export function managerEmployeeTaskStatusUpdateMailTemplate(employeeName, taskTitle, updatedBy, status, taskLink, feedback = "No feedback") {
  return `
    <div style="font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5;">
      <div style="max-width: 480px; margin: auto; background: #ffffff; padding: 25px; border-radius: 10px;">
        
        <h2 style="text-align: center; color: #4a6cf7;">Task Update Notification</h2>
        
        <p>Hi <b>${employeeName}</b>,</p>
        <p>Your submission for task <b>"${taskTitle}"</b> has been updated by <b>${updatedBy}</b>.</p>
        
        <div style="
          background: #f0f0f0;
          padding: 15px;
          border-radius: 8px;
          margin: 20px 0;">
          <p><b>Status:</b> ${status}</p>
          <p><b>Feedback:</b> ${feedback || ""}</p>
        </div>
        
        

        <p style="margin-top: 25px; font-size: 12px; color: #777; text-align:center;">
          This is an automated notification. Please do not reply to this email.
        </p>

      </div>
    </div>
  `;
}
