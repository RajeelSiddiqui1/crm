import dbConnect from "@/lib/db";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import SharedTask from "@/models/SharedTask";
import { sendMail } from "@/lib/mail";
import { sendNotification } from "@/lib/sendNotification";
import { operationTaskUpdateMailTemplate } from "@/helper/emails/employee/operationTaskUpdate";

export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "Employee") {
      return NextResponse.json({ success: false, message: "Unauthorized access" }, { status: 401 });
    }

    await dbConnect();
    const { id } = params;
    const { VendorStatus, MachineStatus } = await request.json();

    // Find task assigned to this employee
    const task = await SharedTask.findOne({
      _id: id,
      sharedOperationEmployee: session.user.id
    })
    .populate("sharedOperationTeamlead", "firstName lastName email")
    .populate("sharedBy", "firstName lastName email")
    .populate("formId");

    if (!task) return NextResponse.json({ success: false, message: "Task not found or access denied" }, { status: 404 });

    // Update status fields
    if (VendorStatus) task.VendorStatus = VendorStatus;
    if (MachineStatus) task.MachineStatus = MachineStatus;

    task.feedbackUpdatedAt = new Date();
    await task.save();

    // Populate updated task for response
    const updatedTask = await SharedTask.findById(id)
      .populate("sharedOperationEmployee", "firstName lastName email")
      .populate("sharedOperationTeamlead", "firstName lastName email")
      .populate("sharedBy", "firstName lastName email")
      .populate("formId");

    const taskLink = `${process.env.NEXT_PUBLIC_DOMAIN}/teamlead/operation-tasks/${updatedTask._id}`;
    const employeeName = `${session.user.firstName} ${session.user.lastName}`;
    const teamLeadName = task.sharedOperationTeamlead ? `${task.sharedOperationTeamlead.firstName} ${task.sharedOperationTeamlead.lastName}` : "TeamLead";
    const taskTitle = updatedTask.formId?.title || updatedTask.taskTitle;

    // Send mail & notification to TeamLead in parallel
    await Promise.all([
      sendMail(
        task.sharedOperationTeamlead?.email,
        "Employee Updated Operation Task",
        operationTaskUpdateMailTemplate(employeeName, taskTitle, teamLeadName, taskLink, VendorStatus, MachineStatus)
      ),
      sendNotification({
        senderId: session.user.id,
        senderModel: "Employee",
        senderName: employeeName,
        receiverId: task.sharedOperationTeamlead?._id,
        receiverModel: "TeamLead",
        type: "operation_task_updated",
        title: "Task Updated",
        message: `${employeeName} updated the task "${taskTitle}".`,
        link: taskLink,
        referenceId: updatedTask._id,
        referenceModel: "SharedTask"
      })
    ]);

    return NextResponse.json({
      success: true,
      message: "Status updated and TeamLead notified successfully",
      sharedTask: updatedTask
    }, { status: 200 });

  } catch (error) {
    console.error("Employee Task Update Error:", error);
    return NextResponse.json({ success: false, message: "Internal server error", error: error.message }, { status: 500 });
  }
}

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "Employee") {
      return NextResponse.json({ success: false, message: "Unauthorized access" }, { status: 401 });
    }

    await dbConnect();
    const { id } = params;

    const task = await SharedTask.findOne({
      _id: id,
      sharedOperationEmployee: session.user.id
    })
    .populate("sharedOperationEmployee", "firstName lastName email")
    .populate("sharedOperationTeamlead", "firstName lastName email")
    .populate("sharedBy", "firstName lastName email")
    .populate("formId");

    if (!task) return NextResponse.json({ success: false, message: "Task not found" }, { status: 404 });

    return NextResponse.json({ success: true, sharedTask: task }, { status: 200 });

  } catch (error) {
    console.error("Employee Task Detail Error:", error);
    return NextResponse.json({ success: false, message: "Internal server error", error: error.message }, { status: 500 });
  }
}
