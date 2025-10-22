import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Form from "@/models/Form";
import FormSubmission from "@/models/FormSubmission";
import TeamLead from "@/models/TeamLead";
import cloudinary from "@/lib/cloudinary";
import { updatedMailTemplate } from "@/helper/emails/manager/updatedMailTemplate";
import { sendMail } from "@/lib/mail";
import mongoose from "mongoose";

// ✅ GET - Manager ke liye forms fetch karega
export async function GET(req) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const depId = searchParams.get("depId");

    const forms = depId ? await Form.find({ depId }) : await Form.find();
    return NextResponse.json(forms, { status: 200 });
  } catch (error) {
    console.error("Fetch forms error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ✅ POST - Manager form submit karega (TeamLead ko assign karega + Cloudinary Upload)
export async function POST(req) {
  try {
    await dbConnect();

    // 👇 Agar form-data (with files) aayi ho to usko handle karte hain
    const contentType = req.headers.get("content-type") || "";
    let body = {};
    let fileUrl = null;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      body.formId = formData.get("formId");
      body.submittedBy = formData.get("submittedBy");
      body.assignedTo = formData.get("assignedTo");
      body.formData = JSON.parse(formData.get("formData") || "{}");

      // ✅ Handle file/image upload
      const file = formData.get("file");
      if (file && file.name) {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const uploadResponse = await new Promise((resolve, reject) => {
          cloudinary.uploader
            .upload_stream({ folder: "form_uploads" }, (error, result) => {
              if (error) reject(error);
              else resolve(result);
            })
            .end(buffer);
        });

        fileUrl = uploadResponse.secure_url;
      }
    } else {
      // Agar simple JSON request hai
      body = await req.json();
    }

    const { formId, submittedBy, assignedTo, formData } = body;

    // ✅ Add file URL to formData (if exists)
    if (fileUrl) {
      formData.file = fileUrl;
    }

    // ✅ Create new form submission
    const newSubmission = new FormSubmission({
      formId,
      submittedBy,
      assignedTo,
      formData,
      status: "pending",
    });

    await newSubmission.save();

    // ✅ Send email notification
    let teamLead = null;
    if (mongoose.Types.ObjectId.isValid(assignedTo)) {
      teamLead = await TeamLead.findById(assignedTo);
    } else {
      teamLead = await TeamLead.findOne({ email: assignedTo });
    }

    if (teamLead?.email) {
      const html = updatedMailTemplate(
        teamLead.name || "Team Lead",
        "New Form Assigned",
        "Manager",
        "Pending",
        "A new form has been assigned to you."
      );
      await sendMail(teamLead.email, "New Form Assigned", html);
    }

    return NextResponse.json(
      { message: "Form submitted successfully", submission: newSubmission },
      { status: 201 }
    );
  } catch (error) {
    console.error("Form submission error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
