import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import dbConnect from "@/lib/db";
import EmployeeFormSubmission from "@/models/EmployeeFormSubmission";
import EmployeeForm from "@/models/EmployeeForm";
import { authOptions } from "@/lib/auth";

export async function POST(req) {
  try {
    console.log("📥 API hit hua...");
    
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    console.log("✅ Database connected");

    const body = await req.json();
    console.log("📦 Request body:", body);

    const { formId, subtaskId, formData } = body;

    if (!formId || !subtaskId) {
      return NextResponse.json({ error: "Form ID aur Subtask ID required hai" }, { status: 400 });
    }

    // ✅ Form details get karein takay assignedTo mil jaye
    const form = await EmployeeForm.findById(formId);
    if (!form) {
      return NextResponse.json({ error: "Form nahi mila" }, { status: 404 });
    }

    console.log("📋 Form details:", {
      formId: form._id,
      managerId: form.managerId,
      depId: form.depId
    });

    // ✅ Simple submission create karein with assignedTo
    const submission = new EmployeeFormSubmission({
      formId,
      subtaskId,
      employeeId: session.user.id,
      submittedBy: session.user.email,
      assignedTo: form.managerId || "system", // ✅ YEH ADD KAREIN
      formData,
      teamleadstatus: "pending",
      managerstatus: "pending",
    });

    await submission.save();
    console.log("✅ Submission saved:", submission._id);

    return NextResponse.json(
      { message: "Form submit ho gaya!", submissionId: submission._id },
      { status: 201 }
    );

  } catch (error) {
    console.error("❌ API error:", error);
    return NextResponse.json(
      { error: `Server error: ${error.message}` },
      { status: 500 }
    );
  }
}