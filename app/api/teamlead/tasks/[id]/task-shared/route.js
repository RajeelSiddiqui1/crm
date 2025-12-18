import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import connectDB from "@/lib/db";
import FormSubmission from "@/models/FormSubmission";
import TeamLead from "@/models/TeamLead";
import { authOptions } from "@/lib/auth";
import mongoose from "mongoose";

// GET: Shared team leads کی list حاصل کریں
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "TeamLead") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { id } = params;

    // Current team lead کی معلومات حاصل کریں
    const currentTeamLead = await TeamLead.findOne({ email: session.user.email });
    if (!currentTeamLead) {
      return NextResponse.json({ error: "Team lead not found" }, { status: 404 });
    }

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid submission ID" }, { status: 400 });
    }
    // Submission fetch کریں
    const submission = await FormSubmission.findById(id)
      .populate({
        path: 'multipleTeamLeadShared',
        select: 'firstName lastName email'
      })
      .populate({
        path: 'sharedByTeamlead',
        select: 'firstName lastName email'
      });

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    // Check اگر current team lead کا task سے relation ہے
    const isAssigned = submission.assignedTo?.some(
      id => id.toString() === currentTeamLead._id.toString()
    );
    const isAlreadyShared = submission.multipleTeamLeadShared?.some(
      id => id._id.toString() === currentTeamLead._id.toString()
    );

    if (!isAssigned && !isAlreadyShared) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json({
      submission: {
        _id: submission._id,
        title: submission.formId?.title,
        clientName: submission.clientName,
        multipleTeamLeadShared: submission.multipleTeamLeadShared,
        sharedByTeamlead: submission.sharedByTeamlead,
        status2: submission.status2
      }
    }, { status: 200 });

  } catch (error) {
    console.error("Error fetching shared team leads:", error);
    return NextResponse.json({ error: "Failed to fetch shared team leads" }, { status: 500 });
  }
}

// POST: Task دوسرے team leads کے ساتھ share کریں
export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "TeamLead") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { id } = params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid submission ID" }, { status: 400 });
    }

    const submission = await FormSubmission.findById(id);

    if (!teamLeadIds || !Array.isArray(teamLeadIds)) {
      return NextResponse.json({ error: "Invalid team lead IDs" }, { status: 400 });
    }

    // Current team lead کی معلومات حاصل کریں
    const currentTeamLead = await TeamLead.findOne({ email: session.user.email });
    if (!currentTeamLead) {
      return NextResponse.json({ error: "Team lead not found" }, { status: 404 });
    }

    // Submission fetch کریں
    

   
    // Check permissions
    const isAssigned = submission.assignedTo?.some(
      id => id.toString() === currentTeamLead._id.toString()
    );
    const isAlreadyShared = submission.multipleTeamLeadShared?.some(
      id => id.toString() === currentTeamLead._id.toString()
    );

    if (!isAssigned && !isAlreadyShared) {
      return NextResponse.json({ error: "You don't have permission to share this task" }, { status: 403 });
    }

    // Validate team lead IDs
    const validTeamLeads = await TeamLead.find({
      _id: { $in: teamLeadIds },
      depId: currentTeamLead.depId // صرف اپنے ہی department کے team leads
    });

    if (validTeamLeads.length !== teamLeadIds.length) {
      return NextResponse.json({ error: "One or more team leads are invalid or from different department" }, { status: 400 });
    }

    // Check for duplicate shares
    const newTeamLeadIds = teamLeadIds.filter(id =>
      !submission.multipleTeamLeadShared.some(
        sharedId => sharedId.toString() === id.toString()
      )
    );

    if (newTeamLeadIds.length === 0) {
      return NextResponse.json({
        message: "These team leads are already shared with this task",
        sharedCount: submission.multipleTeamLeadShared.length
      }, { status: 200 });
    }

    // Update submission
    submission.multipleTeamLeadShared.push(...newTeamLeadIds);

    // اگر پہلی بار share کر رہے ہیں تو sharedByTeamlead set کریں
    if (!submission.sharedByTeamlead && isAssigned) {
      submission.sharedByTeamlead = currentTeamLead._id;
    }

    await submission.save();

    // Populate کے ساتھ response دیں
    const updatedSubmission = await FormSubmission.findById(id)
      .populate({
        path: 'multipleTeamLeadShared',
        select: 'firstName lastName email'
      })
      .populate({
        path: 'sharedByTeamlead',
        select: 'firstName lastName email'
      });

    return NextResponse.json({
      message: `Task shared successfully with ${newTeamLeadIds.length} team lead(s)`,
      submission: {
        _id: updatedSubmission._id,
        multipleTeamLeadShared: updatedSubmission.multipleTeamLeadShared,
        sharedByTeamlead: updatedSubmission.sharedByTeamlead,
        sharedCount: updatedSubmission.multipleTeamLeadShared.length
      }
    }, { status: 200 });

  } catch (error) {
    console.error("Error sharing task:", error);
    return NextResponse.json({ error: "Failed to share task" }, { status: 500 });
  }
}

// DELETE: Shared team lead کو remove کریں
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "TeamLead") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { id } = params;
    const { teamLeadId } = await request.json();

    if (!teamLeadId) {
      return NextResponse.json({ error: "Team lead ID is required" }, { status: 400 });
    }

    // Current team lead کی معلومات حاصل کریں
    const currentTeamLead = await TeamLead.findOne({ email: session.user.email });
    if (!currentTeamLead) {
      return NextResponse.json({ error: "Team lead not found" }, { status: 404 });
    }

    // Submission fetch کریں
    const submission = await FormSubmission.findById(id);
    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    // Check permissions
    // صرف shared کرنے والا یا admin ہی remove کر سکتا ہے
    const canRemove =
      submission.sharedByTeamlead?.toString() === currentTeamLead._id.toString() ||
      submission.assignedTo?.some(id => id.toString() === currentTeamLead._id.toString());

    if (!canRemove) {
      return NextResponse.json({ error: "You don't have permission to remove team leads from this task" }, { status: 403 });
    }

    // Check if team lead is actually shared
    const isShared = submission.multipleTeamLeadShared.some(
      id => id.toString() === teamLeadId.toString()
    );

    if (!isShared) {
      return NextResponse.json({ error: "Team lead is not shared with this task" }, { status: 400 });
    }

    // Remove team lead
    submission.multipleTeamLeadShared = submission.multipleTeamLeadShared.filter(
      id => id.toString() !== teamLeadId.toString()
    );

    // اگر sharedByTeamlead خود کو remove کر رہا ہے تو sharedByTeamlead null کر دیں
    if (submission.sharedByTeamlead?.toString() === teamLeadId.toString()) {
      submission.sharedByTeamlead = null;
    }

    await submission.save();

    return NextResponse.json({
      message: "Team lead removed successfully",
      removedTeamLeadId: teamLeadId,
      remainingCount: submission.multipleTeamLeadShared.length
    }, { status: 200 });

  } catch (error) {
    console.error("Error removing team lead:", error);
    return NextResponse.json({ error: "Failed to remove team lead" }, { status: 500 });
  }
}