// helper/emails/employee/submissionTask.js

export function submissionTaskMailTemplate({
  teamLeadName,
  employeeName,
  subtaskTitle,
  submissionLink,
  submittedAt
}) {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: linear-gradient(135deg, #1a73e8 0%, #1669c1 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
      .content { background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px; }
      .info-box { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 20px; margin: 20px 0; }
      .button { display: inline-block; background: #1a73e8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; }
      .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>📨 New Subtask Submission</h1>
      </div>
      <div class="content">
        <h2>Hello ${teamLeadName},</h2>
        <p>${employeeName} has submitted a form for the subtask:</p>

        <div class="info-box">
          <h3>📋 Subtask Details</h3>
          <p><strong>Subtask Title:</strong> ${subtaskTitle}</p>
          <p><strong>Submitted By:</strong> ${employeeName}</p>
          <p><strong>Submission Date & Time:</strong> ${new Date(submittedAt).toLocaleString()}</p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${submissionLink}" class="button">View Submission</a>
        </div>

        <p>Please review the submission and provide feedback or update the status accordingly.</p>
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
