export function sendTaskStatusUpdateMail({ name, formTitle, status, updatedBy, taskLink }) {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f9fafb; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
      .content { background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px; }
      .info-box { background: #ffedd5; border: 1px solid #fed7aa; border-radius: 8px; padding: 20px; margin: 20px 0; }
      .button { display: inline-block; background: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; }
      .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>✅ Task Status Updated</h1>
      </div>
      <div class="content">
        <h2>Hello ${name},</h2>
        <p>The status of your task has been updated by <strong>${updatedBy}</strong>.</p>

        <div class="info-box">
          <h3>📋 Task Details</h3>
          <p><strong>Task Title:</strong> ${formTitle}</p>
          <p><strong>New Status:</strong> ${status}</p>
        </div>

        <p>Please check the task and continue accordingly.</p>

        ${taskLink ? `<a href="${taskLink}" class="button">View Task</a>` : ''}

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
