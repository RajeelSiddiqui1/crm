import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import FormSubmission from "@/models/FormSubmission";
import Form from "@/models/Form";
import cloudinary from "@/lib/cloudinary";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import mongoose from "mongoose";
import { sendMail } from "@/lib/mail";
import { deletedMailTemplate } from "@/helper/emails/manager/deletedMailTemplate";
import { statusUpdateMailTemplate } from "@/helper/emails/manager/statusUpdateMailTemplate";
import { taskEditedMailTemplate } from "@/helper/emails/manager/taskEditMail";
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
      .populate("assignedEmployees.employeeId", "firstName lastName email")
      .lean();

    if (!submission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    // 🔥 normalize assignedTo (array or single)
    const assignedTo =
      Array.isArray(submission.assignedTo)
        ? submission.assignedTo[0] || null
        : submission.assignedTo || null;

    return NextResponse.json(
      {
        ...submission,
        assignedTo,
      },
      { status: 200 }
    );

  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}




// ----------------------- UPDATE Submission -----------------------
export async function PUT(req, { params }) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    const { id } = params;
    const body = await req.json();

    const {
      title,
      managerComments,
      assignedTeamLeadId,
      status,
      clinetName,
      formData
    } = body;

    const submission = await FormSubmission.findById(id)
      .populate("formId")
      .populate("assignedTo", "firstName lastName email")
      .populate("multipleTeamLeadAssigned", "firstName lastName email")
      .populate("assignedEmployees.employeeId", "firstName lastName email");

    if (!submission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    /* ---------------- BASIC UPDATES ---------------- */
    if (clinetName !== undefined && clinetName !== null) {
      submission.clinetName = clinetName.trim();
    }

    if (managerComments !== undefined) {
      submission.managerComments = managerComments;
    }

    if (status) {
      submission.status = status;
    }

    if (title) {
      submission.formData.title = title;
    }

    if (formData && typeof formData === "object") {
      Object.keys(formData).forEach(key => {
        submission.formData.set(key, formData[key]);
      });
    }

    /* ---------------- TEAM LEAD REASSIGN (FIXED) ---------------- */
    if (assignedTeamLeadId) {
      const newTlId = assignedTeamLeadId.toString();

      const currentAssignedId =
        submission.assignedTo?.[0]?._id?.toString() ||
        submission.assignedTo?.[0]?.toString();

      if (newTlId !== currentAssignedId) {

        // remove old TL from multiple list
        if (currentAssignedId) {
          submission.multipleTeamLeadAssigned =
            submission.multipleTeamLeadAssigned.filter(
              tl => tl._id.toString() !== currentAssignedId
            );
        }

        // assignedTo MUST be array
        submission.assignedTo = [
          new mongoose.Types.ObjectId(newTlId)
        ];

        // add to multiple list if not exists
        const exists = submission.multipleTeamLeadAssigned.some(
          tl => tl._id.toString() === newTlId
        );

        if (!exists) {
          submission.multipleTeamLeadAssigned.push(
            new mongoose.Types.ObjectId(newTlId)
          );
        }
      }
    }

    submission.updatedAt = new Date();
    await submission.save();

    /* ---------------- EMAIL + NOTIFICATIONS ---------------- */
    const submissionLink = `${process.env.NEXT_PUBLIC_BASE_URL}/teamlead/tasks/${submission._id}`;
    const updatedBy = session.user.name || "Manager";

    const recipients = [
      ...(submission.assignedTo || []),
      ...(submission.multipleTeamLeadAssigned || []),
      ...(submission.assignedEmployees.map(emp => emp.employeeId) || [])
    ].filter(Boolean);

    const mailPromises = recipients.map(user => {
      const name = user.firstName || "User";
      const email = user.email;
      if (!email) return null;

      return sendMail(
        `${name} <${email}>`,
        "Submission Updated",
        taskEditedMailTemplate(
          name,
          submission.formId?.title || "Submission",
          updatedBy,
          submissionLink
        )
      );
    }).filter(Boolean);

    const notiPromises = recipients.map(user => {
      const model = user.__t === "Employee" ? "Employee" : "TeamLead";

      return sendNotification({
        senderId: session.user.id,
        senderModel: "Manager",
        senderName: updatedBy,
        receiverId: user._id,
        receiverModel: model,
        type: "submission_edited",
        title: "Submission Updated",
        message: `${submission.formId?.title || "Submission"} has been edited`,
        referenceId: submission._id,
        referenceModel: "FormSubmission",
      });
    });

    await Promise.all([...mailPromises, ...notiPromises]);

    return NextResponse.json(
      {
        message: "Submission updated successfully",
        submission: {
          _id: submission._id,
          clinetName: submission.clinetName,
          formData: submission.formData,
          managerComments: submission.managerComments,
          status: submission.status,
          assignedTo: submission.assignedTo,
          updatedAt: submission.updatedAt
        }
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("Error updating submission:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update submission" },
      { status: 500 }
    );
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
