export function sendEmployeeRemovedFromTaskMail({ name, formTitle, removedBy, taskId }) {
  return `
    <div style="font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5;">
      <div style="max-width: 480px; margin: auto; background: #ffffff; padding: 25px; border-radius: 10px;">
        
        <h2 style="text-align: center; color: #333;">Task Assignment Update</h2>
        <p>Hi <b>${name}</b>,</p>
        <p>You have been removed from the task <b>"${formTitle}"</b> by <b>${removedBy}</b>.</p>

        <div style="
          font-size: 16px; 
          text-align: center; 
          font-weight: normal; 
          margin: 25px 0; 
          background: #f0f0f0; 
          padding: 15px; 
          border-radius: 8px;">
          Task ID: <b>${taskId}</b>
        </div>

        <p style="text-align:center; color: #555;">
          If you think this was a mistake, please contact your Team Lead.
        </p>

        <div style="text-align: center; margin-top: 20px;">
          <a href="${process.env.NEXT_PUBLIC_BASE_URL}/employee/tasks/${taskId}" 
            style="
              background: #ff4a4a;
              color: white;
              padding: 12px 25px;
              border-radius: 6px;
              text-decoration: none;
              font-size: 14px;">
            View Task
          </a>
        </div>

        <p style="margin-top: 25px; font-size: 12px; color: #777; text-align:center;">
          This is an automated notification. No reply is needed.
        </p>
      </div>
    </div>
  `;
}
