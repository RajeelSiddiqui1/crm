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
  <!DOCTYPE html>
  <html>
  <head>
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f9fafb; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
      .content { background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px; }
      .info-box { background: #d1fae5; border: 1px solid #6ee7b7; border-radius: 8px; padding: 20px; margin: 20px 0; }
      .status { font-weight: bold; color: #059669; }
      .button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; }
      .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>✅ Task Status Updated</h1>
      </div>
      <div class="content">
        <h2>Hello ${employeeName},</h2>
        <p>Your submission for the task "<strong>${taskTitle}</strong>" has been updated by <strong>${updatedBy}</strong>.</p>

        <div class="info-box">
          <h3>📋 Task Status Details</h3>
          <p><strong>Task Title:</strong> ${taskTitle}</p>
          <p><strong>Updated By:</strong> ${updatedBy}</p>
          <p><strong>Status:</strong> <span class="status">${status}</span></p>
          <p><strong>Feedback:</strong> ${feedback}</p>
        </div>

        

        <p>Please check the feedback and take any necessary action.</p>

        <p>Best regards,<br>The Task Management Team</p>
      </div>
      <div class="footer">
        <p>© ${new Date().getFullYear()} Task Management System. All rights reserved.</p>
        <p>This is an automated notification. Please do not reply to this email.</p>
      </div>
    </div>
  </body>
  </html>
  `;
}
