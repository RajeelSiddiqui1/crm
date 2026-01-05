// helper/emails/teamlead/updatedSubtaskMailTemplate.js
export function updatedSubtaskMailTemplate(
  creatorName,
  taskTitle,
  newStatus,
  feedback,
  updatedBy
) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
        .content { background: white; padding: 40px; border-radius: 10px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .header h1 { color: #2d3748; font-size: 24px; margin-bottom: 10px; }
        .status-badge { 
          display: inline-block; 
          padding: 8px 16px; 
          border-radius: 20px; 
          font-weight: bold; 
          margin: 10px 0; 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }
        .info-box { background: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
        .footer { margin-top: 40px; text-align: center; color: #718096; font-size: 14px; }
        .button { 
          display: inline-block; 
          padding: 12px 24px; 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
          color: white; 
          text-decoration: none; 
          border-radius: 5px; 
          margin-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="content">
          <div class="header">
            <h1>📊 Task Progress Update</h1>
            <p>Hi ${creatorName}, one of your assigned team leads has updated progress on a task.</p>
          </div>
          
          <div class="info-box">
            <h3>Task Details:</h3>
            <p><strong>Task Title:</strong> ${taskTitle}</p>
            <p><strong>Updated By:</strong> ${updatedBy}</p>
            <p><strong>New Status:</strong> <span class="status-badge">${newStatus}</span></p>
            <p><strong>Update Time:</strong> ${new Date().toLocaleString()}</p>
          </div>
          
          <div class="info-box">
            <h3>Feedback/Comments:</h3>
            <p>${feedback || "No feedback provided"}</p>
          </div>
          
          <div style="text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_DOMAIN}/teamlead/subtasks" class="button">
              View Task Details
            </a>
          </div>
          
          <div class="footer">
            <p>This is an automated notification from the Task Management System.</p>
            <p>© ${new Date().getFullYear()} Your Company. All rights reserved.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}