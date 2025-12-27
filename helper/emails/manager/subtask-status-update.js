export const subtaskStatusUpdateMailTemplate = (
  recipientName,
  taskTitle,
  managerName,
  newStatus,
  feedback = ""
) => {
  const statusColors = {
    pending: "#F59E0B",
    in_progress: "#3B82F6",
    completed: "#10B981",
    rejected: "#EF4444"
  };

  const statusText = {
    pending: "Pending",
    in_progress: "In Progress",
    completed: "Completed",
    rejected: "Rejected"
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Task Status Updated</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          line-height: 1.6;
          color: #374151;
          margin: 0;
          padding: 0;
          background-color: #F9FAFB;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #FFFFFF;
        }
        .header {
          background: linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%);
          color: white;
          padding: 40px 20px;
          text-align: center;
          border-radius: 12px 12px 0 0;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: bold;
        }
        .content {
          padding: 40px;
        }
        .status-badge {
          display: inline-block;
          padding: 8px 16px;
          border-radius: 20px;
          font-weight: bold;
          color: white;
          background-color: ${statusColors[newStatus] || "#6B7280"};
          margin: 10px 0;
        }
        .task-card {
          background-color: #F3F4F6;
          border-radius: 12px;
          padding: 24px;
          margin: 24px 0;
          border-left: 4px solid #7C3AED;
        }
        .manager-info {
          display: flex;
          align-items: center;
          gap: 16px;
          background-color: #F8FAFC;
          padding: 16px;
          border-radius: 8px;
          margin: 24px 0;
        }
        .avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 20px;
        }
        .button {
          display: inline-block;
          background: linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%);
          color: white;
          padding: 14px 32px;
          text-decoration: none;
          border-radius: 8px;
          font-weight: bold;
          margin-top: 24px;
        }
        .footer {
          text-align: center;
          padding: 24px;
          color: #6B7280;
          font-size: 14px;
          border-top: 1px solid #E5E7EB;
          margin-top: 40px;
        }
        @media (max-width: 600px) {
          .content {
            padding: 20px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📋 Task Status Updated</h1>
          <p>A manager has updated their task status</p>
        </div>
        
        <div class="content">
          <h2>Hello ${recipientName},</h2>
          
          <p>A manager has updated their status for a task assigned to them.</p>
          
          <div class="manager-info">
            <div class="avatar">${managerName.charAt(0)}</div>
            <div>
              <h3 style="margin: 0; color: #1F2937;">${managerName}</h3>
              <p style="margin: 4px 0 0 0; color: #6B7280;">Manager</p>
            </div>
          </div>
          
          <div class="task-card">
            <h3 style="margin-top: 0; color: #1F2937;">${taskTitle}</h3>
            <div class="status-badge">
              New Status: ${statusText[newStatus] || newStatus}
            </div>
            ${feedback ? `
              <div style="margin-top: 16px;">
                <h4 style="margin-bottom: 8px; color: #4B5563;">Manager's Feedback:</h4>
                <p style="background-color: #FEF3C7; padding: 12px; border-radius: 8px; border-left: 3px solid #D97706;">${feedback}</p>
              </div>
            ` : ''}
          </div>
          
          <p>You can view the updated task details by clicking the button below:</p>
          
          <div style="text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_DOMAIN}/teamlead/subtasks" class="button">
              View Task Dashboard
            </a>
          </div>
          
          <p style="margin-top: 32px; color: #6B7280;">
            If you have any questions, please contact the manager directly or your team lead.
          </p>
        </div>
        
        <div class="footer">
          <p>This is an automated notification from the Task Management System.</p>
          <p>© ${new Date().getFullYear()} Task Management System. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};