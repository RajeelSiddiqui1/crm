import SharedTask from "@/models/SharedTask";
import Manager from "@/models/Manager";
import EmployeeFormSubmission from "@/models/EmployeeFormSubmission";
import dbConnect from "@/lib/db";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendNotification } from "@/lib/sendNotification";
import { sendMail } from "@/lib/mail";
import { sharedTaskMailTemplate } from "@/helper/emails/manager/sharedtask-manager";

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "Manager") {
      return NextResponse.json({ success: false, message: "Unauthorized access" }, { status: 401 });
    }

    await dbConnect();
    const body = await request.json();
    const { formId, originalTaskId, taskTitle, taskDescription, sharedTo, dueDate, priority, notes } = body;

    const formSubmission = await EmployeeFormSubmission.findById(formId);
    if (!formSubmission) {
      return NextResponse.json({ success: false, message: "Form submission not found" }, { status: 404 });
    }

    const receiverManager = await Manager.findById(sharedTo);
    if (!receiverManager) {
      return NextResponse.json({ success: false, message: "Manager not found" }, { status: 404 });
    }

    const sharedTaskData = {
      formId,
      originalTaskId,
      taskTitle,
      taskDescription,
      dueDate,
      priority: priority || "medium",
      notes: notes || "",
      status: "pending",
      sharedManager: sharedTo,
      sharedBy: session.user.id
    };

    const sharedTask = new SharedTask(sharedTaskData);
    await sharedTask.save();

    const populatedTask = await SharedTask.findById(sharedTask._id)
      .populate("sharedManager", "firstName lastName email")
      .populate("sharedBy", "firstName lastName email")
      .populate("formId");

    // -------------------------------
    // ✅ Send notification & email to receiver manager
    // -------------------------------
    const taskLink = `${process.env.NEXTAUTH_URL}/manager/sharedtasks/${sharedTask._id}`;
    const tasks = [];

    if (receiverManager.email) {
      tasks.push(sendNotification({
        senderId: session.user.id,
        senderModel: "Manager",
        senderName: session.user.name || "Manager",
        receiverId: receiverManager._id,
        receiverModel: "Manager",
        type: "shared_task",
        title: "New Task Shared with You",
        message: `A new task "${taskTitle}" has been shared by ${session.user.name || "Manager"}`,
        link: taskLink,
        referenceId: sharedTask._id,
        referenceModel: "SharedTask"
      }));

      tasks.push(sendMail(
        receiverManager.email,
        "New Task Shared with You",
        sharedTaskMailTemplate(
          `${receiverManager.firstName} ${receiverManager.lastName}`,
          session.user.name || "Manager",
          taskTitle,
          taskDescription,
          dueDate,
          priority || "medium",
          notes || "",
          taskLink
        )
      ));
    }

    await Promise.all(tasks);

    return NextResponse.json({ success: true, message: "Task shared successfully", sharedTask: populatedTask }, { status: 201 });

  } catch (error) {
    return NextResponse.json({ success: false, message: "Internal server error", error: error.message }, { status: 500 });
  }
}

export async function GET(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "Manager") {
            return NextResponse.json({ success: false, message: "Unauthorized access" }, { status: 401 });
        }

        await dbConnect();

        const sharedTasks = await SharedTask.find({
            $or: [
                { sharedBy: session.user.id },
                { sharedManager: session.user.id }
            ]
        })
        .populate("sharedManager", "firstName lastName email")
        .populate("sharedBy", "firstName lastName email")
        .populate("formId")
        .sort({ createdAt: -1 });

        return NextResponse.json({ 
            success: true, 
            sharedTasks 
        }, { status: 200 });

    } catch (error) {
        return NextResponse.json({ success: false, message: "Internal server error", error: error.message }, { status: 500 });
    }
}