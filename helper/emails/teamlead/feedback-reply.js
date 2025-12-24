// helper/emails/teamlead/feedback-reply.js
export const sendFeedbackReplyMail = ({
  name,
  taskTitle,
  repliedBy,
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
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: white; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 5px; font-weight: bold; }
        .feedback-box { background: #f8f9fa; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>New Reply to Your Feedback</h1>
        </div>
        <div class="content">
          <h2>Hello ${name},</h2>
          <p>Someone has replied to your feedback on the task:</p>
          <h3>Task: ${taskTitle}</h3>
          
          <div class="feedback-box">
            <p><strong>Replied by:</strong> ${repliedBy}</p>
            <p><strong>Reply:</strong> ${reply}</p>
          </div>
          
          <p>Click the button below to view the full conversation:</p>
          <p style="text-align: center;">
            <a href="${process.env.NEXTAUTH_URL}/teamlead/tasks/${taskId}" class="button">View Task Details</a>
          </p>
          
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