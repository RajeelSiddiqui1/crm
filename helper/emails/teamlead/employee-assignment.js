// helper/emails/employee/task-assignment.js
export const sendEmployeeTaskAssignmentMail = ({ name, formTitle, assignedBy, taskId }) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>New Task Assigned</h1>
            </div>
            <div class="content">
                <h2>Hello ${name},</h2>
                <p>You have been assigned a new task by <strong>${assignedBy}</strong>.</p>
                
                <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin: 20px 0;">
                    <h3 style="margin: 0 0 10px 0; color: #667eea;">Task Details</h3>
                    <p><strong>Task Title:</strong> ${formTitle}</p>
                    <p><strong>Assigned By:</strong> ${assignedBy}</p>
                    <p><strong>Task ID:</strong> ${taskId}</p>
                    <p><strong>Assigned Date:</strong> ${new Date().toLocaleDateString()}</p>
                </div>

                <p>Please log in to your account to view the complete task details and start working on it.</p>
                
               
                
                <p>If you have any questions, please contact your team lead.</p>
            </div>
            <div class="footer">
                <p>This is an automated notification. Please do not reply to this email.</p>
            </div>
        </div>
    </body>
    </html>
  `;
};

// helper/emails/employee/task-status-update.js
export const sendEmployeeTaskUpdateMail = ({ name, formTitle, updatedBy, newStatus, comments }) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .status-badge { display: inline-block; padding: 5px 15px; border-radius: 20px; color: white; font-weight: bold; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Task Status Updated</h1>
            </div>
            <div class="content">
                <h2>Hello ${name},</h2>
                <p>Your task status has been updated by <strong>${updatedBy}</strong>.</p>
                
                <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #f5576c; margin: 20px 0;">
                    <h3 style="margin: 0 0 10px 0; color: #f5576c;">Task Update Details</h3>
                    <p><strong>Task Title:</strong> ${formTitle}</p>
                    <p><strong>Updated By:</strong> ${updatedBy}</p>
                    <p><strong>New Status:</strong> 
                        <span class="status-badge" style="background: ${
                          newStatus === 'completed' ? '#10b981' : 
                          newStatus === 'in_progress' ? '#3b82f6' : 
                          newStatus === 'rejected' ? '#ef4444' : '#f59e0b'
                        };">
                            ${newStatus.replace('_', ' ').toUpperCase()}
                        </span>
                    </p>
                    ${comments ? `<p><strong>Comments:</strong> ${comments}</p>` : ''}
                    <p><strong>Updated Date:</strong> ${new Date().toLocaleDateString()}</p>
                </div>

                <p>Please log in to your account to view the updated task details.</p>
                
                <a href="${process.env.NEXTAUTH_URL}/employeehome" style="background: #f5576c; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">
                    View Updated Task
                </a>
            </div>
            <div class="footer">
                <p>This is an automated notification. Please do not reply to this email.</p>
            </div>
        </div>
    </body>
    </html>
  `;
};