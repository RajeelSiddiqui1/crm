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

    // ---------------- AUTH ----------------
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "Manager") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const contentType = req.headers.get("content-type") || "";
    let body = {};
    let uploadedFileUrl = null;

    // ---------------- MULTIPART ----------------
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();

      body.formId = formData.get("formId");
      body.clinetName = formData.get("clinetName");
      body.assignmentType = formData.get("assignmentType") || "single";
      body.assignedTo = formData.get("assignedTo");
      body.multipleTeamLeadAssigned = JSON.parse(
        formData.get("multipleTeamLeadAssigned") || "[]"
      );

      const formDataJson = formData.get("formData");
      body.formData = formDataJson ? JSON.parse(formDataJson) : {};

      const file = formData.get("file");
      if (file && file.size > 0) {
        const buffer = Buffer.from(await file.arrayBuffer());

        const upload = await cloudinary.uploader.upload(
          `data:${file.type};base64,${buffer.toString("base64")}`,
          {
            folder: "form_uploads",
            resource_type: "auto",
          }
        );

        uploadedFileUrl = upload.secure_url;
      }
    } else {
      body = await req.json();
    }

    const {
      formId,
      clinetName,
      assignmentType,
      assignedTo,
      multipleTeamLeadAssigned,
      formData,
    } = body;

    if (!formId || !clinetName) {
      return NextResponse.json(
        { error: "formId and client name are required" },
        { status: 400 }
      );
    }

    // ---------------- FORM FETCH (depId SOURCE) ----------------
    const form = await Form.findById(
      new mongoose.Types.ObjectId(formId)
    ).select("title depId");

    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    // ---------------- SUBMISSION DATA ----------------
    const submissionData = {
      formId: form._id,
      depId: form.depId, // ✅ AUTO FROM FORM
      clinetName: clinetName.trim(),
      formData,
      status: "pending",
      status2: "pending",
      submittedBy: session.user.id,
      assignedTo: [],
      multipleTeamLeadAssigned: [],
    };

    if (assignmentType === "multiple" && multipleTeamLeadAssigned.length > 0) {
      submissionData.multipleTeamLeadAssigned =
        multipleTeamLeadAssigned.map(
          (id) => new mongoose.Types.ObjectId(id)
        );
    } else if (assignmentType === "single" && assignedTo) {
      submissionData.assignedTo = [
        new mongoose.Types.ObjectId(assignedTo),
      ];
    } else {
      return NextResponse.json(
        { error: "Invalid assignment data" },
        { status: 400 }
      );
    }

    // ---------------- SAVE ----------------
    const newSubmission = await FormSubmission.create(submissionData);

    // ---------------- NOTIFY FUNCTION ----------------
    const notifyTeamLead = async (teamLeadId) => {
      const teamLead = await TeamLead.findById(teamLeadId);
      if (!teamLead) return;

      const html = createTaskTemplate({
        name: teamLead.name || "Team Lead",
        managerName: session.user.name || "Manager",
        formTitle: form.title,
        status: "Pending",
        message: `A new form "${form.title}" has been assigned for client: ${clinetName}`,
        taskLink: `/teamlead/tasks/${newSubmission._id}`,
      });

      await sendMail(teamLead.email, "New Task Assigned", html);

      await sendNotification({
        senderId: session.user.id,
        senderModel: "Manager",
        senderName: session.user.name || "Manager",
        receiverId: teamLead._id,
        receiverModel: "TeamLead",
        type: "form_assigned",
        title: "New Task Assigned",
        message: `Form "${form.title}" assigned for client ${clinetName}`,
        link: `/teamlead/tasks/${newSubmission._id}`,
        referenceId: newSubmission._id,
        referenceModel: "FormSubmission",
      });
    };

    // ---------------- SEND NOTIFICATIONS ----------------
    if (assignmentType === "multiple") {
      for (const tlId of multipleTeamLeadAssigned) {
        await notifyTeamLead(tlId);
      }
    } else {
      await notifyTeamLead(assignedTo);
    }

    return NextResponse.json(
      {
        message: "Form submitted successfully",
        submission: newSubmission,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST error:", error);
    return NextResponse.json(
      { error: "Submission failed", details: error.message },
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

