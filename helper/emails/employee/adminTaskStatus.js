export default function adminTaskStatus({
  recipientName,
  taskTitle,
  updaterName,
  status,
  feedback,
}) {
  return `
    <div style="font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5;">
      <div style="max-width: 480px; margin: auto; background: #ffffff; padding: 25px; border-radius: 10px;">
        
        <h2 style="text-align: center; color: #333;">Task Status Update</h2>

        <p>Hi <b>${recipientName}</b>,</p>

        <p>
          The task "<b>${taskTitle}</b>" has been updated by 
          <b>${updaterName}</b>.
        </p>

        <div style="
          font-size: 18px;
          text-align: center;
          font-weight: bold;
          margin: 15px 0;
          background: #f0f0f0;
          padding: 12px;
          border-radius: 8px;">
          Status: ${status}
        </div>

        ${feedback ? `
          <p><b>Feedback:</b> ${feedback}</p>
        ` : ""}

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
          If you did not expect this update, you can safely ignore this email.
        </p>
      </div>
    </div>
  `;
}
