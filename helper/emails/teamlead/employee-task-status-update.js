// helper/emails/teamlead/employee-task-status-update.js
export function employeeTaskStatusUpdateMailTemplate(
  employeeName,
  taskTitle,
  updatedBy,
  status,
  taskLink,
  feedback = "No feedback provided"
) {
  return `
  <div style="font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5;">
    <div style="max-width: 480px; margin: auto; background: #ffffff; padding: 25px; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">

      <h2 style="text-align:center; color: #10b981;">✅ Task Status Updated</h2>
      
      <p>Hi <b>${employeeName}</b>,</p>
      <p>Your submission for the task "<strong>${taskTitle}</strong>" has been updated by <strong>${updatedBy}</strong>.</p>

      <div style="margin: 20px 0; padding: 15px; background: #d1fae5; border-left: 4px solid #10b981; border-radius: 8px;">
        <p><strong>Task Title:</strong> ${taskTitle}</p>
        <p><strong>Updated By:</strong> ${updatedBy}</p>
        <p><strong>Status:</strong> <span style="font-weight:bold; color:#059669;">${status}</span></p>
        <p><strong>Feedback:</strong> ${feedback}</p>
      </div>

      <p>Please check the feedback and take any necessary action.</p>

     

      <p style="margin-top:25px; font-size:12px; color:#777; text-align:center;">
        This is an automated notification. Please do not reply.
      </p>
    </div>
  </div>
  `;
}
