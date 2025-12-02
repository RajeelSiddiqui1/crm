import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import dbConnect from "@/lib/db";
import EmployeeForm from "@/models/EmployeeForm";
import Employee from "@/models/Employee";
import EmployeeFormSubmission from "@/models/EmployeeFormSubmission";
import Subtask from "@/models/Subtask";
import { authOptions } from "@/lib/auth";

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "Employee") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(req.url);
    const subtaskId = searchParams.get("subtaskId");

    if (!subtaskId) {
      return NextResponse.json({ error: "Subtask ID is required" }, { status: 400 });
    }

    const subtask = await Subtask.findById(subtaskId);
    if (!subtask) {
      return NextResponse.json({ error: "Subtask not found" }, { status: 404 });
    }

    const isAssigned = subtask.assignedEmployees.some(
      (emp) => emp.employeeId.toString() === session.user.id
    );

    if (!isAssigned) {
      return NextResponse.json({ 
        error: "You are not assigned to this subtask" 
      }, { status: 403 });
    }

    // ✅ Get lead requirement from subtask
    const leadRequired = subtask.lead || 1;
    
    // ✅ Count ONLY approved submissions (model ke hisab se)
    const approvedSubmissions = await EmployeeFormSubmission.countDocuments({
      subtaskId: subtaskId,
      employeeId: session.user.id,
      teamleadstatus: "approved"
    });

    console.log(`📊 Approved: ${approvedSubmissions}, Required: ${leadRequired}`);

    // ✅ IMPORTANT: Jab tak approved submissions lead ke equal nahi hain, forms available rahein
    if (approvedSubmissions >= leadRequired) {
      console.log("✅ All required forms approved. No more forms needed.");
      return NextResponse.json([]);
    }

    const employee = await Employee.findById(session.user.id);
    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    // ✅ Get all active forms for department
    let allForms;
    try {
      allForms = await EmployeeForm.find({ 
        depId: employee.depId 
      }).sort({ createdAt: -1 }).lean();
    } catch (error) {
      console.error("Error fetching forms:", error);
      return NextResponse.json({ error: "Failed to fetch forms" }, { status: 500 });
    }

    console.log(`📋 Total forms in department: ${allForms.length}`);

    // ✅ IMPORTANT CHANGE: Sirf REJECTED forms ko dobara allow karein
    // PENDING wale bhi available rahein taki employee wait na kare
    const rejectedSubmissions = await EmployeeFormSubmission.find({
      subtaskId: subtaskId,
      employeeId: session.user.id,
      teamleadstatus: "rejected"
    }).populate("formId");

    const rejectedFormIds = rejectedSubmissions
      .map((sub) => sub.formId?._id?.toString())
      .filter(Boolean);

    console.log(`❌ Rejected forms: ${rejectedFormIds.length}`);

    // ✅ Calculate how many more submissions needed
    const remainingSubmissionsNeeded = leadRequired - approvedSubmissions;
    
    console.log(`🎯 Remaining submissions needed: ${remainingSubmissionsNeeded}`);

    if (allForms.length === 0) {
      console.log("ℹ️ No forms in department");
      return NextResponse.json([]);
    }

    // ✅ Create array of forms for employee
    let formsToShow = [];
    
    if (remainingSubmissionsNeeded > 0) {
      // Kitni baar har form dikhana hai
      // Agar 2 forms hain aur 10 submissions chahiye, toh har form 5-5 baar dikhaye
      const formsCount = allForms.length;
      const formsPerSubmission = Math.ceil(remainingSubmissionsNeeded / formsCount);
      
      console.log(`🔄 Forms per submission: ${formsPerSubmission}`);
      
      for (let i = 0; i < formsCount && formsToShow.length < remainingSubmissionsNeeded; i++) {
        const form = allForms[i];
        
        // Har form ko itni baar add karein jitni needed hai
        const copiesForThisForm = Math.min(
          formsPerSubmission,
          remainingSubmissionsNeeded - formsToShow.length
        );
        
        console.log(`📝 Form "${form.title}" will show ${copiesForThisForm} times`);
        
        for (let j = 0; j < copiesForThisForm; j++) {
          formsToShow.push({
            ...form,
            _originalId: form._id,
            instanceNumber: j + 1,
            displayTitle: `${form.title} ${j > 0 ? `(${j + 1})` : ''}`
          });
        }
      }
    }

    console.log(`✅ Showing ${formsToShow.length} form instances`);

    return NextResponse.json(formsToShow);

  } catch (error) {
    console.error("Forms API Error:", error);
    return NextResponse.json(
      { error: `Failed to fetch forms: ${error.message}` },
      { status: 500 }
    );
  }
}