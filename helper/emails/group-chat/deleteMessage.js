export function deleteMessageEmailTemplate({ recipientName, senderName, link }) {
  return `
    <div style="font-family: Arial, sans-serif; padding: 20px; background: #f0f2f5;">
      <div style="max-width: 480px; margin: auto; background: white; padding: 30px; border-radius: 12px; box-shadow: 0 10px 20px rgba(0,0,0,0.1);">
        <h2 style="color: #333;">Message Deleted by ${senderName}</h2>
        <p style="color: #555;">Hi ${recipientName},</p>
        <p style="color: #555;">A message in the group chat has been deleted.</p>
        <a href="${link}" style="display: inline-block; margin-top: 20px; background: #4a6cf7; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none;">View Chat</a>
        <p style="color: #999; font-size: 12px; margin-top: 20px;">This is an automated email notification.</p>
      </div>
    </div>
  `;
}
