import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";


// PATCH: Update teamlead status for a submission and notify employee & manager
export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.role !== "Teamlead") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await dbConnect();

    const { id } = params; // submissionId
    const { teamleadstatus, feedback } = await request.json();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid task ID" }, { status: 400 });
    }

    const validStatuses = ["pending", "in_progress", "completed", "approved", "rejected", "late"];
    if (!validStatuses.includes(teamleadstatus)) return NextResponse.json({ error: "Invalid status" }, { status: 400 });

    // Update the submission
    const updatedSubmission = await EmployeeFormSubmission.findByIdAndUpdate(
      id,
      { 
        teamleadstatus,
        ...(teamleadstatus === "completed" && { completedAt: new Date() }),
        ...(feedback && { feedback })
      },
      { new: true }
    )
    .populate("formId", "title description")
    .populate("employeeId", "firstName lastName email department")
    .populate("subtaskId", "title description")
    .populate("teamleadId", "firstName lastName email managerId"); // populate managerId

    if (!updatedSubmission) return NextResponse.json({ error: "Submission not found" }, { status: 404 });

    const teamLead = updatedSubmission.teamleadId;
    const employee = updatedSubmission.employeeId;

    const submissionLink = `${process.env.NEXTAUTH_URL}/employee/submissions/${updatedSubmission._id}`;
    const teamLeadName = session.user.name || "Team Lead";
    const employeeName = `${employee.firstName} ${employee.lastName}`;

    // ✅ Notify Employee
    const employeeNotification = sendNotification({
      senderId: session.user.id,
      senderModel: "Employee",
      senderName: teamLeadName,
      receiverId: employee._id,
      receiverModel: "Employee",
      type: "submission_status_update",
      title: "Your Submission Status Updated",
      message: `Your submission for subtask "${updatedSubmission.subtaskId.title}" has been marked as "${teamleadstatus}" by ${teamLeadName}.`,
      link: submissionLink,
      referenceId: updatedSubmission._id,
      referenceModel: "EmployeeFormSubmission"
    });

    const employeeEmail = sendMail(
      employee.email,
      "Submission Status Updated",
      employeeTaskStatusUpdateMailTemplate(
        employeeName,
        updatedSubmission.subtaskId.title,
        teamLeadName,
        teamleadstatus,
        submissionLink,
        feedback
      )
    );

    // ✅ Notify Manager (if manager exists)
    let managerNotification = null;
    let managerEmail = null;
    if (teamLead.managerId) {
      const manager = await Manager.findById(teamLead.managerId);
      if (manager && manager.email) {
        const managerName = `${manager.firstName} ${manager.lastName}`;
        managerNotification = sendNotification({
          senderId: session.user.id,
          senderModel: "Employee",
          senderName: teamLeadName,
          receiverId: manager._id,
          receiverModel: "Manager",
          type: "teamlead_submission_status_update",
          title: "Team Lead Updated a Submission",
          message: `Team Lead "${teamLeadName}" updated submission for "${employeeName}" on subtask "${updatedSubmission.subtaskId.title}". Status: "${teamleadstatus}".`,
          link: submissionLink,
          referenceId: updatedSubmission._id,
          referenceModel: "EmployeeFormSubmission"
        });

        managerEmail = sendMail(
          manager.email,
          "Team Lead Submission Status Updated",
          managerTaskStatusUpdateMailTemplate(
            managerName,
            employeeName,
            updatedSubmission.subtaskId.title,
            teamLeadName,
            teamleadstatus,
            submissionLink,
            feedback
          )
        );
      }
    }

    // Run notifications and emails in parallel
    await Promise.all([employeeNotification, employeeEmail, managerNotification, managerEmail]);

    return NextResponse.json({
      message: "Status updated and notifications sent to employee & manager successfully",
      submission: updatedSubmission
    }, { status: 200 });

  } catch (error) {
    console.error("Error updating submission status:", error);
    return NextResponse.json({ error: "Failed to update submission status" }, { status: 500 });
  }
}
