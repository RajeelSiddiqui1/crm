export const sharedTaskAssignTeamLeadMailTemplate = (
  teamLeadName,
  employeeName,
  taskTitle,
  managerName,
  taskLink
) => {
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <h2 style="color: #1a73e8;">New Task Assigned</h2>
      <p>Hi ${teamLeadName},</p>
      <p>You have been assigned a new task by <strong>${managerName}</strong> for employee <strong>${employeeName}</strong>.</p>
      <p><strong>Task Title:</strong> ${taskTitle}</p>
      <p>Please review and take the necessary action.</p>
      
      <p>Best regards,<br/>Task Management System</p>
    </div>
  `;
};
