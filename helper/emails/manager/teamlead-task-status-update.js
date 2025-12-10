// helper/emails/manager/teamlead-task-status-update.js

export function managerTeamLeadTaskStatusUpdateMailTemplate(
  teamLeadName,
  employeeName,
  taskTitle,
  updatedBy,
  status,
  taskLink,
  feedback = "No feedback"
) {
  return `
  <div style="font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5;">
    <div style="max-width: 480px; margin: auto; background: #ffffff; padding: 25px; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
      
      <h2 style="text-align: center; color: #333;">Task Submission Update</h2>
      
      <p>Hi <b>${teamLeadName}</b>,</p>
      <p>Manager <b>${updatedBy}</b> updated the submission of <b>${employeeName}</b> for the task:</p>
      
      <div style="margin: 20px 0; padding: 15px; background: #f0f4ff; border-left: 4px solid #6366f1; border-radius: 8px;">
        <p><strong>Task Title:</strong> ${taskTitle}</p>
        <p><strong>Status:</strong> ${status}</p>
        <p><strong>Feedback:</strong> ${feedback}</p>
      </div>

    

      <p style="margin-top: 25px; font-size: 12px; color: #777; text-align:center;">
        This is an automated notification. Please do not reply to this email.
      </p>
    </div>
  </div>
  `;
}

