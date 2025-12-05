export function updatedSubtaskMailTemplate(
  employeeName,
  subtaskTitle,
  description,
  teamLeadName,
  startDate,
  endDate,
  updateMessage,
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
        background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
        color: white; padding: 30px; text-align: center; 
        border-radius: 10px 10px 0 0; 
      }
      .content { 
        background: white; padding: 30px; 
        border: 1px solid #e5e7eb; border-top: none; 
        border-radius: 0 0 10px 10px; 
      }
      .info-box { 
        background: #eff6ff; border: 1px solid #bfdbfe; 
        border-radius: 8px; padding: 20px; margin: 20px 0; 
      }
      .update-box {
        background: #fef3c7; border: 1px solid #fbbf24;
        border-radius: 8px; padding: 15px; margin: 20px 0;
      }
      .button { 
        display: inline-block; background: #1d4ed8; 
        color: white; padding: 12px 24px; 
        text-decoration: none; border-radius: 6px; 
        font-weight: bold; 
      }
      .footer { 
        text-align: center; margin-top: 30px; 
        color: #6b7280; font-size: 14px; 
      }
    </style>
  </head>
  <body>
    <div class="container">

      <div class="header">
        <h1>📝 Subtask Updated</h1>
      </div>

      <div class="content">
        <h2>Hello ${employeeName},</h2>

        <p>The following subtask has been updated:</p>

        <div class="update-box">
          <h3>🔄 Update Notice</h3>
          <p><strong>${updateMessage}</strong></p>
        </div>

        <div class="info-box">
          <h3>📌 Updated Subtask Details</h3>

          <p><strong>Subtask Title:</strong> ${subtaskTitle}</p>
          <p><strong>Description:</strong> ${description || "No description added"}</p>
          <p><strong>Updated By:</strong> ${teamLeadName}</p>
          <p><strong>Start Date:</strong> ${startDate}</p>
          <p><strong>End Date:</strong> ${endDate}</p>
        </div>

        <p>Please review the updated details in your dashboard.</p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${link}" class="button">
            View Updated Subtask
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

export function deletedSubtaskMailTemplate(
  employeeName,
  subtaskTitle,
  description,
  teamLeadName,
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
        background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
        color: white; padding: 30px; text-align: center; 
        border-radius: 10px 10px 0 0; 
      }
      .content { 
        background: white; padding: 30px; 
        border: 1px solid #e5e7eb; border-top: none; 
        border-radius: 0 0 10px 10px; 
      }
      .info-box { 
        background: #fef2f2; border: 1px solid #fecaca; 
        border-radius: 8px; padding: 20px; margin: 20px 0; 
      }
      .button { 
        display: inline-block; background: #dc2626; 
        color: white; padding: 12px 24px; 
        text-decoration: none; border-radius: 6px; 
        font-weight: bold; 
      }
      .footer { 
        text-align: center; margin-top: 30px; 
        color: #6b7280; font-size: 14px; 
      }
    </style>
  </head>
  <body>
    <div class="container">

      <div class="header">
        <h1>🗑️ Subtask Deleted</h1>
      </div>

      <div class="content">
        <h2>Hello ${employeeName},</h2>

        <p>A subtask that was assigned to you has been deleted:</p>

        <div class="info-box">
          <h3>❌ Deleted Subtask Details</h3>

          <p><strong>Subtask Title:</strong> ${subtaskTitle}</p>
          <p><strong>Description:</strong> ${description || "No description added"}</p>
          <p><strong>Deleted By:</strong> ${teamLeadName}</p>
          <p><strong>Status:</strong> Deleted permanently</p>
        </div>

        <p>This subtask is no longer available in your task list.</p>
        <p>If you believe this is a mistake, please contact your team lead.</p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${link}" class="button">
            View Your Tasks
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