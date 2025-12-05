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
      <p>
        <a href="${taskLink}" style="display: inline-block; padding: 10px 15px; background-color: #1a73e8; color: #fff; text-decoration: none; border-radius: 4px;">
          View Task
        </a>
      </p>
      <p>Best regards,<br/>Task Management System</p>
    </div>
  `;
};
