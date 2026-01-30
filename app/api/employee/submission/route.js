import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import dbConnect from "@/lib/db";
import EmployeeFormSubmission from "@/models/EmployeeFormSubmission";
import EmployeeForm from "@/models/EmployeeForm";
import Employee from "@/models/Employee";
import Subtask from "@/models/Subtask";
import { authOptions } from "@/lib/auth";
import { sendNotification } from "@/lib/sendNotification";
import { sendMail } from "@/lib/mail";
import { submissionTaskMailTemplate } from "@/helper/emails/employee/submissionTask";
import { Upload } from "@aws-sdk/lib-storage";
import s3 from "@/lib/aws";

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "Employee") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const data = await req.formData();

    const formId = data.get("formId");
    const subtaskId = data.get("subtaskId");
    const formData = JSON.parse(data.get("formData") || "{}");

    if (!formId || !subtaskId) {
      return NextResponse.json(
        { error: "Form ID and Subtask ID are required" },
        { status: 400 }
      );
    }

    const actualFormId = formId.includes("_originalId_")
      ? formId.split("_originalId_")[0]
      : formId;

    const form = await EmployeeForm.findById(actualFormId);
    if (!form)
      return NextResponse.json({ error: "Form not found" }, { status: 404 });

    const subtask = await Subtask.findById(subtaskId);
    if (!subtask)
      return NextResponse.json({ error: "Subtask not found" }, { status: 404 });

    // check assignment
    const isAssigned = subtask.assignedEmployees.some(
      (emp) => emp.employeeId.toString() === session.user.id
    );

    if (!isAssigned) {
      return NextResponse.json(
        { error: "You are not assigned to this subtask" },
        { status: 403 }
      );
    }

    // check lead limit
    const leadRequired = subtask.lead || 1;

    const approvedSubmissions =
      await EmployeeFormSubmission.countDocuments({
        subtaskId,
        employeeId: session.user.id,
        teamleadstatus: "approved",
      });

    if (approvedSubmissions >= leadRequired) {
      return NextResponse.json(
        { error: `You have completed all ${leadRequired} required forms.` },
        { status: 400 }
      );
    }

    const employee = await Employee.findById(session.user.id);
    if (!employee)
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });

    // -------------------------------
    // FILE UPLOADS (S3)
    // -------------------------------
    const files = data.getAll("files");
    const uploadedFiles = [];

    for (const file of files) {
      if (file && file.size > 0) {
        const buffer = Buffer.from(await file.arrayBuffer());

        const fileKey = `employee_submissions/files/${Date.now()}_${file.name}`;

        const upload = new Upload({
          client: s3,
          params: {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: fileKey,
            Body: buffer,
            ContentType: file.type || "application/octet-stream",
            Metadata: {
              originalName: encodeURIComponent(file.name),
              uploadedBy: session.user.id,
              uploadedAt: Date.now().toString(),
            },
          },
        });

        await upload.done();

        const fileUrl = `https://s3.${process.env.AWS_REGION}.amazonaws.com/${process.env.AWS_BUCKET_NAME}/${fileKey}`;

        uploadedFiles.push({
          url: fileUrl,
          name: file.name,
          type: file.type || "application/octet-stream",
          size: file.size,
          publicId: fileKey,
        });
      }
    }

    // -------------------------------
    // CREATE SUBMISSION
    // -------------------------------
    const submission = new EmployeeFormSubmission({
      formId: actualFormId,
      subtaskId,
      employeeId: session.user.id,
      submittedBy: `${employee.firstName} ${employee.lastName}`,
      assignedTo: subtask.assignedTo || "Team Lead",
      formData,
      fileAttachments: uploadedFiles,
      teamleadstatus: "pending",
      managerStatus: "pending",
      createdAt: new Date(),
    });

    await submission.save();

    // -------------------------------
    // NOTIFICATION + MAIL
    // -------------------------------
    if (subtask.teamLeadId) {
      const teamLead = await Employee.findById(subtask.teamLeadId);

      if (teamLead) {
        const submissionLink = `${process.env.NEXTAUTH_URL}/teamlead/subtasks/${subtask._id}/submissions`;

        const employeeName = `${employee.firstName} ${employee.lastName}`;
        const teamLeadName = `${teamLead.firstName} ${teamLead.lastName}`;

        await Promise.all([
          sendNotification({
            senderId: employee._id,
            senderModel: "Employee",
            senderName: employeeName,
            receiverId: teamLead._id,
            receiverModel: "Employee",
            type: "subtask_submission",
            title: "New Subtask Submission",
            message: `${employeeName} submitted a form for subtask: "${subtask.title}"`,
            link: submissionLink,
            referenceId: submission._id,
            referenceModel: "EmployeeFormSubmission",
          }),
          sendMail(
            teamLead.email,
            "New Subtask Submission",
            submissionTaskMailTemplate(
              teamLeadName,
              employeeName,
              subtask.title,
              submissionLink,
              submission.createdAt
            )
          ),
        ]);
      }
    }

    return NextResponse.json(
      {
        message: "Form submitted successfully!",
        submissionId: submission._id,
        submission: {
          _id: submission._id,
          teamleadstatus: submission.teamleadstatus,
          managerStatus: submission.managerStatus,
          submittedAt: submission.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Submission API Error:", error);
    return NextResponse.json(
      { error: "Failed to submit form" },
      { status: 500 }
    );
  }
}
