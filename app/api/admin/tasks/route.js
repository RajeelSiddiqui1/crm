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
  try {
    await dbConnect();

    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "Admin") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const title = formData.get("title");
    const description = formData.get("description") || "";
    const clientName = formData.get("clientName") || "";
    const priority = formData.get("priority") || "low";
    const endDate = formData.get("endDate") || null;
    const managersId = JSON.parse(formData.get("managersId") || "[]");

    if (!title || managersId.length === 0) {
      return NextResponse.json(
        { success: false, message: "Title and managers are required" },
        { status: 400 }
      );
    }

    // -------------------------------
    // MULTIPLE FILE UPLOADS
    // -------------------------------
    const files = formData.getAll("files[]");
    const uploadedFiles = [];

    for (const file of files) {
      if (file && file.size > 0) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const fileName = file.name;
        const fileType = file.type;
        const fileSize = file.size;
        const fileKey = `admin_tasks/files/${Date.now()}_${fileName}`;

        const upload = new Upload({
          client: s3,
          params: {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: fileKey,
            Body: buffer,
            ContentType: fileType,
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
        const fileUrl = await getSignedUrl(s3, command, { expiresIn: 604800 }); // 1 year

        uploadedFiles.push({
          url: fileUrl,
          name: fileName,
          type: fileType,
          size: fileSize,
          publicId: fileKey,
        });
      }
    }

    // -------------------------------
    // MULTIPLE AUDIO UPLOADS
    // -------------------------------
    const audioFiles = formData.getAll("audioFiles[]");
    const uploadedAudio = [];

    for (const audio of audioFiles) {
      if (audio && audio.size > 0) {
        try {
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
        } catch (err) {
          console.error("S3 upload error for audio file:", audio.name, err);
        }
      }
    }

    // -------------------------------
    // RECORDED AUDIO UPLOAD
    // -------------------------------
    const recordedAudios = formData.getAll("recordedAudios[]");
    const singleRecordedAudio = formData.get("recordedAudio");

    if (singleRecordedAudio && singleRecordedAudio.size > 0) {
      recordedAudios.push(singleRecordedAudio);
    }

    for (const recordedAudio of recordedAudios) {
      if (recordedAudio && recordedAudio.size > 0) {
        try {
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
        } catch (err) {
          console.error("S3 upload error for recorded audio:", err);
        }
      }
    }


    // -------------------------------
    // FETCH MANAGERS & DEPARTMENTS
    // -------------------------------
    const managers = await Manager.find({ _id: { $in: managersId } });
    const departmentSet = new Set();
    managers.forEach((manager) =>
      manager.departments.forEach((dep) => departmentSet.add(dep.toString()))
    );
    const departmentIds = Array.from(departmentSet);

    // -------------------------------
    // SAVE ADMIN TASK
    // -------------------------------
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

    // -------------------------------
    // SEND NOTIFICATIONS & EMAILS
    // -------------------------------
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

    return NextResponse.json(
      { success: true, message: "Admin task created successfully", task: newTask },
      { status: 201 }
    );
  } catch (error) {
    console.error("Admin Task Error:", error);
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
      { success: false, message: "Tasks fetch error", error: error.message },
      { status: 500 }
    );
  }
}