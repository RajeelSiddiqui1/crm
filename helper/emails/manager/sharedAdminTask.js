export function taskClaimedMailTemplate(managerName, taskTitle, assignedManagers, assignedBy) {
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const managerList = assignedManagers.map(m => 
    `<li style="margin-bottom: 8px; padding: 10px; background: #f8fafc; border-radius: 6px; border-left: 4px solid #3b82f6;">
      <strong style="color: #1e293b;">${m.name}</strong> - ${m.email}
    </li>`
  ).join('');

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Task Assigned Successfully</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Inter', sans-serif;
          line-height: 1.6;
          color: #334155;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          min-height: 100vh;
          padding: 20px;
        }
        
        .email-container {
          max-width: 680px;
          margin: 0 auto;
          background: white;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.05);
          border: 1px solid #e2e8f0;
        }
        
        .header {
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          color: white;
          padding: 40px 30px;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        
        .header::before {
          content: '';
          position: absolute;
          top: -50%;
          right: -50%;
          width: 200px;
          height: 200px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 50%;
        }
        
        .header::after {
          content: '';
          position: absolute;
          bottom: -30%;
          left: -30%;
          width: 150px;
          height: 150px;
          background: rgba(255, 255, 255, 0.08);
          border-radius: 50%;
        }
        
        .header h1 {
          font-size: 32px;
          font-weight: 700;
          margin-bottom: 12px;
          position: relative;
          z-index: 1;
        }
        
        .header-subtitle {
          font-size: 16px;
          opacity: 0.9;
          font-weight: 400;
          position: relative;
          z-index: 1;
        }
        
        .content {
          padding: 40px 30px;
        }
        
        .greeting {
          font-size: 18px;
          margin-bottom: 30px;
          color: #1e293b;
          font-weight: 500;
        }
        
        .info-card {
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border-radius: 16px;
          padding: 30px;
          margin-bottom: 30px;
          border: 1px solid #e2e8f0;
        }
        
        .info-title {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 24px;
        }
        
        .info-title .icon {
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }
        
        .info-title h2 {
          font-size: 22px;
          font-weight: 600;
          color: #1e293b;
        }
        
        .task-details {
          display: grid;
          gap: 20px;
        }
        
        .detail-row {
          display: grid;
          grid-template-columns: 1fr 2fr;
          align-items: center;
          padding-bottom: 16px;
          border-bottom: 1px solid #e2e8f0;
        }
        
        .detail-label {
          font-size: 14px;
          font-weight: 500;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .detail-value {
          font-size: 16px;
          font-weight: 600;
          color: #1e293b;
        }
        
        .managers-section {
          margin-top: 30px;
        }
        
        .managers-title {
          font-size: 18px;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .managers-list {
          list-style: none;
          margin: 0;
          padding: 0;
        }
        
        .manager-item {
          background: white;
          border-radius: 12px;
          padding: 18px;
          margin-bottom: 12px;
          border: 1px solid #e2e8f0;
          transition: all 0.3s ease;
        }
        
        .manager-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.05);
          border-color: #cbd5e1;
        }
        
        .manager-name {
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 4px;
        }
        
        .manager-email {
          font-size: 14px;
          color: #64748b;
        }
        
        .status-badge {
          display: inline-block;
          padding: 6px 16px;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 600;
          margin-top: 12px;
        }
        
        .action-buttons {
          display: flex;
          gap: 16px;
          margin: 40px 0;
        }
        
        .btn {
          flex: 1;
          padding: 16px 24px;
          text-align: center;
          text-decoration: none;
          border-radius: 12px;
          font-weight: 600;
          font-size: 16px;
          transition: all 0.3s ease;
        }
        
        .btn-primary {
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          color: white;
        }
        
        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(59, 130, 246, 0.3);
        }
        
        .btn-secondary {
          background: white;
          color: #475569;
          border: 2px solid #e2e8f0;
        }
        
        .btn-secondary:hover {
          border-color: #cbd5e1;
          transform: translateY(-2px);
        }
        
        .timeline {
          position: relative;
          padding-left: 30px;
          margin: 30px 0;
        }
        
        .timeline::before {
          content: '';
          position: absolute;
          left: 10px;
          top: 0;
          bottom: 0;
          width: 2px;
          background: linear-gradient(to bottom, #3b82f6, #8b5cf6);
        }
        
        .timeline-item {
          position: relative;
          margin-bottom: 20px;
          padding-left: 20px;
        }
        
        .timeline-item::before {
          content: '';
          position: absolute;
          left: -20px;
          top: 5px;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #3b82f6;
          border: 3px solid white;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
        }
        
        .timeline-item:last-child::before {
          background: #10b981;
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);
        }
        
        .timeline-content {
          background: #f8fafc;
          padding: 16px;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
        }
        
        .timeline-title {
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 4px;
        }
        
        .timeline-desc {
          font-size: 14px;
          color: #64748b;
        }
        
        .footer {
          background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
          color: #cbd5e1;
          padding: 40px 30px;
          text-align: center;
          border-top: 1px solid #334155;
        }
        
        .footer-logo {
          font-size: 24px;
          font-weight: 700;
          color: white;
          margin-bottom: 20px;
          background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          display: inline-block;
        }
        
        .footer-links {
          display: flex;
          justify-content: center;
          gap: 24px;
          margin: 20px 0;
        }
        
        .footer-link {
          color: #94a3b8;
          text-decoration: none;
          font-size: 14px;
          transition: color 0.2s;
        }
        
        .footer-link:hover {
          color: white;
        }
        
        .footer-text {
          font-size: 14px;
          color: #94a3b8;
          margin-top: 20px;
          line-height: 1.5;
        }
        
        .notification {
          position: relative;
          padding: 20px;
          background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
          border-radius: 12px;
          border: 1px solid #bae6fd;
          margin-bottom: 30px;
        }
        
        .notification::before {
          content: '🔔';
          position: absolute;
          left: 20px;
          top: 20px;
          font-size: 20px;
        }
        
        .notification-content {
          padding-left: 40px;
        }
        
        @media (max-width: 600px) {
          .header {
            padding: 30px 20px;
          }
          
          .header h1 {
            font-size: 26px;
          }
          
          .content {
            padding: 30px 20px;
          }
          
          .detail-row {
            grid-template-columns: 1fr;
            gap: 8px;
          }
          
          .action-buttons {
            flex-direction: column;
          }
          
          .btn {
            width: 100%;
          }
          
          .footer-links {
            flex-direction: column;
            gap: 12px;
          }
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <!-- Header -->
        <div class="header">
          <h1>📋 Task Successfully Assigned</h1>
          <p class="header-subtitle">Task has been shared with multiple managers</p>
        </div>
        
        <!-- Content -->
        <div class="content">
          <p class="greeting">Hello ${managerName},</p>
          
          <div class="notification">
            <div class="notification-content">
              <h3 style="margin: 0 0 8px 0; color: #0369a1;">Great news!</h3>
              <p style="margin: 0; color: #0c4a6e;">Your task has been successfully shared with ${assignedManagers.length} manager${assignedManagers.length > 1 ? 's' : ''}.</p>
            </div>
          </div>
          
          <!-- Task Information Card -->
          <div class="info-card">
            <div class="info-title">
              <div class="icon">📄</div>
              <h2>Task Information</h2>
            </div>
            
            <div class="task-details">
              <div class="detail-row">
                <span class="detail-label">Task Title</span>
                <span class="detail-value">${taskTitle}</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Assigned By</span>
                <span class="detail-value">${assignedBy.name} (${assignedBy.email})</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Assigned Date</span>
                <span class="detail-value">${currentDate}</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Status</span>
                <span class="status-badge">Shared with Managers</span>
              </div>
            </div>
          </div>
          
          <!-- Assigned Managers Section -->
          <div class="managers-section">
            <h3 class="managers-title">
              <span style="background: #6366f1; color: white; width: 30px; height: 30px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 14px;">${assignedManagers.length}</span>
              Assigned Manager${assignedManagers.length > 1 ? 's' : ''}
            </h3>
            
            <ul class="managers-list">
              ${managerList}
            </ul>
          </div>
          
          <!-- Next Steps Timeline -->
          <div class="timeline">
            <h3 style="margin-bottom: 20px; color: #1e293b; font-size: 18px; font-weight: 600;">📈 What Happens Next?</h3>
            
            <div class="timeline-item">
              <div class="timeline-content">
                <div class="timeline-title">Managers Notified</div>
                <div class="timeline-desc">All assigned managers have been notified via email and in-app notifications</div>
              </div>
            </div>
            
            <div class="timeline-item">
              <div class="timeline-content">
                <div class="timeline-title">Form Creation</div>
                <div class="timeline-desc">Managers will create forms based on this task for their team leads</div>
              </div>
            </div>
            
            <div class="timeline-item">
              <div class="timeline-content">
                <div class="timeline-title">Team Assignment</div>
                <div class="timeline-desc">Team leads will receive forms and assign work to employees</div>
              </div>
            </div>
            
            <div class="timeline-item">
              <div class="timeline-content">
                <div class="timeline-title">Task Completion</div>
                <div class="timeline-desc">Track progress and review completed submissions</div>
              </div>
            </div>
          </div>
          
          <!-- Action Buttons -->
          <div class="action-buttons">
            <a href="${process.env.TASK_LINK}/manager/admin-tasks" class="btn btn-primary">View All Tasks</a>
            <a href="${process.env.TASK_LINK}/manager/track-progress" class="btn btn-secondary">Track Progress</a>
          </div>
          
          <!-- Additional Info -->
          <div style="padding: 20px; background: #f8fafc; border-radius: 12px; margin-top: 30px; border: 1px solid #e2e8f0;">
            <h4 style="margin: 0 0 12px 0; color: #1e293b; font-size: 16px; font-weight: 600;">💡 Need Help?</h4>
            <p style="margin: 0; color: #64748b; font-size: 14px;">
              If you have any questions or need to modify the assignment, please contact the system administrator or reply to this email.
            </p>
          </div>
        </div>
        
        <!-- Footer -->
        <div class="footer">
          <div class="footer-logo">TaskFlow Pro</div>
          
          <div class="footer-links">
            <a href="${process.env.TASK_LINK}" class="footer-link">Dashboard</a>
            <a href="${process.env.TASK_LINK}/help" class="footer-link">Help Center</a>
            <a href="${process.env.TASK_LINK}/contact" class="footer-link">Contact Support</a>
          </div>
          
          <p class="footer-text">
            This is an automated notification. Please do not reply to this email.<br>
            © ${new Date().getFullYear()} TaskFlow Pro. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}