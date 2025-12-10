export const sharedTaskAssignTeamLeadMailTemplate = (
  teamLeadName,
  employeeName,
  taskTitle,
  managerName,
  taskLink
) => {
  return `
    <div style="font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5;">
      <div style="max-width: 480px; margin: auto; background: #ffffff; padding: 25px; border-radius: 10px;">
        
        <h2 style="text-align: center; color: #4a6cf7;">New Task Assigned</h2>
        
        <p>Hi <b>${teamLeadName}</b>,</p>
        <p>You have been assigned a new task by <b>${managerName}</b> for employee <b>${employeeName}</b>.</p>
        
        <div style="
          background: #f0f0f0;
          padding: 15px;
          border-radius: 8px;
          margin: 20px 0;">
          <p><b>Task Title:</b> ${taskTitle}</p>
        </div>
        
       

        <p style="margin-top: 25px; font-size: 12px; color: #777; text-align:center;">
          This is an automated notification. Please do not reply to this email.
        </p>

      </div>
    </div>
  `;
};
