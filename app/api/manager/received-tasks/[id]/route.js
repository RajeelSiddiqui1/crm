import SharedTask from "@/models/SharedTask";
import EmployeeFormSubmission from "@/models/EmployeeFormSubmission";
import Employee from "@/models/Employee";
import dbConnect from "@/lib/db";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendNotification } from "@/lib/sendNotification";
import { sendMail } from "@/lib/mail";
import { sharedTaskAssignTeamLeadMailTemplate } from "@/helper/emails/manager/sharedtask-teamlead";

export async function PATCH(request, context) {
  const { params } = await context; // Next.js 15 fix

  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "Manager") {
      return NextResponse.json(
        { success: false, message: "Unauthorized access" },
        { status: 401 }
      );
    }

    await dbConnect();

    const { id } = params;
    const { sharedTo } = await request.json();

    if (!sharedTo) {
      return NextResponse.json(
        { success: false, message: "Teamlead ID is required" },
        { status: 400 }
      );
    }

    const existingTask = await SharedTask.findOne({
      _id: id,
      sharedManager: session.user.id,
    });

    if (!existingTask) {
      return NextResponse.json(
        { success: false, message: "Task not found or you don't have permission" },
        { status: 404 }
      );
    }

    // Assign Team Lead
    existingTask.sharedTeamlead = sharedTo;
    existingTask.status = "pending";
    await existingTask.save();

    // Populate for notifications and email
    const populatedTask = await SharedTask.findById(existingTask._id)
      .populate("sharedManager", "firstName lastName email")
      .populate("sharedTeamlead", "firstName lastName email department depId")
      .populate({
        path: "formId",
        populate: {
        
          path: "employeeId",
          select: "firstName lastName email department",
        },
      })
      
      .lean();

    // Send notification + email to Team Lead
    const teamLead = populatedTask.sharedTeamlead;
    const employee = populatedTask.formId.employeeId;
    const taskLink = `${process.env.NEXTAUTH_URL}/teamlead/shared-tasks/${populatedTask._id}`;
    const tasks = [];

    if (teamLead?.email) {
      // Notification
      tasks.push(
        sendNotification({
          senderId: session.user.id,
          senderModel: "Manager",
          senderName: session.user.name || "Manager",
          receiverId: teamLead._id,
          receiverModel: "Employee",
          type: "shared_task_assigned",
          title: "New Task Assigned",
          message: `Manager assigned you a new shared task for employee ${employee.firstName} ${employee.lastName}.`,
          link: taskLink,
          referenceId: populatedTask._id,
          referenceModel: "SharedTask",
        })
      );

      // Email
      tasks.push(
        sendMail(
          teamLead.email,
          "New Task Assigned by Manager",
          sharedTaskAssignTeamLeadMailTemplate(
            `${teamLead.firstName} ${teamLead.lastName}`,
            `${employee.firstName} ${employee.lastName}`,
            populatedTask.taskTitle,
            session.user.name || "Manager",
            taskLink
          )
        )
      );
    }

    await Promise.all(tasks);

    return NextResponse.json(
      {
        success: true,
        message: "Teamlead assigned and notifications sent successfully",
        sharedTask: populatedTask,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("PATCH /api/manager/received-tasks/[id] error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error", error: error.message },
      { status: 500 }
    );
  }
}



// manager/received-tasks/[id]/route.js - GET method

export async function GET(request, context) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "Manager") {
      return NextResponse.json(
        { success: false, message: "Unauthorized access" },
        { status: 401 }
      );
    }

    await dbConnect();

    const { params } = context;
    const { id } = params;

    const task = await SharedTask.findOne({
      _id: id,
      sharedManager: session.user.id,
    })
      .populate({
        path: "formId",
        select: "+fileAttachments", // This is key - selects fileAttachments
        populate: {
          path: "employeeId",
          select: "firstName lastName email department phoneNumber address",
        },
      })
      .populate("sharedManager", "firstName lastName email department")
      .populate("sharedTeamlead", "firstName lastName email department depId")
      .populate("sharedEmployee", "firstName lastName email")
      .populate("sharedBy", "firstName lastName email")
      .select("+fileAttachments")
      .lean();

    if (!task) {
      return NextResponse.json(
        { success: false, message: "Task not found or you don't have permission" },
        { status: 404 }
      );
    }

    // Log for debugging
    console.log("Task formId data:", task.formId);
    console.log("File attachments:", task.formId?.fileAttachments);

    return NextResponse.json({ success: true, task }, { status: 200 });
  } catch (error) {
    console.error("GET /api/manager/received-tasks/[id] error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error", error: error.message },
      { status: 500 }
    );
  }
}