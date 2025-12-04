import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import FormSubmission from "@/models/FormSubmission";
import TeamLead from "@/models/TeamLead";
import Employee from "@/models/Employee";
import Form from "@/models/Form";
import AdminTask from "@/models/AdminTask";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendNotification } from "@/lib/sendNotification";
import { sendMail } from "@/lib/mail";
import { taskStatusUpdatedMail } from "@/helper/emails/admin/taskStatusUpdatedMail";

export async function PUT(req, { params }) {
  await dbConnect();

  try {
    const { id } = params;
    const body = await req.json();
    const { adminStatus, managerComments } = body;

    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return NextResponse.json({ success: false, error: "Invalid Submission ID" }, { status: 400 });
    }

    const submission = await FormSubmission.findById(id)
      .populate("submittedBy")
      .populate("assignedTo")
      .populate("multipleTeamLeadAssigned")
      .populate("assignedEmployees.employeeId")
      .populate("formId");

    if (!submission) {
      return NextResponse.json({ success: false, error: "Form submission not found" }, { status: 404 });
    }

    const updateData = {};

    if (adminStatus && ["pending", "approved", "rejected"].includes(adminStatus)) {
      updateData.adminStatus = adminStatus;
      if (adminStatus === "approved") updateData.status = "approved";
      if (adminStatus === "rejected") updateData.status = "rejected";
    }

    if (managerComments !== undefined) {
      updateData.managerComments = managerComments;
    }

    const updated = await FormSubmission.findByIdAndUpdate(id, updateData, { new: true })
      .populate("submittedBy")
      .populate("assignedTo")
      .populate("multipleTeamLeadAssigned")
      .populate("assignedEmployees.employeeId")
      .populate("formId");

    const session = await getServerSession(authOptions);

    const allRecipients = [];

    if (submission.submittedBy?._id) allRecipients.push({ user: submission.submittedBy, model: "Manager" });
    if (submission.assignedTo?._id) allRecipients.push({ user: submission.assignedTo, model: "TeamLead" });
    if (submission.multipleTeamLeadAssigned?.length) {
      submission.multipleTeamLeadAssigned.forEach(tl => allRecipients.push({ user: tl, model: "TeamLead" }));
    }
    if (submission.assignedEmployees?.length) {
      submission.assignedEmployees.forEach(emp => {
        if (emp.employeeId) allRecipients.push({ user: emp.employeeId, model: "Employee", email: emp.email });
      });
    }

    const now = new Date().toLocaleString();

    await Promise.all(allRecipients.map(async r => {
      const emailAddress = r.user?.email || r.email;
      if (!emailAddress) return;

      sendNotification({
        senderId: session?.user?.id,
        senderModel: "Admin",
        senderName: session?.user?.firstName || "Admin",
        receiverId: r.user._id,
        receiverModel: r.model,
        type: "admin_updated_submission",
        title: "Task Status Updated",
        message: `Task "${submission.formId?.title}" updated to ${updated.adminStatus}`,
        link: `${process.env.TASK_LINK}/dashboard`,
        referenceId: submission._id,
        referenceModel: "FormSubmission"
      }).catch(() => {});

      const emailHTML = taskStatusUpdatedMail(
        r.user.firstName + " " + (r.user.lastName || ""),
        submission.formId?.title,
        updated.adminStatus,
        managerComments || "",
        now
      );

      sendMail(emailAddress, `Task Status Updated - ${submission.formId?.title}`, emailHTML).catch(() => {});
    }));

    return NextResponse.json({ success: true, message: "Status updated, notifications and emails sent", formSubmission: updated });

  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to update submission status" }, { status: 500 });
  }
}


export async function GET(req, { params }) {
  await dbConnect();

  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Submission ID is required" },
        { status: 400 }
      );
    }

    const submission = await FormSubmission.findById(id)
      .populate([
        { 
          path: "submittedBy", 
          select: "firstName lastName email phone departments profilePic" 
        },
        { 
          path: "assignedTo", 
          select: "firstName lastName email phone" 
        },
        { 
          path: "multipleTeamLeadAssigned", 
          select: "firstName lastName email" 
        },
        { 
          path: "assignedEmployees.employeeId", 
          select: "firstName lastName email depId profilePic employeeId" 
        },
        { 
          path: "formId", 
          select: "title description fields" 
        },
        { 
          path: "adminTask", 
          select: "title clientName endDate priority" 
        }
      ]);

    if (!submission) {
      return NextResponse.json(
        { success: false, error: "Form submission not found" },
        { status: 404 }
      );
    }

    const response = {
      ...submission.toObject(),
      formData: submission.formData ? Object.fromEntries(submission.formData) : {}
    };

    return NextResponse.json({
      success: true,
      formSubmission: response
    });

  } catch (error) {
    console.error("Error fetching submission details:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch submission details" },
      { status: 500 }
    );
  }
}