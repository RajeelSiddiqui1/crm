import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Form from "@/models/Form";
import Department from "@/models/Department";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// ✅ POST (create new form by logged-in manager)
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

    // ✅ Create form with logged-in managerId
    const newForm = new Form({
      title,
      depId,
      description,
      fields,
      createdBy,
      managerId: session.user.id, // attach manager id
    });

    await newForm.save();

    return NextResponse.json(newForm, { status: 201 });
  } catch (error) {
    console.error("Form creation error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ✅ GET (fetch forms by logged-in manager)
export async function GET() {
  try {
    await dbConnect();

    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "Manager") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // ✅ Fetch only forms created by this manager
    const forms = await Form.find({ managerId: session.user.id });

    return NextResponse.json(forms, { status: 200 });
  } catch (error) {
    console.error("Fetch forms error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
