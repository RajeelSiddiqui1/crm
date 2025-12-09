export function managerTaskStatusUpdateMailTemplate(
  managerName,
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
      .header { background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
      .content { background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px; }
      .info-box { background: #dbeafe; border: 1px solid #3b82f6; border-radius: 8px; padding: 20px; margin: 20px 0; }
      .status { font-weight: bold; color: #1e40af; }
      .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; }
      .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>📢 Team Lead Submission Update</h1>
      </div>
      <div class="content">
        <h2>Hello ${managerName},</h2>
        <p>Team Lead <strong>${updatedBy}</strong> updated the submission of <strong>${employeeName}</strong> for the task "<strong>${taskTitle}</strong>".</p>

        <div class="info-box">
          <h3>📋 Task Status Details</h3>
          <p><strong>Task Title:</strong> ${taskTitle}</p>
          <p><strong>Employee:</strong> ${employeeName}</p>
          <p><strong>Updated By:</strong> ${updatedBy}</p>
          <p><strong>Status:</strong> <span class="status">${status}</span></p>
          <p><strong>Feedback:</strong> ${feedback}</p>
        </div>

      

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
