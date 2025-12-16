import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Form from "@/models/Form";
import FormSubmission from "@/models/FormSubmission";
import TeamLead from "@/models/TeamLead";
import Manager from "@/models/Manager";
import cloudinary from "@/lib/cloudinary";
import { createTaskTemplate } from "@/helper/emails/manager/createTaskTemplate";
import { sendMail } from "@/lib/mail";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendNotification } from "@/lib/sendNotification";

export async function POST(req) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "Manager") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const contentType = req.headers.get("content-type") || "";
    let body = {};
    let uploadedFileUrl = null;

    // ----------------------- MULTIPART HANDLING -----------------------
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      body.formId = formData.get("formId");
      body.adminTaskId = formData.get("adminTaskId");
      body.submittedBy = formData.get("submittedBy");
      body.assignmentType = formData.get("assignmentType") || "single";
      body.assignedTo = formData.get("assignedTo");
      body.multipleTeamLeadAssigned = JSON.parse(formData.get("multipleTeamLeadAssigned") || "[]");
      body.formData = JSON.parse(formData.get("formData") || "{}");

      const file = formData.get("file");
      if (file && file.name) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const uploadResult = await new Promise((resolve, reject) => {
          cloudinary.uploader
            .upload_stream({ folder: "form_uploads" }, (err, result) => {
              if (err) reject(err);
              else resolve(result);
            })
            .end(buffer);
        });
        uploadedFileUrl = uploadResult.secure_url;
      }
    } else {
      body = await req.json();
    }

    const {
      formId,
      adminTaskId,
      submittedBy,
      clinetName,
      assignmentType,
      assignedTo,
      multipleTeamLeadAssigned,
      formData,
    } = body;

    if (uploadedFileUrl) formData.file = uploadedFileUrl;

    // ----------------------- FORM TITLE FETCH -----------------------
    const form = await Form.findById(formId);
    const formTitle = form?.title || "New Task";

    // ----------------------- SUBMISSION CREATION -----------------------
    const submissionData = {
      formId,
      adminTask: adminTaskId || null,
      submittedBy,
      clinetName,
      formData,
      status: "pending",
    };

    if (assignmentType === "multiple" && multipleTeamLeadAssigned?.length > 0) {
      submissionData.multipleTeamLeadAssigned = multipleTeamLeadAssigned.map(
        (id) => new mongoose.Types.ObjectId(id)
      );
    } else if (assignmentType === "single" && assignedTo) {
      submissionData.assignedTo = new mongoose.Types.ObjectId(assignedTo);
      submissionData.multipleTeamLeadAssigned = [];
    } else {
      return NextResponse.json({ error: "Invalid assignment data" }, { status: 400 });
    }

    const newSubmission = new FormSubmission(submissionData);
    await newSubmission.save();

    // ----------------------- MULTIPLE ASSIGN -----------------------
    if (assignmentType === "multiple" && multipleTeamLeadAssigned?.length > 0) {
      for (const tlId of multipleTeamLeadAssigned) {
        const teamLead = await TeamLead.findById(tlId);
        if (teamLead && teamLead.email) {
          try {
            const html = createTaskTemplate({
              name: teamLead.name || "Team Lead",
              managerName: session.user.name || "Manager",
              formTitle: formTitle,
              status: "Pending",
              message: "A new form has been assigned to you.",
              taskLink: `https://mhcirclesolutions.com/teamlead/task-offer/`,
            });

            await sendMail(teamLead.email, "New Task Assigned", html);
          } catch (e) {}

          await sendNotification({
            senderId: session.user.id,
            senderModel: "Manager",
            senderName: session.user.name || "Manager",
            receiverId: teamLead._id,
            receiverModel: "TeamLead",
            type: "form_assigned",
            title: "New Task Assigned",
            message: `A new form has been assigned to you.`,
            link: `/teamlead/task-offer/`,
            referenceId: newSubmission._id,
            referenceModel: "FormSubmission",
          });
        }
      }
    }

    // ----------------------- SINGLE ASSIGN -----------------------
    if (assignmentType === "single" && assignedTo) {
      const teamLead = await TeamLead.findById(assignedTo);

      if (teamLead && teamLead.email) {
        try {
          const html = createTaskTemplate({
            name: teamLead.name || "Team Lead",
            managerName: session.user.name || "Manager",
            formTitle: formTitle,
            status: "Pending",
            message: "A new form has been assigned to you.",
            taskLink: `https://mhcirclesolutions.com/teamlead/tasks/${newSubmission._id}`,
          });

          await sendMail(teamLead.email, "New Task Assigned", html);
        } catch (e) {}

        await sendNotification({
          senderId: session.user.id,
          senderModel: "Manager",
          senderName: session.user.name || "Manager",
          receiverId: teamLead._id,
          receiverModel: "TeamLead",
          type: "form_assigned",
          title: "New Task Assigned",
          message: `A new form has been assigned to you.`,
          link: `/teamlead/tasks/${newSubmission._id}`,
          referenceId: newSubmission._id,
          referenceModel: "FormSubmission",
        });
      }
    }

    return NextResponse.json(
      { message: "Form submitted successfully", submission: newSubmission },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error.message, details: error.errors || null },
      { status: 500 }
    );
  }
}



export async function GET(req) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "Manager") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const depId = searchParams.get("depId");

    const manager = await Manager.findById(session.user.id).lean();
    if (!manager) return NextResponse.json({ message: "Manager not found" }, { status: 404 });

    const managerDeptIds = manager.departments.map((d) => d.toString());
    let forms = [];

    if (depId) {
      if (!managerDeptIds.includes(depId)) return NextResponse.json({ message: "Not authorized for this department" }, { status: 403 });
      forms = await Form.find({ depId });
    } else {
      forms = await Form.find({ depId: { $in: managerDeptIds } });
    }

    return NextResponse.json(forms, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

