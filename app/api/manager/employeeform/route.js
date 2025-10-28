import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import EmployeeForm from "@/models/EmployeeForm";
import Department from "@/models/Department";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// ✅ POST (create new EmployeeForm by logged-in manager)
export async function POST(req) {
  try {
    await dbConnect();

    const session = await getServerSession(authOptions);

    // ✅ Only allow logged-in Managers
    if (!session || session.user.role !== "Manager") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, depId, description, fields, createdBy } = body;

    // ✅ Check if department exists
    const department = await Department.findById(depId);
    if (!department) {
      return NextResponse.json(
        { error: "Department not found" },
        { status: 404 }
      );
    }

    // ✅ Create EmployeeForm with logged-in managerId
    const newEmployeeForm = new EmployeeForm({
      title,
      depId,
      description,
      fields,
      createdBy,
      managerId: session.user.id, // attach manager id
    });

    await newEmployeeForm.save();

    return NextResponse.json(newEmployeeForm, { status: 201 });
  } catch (error) {
    console.error("EmployeeForm creation error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ✅ GET (fetch EmployeeForms by logged-in manager)
export async function GET() {
  try {
    await dbConnect();

    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "Manager") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // ✅ Fetch only EmployeeForms created by this manager
    const EmployeeForms = await EmployeeForm.find({ managerId: session.user.id });

    return NextResponse.json(EmployeeForms, { status: 200 });
  } catch (error) {
    console.error("Fetch EmployeeForms error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
