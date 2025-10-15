import { sendMail } from "@/lib/mail";

export const sendTeamLeadWelcomeEmail = async (email, firstName, userId, password) => {
  const subject = "🎉 Welcome to MH Circle Solutions - Your Team Lead Account";

  const html = `
  <div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 30px;">
    <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 10px; padding: 25px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
      <h2 style="color: #d63384; text-align:center;">Welcome Aboard, ${firstName}! 💼</h2>
      <p style="font-size: 16px; color: #333;">
        Congratulations! You’ve been successfully added as a <strong>Team Lead</strong> at <strong>MH Circle Solutions</strong>.
      </p>
      <p style="font-size: 16px; color: #333;">
        You can now log in using the details below:
      </p>
      <div style="background: #f2f2f2; padding: 15px; border-radius: 8px; margin: 15px 0;">
        <p><strong>User ID:</strong> ${userId}</p>
        <p><strong>Password:</strong> ${password}</p>
        <p><strong>Login URL:</strong> <a href="https://yourdomain.com/login" target="_blank">https://yourdomain.com/login</a></p>
      </div>
      <p style="font-size: 15px; color: #555;">
        Please make sure to change your password after your first login for security reasons.
      </p>
      <p style="text-align:center; color: #888; font-size: 14px; margin-top: 30px;">
        — The MH Circle Solutions Team
      </p>
    </div>
  </div>
  `;

  await sendMail(email, subject, html);
};
