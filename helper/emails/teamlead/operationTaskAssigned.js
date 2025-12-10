export function operationTaskAssignedMailTemplate(employeeName, taskTitle, assignedBy, taskLink) {
  return `
    <div style="font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5;">
      <div style="max-width: 480px; margin: auto; background: #ffffff; padding: 25px; border-radius: 10px;">
        <h2 style="text-align: center; color: #333;">New Operation Task Assigned</h2>
        <p>Hi <b>${employeeName}</b>,</p>
        <p>You have been assigned a new operation task: <strong>${taskTitle}</strong>.</p>
        <p>Assigned by: <b>${assignedBy}</b></p>

        <div style="text-align:center; margin: 25px 0;">
          <a href="${taskLink}" 
             style="background: #4a6cf7; color: white; padding: 12px 25px; border-radius: 6px; text-decoration: none; font-weight: bold;">
             View Task
          </a>
        </div>

        <p style="font-size: 12px; color: #777; text-align:center;">
          This is an automated notification. Please do not reply.
        </p>
      </div>
    </div>
  `;
}
