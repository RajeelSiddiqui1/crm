export function createdSubtaskMailTemplate(
  teamLeadName,
  taskTitle,
  subtaskTitle,
  description,
  priority,
  startDate,
  endDate,
  link
) {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { 
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        color: white; padding: 30px; text-align: center; 
        border-radius: 10px 10px 0 0; 
      }
      .content { 
        background: white; padding: 30px; 
        border: 1px solid #e5e7eb; border-top: none; 
        border-radius: 0 0 10px 10px; 
      }
      .info-box { 
        background: #ecfdf5; border: 1px solid #a7f3d0; 
        border-radius: 8px; padding: 20px; margin: 20px 0; 
      }
      .button { 
        display: inline-block; background: #059669; 
        color: white; padding: 12px 24px; 
        text-decoration: none; border-radius: 6px; 
        font-weight: bold; 
      }
      .footer { 
        text-align: center; margin-top: 30px; 
        color: #6b7280; font-size: 14px; 
      }
      .high { color: #dc2626; font-weight: bold; }
      .medium { color: #d97706; font-weight: bold; }
      .low { color: #059669; font-weight: bold; }
    </style>
  </head>
  <body>
    <div class="container">

      <div class="header">
        <h1>📝 New Subtask Assigned</h1>
      </div>

      <div class="content">
        <h2>Hello ${teamLeadName},</h2>

        <p>A new subtask has been created and assigned under the main task:</p>

        <div class="info-box">
          <h3>📌 Subtask Details</h3>

          <p><strong>Main Task:</strong> ${taskTitle}</p>
          <p><strong>Subtask Title:</strong> ${subtaskTitle}</p>
          <p><strong>Description:</strong> ${description || "No description added"}</p>

          <p><strong>Priority:</strong> 
            <span class="${priority.toLowerCase()}">${priority}</span>
          </p>

          <p><strong>Start Date:</strong> ${startDate}</p>
          <p><strong>End Date:</strong> ${endDate}</p>
        </div>

        <p>You can view and manage this subtask directly in your dashboard.</p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${link}" class="button">
            View Subtask
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
