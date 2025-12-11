import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import FormSubmission from "@/models/FormSubmission";
import cloudinary from "@/lib/cloudinary";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendMail } from "@/lib/mail";
import { editedMailTemplate } from "@/helper/emails/manager/editedMailTemplate";
import { deletedMailTemplate } from "@/helper/emails/manager/deletedMailTemplate";
import { statusUpdateMailTemplate } from "@/helper/emails/manager/statusUpdateMailTemplate";
import { sendNotification } from "@/lib/sendNotification";

function getPublicIdFromUrl(url) {
  try {
    const parts = url.split("/");
    const fileWithExt = parts[parts.length - 1];
    const [publicId] = fileWithExt.split(".");
    const folder = parts.slice(parts.indexOf("upload") + 2, -1).join("/");
    return folder ? `${folder}/${publicId}` : publicId;
  } catch {
    return null;
  }
}

// ----------------------- GET Submission -----------------------
export async function GET(req, { params }) {
  try {
    await dbConnect();
    const { id } = params;

    const submission = await FormSubmission.findById(id)
      .populate("formId", "title description fields depId")
      .populate("assignedTo", "firstName lastName email")
      .populate("multipleTeamLeadAssigned", "firstName lastName email")
      .populate("assignedEmployees.employeeId", "firstName lastName email");

    if (!submission) return NextResponse.json({ error: "Submission not found" }, { status: 404 });

    return NextResponse.json(submission, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ----------------------- UPDATE Submission -----------------------
export async function PUT(req, { params }) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    const { id } = params;

    const contentType = req.headers.get("content-type") || "";
    let body = {};
    let newFileUrl = null;
    let assignedTeamLeadId = null;

    const submission = await FormSubmission.findById(id)
      .populate("formId")
      .populate("multipleTeamLeadAssigned")
      .populate("assignedEmployees.employeeId");

    if (!submission) return NextResponse.json({ error: "Submission not found" }, { status: 404 });

    // ----------------------- HANDLE MULTIPART -----------------------
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      body.formData = JSON.parse(formData.get("formData") || "{}");
      body.managerComments = formData.get("managerComments") || "";
      assignedTeamLeadId = formData.get("assignedTeamLeadId");
      const file = formData.get("file");

      if (file && file.name) {
        const buffer = Buffer.from(await file.arrayBuffer());

        if (submission.formData?.file) {
          const publicId = getPublicIdFromUrl(submission.formData.file);
          if (publicId) await cloudinary.uploader.destroy(publicId);
        }

        const uploadResponse = await new Promise((resolve, reject) => {
          cloudinary.uploader
            .upload_stream({ folder: "form_uploads" }, (error, result) => {
              if (error) reject(error);
              else resolve(result);
            })
            .end(buffer);
        });
        newFileUrl = uploadResponse.secure_url;
      }
    } else {
      body = await req.json();
      assignedTeamLeadId = body.assignedTeamLeadId;
    }

    const { formData, managerComments } = body;

    // ----------------------- UPDATE TEAM LEAD -----------------------
    if (assignedTeamLeadId && assignedTeamLeadId !== submission.assignedTo?.toString()) {
      if (submission.assignedTo) {
        submission.multipleTeamLeadAssigned = submission.multipleTeamLeadAssigned.filter(
          tl => tl._id.toString() !== submission.assignedTo.toString()
        );
      }

      submission.assignedTo = assignedTeamLeadId;

      const isAlreadyAssigned = submission.multipleTeamLeadAssigned.some(
        tl => tl._id.toString() === assignedTeamLeadId
      );

      if (!isAlreadyAssigned) submission.multipleTeamLeadAssigned.push(assignedTeamLeadId);
    }

    if (formData) {
      Object.entries(formData).forEach(([key, value]) => {
        submission.formData.set(key, value);
      });
    }

    if (newFileUrl) submission.formData.file = newFileUrl;
    if (managerComments !== undefined) submission.managerComments = managerComments;
    submission.updatedAt = new Date();
    await submission.save();

    // ----------------------- SEND EMAILS & NOTIFICATIONS -----------------------
    const teamLeads = submission.multipleTeamLeadAssigned;
    const employees = submission.assignedEmployees;
    const submissionLink = `${process.env.NEXT_PUBLIC_BASE_URL}/teamlead/tasks/${submission._id}`;

    const mailPromises = [
      ...teamLeads.map(tl =>
        sendMail(
          `${tl.firstName} ${tl.lastName} <${tl.email}>`,
          "Submission Updated",
          editedMailTemplate(`${tl.firstName} ${tl.lastName}`, submission.formId?.title, session.user.name, submissionLink)
        )
      ),
      ...employees.map(emp =>
        sendMail(
          `${emp.employeeId.firstName} <${emp.employeeId.email}>`,
          "Submission Updated",
          editedMailTemplate(emp.employeeId.firstName, submission.formId.title, session.user.name, submissionLink)
        )
      )
    ];

    const notiPromises = [
      ...teamLeads.map(tl =>
        sendNotification({
          senderId: session.user.id,
          senderModel: "Manager",
          senderName: session.user.name,
          receiverId: tl._id,
          receiverModel: "TeamLead",
          type: "submission_edited",
          title: "Submission Updated",
          message: `${submission.formId.title} edited`,
          referenceId: submission._id,
          referenceModel: "FormSubmission",
        })
      ),
      ...employees.map(emp =>
        sendNotification({
          senderId: session.user.id,
          senderModel: "Manager",
          senderName: session.user.name,
          receiverId: emp.employeeId._id,
          receiverModel: "Employee",
          type: "submission_edited",
          title: "Submission Updated",
          message: `${submission.formId.title} updated`,
          referenceId: submission._id,
          referenceModel: "FormSubmission",
        })
      )
    ];

    await Promise.all([...mailPromises, ...notiPromises]);

    return NextResponse.json({ message: "Updated", submission }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ----------------------- DELETE Submission -----------------------
export async function DELETE(req, { params }) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    const { id } = params;

    const submission = await FormSubmission.findById(id)
      .populate("formId")
      .populate("multipleTeamLeadAssigned")
      .populate("assignedEmployees.employeeId");

    if (!submission) return NextResponse.json({ error: "Submission not found" }, { status: 404 });

    if (submission.formData?.file) {
      const publicId = getPublicIdFromUrl(submission.formData.file);
      if (publicId) await cloudinary.uploader.destroy(publicId);
    }

    await submission.deleteOne();

    const teamLeads = submission.multipleTeamLeadAssigned;
    const employees = submission.assignedEmployees;
    const deletedAt = new Date().toLocaleString();

    const mailPromises = [
      ...teamLeads.map(tl =>
        sendMail(
          `${tl.firstName} ${tl.lastName} <${tl.email}>`,
          "Submission Deleted",
          deletedMailTemplate(`${tl.firstName} ${tl.lastName}`, submission.formId.title, session.user.name, deletedAt)
        )
      ),
      ...employees.map(emp =>
        sendMail(
          `${emp.employeeId.firstName} <${emp.employeeId.email}>`,
          "Submission Deleted",
          deletedMailTemplate(emp.employeeId.firstName, submission.formId.title, session.user.name, deletedAt)
        )
      )
    ];

    const notiPromises = [
      ...teamLeads.map(tl =>
        sendNotification({
          senderId: session.user.id,
          senderModel: "Manager",
          senderName: session.user.name,
          receiverId: tl._id,
          receiverModel: "TeamLead",
          type: "submission_deleted",
          title: "Submission Deleted",
          message: `${submission.formId.title} deleted`,
        })
      ),
      ...employees.map(emp =>
        sendNotification({
          senderId: session.user.id,
          senderModel: "Manager",
          senderName: session.user.name,
          receiverId: emp.employeeId._id,
          receiverModel: "Employee",
          type: "submission_deleted",
          title: "Submission Deleted",
          message: `${submission.formId.title} deleted`,
        })
      )
    ];

    await Promise.all([...mailPromises, ...notiPromises]);

    return NextResponse.json({ message: "Deleted" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ----------------------- PATCH STATUS -----------------------
export async function PATCH(req, { params }) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    const { id } = params;
    const { status } = await req.json();

    const submission = await FormSubmission.findById(id)
      .populate("formId")
      .populate("multipleTeamLeadAssigned")
      .populate("assignedEmployees.employeeId");

    if (!submission) return NextResponse.json({ error: "Submission not found" }, { status: 404 });

    const oldStatus = submission.status;
    submission.status = status;
    await submission.save();

    const teamLeads = submission.multipleTeamLeadAssigned;
    const employees = submission.assignedEmployees;

    const mailPromises = [
      ...teamLeads.map(tl =>
        sendMail(
          `${tl.firstName} ${tl.lastName} <${tl.email}>`,
          "Status Updated",
          statusUpdateMailTemplate(tl.firstName, submission.formId.title, oldStatus, status)
        )
      ),
      ...employees.map(emp =>
        sendMail(
          `${emp.employeeId.firstName} <${emp.employeeId.email}>`,
          "Status Updated",
          statusUpdateMailTemplate(emp.employeeId.firstName, submission.formId.title, oldStatus, status)
        )
      )
    ];

    const notiPromises = [
      ...teamLeads.map(tl =>
        sendNotification({
          senderId: session.user.id,
          senderModel: "Manager",
          senderName: session.user.name,
          receiverId: tl._id,
          receiverModel: "TeamLead",
          type: "status_updated",
          title: "Status Updated",
          message: `${submission.formId.title} status changed`,
        })
      ),
      ...employees.map(emp =>
        sendNotification({
          senderId: session.user.id,
          senderModel: "Manager",
          senderName: session.user.name,
          receiverId: emp.employeeId._id,
          receiverModel: "Employee",
          type: "status_updated",
          title: "Status Updated",
          message: `${submission.formId.title} status updated`,
        })
      )
    ];

    await Promise.all([...mailPromises, ...notiPromises]);

    return NextResponse.json({ message: "Status Updated", submission }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
