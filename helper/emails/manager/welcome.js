export function welcomeManagerTemplate(name, email) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to CRM Dashboard</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
          background-color: #f4f4f4;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        }
        .header {
          background: linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%);
          padding: 40px 20px;
          text-align: center;
          color: white;
        }
        .header h1 {
          margin: 0;
          font-size: 32px;
          font-weight: 600;
        }
        .content {
          padding: 40px 30px;
        }
        .welcome-icon {
          text-align: center;
          font-size: 60px;
          margin: 20px 0;
          color: #4CAF50;
        }
        .credentials-box {
          background-color: #f8f9fa;
          border: 2px dashed #4CAF50;
          border-radius: 8px;
          padding: 20px;
          margin: 30px 0;
        }
        .action-buttons {
          text-align: center;
          margin: 30px 0;
        }
        .btn {
          display: inline-block;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          text-decoration: none;
          padding: 14px 32px;
          border-radius: 50px;
          font-weight: 600;
          font-size: 16px;
          margin: 10px;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
        }
        .features {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin: 30px 0;
        }
        .feature {
          text-align: center;
          padding: 20px;
          background-color: #f8f9fa;
          border-radius: 8px;
          border: 1px solid #eaeaea;
        }
        .feature-icon {
          font-size: 32px;
          margin-bottom: 10px;
          color: #667eea;
        }
        .footer {
          text-align: center;
          padding: 20px;
          color: #666;
          font-size: 12px;
          border-top: 1px solid #eaeaea;
          background-color: #f9f9f9;
        }
        @media only screen and (max-width: 600px) {
          .content {
            padding: 20px 15px;
          }
          .features {
            grid-template-columns: 1fr;
          }
          .btn {
            display: block;
            margin: 10px auto;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Welcome to CRM Dashboard!</h1>
          <p style="margin-top: 10px; opacity: 0.9; font-size: 18px;">Your Manager Account is Now Active</p>
        </div>
        
        <div class="content">
          <div class="welcome-icon">✅</div>
          
          <h2 style="color: #2c3e50; text-align: center; margin-bottom: 20px;">
            Hello ${name},
          </h2>
          
          <p style="color: #555; text-align: center; font-size: 16px; margin-bottom: 30px;">
            Congratulations! Your manager account has been successfully verified and is now ready to use.
          </p>
          
          <div class="credentials-box">
            <h3 style="color: #2c3e50; margin-top: 0;">📋 Your Account Details:</h3>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Role:</strong> Manager</p>
            <p><strong>Status:</strong> Verified ✅</p>
            <p><strong>Login URL:</strong> <a href="${process.env.NEXTAUTH_URL}/managerlogin">${process.env.NEXTAUTH_URL}/managerlogin</a></p>
          </div>
          
          <div class="action-buttons">
            <a href="${process.env.NEXTAUTH_URL}/managerlogin" class="btn">
              Go to Manager Login
            </a>
            <a href="${process.env.NEXTAUTH_URL}/manager/home" class="btn" style="background: linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%);">
              Access Dashboard
            </a>
          </div>
          
          <h3 style="color: #2c3e50; text-align: center; margin: 40px 0 20px 0;">
            🚀 Get Started with These Features:
          </h3>
          
          <div class="features">
            <div class="feature">
              <div class="feature-icon">👥</div>
              <h4 style="color: #2c3e50; margin-bottom: 10px;">Team Management</h4>
              <p style="color: #666; font-size: 14px;">Manage your team members and assign tasks</p>
            </div>
            
            <div class="feature">
              <div class="feature-icon">📊</div>
              <h4 style="color: #2c3e50; margin-bottom: 10px;">Analytics Dashboard</h4>
              <p style="color: #666; font-size: 14px;">Track team performance and progress</p>
            </div>
            
            <div class="feature">
              <div class="feature-icon">📋</div>
              <h4 style="color: #2c3e50; margin-bottom: 10px;">Task Assignment</h4>
              <p style="color: #666; font-size: 14px;">Create and assign tasks to your team</p>
            </div>
            
            <div class="feature">
              <div class="feature-icon">📈</div>
              <h4 style="color: #2c3e50; margin-bottom: 10px;">Reports</h4>
              <p style="color: #666; font-size: 14px;">Generate detailed reports and insights</p>
            </div>
          </div>
          
          <div style="background-color: #e8f5e8; border-left: 4px solid #4CAF50; padding: 15px; margin: 30px 0; border-radius: 0 8px 8px 0;">
            <h4 style="color: #2c3e50; margin-top: 0;">💡 Need Help?</h4>
            <p style="color: #666; margin-bottom: 0;">
              • Check our <a href="${process.env.NEXTAUTH_URL}/docs" style="color: #4CAF50;">documentation</a><br>
              • Visit our <a href="${process.env.NEXTAUTH_URL}/help" style="color: #4CAF50;">help center</a><br>
              • Contact support: <a href="mailto:support@company.com" style="color: #4CAF50;">support@company.com</a>
            </p>
          </div>
        </div>
        
        <div class="footer">
          <p style="margin-bottom: 10px;">
            © ${new Date().getFullYear()} CRM Dashboard. All rights reserved.
          </p>
          <p style="margin: 5px 0; font-size: 11px; color: #888;">
            This is an automated welcome email. You're receiving this because you successfully verified your manager account.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}