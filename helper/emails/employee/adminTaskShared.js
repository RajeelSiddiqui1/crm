export default function adminTaskShared({
  recipientName,
  taskTitle,
  sharedBy,
}) {
  return `
    <div style="font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5;">
      <div style="max-width: 480px; margin: auto; background: #ffffff; padding: 25px; border-radius: 10px;">
        
        <h2 style="text-align: center; color: #333;">New Task Shared</h2>

        <p>Hi <b>${recipientName}</b>,</p>

        <p>
          A new task "<b>${taskTitle}</b>" has been shared with you by 
          <b>${sharedBy}</b>.
        </p>

        <div style="
          font-size: 16px;
          text-align: center;
          font-weight: bold;
          margin: 15px 0;
          background: #f0f0f0;
          padding: 12px;
          border-radius: 8px;">
          You have been assigned a new task
        </div>

        <div style="text-align: center; margin-top: 20px;">
          <a href="${process.env.NEXT_PUBLIC_DOMAIN}/employee/admin-tasks"
            style="
              background: #4a6cf7;
              color: white;
              padding: 12px 25px;
              border-radius: 6px;
              text-decoration: none;
              font-size: 14px;">
            View Task
          </a>
        </div>

        <p style="margin-top: 25px; font-size: 12px; color: #777; text-align:center;">
          Please check your dashboard for task details.
        </p>
      </div>
    </div>
  `;
}
