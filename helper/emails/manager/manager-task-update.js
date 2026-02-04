export function managerUpdatedTaskMailTemplate(
  recipientName,
  managerName,
  employeeName,
  taskTitle,
  status,
  taskLink
) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Task Updated by Manager</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
          background-color: #f5f5f5;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 30px;
          text-align: center;
          color: white;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 600;
        }
        .content {
          padding: 40px;
        }
        .info-box {
          background-color: #f8f9fa;
          border-left: 4px solid #667eea;
          padding: 20px;
          margin: 25px 0;
          border-radius: 5px;
        }
        .task-details {
          background-color: #e8f4fd;
          border: 1px solid #cfe2ff;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
        }
        .status-badge {
          display: inline-block;
          padding: 6px 16px;
          border-radius: 20px;
          font-weight: 600;
          font-size: 14px;
          margin: 5px 0;
        }
        .status-pending { background-color: #fff3cd; color: #856404; }
        .status-completed { background-color: #d1e7dd; color: #0f5132; }
        .status-in_progress { background-color: #cfe2ff; color: #084298; }
        .status-cancelled { background-color: #f8d7da; color: #721c24; }
        .btn {
          display: inline-block;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          text-decoration: none;
          padding: 14px 32px;
          border-radius: 6px;
          font-weight: 600;
          margin-top: 20px;
          text-align: center;
          transition: transform 0.3s ease;
        }
        .btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 12px rgba(102, 126, 234, 0.3);
        }
        .footer {
          text-align: center;
          padding: 25px;
          color: #666;
          font-size: 14px;
          background-color: #f8f9fa;
          border-top: 1px solid #e9ecef;
        }
        .highlight {
          color: #667eea;
          font-weight: 600;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📋 Task Updated</h1>
        </div>
        
        <div class="content">
          <h2>Hello ${recipientName},</h2>
          
          <p>Manager <span class="highlight">${managerName}</span> has updated the task related to employee <span class="highlight">${employeeName}</span>.</p>
          
          <div class="task-details">
            <h3 style="margin-top: 0; color: #2d3748;">Task Details:</h3>
            <p><strong>Task Title:</strong> ${taskTitle}</p>
            <p><strong>Updated By:</strong> ${managerName}</p>
            <p><strong>New Status:</strong> 
              <span class="status-badge status-${status}">
                ${status.replace('_', ' ').toUpperCase()}
              </span>
            </p>
            <p><strong>Updated At:</strong> ${new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</p>
          </div>
          
          <div class="info-box">
            <p><strong>📌 Important:</strong> The manager has made updates to this task. Please review the changes and take necessary action if required.</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${taskLink}" class="btn">
              👀 View Updated Task
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px;">
            <strong>Note:</strong> This is an automated notification. Please do not reply to this email.
          </p>
        </div>
        
        <div class="footer">
          <p>© ${new Date().getFullYear()} Task Management System. All rights reserved.</p>
          <p>If you have any questions, please contact your system administrator.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function managerUploadedFilesMailTemplate(
  recipientName,
  managerName,
  taskTitle,
  fileCount,
  taskLink
) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Files Uploaded by Manager</title>
      <style>
        /* Same styles as above, with slight modifications */
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
          background-color: #f5f5f5;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
          background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
          padding: 30px;
          text-align: center;
          color: white;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 600;
        }
        .content {
          padding: 40px;
        }
        .file-info {
          background-color: #e8f5e9;
          border: 1px solid #c8e6c9;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
        }
        .btn {
          display: inline-block;
          background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
          color: white;
          text-decoration: none;
          padding: 14px 32px;
          border-radius: 6px;
          font-weight: 600;
          margin-top: 20px;
          text-align: center;
          transition: transform 0.3s ease;
        }
        .btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 12px rgba(76, 175, 80, 0.3);
        }
        .footer {
          text-align: center;
          padding: 25px;
          color: #666;
          font-size: 14px;
          background-color: #f8f9fa;
          border-top: 1px solid #e9ecef;
        }
        .highlight {
          color: #4CAF50;
          font-weight: 600;
        }
        .file-icon {
          font-size: 20px;
          margin-right: 10px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📎 Files Uploaded</h1>
        </div>
        
        <div class="content">
          <h2>Hello ${recipientName},</h2>
          
          <p>Manager <span class="highlight">${managerName}</span> has uploaded <span class="highlight">${fileCount} new file(s)</span> to the task:</p>
          
          <div class="file-info">
            <h3 style="margin-top: 0; color: #2d3748;">📋 Task Information:</h3>
            <p><strong>Task Title:</strong> ${taskTitle}</p>
            <p><strong>Uploaded By:</strong> ${managerName}</p>
            <p><strong>Files Uploaded:</strong> ${fileCount} file(s)</p>
            <p><strong>Upload Time:</strong> ${new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</p>
          </div>
          
          <p>These files are now available for you to view and download from the task page.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${taskLink}" class="btn">
              📁 View Files & Task
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px;">
            <strong>Note:</strong> Please review the uploaded files and take necessary action.
          </p>
        </div>
        
        <div class="footer">
          <p>© ${new Date().getFullYear()} Task Management System. All rights reserved.</p>
          <p>Secure file sharing system</p>
        </div>
      </div>
    </body>
    </html>
  `;
}