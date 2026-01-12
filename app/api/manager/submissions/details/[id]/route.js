// app/api/manager/submissions/details/[id]/route.js
import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import FormSubmission from "@/models/FormSubmission";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Form from "@/models/Form";
import Department from "@/models/Department";

export async function GET(req, { params }) {
  try {
    await dbConnect();
    const { id } = params;

    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "Manager") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const managerId = session.user.id;

    const submission = await FormSubmission.findOne({
      _id: id,
      $or: [
        { submittedBy: managerId },
        { multipleManagerShared: managerId }
      ]
    })
      .populate({
        path: 'formId',
        select: 'title description fields depId',
        populate: {
          path: 'depId',
          select: 'name'
        }
      })
      .populate('submittedBy', 'firstName lastName email')
      .populate('depId', 'name')
      .populate('multipleManagerShared', 'firstName lastName email')
      .populate('sharedBy', 'firstName lastName email')
      .populate('multipleTeamLeadAssigned', 'firstName lastName email')
      .populate('multipleTeamLeadShared', 'firstName lastName email')
      .populate('sharedByTeamlead', 'firstName lastName email')
      .populate('assignedTo', 'firstName lastName email')
      .populate({
        path: 'assignedEmployees.employeeId',
        select: 'firstName lastName email position department'
      })
      .populate({
        path: 'employeeFeedbacks.employeeId',
        select: 'firstName lastName email profilePic'
      })
      .populate({
        path: 'teamLeadFeedbacks.teamLeadId',
        select: 'firstName lastName email profilePic'
      })
      .populate('teamLeadFeedbacks.replies.repliedBy', 'firstName lastName email profilePic')
      .lean();

    if (!submission) {
      return NextResponse.json(
        { error: "Submission not found or access denied" },
        { status: 404 }
      );
    }

    // Transform the data
    const transformedSubmission = {
      ...submission,
      _id: submission._id.toString(),
      formId: submission.formId ? {
        _id: submission.formId._id.toString(),
        title: submission.formId.title,
        description: submission.formId.description,
        fields: submission.formId.fields || [],
        department: submission.formId.depId
      } : null,
      department: submission.depId || submission.formId?.depId,
      submittedBy: submission.submittedBy ? {
        _id: submission.submittedBy._id.toString(),
        name: `${submission.submittedBy.firstName} ${submission.submittedBy.lastName}`,
        email: submission.submittedBy.email
      } : null,
      sharingInfo: {
        isShared: (submission.multipleManagerShared || []).length > 0,
        sharedWith: submission.multipleManagerShared || [],
        sharedBy: submission.sharedBy,
        sharedCount: submission.sharedTasksCount || 0
      },
      teamLeadInfo: {
        assigned: submission.assignedTo || [],
        multipleAssigned: submission.multipleTeamLeadAssigned || [],
        multipleShared: submission.multipleTeamLeadShared || [],
        sharedBy: submission.sharedByTeamlead,
        claimedAt: submission.claimedAt
      },
      employees: submission.assignedEmployees || [],
      feedbacks: {
        employees: submission.employeeFeedbacks || [],
        teamLeads: submission.teamLeadFeedbacks || []
      },
      timeline: {
        createdAt: submission.createdAt,
        updatedAt: submission.updatedAt,
        assignedAt: submission.assignedEmployees?.[0]?.assignedAt,
        claimedAt: submission.claimedAt,
        completedAt: submission.completedAt
      },
      statusHierarchy: {
        manager: submission.status,
        teamLead: submission.status2,
        admin: submission.adminStatus,
        employees: submission.assignedEmployees?.map(emp => ({
          employeeId: emp.employeeId?._id?.toString(),
          name: emp.employeeId ?
            `${emp.employeeId.firstName} ${emp.employeeId.lastName}` :
            'Unknown',
          status: emp.status
        })) || []
      }
    };

    return NextResponse.json(transformedSubmission, { status: 200 });
  } catch (error) {
    console.error("Error fetching submission details:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}