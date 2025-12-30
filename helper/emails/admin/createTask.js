// helper/emails/admin/createTask.js
export function adminTaskCreatedMailTemplate(managerName, taskTitle, assignedBy, priority, endDate, taskLink) {
  return `
  <div style="font-family: Arial, sans-serif; padding: 20px; background: #f5f7fa;">
    <div style="max-width: 480px; margin: auto; background: #ffffff; padding: 25px; border-radius: 10px;">
      <h2 style="text-align:center; color:#1e40af;">📝 New Admin Task Assigned</h2>
      <p>Hi <b>${managerName}</b>,</p>
      <p>A new task has been assigned to you by <b>${assignedBy}</b>.</p>
      <div style="background: #e0f2fe; padding: 20px; border-radius: 8px; margin:20px 0; border:1px solid #3b82f6;">
        <p><strong>Task Title:</strong> ${taskTitle}</p>
        <p><strong>Priority:</strong> <span style="font-weight:bold; color:${priority==='High'?'#dc2626':priority==='Medium'?'#d97706':'#059669'}">${priority}</span></p>
        <p><strong>Deadline:</strong> ${endDate ? new Date(endDate).toLocaleDateString() : "No deadline"}</p>
      </div>
      <p style="text-align:center;">
        <a href="https://www.mhcirclesolutions.com/admin-tasks" style="background:#3b82f6;color:#fff;padding:12px 25px;border-radius:6px;text-decoration:none;font-weight:bold;">View Task</a>
      </p>
      <p>Best regards,<br>The Task Management Team</p>
      <p style="text-align:center; font-size:12px; color:#777; margin-top:20px;">© ${new Date().getFullYear()} Task Management System. All rights reserved.</p>
    </div>
  </div>
  `;
}
