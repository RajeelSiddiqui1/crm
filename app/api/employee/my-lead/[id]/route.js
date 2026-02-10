import dbConnect from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import SharedTask from "@/models/SharedTask";
import EmployeeFormSubmission from "@/models/EmployeeFormSubmission";
import Employee from "@/models/Employee";
import Department from "@/models/Department";
import EmployeeForm from "@/models/EmployeeForm";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = params;

    if (!session || session.user.role !== "Employee") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    // Get the specific shared task
    const sharedTask = await SharedTask.findById(id)
      .populate({
        path: "formId",
        populate: [
          {
            path: "employeeId",
            model: "Employee",
            select: "firstName lastName email phone designation depId",
          },
          {
            path: "formId",
            model: "EmployeeForm",
            select: "title description fields",
          },
        ],
      })
      .populate({
        path: "sharedBy",
        select: "firstName lastName email departments",
        populate: {
          path: "departments",
          select: "name",
        },
      })

      .populate({
        path: "sharedManager",
        select: "firstName lastName email departments",
        populate: {
          path: "departments",
          select: "name",
        },
      })
      .populate({
        path: "sharedTeamlead",
        select: "firstName lastName email depId",
        populate: {
          path: "depId",
          select: "name",
        },
      })
      .populate({
        path: "sharedOperationManager",
        select: "firstName lastName email departments",
        populate: {
          path: "departments",
          select: "name",
        },
      })
      .populate({
        path: "sharedOperationTeamlead",
        select: "firstName lastName email depId",
        populate: {
          path: "depId",
          select: "name",
        },
      })
      .populate({
        path: "sharedOperationEmployee",
        select: "firstName lastName email depId",
        populate: {
          path: "depId",
          select: "name",
        },
      })

      .select("+fileAttachments");

    if (!sharedTask) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    // Verify that this lead belongs to the logged-in employee
    if (
      !sharedTask.formId ||
      sharedTask.formId.employeeId._id.toString() !== session.user.id
    ) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get current employee info
    const currentEmployee = await Employee.findById(session.user.id)
      .select("firstName lastName email phone designation depId")
      .populate("depId", "name");

    return NextResponse.json(
      {
        success: true,
        lead: sharedTask,
        employee: currentEmployee,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("GET Lead Details Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch lead details" },
      { status: 500 },
    );
  }
}

export async function PUT(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = params;

    if (!session || session.user.role !== "Employee") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { status, employeeFeedback, notes } = body;

    await dbConnect();

    // Find the shared task
    const sharedTask = await SharedTask.findById(id).populate({
      path: "formId",
      populate: {
        path: "employeeId",
        model: "Employee",
      },
    });

    if (!sharedTask) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    // Verify ownership
    if (
      !sharedTask.formId ||
      sharedTask.formId.employeeId._id.toString() !== session.user.id
    ) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Update fields
    const updates = {};
    if (
      status &&
      [
        "pending",
        "signed",
        "not_avaiable",
        "not_intrested",
        "re_shedule",
      ].includes(status)
    ) {
      updates.status = status;
    }

    if (employeeFeedback !== undefined) {
      updates.employeeFeedback = employeeFeedback;
      updates.feedbackUpdatedAt = new Date();
    }

    if (notes !== undefined) {
      updates.notes = notes;
    }

    // Update the task
    const updatedTask = await SharedTask.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true },
    )
      .populate({
        path: "formId",
        select: "formId employeeId formData fileAttachments submittedBy assignedTo subtaskId teamleadstatus managerStatus completedAt createdAt",
        populate: [
          {
            path: "employeeId",
            model: "Employee",
            select: "firstName lastName email phone designation depId",
          },
          {
            path: "formId",
            model: "EmployeeForm",
            select: "title description fields",
          },
        ],
      })

      .populate("sharedBy", "firstName lastName email departments")
      .populate("sharedManager", "firstName lastName email departments")
      .populate("sharedTeamlead", "firstName lastName email depId")
      .populate(
        "sharedOperationManager",
        "firstName lastName email departments",
      )
      .populate("sharedOperationTeamlead", "firstName lastName email depId")
      .populate("sharedOperationEmployee", "firstName lastName email depId");

    return NextResponse.json(
      {
        success: true,
        message: "Lead updated successfully",
        lead: updatedTask,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("UPDATE Lead Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update lead" },
      { status: 500 },
    );
  }
}
