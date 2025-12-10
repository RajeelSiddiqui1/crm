export const sharedTaskAssignEmployeeMailTemplate = (
  employeeName,
  taskTitle,
  teamLeadName,
  managerName
) => {
  return `
  <div style="font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5;">
    <div style="max-width: 480px; margin: auto; background: #ffffff; padding: 25px; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
      <h2 style="text-align:center; color:#3b82f6;">📝 New Task Assigned</h2>

      <p>Hi <b>${employeeName}</b>,</p>
      <p>You have been assigned a new task: <strong>${taskTitle}</strong>.</p>
      <p>Assigned by Team Lead: <b>${teamLeadName}</b></p>
      <p>Shared by Manager: <b>${managerName}</b></p>


      <p style="margin-top:25px; font-size:12px; color:#777; text-align:center;">
        This is an automated notification. Please do not reply.
      </p>
    </div>
  </div>
  `;
};
