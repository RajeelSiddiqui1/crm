// app/api/employee/tasks/[id]/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import dbConnect from "@/lib/db";
import FormSubmission from "@/models/FormSubmission";
import Employee from "@/models/Employee";
import TeamLead from "@/models/TeamLead";
import Manager from "@/models/Manager";
import { authOptions } from "@/lib/auth";
import { sendNotification } from "@/lib/sendNotification";

// GET: ایمپلائی کے لیے ٹاسک ڈیٹیلز
export async function GET(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "Employee") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const { id } = params;

    // ✅ ID validation
    if (!id || id === "undefined") {
      return NextResponse.json(
        { error: "Invalid Task ID" },
        { status: 400 }
      );
    }

    const employee = await Employee.findOne({ email: session.user.email });
    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    const task = await FormSubmission.findById(id)
      .populate("formId", "title description fields")
      .populate("depId", "name description")
      .populate("submittedBy", "firstName lastName email phone department")
      .populate("assignedTo", "firstName lastName email phone department")
      .populate("multipleTeamLeadShared", "firstName lastName email department")
      .populate({
        path: "assignedEmployees.employeeId",
        select: "firstName lastName email department position phone profileImage",
        populate: {
          path: "depId",
          select: "name",
        },
      })
      .populate("employeeFeedbacks.employeeId", "firstName lastName email")
      .populate("teamLeadFeedbacks.teamLeadId", "firstName lastName email department")
      .lean();

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const isAssigned = task.assignedEmployees?.some(
      a => a.employeeId?._id?.toString() === employee._id.toString()
    );

    if (!isAssigned) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json(task, { status: 200 });

  } catch (error) {
    console.error("GET task details error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// PUT: ٹاسک اسٹیٹس اپڈیٹ
export async function PUT(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "Employee") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const { id } = params;
    const { status, feedback } = await req.json();

    const employee = await Employee.findOne({ email: session.user.email });
    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    const task = await FormSubmission.findById(id)
      .populate("formId")
      .populate("submittedBy")
      .populate("assignedTo");

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // چیک کریں کہ ایمپلائی اس ٹاسک پر ہے
    const isAssigned = task.assignedEmployees?.some(
      assignment => assignment.employeeId?.toString() === employee._id.toString()
    );

    if (!isAssigned) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // ایمپلائی کا اسٹیٹس اپڈیٹ کریں
    const assignmentIndex = task.assignedEmployees.findIndex(
      assignment => assignment.employeeId?.toString() === employee._id.toString()
    );

    if (assignmentIndex !== -1) {
      task.assignedEmployees[assignmentIndex].status = status;
      if (status === "completed") {
        task.assignedEmployees[assignmentIndex].completedAt = new Date();
      }
    }

    // اگر فیڈ بیک دیا گیا ہے تو اسٹور کریں
    if (feedback) {
      task.employeeFeedbacks.push({
        employeeId: employee._id,
        feedback: feedback.trim(),
        submittedAt: new Date()
      });
    }

    await task.save();

    // نوٹیفیکیشنز بھیجیں
    const notifications = [];

    // ٹیم لیڈ کو نوٹیفائی کریں
    if (task.assignedTo?.length > 0) {
      await Promise.allSettled(
        task.assignedTo.map(async (teamLead) => {
          notifications.push(
            sendNotification({
              senderId: employee._id,
              senderModel: "Employee",
              senderName: `${employee.firstName} ${employee.lastName}`,
              receiverId: teamLead._id,
              receiverModel: "TeamLead",
              type: "employee_status_update",
              title: "Employee Status Updated",
              message: `${employee.firstName} ${employee.lastName} updated task "${task.formId?.title}" status to ${status}`,
              link: `/teamlead/tasks/${task._id}`,
              referenceId: task._id,
              referenceModel: "FormSubmission",
            })
          );
        })
      );
    }

    // مینیجر کو نوٹیفائی کریں
    if (task.submittedBy) {
      notifications.push(
        sendNotification({
          senderId: employee._id,
          senderModel: "Employee",
          senderName: `${employee.firstName} ${employee.lastName}`,
          receiverId: task.submittedBy._id,
          receiverModel: "Manager",
          type: "employee_status_update",
          title: "Employee Status Updated",
          message: `${employee.firstName} ${employee.lastName} updated task "${task.formId?.title}" status to ${status}`,
          link: `/manager/tasks/${task._id}`,
          referenceId: task._id,
          referenceModel: "FormSubmission",
        })
      );
    }

    await Promise.allSettled(notifications);

    return NextResponse.json({
      success: true,
      message: "Task status updated successfully",
      task: task
    }, { status: 200 });

  } catch (error) {
    console.error("PUT task update error:", error);
    return NextResponse.json({
      error: "Internal Server Error",
      details: error.message
    }, { status: 500 });
  }
}