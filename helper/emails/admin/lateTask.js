// helper/emails/admin/lateTask.js
import { Resend } from "resend";
import dotenv from "dotenv";

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendLateTaskEmail = async (adminEmail, taskDetails) => {
  try {
    const { data, error } = await resend.emails.send({
      from: "Task Management <onboarding@resend.dev>",
      to: [adminEmail],
      subject: `🚨 Task Overdue: ${taskDetails.title}`,
      html: `
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Task Overdue Notification</title>
          <style>
              body {
                  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                  line-height: 1.6;
                  color: #333;
                  background-color: #f4f4f4;
                  margin: 0;
                  padding: 0;
              }
              .container {
                  max-width: 600px;
                  margin: 0 auto;
                  background-color: #ffffff;
                  border-radius: 12px;
                  overflow: hidden;
                  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
              }
              .header {
                  background: linear-gradient(135deg, #ff6b6b 0%, #ff8e53 100%);
                  color: white;
                  padding: 30px;
                  text-align: center;
                  border-bottom: 4px solid #ff4757;
              }
              .header h1 {
                  margin: 0;
                  font-size: 28px;
                  font-weight: 700;
              }
              .header p {
                  margin: 10px 0 0;
                  opacity: 0.9;
                  font-size: 16px;
              }
              .content {
                  padding: 40px;
              }
              .task-details {
                  background-color: #f8f9fa;
                  border-radius: 8px;
                  padding: 25px;
                  margin-bottom: 25px;
                  border-left: 4px solid #ff6b6b;
              }
              .detail-row {
                  margin-bottom: 15px;
                  display: flex;
                  align-items: center;
              }
              .detail-label {
                  font-weight: 600;
                  color: #495057;
                  min-width: 120px;
              }
              .detail-value {
                  color: #212529;
                  flex: 1;
              }
              .priority-badge {
                  display: inline-block;
                  padding: 4px 12px;
                  border-radius: 20px;
                  font-size: 12px;
                  font-weight: 600;
                  text-transform: uppercase;
              }
              .priority-high {
                  background-color: #ff6b6b;
                  color: white;
              }
              .priority-medium {
                  background-color: #ffa502;
                  color: white;
              }
              .priority-low {
                  background-color: #2ed573;
                  color: white;
              }
              .managers-section {
                  background-color: #e8f4fc;
                  border-radius: 8px;
                  padding: 20px;
                  margin-bottom: 25px;
              }
              .manager-item {
                  display: flex;
                  align-items: center;
                  gap: 15px;
                  padding: 12px;
                  background: white;
                  border-radius: 6px;
                  margin-bottom: 10px;
                  border: 1px solid #dee2e6;
              }
              .avatar {
                  width: 40px;
                  height: 40px;
                  border-radius: 50%;
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  color: white;
                  font-weight: bold;
                  font-size: 16px;
              }
              .action-buttons {
                  text-align: center;
                  margin-top: 30px;
              }
              .btn {
                  display: inline-block;
                  padding: 14px 32px;
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                  color: white;
                  text-decoration: none;
                  border-radius: 8px;
                  font-weight: 600;
                  font-size: 16px;
                  transition: all 0.3s ease;
              }
              .btn:hover {
                  transform: translateY(-2px);
                  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
              }
              .footer {
                  text-align: center;
                  padding: 20px;
                  color: #6c757d;
                  font-size: 14px;
                  background-color: #f8f9fa;
                  border-top: 1px solid #dee2e6;
              }
              .urgent-banner {
                  background: linear-gradient(135deg, #ff6b6b 0%, #ff4757 100%);
                  color: white;
                  padding: 15px;
                  text-align: center;
                  font-weight: 600;
                  font-size: 16px;
                  border-radius: 6px;
                  margin-bottom: 20px;
              }
              @media (max-width: 600px) {
                  .content {
                      padding: 20px;
                  }
                  .detail-row {
                      flex-direction: column;
                      align-items: flex-start;
                  }
                  .detail-label {
                      margin-bottom: 5px;
                  }
              }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h1>🚨 Task Overdue Notification</h1>
                  <p>Immediate attention required</p>
              </div>
              
              <div class="content">
                  <div class="urgent-banner">
                      ⚠️ This task is now overdue! Please take immediate action.
                  </div>
                  
                  <div class="task-details">
                      <h2 style="color: #ff6b6b; margin-top: 0;">${taskDetails.title}</h2>
                      
                      <div class="detail-row">
                          <span class="detail-label">Client:</span>
                          <span class="detail-value">${taskDetails.clientName || 'Not specified'}</span>
                      </div>
                      
                      <div class="detail-row">
                          <span class="detail-label">Priority:</span>
                          <span class="detail-value">
                              <span class="priority-badge priority-${taskDetails.priority}">
                                  ${taskDetails.priority}
                              </span>
                          </span>
                      </div>
                      
                      <div class="detail-row">
                          <span class="detail-label">Due Date:</span>
                          <span class="detail-value" style="color: #ff6b6b; font-weight: 600;">
                              ${new Date(taskDetails.endDate).toLocaleDateString('en-US', {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                              })}
                          </span>
                      </div>
                      
                      <div class="detail-row">
                          <span class="detail-label">Created By:</span>
                          <span class="detail-value">${taskDetails.adminName || 'System Admin'}</span>
                      </div>
                      
                      <div class="detail-row">
                          <span class="detail-label">Created On:</span>
                          <span class="detail-value">
                              ${new Date(taskDetails.createdAt).toLocaleDateString('en-US', {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                              })}
                          </span>
                      </div>
                      
                      ${taskDetails.description ? `
                      <div class="detail-row">
                          <span class="detail-label">Description:</span>
                          <span class="detail-value">${taskDetails.description}</span>
                      </div>
                      ` : ''}
                  </div>
                  
                  ${taskDetails.managers && taskDetails.managers.length > 0 ? `
                  <div class="managers-section">
                      <h3 style="margin-top: 0; color: #495057;">Assigned Managers:</h3>
                      ${taskDetails.managers.map(manager => `
                          <div class="manager-item">
                              <div class="avatar">
                                  ${manager.firstName ? manager.firstName.charAt(0) : 'M'}${manager.lastName ? manager.lastName.charAt(0) : 'G'}
                              </div>
                              <div>
                                  <strong>${manager.firstName} ${manager.lastName}</strong>
                                  ${manager.email ? `<br><small>${manager.email}</small>` : ''}
                                  ${manager.department ? `<br><small>${manager.department}</small>` : ''}
                              </div>
                          </div>
                      `).join('')}
                  </div>
                  ` : ''}
                  
                  <div class="action-buttons">
                      <a href="${taskDetails.dashboardUrl || '#'}" class="btn">
                          🔍 View Task in Dashboard
                      </a>
                  </div>
                  
                  <p style="text-align: center; color: #6c757d; font-size: 14px; margin-top: 25px;">
                      This is an automated notification. Please check the task management system for more details.
                  </p>
              </div>
              
              <div class="footer">
                  <p>© ${new Date().getFullYear()} Task Management System. All rights reserved.</p>
                  <p>This email was sent automatically. Please do not reply to this email.</p>
              </div>
          </div>
      </body>
      </html>
      `,
    });

    if (error) {
      console.error("Error sending late task email:", error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error in sendLateTaskEmail:", error);
    return { success: false, error };
  }
};