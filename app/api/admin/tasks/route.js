// app/api/admin/tasks/route.js
import { NextResponse } from "next/server";
import AdminTask from "@/models/AdminTask";
import Manager from "@/models/Manager";
import dbConnect from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import s3 from "@/lib/aws";
import { Upload } from "@aws-sdk/lib-storage";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { sendNotification } from "@/lib/sendNotification";
import { sendMail } from "@/lib/mail";
import { adminTaskCreatedMailTemplate } from "@/helper/emails/admin/createTask";

export async function POST(req) {
  console.log("---- POST /api/admin/tasks ----");

  try {
    console.log("1️⃣ Connecting to database...");
    await dbConnect();
    console.log("✅ DB connected");

    console.log("2️⃣ Getting session...");
    const session = await getServerSession(authOptions);
    console.log("Session:", session);

    if (!session || session.user.role !== "Admin") {
      console.warn("❌ Unauthorized access");
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log("3️⃣ Reading form data...");
    const formData = await req.formData();
    const title = formData.get("title");
    const description = formData.get("description") || "";
    const clientName = formData.get("clientName") || "";
    const priority = formData.get("priority") || "low";
    const endDate = formData.get("endDate") || null;
    let managersId = [];

    try {
      managersId = JSON.parse(formData.get("managersId") || "[]");
    } catch (err) {
      console.error("❌ Error parsing managersId:", err);
      return NextResponse.json(
        { success: false, message: "Invalid managersId format" },
        { status: 400 }
      );
    }

    console.log("Title:", title, "ManagersId:", managersId);

    if (!title || managersId.length === 0) {
      console.warn("❌ Title or managers missing");
      return NextResponse.json(
        { success: false, message: "Title and managers are required" },
        { status: 400 }
      );
    }

    // -------------------------------
    // MULTIPLE FILE UPLOADS
    // -------------------------------
    console.log("4️⃣ Handling file uploads...");
    const files = formData.getAll("files[]");
    const uploadedFiles = [];

    for (const file of files) {
      if (file && file.size > 0) {
        try {
          console.log("Uploading file:", file.name);
          const buffer = Buffer.from(await file.arrayBuffer());
          const fileKey = `admin_tasks/files/${Date.now()}_${file.name}`;

          const upload = new Upload({
            client: s3,
            params: {
              Bucket: process.env.AWS_BUCKET_NAME,
              Key: fileKey,
              Body: buffer,
              ContentType: file.type,
              Metadata: {
                originalName: encodeURIComponent(file.name),
                uploadedBy: session.user.id,
                uploadedAt: Date.now().toString(),
              },
            },
          });

          await upload.done();
          console.log("✅ File uploaded:", file.name);

          const command = new GetObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: fileKey,
          });

          const fileUrl = await getSignedUrl(s3, command, { expiresIn: 604800 });
          uploadedFiles.push({
            url: fileUrl,
            name: file.name,
            type: file.type,
            size: file.size,
            publicId: fileKey,
          });
        } catch (err) {
          console.error("❌ S3 file upload error:", file.name, err);
        }
      }
    }

    // -------------------------------
    // MULTIPLE AUDIO UPLOADS
    // -------------------------------
    console.log("5️⃣ Handling audio uploads...");
    const audioFiles = formData.getAll("audioFiles[]");
    const uploadedAudio = [];

    for (const audio of audioFiles) {
      if (audio && audio.size > 0) {
        try {
          console.log("Uploading audio:", audio.name);
          const buffer = Buffer.from(await audio.arrayBuffer());
          const audioKey = `admin_tasks/audio/${Date.now()}_${audio.name}`;

          const uploadAudio = new Upload({
            client: s3,
            params: {
              Bucket: process.env.AWS_BUCKET_NAME,
              Key: audioKey,
              Body: buffer,
              ContentType: audio.type,
              Metadata: {
                originalName: encodeURIComponent(audio.name),
                uploadedBy: session.user.id,
                uploadedAt: Date.now().toString(),
              },
            },
          });
          await uploadAudio.done();

          const command = new GetObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: audioKey,
          });

          const audioUrl = await getSignedUrl(s3, command, { expiresIn: 604800 });
          uploadedAudio.push({
            url: audioUrl,
            name: audio.name,
            type: audio.type,
            size: audio.size,
            publicId: audioKey,
          });

          console.log("✅ Audio uploaded:", audio.name);
        } catch (err) {
          console.error("❌ S3 upload error for audio file:", audio.name, err);
        }
      }
    }

    // -------------------------------
    // RECORDED AUDIO UPLOAD
    // -------------------------------
    console.log("6️⃣ Handling recorded audios...");
    const recordedAudios = formData.getAll("recordedAudios[]");
    const singleRecordedAudio = formData.get("recordedAudio");

    if (singleRecordedAudio && singleRecordedAudio.size > 0) {
      recordedAudios.push(singleRecordedAudio);
    }

    for (const recordedAudio of recordedAudios) {
      if (recordedAudio && recordedAudio.size > 0) {
        try {
          console.log("Uploading recorded audio:", recordedAudio.name || "Voice Recording");
          const buffer = Buffer.from(await recordedAudio.arrayBuffer());
          const audioKey = `admin_tasks/recordings/${Date.now()}_recording.webm`;

          const uploadAudio = new Upload({
            client: s3,
            params: {
              Bucket: process.env.AWS_BUCKET_NAME,
              Key: audioKey,
              Body: buffer,
              ContentType: recordedAudio.type || "audio/webm",
              Metadata: {
                isRecording: "true",
                uploadedBy: session.user.id,
                uploadedAt: Date.now().toString(),
              },
            },
          });
          await uploadAudio.done();

          const command = new GetObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: audioKey,
          });
          const audioUrl = await getSignedUrl(s3, command, { expiresIn: 604800 });

          uploadedAudio.push({
            url: audioUrl,
            name: recordedAudio.name || "Voice Recording",
            type: recordedAudio.type || "audio/webm",
            size: recordedAudio.size,
            publicId: audioKey,
          });

          console.log("✅ Recorded audio uploaded");
        } catch (err) {
          console.error("❌ S3 upload error for recorded audio:", err);
        }
      }
    }

    // -------------------------------
    // FETCH MANAGERS
    // -------------------------------
    console.log("7️⃣ Fetching managers...");
    const managers = await Manager.find({ _id: { $in: managersId } });
    console.log("Managers found:", managers.length);

    const departmentSet = new Set();
    managers.forEach((manager) =>
      manager.departments.forEach((dep) => departmentSet.add(dep.toString()))
    );
    const departmentIds = Array.from(departmentSet);
    console.log("Departments involved:", departmentIds);

    // -------------------------------
    // SAVE ADMIN TASK
    // -------------------------------
    console.log("8️⃣ Saving admin task...");
    const newTask = new AdminTask({
      title,
      description,
      clientName,
      fileAttachments: uploadedFiles,
      audioFiles: uploadedAudio,
      priority,
      endDate: endDate ? new Date(endDate) : null,
      managers: managersId,
      departments: departmentIds,
      submittedBy: session.user.id,
    });

    await newTask.save();
    console.log("✅ Admin task saved:", newTask._id);

    // -------------------------------
    // SEND NOTIFICATIONS & EMAILS
    // -------------------------------
    console.log("9️⃣ Sending notifications and emails...");
    const taskLink = `${process.env.NEXT_PUBLIC_DOMAIN}/manager/admin-tasks`;
    await Promise.all(
      managers.flatMap((manager) => {
        const emailHtml = adminTaskCreatedMailTemplate(
          `${manager.firstName} ${manager.lastName}`,
          title,
          session.user.name || "Admin",
          priority,
          endDate,
          taskLink
        );

        return [
          sendNotification({
            senderId: session.user.id,
            senderModel: "Admin",
            senderName: session.user.name || "Admin",
            receiverId: manager._id,
            receiverModel: "Manager",
            type: "admin_task_created",
            title: "New Admin Task",
            message: `A new admin task "${title}" has been assigned to you.`,
            link: taskLink,
            referenceId: newTask._id,
            referenceModel: "AdminTask",
          }),
          sendMail(manager.email, "New Admin Task Assigned", emailHtml),
        ];
      })
    );

    console.log("🔟 All notifications sent");

    return NextResponse.json(
      { success: true, message: "Admin task created successfully", task: newTask },
      { status: 201 }
    );
  } catch (error) {
    console.error("🔥 Admin Task Error:", error.stack || error);
    return NextResponse.json(
      { success: false, message: "Task creation failed", error: error.message },
      { status: 500 }
    );
  }
}


export async function GET() {
  try {
    await dbConnect();

    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "Admin") {
      return NextResponse.json(
        { success: false, message: "Unauthorized access" },
        { status: 401 }
      );
    }

    const tasks = await AdminTask.find({ submittedBy: session.user.id })
      .populate({
        path: "managers",
        select: "firstName lastName email departments",
        populate: { path: "departments", select: "name description" },
      })
      .populate({ path: "submittedBy", select: "name email" })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(
      { success: true, tasks, message: "Tasks fetched successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching admin tasks:", error);
    return NextResponse.json(
      { success: false, message: "Tasks fetch error",error },
      { status: 500 }
    );
  }
}