import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import FormSubmission from "@/models/FormSubmission";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "TeamLead") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const teamLeadId = session.user.id;

    // Get tasks where current team lead is in multipleTeamLeadAssigned array
    // and assignedTo is not set (meaning no one has claimed it yet)
    const tasks = await FormSubmission.find({
      multipleTeamLeadAssigned: teamLeadId,
      assignedTo: { $exists: false }
    })
    .populate('formId', 'title description')
    .populate('submittedBy', 'name email')
    .populate('multipleTeamLeadAssigned', 'name email')
    .sort({ createdAt: -1 })
    .lean();

    return NextResponse.json({ tasks }, { status: 200 });
  } catch (error) {
    console.error("Error fetching task offers:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}