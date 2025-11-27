import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Form from "@/models/Form";
import FormSubmission from "@/models/FormSubmission";
import TeamLead from "@/models/TeamLead";
import Manager from "@/models/Manager";
import cloudinary from "@/lib/cloudinary";
import { updatedMailTemplate } from "@/helper/emails/manager/updatedMailTemplate";
import { sendMail } from "@/lib/mail";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendNotification } from "@/lib/sendNotification";

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

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();

      body.formId = formData.get("formId");
      body.adminTaskId = formData.get("adminTaskId");
      body.submittedBy = formData.get("submittedBy");
      body.assignedTo = formData.get("assignedTo");
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

    const { formId, adminTaskId, submittedBy, assignedTo, formData } = body;
    if (uploadedFileUrl) formData.file = uploadedFileUrl;

    const newSubmission = new FormSubmission({
      formId,
      adminTask: adminTaskId || null,
      submittedBy,
      assignedTo,
      formData,
      status: "pending",
    });

    await newSubmission.save();

    let teamLead = null;
    if (mongoose.Types.ObjectId.isValid(assignedTo)) {
      teamLead = await TeamLead.findById(assignedTo);
    } else {
      teamLead = await TeamLead.findOne({ email: assignedTo });
    }

    if (teamLead) {
      if (teamLead.email) {
        const html = updatedMailTemplate(
          teamLead.name || "Team Lead",
          "New Form Assigned",
          "Manager",
          "Pending",
          "A new form has been assigned to you."
        );
        await sendMail(teamLead.email, "New Form Assigned", html);
      }

      // Send notification
      await sendNotification({
        senderId: session.user.id,
        senderModel: "Manager",
        senderName: session.user.name || "Manager",
        receiverId: teamLead._id,
        receiverModel: "TeamLead",
        type: "form_assigned",
        title: "New Form Assigned",
        message: `A new form "${newSubmission.formId}" has been assigned to you.`,
        link: `${process.env.TASK_LINK}/teamlead/submissions/${newSubmission._id}`,
        referenceId: newSubmission._id,
        referenceModel: "FormSubmission",
      });
    }

    return NextResponse.json({ message: "Form submitted successfully", submission: newSubmission }, { status: 201 });
  } catch (error) {
    console.error("Form Submission Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
