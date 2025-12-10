// helper/emails/manager/operationTaskAssigned.js
export function operationTaskAssignedMailTemplate(teamLeadName, taskTitle, managerName, formTitle, taskLink) {
  return `
  <div style="font-family: Arial, sans-serif; padding: 20px; background: #f5f7fa;">
    <div style="max-width: 480px; margin: auto; background: #ffffff; padding: 25px; border-radius: 10px;">
      
      <h2 style="text-align:center; color:#1e40af;">📌 New Operation Task Assigned</h2>
      
      <p>Hi <b>${teamLeadName}</b>,</p>
      <p><b>${managerName}</b> has assigned you a new operation task to manage.</p>
      
      <div style="background: #e0f2fe; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #3b82f6;">
        <p><strong>Task Title:</strong> ${taskTitle}</p>
        <p><strong>Form Title:</strong> ${formTitle || "N/A"}</p>
        <p><strong>Assigned By:</strong> ${managerName}</p>
        <p><strong>Status:</strong> Pending</p>
      </div>
      
      

      <p>Best regards,<br>The Task Management Team</p>

      <p style="text-align:center; font-size:12px; color:#777; margin-top:20px;">
        © ${new Date().getFullYear()} Task Management System. All rights reserved.<br>
        This is an automated notification. Please do not reply.
      </p>

    </div>
  </div>
  `;
}
