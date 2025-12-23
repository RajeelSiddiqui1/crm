export function removeSharedTeamleadEmail({
  recipientName,
  senderName,
  taskTitle,
  link,
}) {
  return `
    <div style="font-family: Arial, sans-serif; padding:20px; background:#f4f6f8">
      <div style="max-width:520px; margin:auto; background:#fff; padding:30px; border-radius:12px">
        <h2>❌ Task Access Removed</h2>
        <p>Hi ${recipientName},</p>
        <p>
          Your access to the task <b>"${taskTitle}"</b> has been removed by
          <b>${senderName}</b>.
        </p>
        <a href="${link}" style="display:inline-block;margin-top:20px;background:#ef4444;color:#fff;padding:10px 24px;border-radius:8px;text-decoration:none">
          View Dashboard
        </a>
        <p style="margin-top:20px;font-size:12px;color:#999">
          This is an automated email.
        </p>
      </div>
    </div>
  `;
}
