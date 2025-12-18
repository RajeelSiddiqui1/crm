import dbConnect from "@/lib/db";
import AdminTask from "@/models/AdminTask";
import Subtask from "@/models/Subtask";
import FormSubmission from "@/models/FormSubmission";
import mongoose from "mongoose";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
  try {
    await dbConnect();

    const { id } = params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid department id" },
        { status: 400 }
      );
    }

    const depObjectId = new mongoose.Types.ObjectId(id);

    // Parallel fetching
    const [adminTasks, subtasks, submissions] = await Promise.all([
      // Admin Tasks
      AdminTask.find({ departments: { $in: [depObjectId] } })
        .populate({
          path: "managers",
          select: "firstName lastName email profilePic",
        })
        .populate({
          path: "sharedBYManager",
          select: "firstName lastName email profilePic",
        })
        .populate({
          path: "submittedBy",
          select: "firstName lastName email profilePic",
        })
        .sort({ createdAt: -1 })
        .lean(),

      // Subtasks
      Subtask.find({ depId: depObjectId })
        .populate({
          path: "teamLeadId",
          select: "firstName lastName email profilePic",
        })
        .populate({
          path: "assignedEmployees.employeeId",
          select: "firstName lastName email profilePic",
        })
        .sort({ createdAt: -1 })
        .lean(),

      // Form Submissions
      FormSubmission.find({ depId: depObjectId })
        .populate({
          path: "formId",
          select: "title description fields depId",
          populate: {
            path: "depId",
            select: "name _id",
          },
        })
        .populate({
          path: "submittedBy",
          select: "firstName lastName email profilePic role",
        })
        .populate({
          path: "multipleManagerShared",
          select: "firstName lastName email profilePic",
        })
        .populate({
          path: "sharedBy",
          select: "firstName lastName email profilePic",
        })
        .populate({
          path: "assignedTo",
          select: "firstName lastName email profilePic",
        })
        .populate({
          path: "multipleTeamLeadAssigned",
          select: "firstName lastName email profilePic",
        })
        .populate({
          path: "assignedEmployees.employeeId",
          select: "firstName lastName email profilePic",
        })
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    // Transform submissions with separate status fields
    const transformedSubmissions = submissions.map((submission) => {
      // Determine overall status based on hierarchy
      let overallStatus = "pending";
      if (submission.adminStatus && submission.adminStatus !== "pending") {
        overallStatus = submission.adminStatus; // Admin has final say
      } else if (submission.status2 && submission.status2 !== "pending") {
        overallStatus = submission.status2; // Team lead status
      } else if (submission.status && submission.status !== "pending") {
        overallStatus = submission.status; // Manager status
      }

      // Create status hierarchy object
      const statusHierarchy = {
        managerStatus: submission.status || "pending",
        teamLeadStatus: submission.status2 || "pending",
        adminStatus: submission.adminStatus || "pending",
        overallStatus: overallStatus,
        // Add status timestamps if available
        managerUpdatedAt: submission.status === "approved" || submission.status === "rejected" ? submission.updatedAt : null,
        teamLeadUpdatedAt: submission.status2 === "completed" || submission.status2 === "rejected" ? submission.updatedAt : null,
        adminUpdatedAt: submission.adminStatus === "approved" || submission.adminStatus === "rejected" ? submission.updatedAt : null,
      };

      return {
        _id: submission._id,
        clinetName: submission.clinetName || "N/A",
        
        // Separate status fields
        status: submission.status, // Manager status
        status2: submission.status2, // Team lead status
        adminStatus: submission.adminStatus, // Admin status
        
        // Hierarchy object for convenience
        statusHierarchy,
        
        form: submission.formId
          ? {
              _id: submission.formId._id,
              title: submission.formId.title,
              description: submission.formId.description,
              department: submission.formId.depId,
            }
          : null,

        submittedBy: submission.submittedBy
          ? {
              _id: submission.submittedBy._id,
              name: `${submission.submittedBy.firstName || ""} ${
                submission.submittedBy.lastName || ""
              }`.trim(),
              email: submission.submittedBy.email,
              profilePic: submission.submittedBy.profilePic,
              role: submission.submittedBy.role,
            }
          : null,

        assignmentInfo: {
          assignedTo:
            submission.assignedTo?.map((tl) => ({
              _id: tl._id,
              name: `${tl.firstName || ""} ${tl.lastName || ""}`.trim(),
              email: tl.email,
              profilePic: tl.profilePic,
            })) || [],

          multipleTeamLeadAssigned:
            submission.multipleTeamLeadAssigned?.map((tl) => ({
              _id: tl._id,
              name: `${tl.firstName || ""} ${tl.lastName || ""}`.trim(),
              email: tl.email,
              profilePic: tl.profilePic,
            })) || [],

          isClaimed: !!submission.claimedAt,
          claimedAt: submission.claimedAt,
        },

        employeesInfo: {
          assignedEmployees:
            submission.assignedEmployees?.map((emp) => ({
              employeeId: emp.employeeId
                ? {
                    _id: emp.employeeId._id,
                    name: `${emp.employeeId.firstName || ""} ${
                      emp.employeeId.lastName || ""
                    }`.trim(),
                    email: emp.employeeId.email,
                    profilePic: emp.employeeId.profilePic,
                  }
                : null,
              email: emp.email,
              status: emp.status,
            })) || [],
        },

        // Additional submission data
        teamLeadFeedback: submission.teamLeadFeedback,
        managerComments: submission.managerComments,
        completedAt: submission.completedAt,
        
        timestamps: {
          createdAt: submission.createdAt,
          updatedAt: submission.updatedAt,
        },
      };
    });

    // Calculate statistics
    const submissionStatuses = {
      pending: 0,
      in_progress: 0,
      completed: 0,
      approved: 0,
      rejected: 0,
    };

    transformedSubmissions.forEach((submission) => {
      const status = submission.statusHierarchy.overallStatus;
      if (submissionStatuses[status] !== undefined) {
        submissionStatuses[status]++;
      }
    });

    const totalSubmissions = transformedSubmissions.length;
    const completionRate = totalSubmissions > 0 
      ? Math.round(((submissionStatuses.completed + submissionStatuses.approved) / totalSubmissions) * 100)
      : 0;

    return NextResponse.json(
      {
        success: true,
        departmentId: id,
        counts: {
          adminTasks: adminTasks.length,
          subtasks: subtasks.length,
          submissions: totalSubmissions,
        },
        stats: {
          submissionStatuses,
          completionRate,
        },
        data: {
          adminTasks,
          subtasks,
          submissions: transformedSubmissions,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Department tasks GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch department tasks" },
      { status: 500 }
    );
  }
}