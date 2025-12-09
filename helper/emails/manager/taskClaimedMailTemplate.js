export function taskClaimedMailTemplate(managerName, teamLeadName, taskTitle, claimDate) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px; }
        .info-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎯 Task Claimed Successfully</h1>
        </div>
        <div class="content">
          <h2>Hello ${managerName},</h2>
          <p>We're pleased to inform you that one of your submitted tasks has been claimed by a team lead.</p>
          
          <div class="info-box">
            <h3>📋 Task Details</h3>
            <p><strong>Task Title:</strong> ${taskTitle}</p>
            <p><strong>Claimed By:</strong> ${teamLeadName}</p>
            <p><strong>Claim Date:</strong> ${claimDate}</p>
            <p><strong>New Status:</strong> In Progress</p>
          </div>
          
          <p>The team lead will now start working on this task and assign it to their employees. You can track the progress from your dashboard.</p>
          
         
          
          <p><strong>Next Steps:</strong></p>
          <ol>
            <li>Team lead will assign tasks to employees</li>
            <li>Employees will complete their assigned work</li>
            <li>Team lead will submit completed tasks for your review</li>
            <li>You can approve or request changes</li>
          </ol>
          
          <p>If you have any questions, please contact the team lead directly or use the platform's messaging system.</p>
          
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