
// Submission Task Mail Template (Card Style)
export function submissionTaskMailTemplate({ teamLeadName, employeeName, subtaskTitle, submissionLink, submittedAt }) {
  return `
  <div style="font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5;">
    <div style="max-width: 480px; margin: auto; background: #ffffff; padding: 25px; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
      
      <h2 style="text-align: center; color: #333;">📨 New Subtask Submission</h2>
      
      <p>Hi <b>${teamLeadName}</b>,</p>
      <p><b>${employeeName}</b> has submitted a form for the subtask:</p>

      <div style="margin: 20px 0; padding: 15px; background: #f0f4ff; border-left: 4px solid #1a73e8; border-radius: 8px;">
        <p><strong>Subtask Title:</strong> ${subtaskTitle}</p>
        <p><strong>Submitted By:</strong> ${employeeName}</p>
        <p><strong>Submission Date & Time:</strong> ${new Date(submittedAt).toLocaleString()}</p>
      </div>

     
      <p style="margin-top: 25px; font-size: 12px; color: #777; text-align:center;">
        Please review the submission and provide feedback.
      </p>

      <p style="margin-top: 25px; font-size: 12px; color: #777; text-align:center;">
        © ${new Date().getFullYear()} Task Management System. All rights reserved. This is an automated notification.
      </p>
    </div>
  </div>
  `;
}
