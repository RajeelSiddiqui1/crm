import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import connectDB from "@/lib/db";
import TeamLead from "@/models/TeamLead";
import { authOptions } from "@/lib/auth";
import FormSubmission from "@/models/FormSubmission";

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "TeamLead") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    // Get logged in team lead
    const currentTeamLead = await TeamLead.findOne({ email: session.user.email });
    if (!currentTeamLead) {
      return NextResponse.json({ error: "Team lead not found" }, { status: 404 });
    }

    // Get task ID from query parameters
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');

    let alreadySharedTeamLeads = [];

    // If taskId is provided, get team leads already shared with this task
    if (taskId) {
      const task = await FormSubmission.findById(taskId)
        .select('multipleTeamLeadShared')
        .populate('multipleTeamLeadShared', '_id');
      
      if (task && task.multipleTeamLeadShared) {
        alreadySharedTeamLeads = task.multipleTeamLeadShared.map(tl => tl._id.toString());
      }
    }

    // Get all other team leads (excluding current team lead)
    // Also exclude team leads already shared with the task
    const otherTeamLeads = await TeamLead.find({
      _id: { 
        $ne: currentTeamLead._id,
        $nin: alreadySharedTeamLeads // Exclude already shared team leads
      }
    })
    .select("-password -otp -otpExpiry")
    .populate({
      path: 'depId',
      select: 'name'
    })
    .sort({ firstName: 1 });

    // Get all team leads including already shared ones (for reference)
    const allTeamLeads = await TeamLead.find({
      _id: { $ne: currentTeamLead._id }
    })
    .select("-password -otp -otpExpiry")
    .populate({
      path: 'depId',
      select: 'name'
    })
    .sort({ firstName: 1 });

    return NextResponse.json({
      currentTeamLead: {
        _id: currentTeamLead._id,
        firstName: currentTeamLead.firstName,
        lastName: currentTeamLead.lastName,
        email: currentTeamLead.email,
        depId: currentTeamLead.depId
      },
      teamLeads: otherTeamLeads,
      alreadySharedTeamLeads: alreadySharedTeamLeads, // Already shared IDs
      allTeamLeads: allTeamLeads // All team leads for reference
    }, { status: 200 });

  } catch (error) {
    console.error("Error fetching team leads:", error);
    return NextResponse.json({ error: "Failed to fetch team leads" }, { status: 500 });
  }
}