// helper/emails/admin/deleteTask.js
export function adminTaskDeletedMailTemplate(managerName, taskTitle, deletedBy, taskLink) {
  return `
  <div style="font-family: Arial, sans-serif; padding: 20px; background: #fef2f2;">
    <div style="max-width: 480px; margin: auto; background: #ffffff; padding: 25px; border-radius: 10px;">
      <h2 style="text-align:center; color:#b91c1c;">🗑️ Admin Task Deleted</h2>
      <p>Hi <b>${managerName}</b>,</p>
      <p>The admin has deleted the task "<b>${taskTitle}</b>".</p>
      <div style="background: #fee2e2; padding: 20px; border-radius: 8px; margin:20px 0; border:1px solid #fca5a5;">
        <p><strong>Deleted By:</strong> ${deletedBy}</p>
      </div>
      <p>This task is no longer available in your task list.</p>
      <p style="text-align:center;">
        <a href="https://www.mhcirclesolutions.com/admin-tasks" style="background:#dc2626;color:#fff;padding:12px 25px;border-radius:6px;text-decoration:none;font-weight:bold;">View Tasks</a>
      </p>
      <p>Best regards,<br>The Task Management Team</p>
      <p style="text-align:center; font-size:12px; color:#777; margin-top:20px;">© ${new Date().getFullYear()} Task Management System. All rights reserved.</p>
    </div>
  </div>
  `;
}
