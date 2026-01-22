import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Form from "@/models/Form";
import FormSubmission from "@/models/FormSubmission";
import TeamLead from "@/models/TeamLead";
import Manager from "@/models/Manager";
import { Upload } from "@aws-sdk/lib-storage";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import s3 from "@/lib/aws";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendNotification } from "@/lib/sendNotification";
import { createTaskTemplate } from "@/helper/emails/manager/createTaskTemplate";
import { sendMail } from "@/lib/mail";

export async function POST(req) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "Manager") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const contentType = req.headers.get("content-type") || "";
    let body = {};
    const uploadedFiles = [];

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      
      // FIXED: Accept both clientName and clinetName
      body.formId = formData.get("formId");
      body.clientName = formData.get("clientName") || formData.get("clinetName"); // ✅ Accept both
      body.assignmentType = formData.get("assignmentType") || "single";
      body.assignedTo = formData.get("assignedTo");
      
      const multipleTeamLeadAssignedStr = formData.get("multipleTeamLeadAssigned");
      body.multipleTeamLeadAssigned = multipleTeamLeadAssignedStr 
        ? JSON.parse(multipleTeamLeadAssignedStr)
        : [];

      const formDataJson = formData.get("formData");
      body.formData = formDataJson ? JSON.parse(formDataJson) : {};

      console.log("Received form data:", {
        formId: body.formId,
        clientName: body.clientName,
        assignmentType: body.assignmentType,
        assignedTo: body.assignedTo,
        multipleTeamLeadAssigned: body.multipleTeamLeadAssigned
      });

      // ---------------- FILE UPLOADS ----------------
      const files = formData.getAll("files");
      for (const file of files) {
        if (file && file.size > 0 && file.name !== "undefined") {
          const buffer = Buffer.from(await file.arrayBuffer());
          const fileName = file.name;
          const fileKey = `manager_tasks/${Date.now()}_${fileName}`;

          const upload = new Upload({
            client: s3,
            params: {
              Bucket: process.env.AWS_BUCKET_NAME,
              Key: fileKey,
              Body: buffer,
              ContentType: file.type,
              Metadata: {
                originalName: encodeURIComponent(fileName),
                uploadedBy: session.user.id,
                uploadedAt: Date.now().toString(),
              },
            },
          });

          await upload.done();

          const command = new GetObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: fileKey,
          });

          const fileUrl = await getSignedUrl(s3, command, { expiresIn: 604800 });
          uploadedFiles.push({
            url: fileUrl,
            name: fileName,
            type: file.type,
            size: file.size,
            publicId: fileKey,
          });
        }
      }
    } else {
      body = await req.json();
    }

    const { formId, clientName, assignmentType, assignedTo, multipleTeamLeadAssigned, formData: dynamicFormData } = body;

    console.log("Validating:", { formId, clientName });

    if (!formId || !clientName) {
      return NextResponse.json({ 
        error: "formId and client name are required",
        details: `Missing: ${!formId ? 'formId' : ''} ${!clientName ? 'clientName' : ''}` 
      }, { status: 400 });
    }

    const form = await Form.findById(new mongoose.Types.ObjectId(formId)).select("title depId");
    if (!form) return NextResponse.json({ error: "Form not found" }, { status: 404 });

    const submissionData = {
      formId: form._id,
      depId: form.depId,
      clinetName: clientName.trim(),
      formData: dynamicFormData,
      status: "pending",
      status2: "pending",
      submittedBy: session.user.id,
      assignedTo: [],
      multipleTeamLeadAssigned: [],
      fileAttachments: uploadedFiles,
    };

    if (assignmentType === "multiple" && multipleTeamLeadAssigned && multipleTeamLeadAssigned.length > 0) {
      submissionData.multipleTeamLeadAssigned = multipleTeamLeadAssigned.map(
        (id) => new mongoose.Types.ObjectId(id)
      );
    } else if (assignmentType === "single" && assignedTo) {
      submissionData.assignedTo = [new mongoose.Types.ObjectId(assignedTo)];
    } else {
      return NextResponse.json({ 
        error: "Invalid assignment data",
        details: `Type: ${assignmentType}, assignedTo: ${assignedTo}, multiple: ${JSON.stringify(multipleTeamLeadAssigned)}`
      }, { status: 400 });
    }

    const newSubmission = await FormSubmission.create(submissionData);

    // ---------------- NOTIFY TEAM LEADS ----------------
    const notifyTeamLead = async (teamLeadId) => {
      const teamLead = await TeamLead.findById(teamLeadId);
      if (!teamLead) return;

      const html = createTaskTemplate({
        name: teamLead.name || "Team Lead",
        managerName: session.user.name || "Manager",
        formTitle: form.title,
        status: "Pending",
        message: `A new form "${form.title}" has been assigned for client: ${clientName}`,
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
        message: `Form "${form.title}" assigned for client ${clientName}`,
        link: `/teamlead/tasks/${newSubmission._id}`,
        referenceId: newSubmission._id,
        referenceModel: "FormSubmission",
      });
    };

    if (assignmentType === "multiple") {
      for (const tlId of multipleTeamLeadAssigned) await notifyTeamLead(tlId);
    } else {
      await notifyTeamLead(assignedTo);
    }

    return NextResponse.json({ 
      message: "Form submitted successfully", 
      submission: newSubmission 
    }, { status: 201 });
  } catch (error) {
    console.error("POST error:", error);
    return NextResponse.json({ 
      error: "Submission failed", 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

// ---------------- GET FORMS ----------------
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