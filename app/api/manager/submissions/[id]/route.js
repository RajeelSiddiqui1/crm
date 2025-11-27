import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import FormSubmission from "@/models/FormSubmission";
import TeamLead from "@/models/TeamLead";
import { sendMail } from "@/lib/mail";
import { editedMailTemplate } from "@/helper/emails/manager/editedMailTemplate";
import { deletedMailTemplate } from "@/helper/emails/manager/deletedMailTemplate";
import cloudinary from "@/lib/cloudinary";
import { sendNotification } from "@/lib/sendNotification";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

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

export async function GET(req, { params }) {
  try {
    await dbConnect();
    const { id } = params;
    const submission = await FormSubmission.findById(id).populate("formId");
    if (!submission) return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    return NextResponse.json(submission, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    await dbConnect();
    const { id } = params;
    const contentType = req.headers.get("content-type") || "";
    let body = {};
    let newFileUrl = null;
    const submission = await FormSubmission.findById(id).populate("formId");
    if (!submission) return NextResponse.json({ error: "Submission not found" }, { status: 404 });



    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      body.formData = JSON.parse(formData.get("formData") || "{}");
      body.managerComments = formData.get("managerComments") || "";
      const file = formData.get("file");
      if (file && file.name) {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const oldUrl = submission.formData?.file;
        if (oldUrl) {
          const publicId = getPublicIdFromUrl(oldUrl);
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
    }

    const { formData, managerComments } = body;
    if (formData) for (const [key, value] of Object.entries(formData)) submission.formData.set(key, value);
    if (newFileUrl) submission.formData.file = newFileUrl;
    if (managerComments !== undefined) submission.managerComments = managerComments;
    submission.updatedAt = new Date();
    await submission.save();

    let teamLead;
    if (submission.assignedTo?.match(/^[0-9a-fA-F]{24}$/)) teamLead = await TeamLead.findById(submission.assignedTo);
    else {
      const email = submission.assignedTo.replace(/^-/, "").trim();
      teamLead = await TeamLead.findOne({ email });
    }

    const session = await getServerSession(authOptions);

    if (teamLead?.email) {
      const html = editedMailTemplate(teamLead.name || "Team Lead", submission.formId?.title || "Form", "Manager");
      await sendMail(teamLead.email, "Form Edited", html);
      await sendNotification({
        senderId: session?.user?.id,
        senderModel: "Manager",
        senderName: session?.user?.name || "Manager",
        receiverId: teamLead._id,
        receiverModel: "TeamLead",
        type: "submission_edited",
        title: "Submission Edited",
        message: `The form "${submission.formId?.title}" has been edited by Manager.`,
        link: `${process.env.TASK_LINK}/teamlead/submissions/${submission._id}`,
        referenceId: submission._id,
        referenceModel: "FormSubmission",
      });
    }


    return NextResponse.json({ message: "Submission updated successfully", submission }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    await dbConnect();
    const { id } = params;
    const submission = await FormSubmission.findById(id).populate("formId");
    if (!submission) return NextResponse.json({ error: "Submission not found" }, { status: 404 });

    const fileUrl = submission.formData?.file;
    if (fileUrl) {
      const publicId = getPublicIdFromUrl(fileUrl);
      if (publicId) await cloudinary.uploader.destroy(publicId);
    }

    await FormSubmission.findByIdAndDelete(id);

    let teamLead;
    if (submission.assignedTo?.match(/^[0-9a-fA-F]{24}$/)) teamLead = await TeamLead.findById(submission.assignedTo);
    else {
      const email = submission.assignedTo.replace(/^-/, "").trim();
      teamLead = await TeamLead.findOne({ email });
    }


        const session = await getServerSession(authOptions);

    if (teamLead?.email) {
      const html = deletedMailTemplate(teamLead.name || "Team Lead", submission.formId?.title || "Form", "Manager");
      await sendMail(teamLead.email, "Form Deleted", html);
      await sendNotification({
        senderId: session?.user?.id,
        senderModel: "Manager",
        senderName: session?.user?.name || "Manager",
        receiverId: teamLead._id,
        receiverModel: "TeamLead",
        type: "submission_deleted",
        title: "Submission Deleted",
        message: `The form "${submission.formId?.title}" has been deleted by Manager.`,
        link: `${process.env.TASK_LINK}/teamlead/submissions`,
        referenceId: submission._id,
        referenceModel: "FormSubmission",
      });

    }
      return NextResponse.json({ message: "Submission deleted successfully" }, { status: 200 });
    } catch (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }
