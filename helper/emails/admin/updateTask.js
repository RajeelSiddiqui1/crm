// helper/emails/admin/updateTask.js
export function adminTaskUpdatedMailTemplate(managerName, taskTitle, updatedBy, taskLink) {
  return `
  <div style="font-family: Arial, sans-serif; padding: 20px; background: #f5f7fa;">
    <div style="max-width: 480px; margin: auto; background: #ffffff; padding: 25px; border-radius: 10px;">
      <h2 style="text-align:center; color:#1e40af;">✏️ Admin Task Updated</h2>
      <p>Hi <b>${managerName}</b>,</p>
      <p>The admin has updated the task "<b>${taskTitle}</b>".</p>
      <div style="background: #e0f2fe; padding: 20px; border-radius: 8px; margin:20px 0; border:1px solid #3b82f6;">
        <p><strong>Updated By:</strong> ${updatedBy}</p>
      </div>
      <p style="text-align:center;">
        <a href="${taskLink}" style="background:#3b82f6;color:#fff;padding:12px 25px;border-radius:6px;text-decoration:none;font-weight:bold;">View Task</a>
      </p>
      <p>Best regards,<br>The Task Management Team</p>
      <p style="text-align:center; font-size:12px; color:#777; margin-top:20px;">© ${new Date().getFullYear()} Task Management System. All rights reserved.</p>
    </div>
  </div>
  `;
}
