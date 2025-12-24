import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import FormSubmission from "@/models/FormSubmission";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Department from "@/models/Department";
import Form from "@/models/Form";

export async function GET(req, { params }) {
  try {
    await dbConnect();
    const { id } = params;

    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "Admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Admin can view ALL submissions (no restriction)
    const submission = await FormSubmission.findOne({ _id: id })
      .populate({
        path: 'formId',
        select: 'title description fields depId createdAt',
        populate: {
          path: 'depId',
          select: 'name manager totalEmployees'
        }
      })
      .populate('submittedBy', 'firstName lastName email role departments position phone')
      .populate('depId', 'name manager totalEmployees')
      .populate('multipleManagerShared', 'firstName lastName email role departments')
      .populate('sharedBy', 'firstName lastName email role')
      .populate('multipleTeamLeadAssigned', 'firstName lastName email role depId')
      .populate('multipleTeamLeadShared', 'firstName lastName email role depId')
      .populate('sharedByTeamlead', 'firstName lastName email role')
      .populate('assignedTo', 'firstName lastName email role depId')
      .populate({
        path: 'assignedEmployees.employeeId',
        select: 'firstName lastName email role depId position phone createdAt',
        populate: {
          path: 'depId',
          select: 'name'
        }
      })
      .populate({
        path: 'employeeFeedbacks.employeeId',
        select: 'firstName lastName email role'
      })
      .populate({
        path: 'teamLeadFeedbacks.teamLeadId',
        select: 'firstName lastName email role'
      })
      .populate('teamLeadFeedbacks.replies.repliedBy', 'firstName lastName email role')
      .lean();

    if (!submission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    // Calculate statistics
    const totalEmployees = submission.assignedEmployees?.length || 0;
    const completedEmployees = submission.assignedEmployees?.filter(emp => 
      emp.status === 'completed' || emp.status === 'approved'
    ).length || 0;
    const completionRate = totalEmployees > 0 ? (completedEmployees / totalEmployees) * 100 : 0;

    // Transform the data for admin view
    const transformedSubmission = {
      ...submission,
      _id: submission._id.toString(),
      formInfo: {
        _id: submission.formId?._id?.toString(),
        title: submission.formId?.title,
        description: submission.formId?.description,
        fields: submission.formId?.fields || [],
        department: submission.formId?.depId,
        createdAt: submission.formId?.createdAt
      },
      submittedBy: submission.submittedBy ? {
        _id: submission.submittedBy._id.toString(),
        name: `${submission.submittedBy.firstName} ${submission.submittedBy.lastName}`,
        email: submission.submittedBy.email,
        role: submission.submittedBy.role,
        department: submission.submittedBy.department,
        position: submission.submittedBy.position,
        phone: submission.submittedBy.phone
      } : null,
      department: submission.depId || submission.formId?.depId,
      
      // Sharing information (Admin can see all)
      sharingInfo: {
        isShared: (submission.multipleManagerShared || []).length > 0,
        sharedWith: submission.multipleManagerShared || [],
        sharedBy: submission.sharedBy,
        sharedCount: submission.sharedTasksCount || 0,
        sharedAt: submission.sharedAt
      },
      
      // Team Lead information
      teamLeadInfo: {
        assigned: submission.assignedTo || [],
        multipleAssigned: submission.multipleTeamLeadAssigned || [],
        multipleShared: submission.multipleTeamLeadShared || [],
        sharedBy: submission.sharedByTeamlead,
        claimedAt: submission.claimedAt,
        assignedAt: submission.assignedAt
      },
      
      // Employees information
      employees: submission.assignedEmployees?.map(emp => ({
        employeeId: emp.employeeId ? {
          _id: emp.employeeId._id.toString(),
          name: `${emp.employeeId.firstName} ${emp.employeeId.lastName}`,
          email: emp.employeeId.email,
          role: emp.employeeId.role,
          department: emp.employeeId.department,
          position: emp.employeeId.position,
          phone: emp.employeeId.phone,
          joinDate: emp.employeeId.createdAt
        } : null,
        status: emp.status,
        assignedAt: emp.assignedAt,
        completedAt: emp.completedAt,
        feedback: emp.feedback,
        attachments: emp.attachments || []
      })) || [],
      
      // Feedbacks (Admin can see all)
      feedbacks: {
        employees: submission.employeeFeedbacks?.map(fb => ({
          ...fb,
          _id: fb._id.toString(),
          employeeId: fb.employeeId ? {
            _id: fb.employeeId._id.toString(),
            name: `${fb.employeeId.firstName} ${fb.employeeId.lastName}`,
            email: fb.employeeId.email,
            role: fb.employeeId.role
          } : null,
          submittedAt: fb.submittedAt
        })) || [],
        teamLeads: submission.teamLeadFeedbacks?.map(fb => ({
          ...fb,
          _id: fb._id.toString(),
          teamLeadId: fb.teamLeadId ? {
            _id: fb.teamLeadId._id.toString(),
            name: `${fb.teamLeadId.firstName} ${fb.teamLeadId.lastName}`,
            email: fb.teamLeadId.email,
            role: fb.teamLeadId.role
          } : null,
          replies: fb.replies?.map(reply => ({
            ...reply,
            repliedBy: reply.repliedBy ? {
              _id: reply.repliedBy._id.toString(),
              name: `${reply.repliedBy.firstName} ${reply.repliedBy.lastName}`,
              email: reply.repliedBy.email,
              role: reply.repliedBy.role
            } : null
          })) || [],
          submittedAt: fb.submittedAt
        })) || []
      },
      
      // Timeline (Complete history)
      timeline: {
        createdAt: submission.createdAt,
        updatedAt: submission.updatedAt,
        submittedAt: submission.submittedAt,
        assignedAt: submission.assignedAt,
        claimedAt: submission.claimedAt,
        completedAt: submission.completedAt,
        approvedAt: submission.approvedAt,
        rejectedAt: submission.rejectedAt
      },
      
      // Status hierarchy (All levels)
      statusHierarchy: {
        manager: submission.status,
        teamLead: submission.status2,
        admin: submission.adminStatus,
        system: submission.systemStatus,
        employees: submission.assignedEmployees?.map(emp => ({
          employeeId: emp.employeeId?._id?.toString(),
          name: emp.employeeId ? 
            `${emp.employeeId.firstName} ${emp.employeeId.lastName}` : 
            'Unknown',
          status: emp.status,
          lastUpdated: emp.updatedAt
        })) || []
      },
      
      // Statistics for admin
      statistics: {
        totalEmployees,
        completedEmployees,
        completionRate: Math.round(completionRate),
        pendingEmployees: totalEmployees - completedEmployees,
        averageCompletionTime: calculateAverageCompletionTime(submission.assignedEmployees),
        feedbackCount: (submission.employeeFeedbacks?.length || 0) + 
                      (submission.teamLeadFeedbacks?.length || 0),
        attachmentCount: submission.attachments?.length || 0
      },
      
      // Form data (Read-only for admin)
      formData: submission.formData || {},
      
      // Attachments
      attachments: submission.attachments?.map(att => ({
        ...att,
        uploadedBy: att.uploadedBy ? {
          name: `${att.uploadedBy.firstName} ${att.uploadedBy.lastName}`,
          email: att.uploadedBy.email
        } : null
      })) || [],
      
      // Audit trail
      auditTrail: submission.auditTrail || [],
      
      // Metadata
      metadata: {
        ipAddress: submission.ipAddress,
        userAgent: submission.userAgent,
        deviceInfo: submission.deviceInfo,
        location: submission.location
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

function calculateAverageCompletionTime(employees) {
  if (!employees || employees.length === 0) return 0;
  
  let totalTime = 0;
  let completedCount = 0;
  
  employees.forEach(emp => {
    if (emp.assignedAt && emp.completedAt) {
      const assigned = new Date(emp.assignedAt);
      const completed = new Date(emp.completedAt);
      totalTime += (completed - assigned);
      completedCount++;
    }
  });
  
  if (completedCount === 0) return 0;
  
  // Return in hours
  return Math.round((totalTime / completedCount) / (1000 * 60 * 60));
}