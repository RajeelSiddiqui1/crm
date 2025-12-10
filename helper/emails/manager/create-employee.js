import { sendMail } from "@/lib/mail";

export const sendEmployeeWelcomeEmail = async (email, firstName,lastName, userId, password, departmentName) => {
  const subject = "🎉 Welcome to MH Circle Solutions - Your Team Lead Account";

  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5;">
      <div style="max-width: 480px; margin: auto; background: #ffffff; padding: 25px; border-radius: 10px;">
        
        <h2 style="text-align: center; color: #333;">Welcome Aboard, <b>${firstName} ${lastName}</b>! 💼</h2>
        
        <p>Congratulations! You’ve been successfully added as a <b>Employee</b> at <b>MH Circle Solutions</b>.</p>
        
        <p><b>Department:</b> ${departmentName}</p>
        
        <p>You can now log in using the details below:</p>

        <div style="
          background: #f0f0f0; 
          padding: 15px; 
          border-radius: 8px; 
          margin: 20px 0;">
          <p><b>User ID:</b> ${userId}</p>
          <p><b>Password:</b> ${password}</p>
          <p><b>Login URL:</b> 
            <a href="https://mhcirclesolutions.com/login" style="color:#4a6cf7;" target="_blank">
              https://mhcirclesolutions.com/login
            </a>
          </p>
        </div>

        <p style="text-align:center;">
          Please make sure to change your password after your first login for security reasons.
        </p>

        <p style="margin-top: 25px; font-size: 12px; color: #777; text-align:center;">
          — The MH Circle Solutions Team
        </p>

      </div>
    </div>
  `;

  await sendMail(email, subject, html);
};
