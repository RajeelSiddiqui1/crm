import { sendMail } from "@/lib/mail";

export const sendTaskStatusUpdateMail = async (to, formId, status, teamLeadEmail) => {
  const subject = `📋 Task Status Update - ${status.toUpperCase()}`;

  const html = `
  <div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 30px;">
    <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 10px; padding: 25px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
      <h2 style="color: #007bff; text-align:center;">Task Update from Your Team Lead</h2>
      
      <p style="font-size: 16px; color: #333;">
        Hello 👋, your task <strong>${formId}</strong> has been updated by your Team Lead (<strong>${teamLeadEmail}</strong>).
      </p>

      <div style="background: #f2f2f2; padding: 15px; border-radius: 8px; margin: 15px 0;">
        <p><strong>Status:</strong> ${status}</p>
      </div>

      <p style="font-size: 15px; color: #555;">
        Please check your dashboard for more details or feedback.
      </p>

      <p style="text-align:center; color: #888; font-size: 14px; margin-top: 30px;">
        — MH Circle Solutions
      </p>
    </div>
  </div>
  `;

  await sendMail(to, subject, html);
};
