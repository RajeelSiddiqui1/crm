import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import FormSubmission from "@/models/FormSubmission";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import s3 from "@/lib/aws";
import { Upload } from "@aws-sdk/lib-storage";
import {
  GetObjectCommand,
  DeleteObjectCommand
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const BUCKET = process.env.AWS_BUCKET_NAME;



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
      .select("+fileAttachments")
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


/* ======================================================
   PUT  (UPDATE + FILE OVERWRITE)  ✅ FIXED
====================================================== */
export async function PUT(req, { params }) {
  try {
    await dbConnect();

    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "Manager") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const formData = await req.formData();

    const title = formData.get("title");
    const managerComments = formData.get("managerComments");
    const status = formData.get("status");

    /* ---------------- PARSE JSON DATA ---------------- */
    let parsedFormData = {};
    try {
      parsedFormData = JSON.parse(formData.get("formData") || "{}");
    } catch {
      parsedFormData = {};
    }

    let removeFiles = [];
    try {
      removeFiles = JSON.parse(formData.get("removeFiles") || "[]");
    } catch {
      removeFiles = [];
    }

    let parsedFileUpdates = {};
    try {
      parsedFileUpdates = JSON.parse(formData.get("fileUpdates") || "{}");
    } catch {
      parsedFileUpdates = {};
    }

    /* ---------------- FIND SUBMISSION ---------------- */
    const submission = await FormSubmission.findById(id).select("+fileAttachments");

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    /* ---------------- BASIC UPDATE ---------------- */
    if (managerComments !== undefined) {
      submission.managerComments = managerComments;
    }

    if (status) {
      submission.status = status;
    }

    /* ---------------- FORM DATA (MAP SAFE UPDATE) ---------------- */
    if (!submission.formData) {
      submission.formData = new Map();
    }

    // title inside formData
    if (title) {
      submission.formData.set("title", title);
    }

    // sanitize helper (prevents mongoose schema objects)
    const sanitize = (val) => JSON.parse(JSON.stringify(val));

    if (parsedFormData && typeof parsedFormData === "object") {
      for (const [key, value] of Object.entries(parsedFormData)) {
        submission.formData.set(key, sanitize(value));
      }
    }

    /* ---------------- FILE HANDLING ---------------- */
    let files = [...(submission.fileAttachments || [])];

    // 🔥 REMOVE FILES
    for (const fileId of removeFiles) {
      const index = files.findIndex(f => f._id.toString() === fileId);
      if (index > -1) {
        const file = files[index];

        if (file.publicId) {
          await s3.send(
            new DeleteObjectCommand({
              Bucket: BUCKET,
              Key: file.publicId,
            })
          );
        }

        files.splice(index, 1);
      }
    }

    // 🔥 ADD NEW FILES
    const newFiles = formData.getAll("files");
for (const file of newFiles) {
  if (!file || !file.size) continue;

  const buffer = Buffer.from(await file.arrayBuffer());
  const key = `manager_tasks/${Date.now()}_${file.name.replace(/\s+/g, "_")}`;

  const upload = new Upload({
    client: s3,
    params: {
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: file.type,
      Metadata: {
        uploadedBy: session.user.id,
        submissionId: id,
      },
    },
  });

  await upload.done();

  // Use correct key here
  const fileUrl = `https://s3.${process.env.AWS_REGION}.amazonaws.com/${process.env.AWS_BUCKET_NAME}/${key}`;

  files.push({
    url: fileUrl,
    name: file.name,
    size: file.size,
    type: file.type,
    publicId: key,
    uploadedBy: session.user.id,
    uploadedAt: new Date(),
  });
}


    // 🔥 UPDATE FILE NAMES
    files = files.map(file => {
      const update = parsedFileUpdates[file._id];
      if (update?.name) {
        return { ...file, name: update.name };
      }
      return file;
    });

    submission.fileAttachments = files;
    submission.updatedAt = new Date();

    /* ---------------- SAVE ---------------- */
    await submission.save();

    /* ---------------- RESPONSE ---------------- */
    const updatedSubmission = await FormSubmission.findById(id)
      .populate("formId", "title description fields")
      .populate("assignedTo", "firstName lastName email")
      .populate("assignedEmployees.employeeId", "firstName lastName email")
      .select("+fileAttachments");

    return NextResponse.json({
      message: "Updated successfully",
      submission: updatedSubmission,
    });

  } catch (e) {
    console.error("Update error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}






export async function DELETE(req, { params }) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    const { id } = params;

    if (!session || session.user.role !== "Manager") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const submission = await FormSubmission.findById(id)
      .populate("formId")
      .populate("multipleTeamLeadAssigned")
      .populate("assignedEmployees.employeeId");

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    // ---------------- FILE HANDLING ----------------
    const allFiles = submission.fileAttachments || [];

    for (const file of allFiles) {
      if (file.publicId) {
        try {
          await s3.send(
            new DeleteObjectCommand({
              Bucket: process.env.AWS_BUCKET_NAME,
              Key: file.publicId,
            })
          );
        } catch (e) {
          console.error("S3 delete error:", e);
        }
      }
    }

    // ---------------- DELETE RECORD ----------------
    await submission.deleteOne();

    // ---------------- NOTIFICATIONS & EMAILS ----------------
    const teamLeads = submission.multipleTeamLeadAssigned || [];
    const employees = submission.assignedEmployees || [];
    const deletedAt = new Date().toLocaleString();

    const mailPromises = [
      ...teamLeads.map(tl =>
        sendMail(
          `${tl.firstName} ${tl.lastName} <${tl.email}>`,
          "Submission Deleted",
          deletedMailTemplate(
            `${tl.firstName} ${tl.lastName}`,
            submission.formId.title,
            session.user.name,
            deletedAt
          )
        )
      ),
      ...employees.map(emp =>
        sendMail(
          `${emp.employeeId.firstName} <${emp.employeeId.email}>`,
          "Submission Deleted",
          deletedMailTemplate(
            emp.employeeId.firstName,
            submission.formId.title,
            session.user.name,
            deletedAt
          )
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

    return NextResponse.json({ message: "Submission deleted successfully" }, { status: 200 });

  } catch (error) {
    console.error("Error deleting submission:", error);
    return NextResponse.json({ error: error.message || "Failed to delete submission" }, { status: 500 });
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
