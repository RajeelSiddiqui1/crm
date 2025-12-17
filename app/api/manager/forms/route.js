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
      
      // ✅ Get all form data
      body.formId = formData.get("formId");
      body.submittedBy = formData.get("submittedBy");
      body.clinetName = formData.get("clinetName"); // ✅ Get clinetName
      body.assignmentType = formData.get("assignmentType") || "single";
      body.assignedTo = formData.get("assignedTo");
      body.multipleTeamLeadAssigned = JSON.parse(formData.get("multipleTeamLeadAssigned") || "[]");
      
      // Get formData JSON
      const formDataJson = formData.get("formData");
      if (formDataJson) {
        body.formData = JSON.parse(formDataJson);
      } else {
        body.formData = {};
      }

      // File upload handling
      const file = formData.get("file");
      if (file && file.name && file.size > 0) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const mimeType = file.type || '';
        let resourceType = 'auto';

        if (mimeType.startsWith('video/')) {
          resourceType = 'video';
        } else if (mimeType.includes('pdf') || mimeType.includes('zip') || mimeType.includes('document')) {
          resourceType = 'raw';
        }

        const uploadResult = await new Promise((resolve, reject) => {
          cloudinary.uploader
            .upload_stream(
              {
                folder: "form_uploads",
                resource_type: resourceType
              },
              (err, result) => {
                if (err) reject(err);
                else resolve(result);
              }
            )
            .end(buffer);
        });

        uploadedFileUrl = uploadResult.secure_url;
        
        // Update formData with file URL
        if (uploadedFileUrl) {
          // Find file field and update it
          for (const key in body.formData) {
            if (typeof body.formData[key] === 'string' && body.formData[key].includes(file.name)) {
              body.formData[key] = uploadedFileUrl;
              break;
            }
          }
        }
      }
    } else {
      body = await req.json();
    }

    console.log("=== BACKEND RECEIVED DATA ===");
    console.log("clinetName:", body.clinetName);
    console.log("formId:", body.formId);
    console.log("assignmentType:", body.assignmentType);

    const {
      formId,
      submittedBy,
      clinetName, // ✅ This should now be available
      assignmentType,
      assignedTo,
      multipleTeamLeadAssigned,
      formData,
    } = body;

    // Validate clinetName
    if (!clinetName || clinetName.trim() === "") {
      return NextResponse.json(
        { error: "Client name is required" },
        { status: 400 }
      );
    }

    // ----------------------- FORM TITLE FETCH -----------------------
    const form = await Form.findById(formId);
    if (!form) {
      return NextResponse.json(
        { error: "Form not found" },
        { status: 404 }
      );
    }
    
    const formTitle = form.title;

    // ----------------------- SUBMISSION CREATION -----------------------
    const submissionData = {
      formId,
      submittedBy,
      clinetName: clinetName.trim(), // ✅ Store clinetName
      formData,
      status: "pending",
      status2: "pending",
      assignedTo: [],                  // ✅ always array
      multipleTeamLeadAssigned: [],    // ✅ always array
    };

    // Handle multiple assignment
    if (assignmentType === "multiple" && multipleTeamLeadAssigned?.length > 0) {
      submissionData.multipleTeamLeadAssigned = multipleTeamLeadAssigned.map(
        (id) => new mongoose.Types.ObjectId(id)
      );
    }
    // Handle single assignment
    else if (assignmentType === "single" && assignedTo) {
      submissionData.assignedTo = [
        new mongoose.Types.ObjectId(assignedTo)
      ];
    }
    else {
      return NextResponse.json(
        { error: "Invalid assignment data" },
        { status: 400 }
      );
    }

    const newSubmission = new FormSubmission(submissionData);
    await newSubmission.save();

    console.log("Submission created with clinetName:", newSubmission.clinetName);

    // ----------------------- NOTIFICATIONS AND EMAILS -----------------------
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
              message: `A new form "${formTitle}" has been assigned to you for client: ${clinetName}`,
              taskLink: `https://mhcirclesolutions.com/teamlead/task-offer/`,
            });

            await sendMail(teamLead.email, "New Task Assigned", html);
          } catch (e) {
            console.error("Email error:", e);
          }

          await sendNotification({
            senderId: session.user.id,
            senderModel: "Manager",
            senderName: session.user.name || "Manager",
            receiverId: teamLead._id,
            receiverModel: "TeamLead",
            type: "form_assigned",
            title: "New Task Assigned",
            message: `A new form "${formTitle}" has been assigned to you for client: ${clinetName}`,
            link: `/teamlead/task-offer/`,
            referenceId: newSubmission._id,
            referenceModel: "FormSubmission",
          });
        }
      }
    }

    // Single assignment notifications
    if (assignmentType === "single" && assignedTo) {
      const teamLead = await TeamLead.findById(assignedTo);

      if (teamLead && teamLead.email) {
        try {
          const html = createTaskTemplate({
            name: teamLead.name || "Team Lead",
            managerName: session.user.name || "Manager",
            formTitle: formTitle,
            status: "Pending",
            message: `A new form "${formTitle}" has been assigned to you for client: ${clinetName}`,
            taskLink: `https://mhcirclesolutions.com/teamlead/tasks/${newSubmission._id}`,
          });

          await sendMail(teamLead.email, "New Task Assigned", html);
        } catch (e) {
          console.error("Email error:", e);
        }

        await sendNotification({
          senderId: session.user.id,
          senderModel: "Manager",
          senderName: session.user.name || "Manager",
          receiverId: teamLead._id,
          receiverModel: "TeamLead",
          type: "form_assigned",
          title: "New Task Assigned",
          message: `A new form "${formTitle}" has been assigned to you for client: ${clinetName}`,
          link: `/teamlead/tasks/${newSubmission._id}`,
          referenceId: newSubmission._id,
          referenceModel: "FormSubmission",
        });
      }
    }

    return NextResponse.json(
      { 
        message: "Form submitted successfully", 
        submission: newSubmission,
        clinetName: newSubmission.clinetName // ✅ Return clinetName in response
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST error:", error);
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

