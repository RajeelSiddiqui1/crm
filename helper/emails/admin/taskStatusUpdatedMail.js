export function taskStatusUpdatedMail(managerName, taskTitle, status, message, date) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px; }
        .info-box { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        .approved { color: #059669; font-weight: bold; }
        .rejected { color: #dc2626; font-weight: bold; }
        .pending { color: #d97706; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📢 Task Status Update</h1>
        </div>
        <div class="content">
          <h2>Hello ${managerName},</h2>

          <p>Your submitted task has received a new update from the admin team.</p>

          <div class="info-box">
            <h3>📋 Task Details</h3>
            <p><strong>Task Title:</strong> ${taskTitle}</p>
            <p><strong>Status:</strong> 
              <span class="${status}">${status.toUpperCase()}</span>
            </p>
            <p><strong>Updated On:</strong> ${date}</p>
            ${
              message
                ? `<p><strong>Admin Message:</strong> ${message}</p>`
                : ""
            }
          </div>

          <p>You can view the full task details and updates in your dashboard.</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.TASK_LINK}/manager/submissions/${process.env.TASK_ID}" class="button">
              View Task
            </a>
          </div>

          <p>Best regards,<br>The Task Management Team</p>
        </div>

        <div class="footer">
          <p>© ${new Date().getFullYear()} Task Management System. All rights reserved.</p>
          <p>This is an automated notification. Please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
