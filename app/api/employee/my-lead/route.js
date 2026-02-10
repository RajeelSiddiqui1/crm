import dbConnect from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import SharedTask from "@/models/SharedTask";
import EmployeeFormSubmission from "@/models/EmployeeFormSubmission";
import Employee from "@/models/Employee";
import Department from "@/models/Department";
import EmployeeForm from "@/models/EmployeeForm";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);

    // Only employees can access their leads
    if (!session || session.user.role !== "Employee") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    // Get current employee details
    const currentEmployee = await Employee.findById(session.user.id)
      .select("firstName lastName email phone designation depId")
      .populate("depId", "name");

    if (!currentEmployee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    // First, find all EmployeeFormSubmissions where this employee is the employeeId
    const formSubmissions = await EmployeeFormSubmission.find({
      employeeId: session.user.id
    })
      .populate({
        path: "formId",
        model: "EmployeeForm",
        select: "title description depId"
      })
      .populate("employeeId", "firstName lastName email phone designation depId");

    // Extract form submission IDs
    const formSubmissionIds = formSubmissions.map(sub => sub._id);

    // Get all shared tasks where formId is in the employee's form submissions
    const sharedTasks = await SharedTask.find({
      formId: { $in: formSubmissionIds }
    })
      .populate({
        path: "formId",
        populate: [
          {
            path: "employeeId",
            model: "Employee",
            select: "firstName lastName email phone designation depId"
          },
          {
            path: "formId",
            model: "EmployeeForm",
            select: "title description"
          }
        ]
      })
      .populate("sharedBy", "firstName lastName email departments")
      .populate("sharedManager", "firstName lastName email departments")
      .populate("sharedTeamlead", "firstName lastName email depId")
      .populate("sharedOperationManager", "firstName lastName email departments")
      .populate("sharedOperationTeamlead", "firstName lastName email depId")
      .populate("sharedOperationEmployee", "firstName lastName email depId")
      .sort({ createdAt: -1 })
      .select("+fileAttachments");

    // Transform data
    const leads = sharedTasks.map(task => ({
      _id: task._id,
      taskTitle: task.taskTitle,
      taskDescription: task.taskDescription,
      originalTaskId: task.originalTaskId,
      formSubmission: task.formId,
      priority: task.priority,
      status: task.status,
      dueDate: task.dueDate,
      sharedBy: task.sharedBy,
      sharedManager: task.sharedManager,
      sharedTeamlead: task.sharedTeamlead,
      sharedOperationManager: task.sharedOperationManager,
      sharedOperationTeamlead: task.sharedOperationTeamlead,
      sharedOperationEmployee: task.sharedOperationEmployee,
      employeeFeedback: task.employeeFeedback,
      feedbackUpdatedAt: task.feedbackUpdatedAt,
      VendorStatus: task.VendorStatus,
      MachineStatus: task.MachineStatus,
      notes: task.notes,
      fileAttachments: task.fileAttachments || [],
      createdAt: task.createdAt,
      updatedAt: task.updatedAt
    }));

    return NextResponse.json({
      success: true,
      employee: currentEmployee,
      leads: leads,
      count: leads.length
    }, { status: 200 });

  } catch (error) {
    console.error("GET Employee Leads Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch leads" },
      { status: 500 }
    );
  }
}