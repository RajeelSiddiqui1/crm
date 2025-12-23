export function sharedTeamleadEmail({
  recipientName,
  senderName,
  taskTitle,
  departmentName,
  link,
}) {
  return `
    <div style="font-family: Arial, sans-serif; padding:20px; background:#f4f6f8">
      <div style="max-width:520px; margin:auto; background:#fff; padding:30px; border-radius:12px">
        <h2>📌 New Task Shared</h2>
        <p>Hi ${recipientName},</p>
        <p>
          <b>${senderName}</b> has shared a task with you.
        </p>
        <p>
          <b>Task:</b> ${taskTitle}<br/>
          <b>Department:</b> ${departmentName || "N/A"}
        </p>
        <a href="${link}" style="display:inline-block;margin-top:20px;background:#4a6cf7;color:#fff;padding:10px 24px;border-radius:8px;text-decoration:none">
          View Task
        </a>
        <p style="margin-top:20px;font-size:12px;color:#999">
          This is an automated email.
        </p>
      </div>
    </div>
  `;
}
