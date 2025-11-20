import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Form from "@/models/Form";
import AdminTask from "@/models/AdminTask";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req, { params }) {
  try {
    await dbConnect();

    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "Manager") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    // Fetch form details
    const form = await Form.findById(id).lean();
    if (!form) {
      return NextResponse.json({ message: "Form not found" }, { status: 404 });
    }

    // Fetch related admin task (assuming form has adminTask reference)
    let adminTask = null;
    if (form.adminTask) {
      adminTask = await AdminTask.findById(form.adminTask)
        .populate('managers', 'firstName lastName email')
        .lean();
    }

    return NextResponse.json({
      form,
      adminTask
    }, { status: 200 });

  } catch (error) {
    console.error("Error fetching form details:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}