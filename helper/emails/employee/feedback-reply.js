// helper/emails/employee/feedback-reply.js
export const sendEmployeeReplyMail = ({
  name,
  employeeName,
  taskTitle,
  reply,
  taskId
}) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: white; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; text-decoration: none; border-radius: 5px; font-weight: bold; }
        .reply-box { background: #f0f9ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; }
        .employee-info { background: #ecfdf5; border: 1px solid #d1fae5; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>New Reply from Employee</h1>
        </div>
        <div class="content">
          <h2>Hello ${name},</h2>
          <p>An employee has replied to your feedback on the task:</p>
          <h3>Task: ${taskTitle}</h3>
          
          <div class="employee-info">
            <p><strong>Employee:</strong> ${employeeName}</p>
          </div>
          
          <div class="reply-box">
            <p><strong>Reply:</strong> ${reply}</p>
          </div>
          
          <p>Click the button below to view the full conversation:</p>
          <p style="text-align: center;">
            <a href="${process.env.NEXTAUTH_URL}/teamlead/tasks/${taskId}" class="button">View Task Details</a>
          </p>
          
          <div style="background: #fef3c7; border: 1px solid #fbbf24; padding: 15px; border-radius: 5px; margin-top: 20px;">
            <h4 style="color: #92400e; margin-top: 0;">💡 Tip for Team Leads:</h4>
            <p style="color: #92400e; margin-bottom: 0;">
              When employees reply to your feedback, it shows engagement and understanding. 
              Consider following up with additional guidance or acknowledgment.
            </p>
          </div>
          
          <p>Best regards,<br>Task Management System</p>
        </div>
        <div class="footer">
          <p>This is an automated message. Please do not reply to this email.</p>
          <p>© ${new Date().getFullYear()} Task Management System. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};