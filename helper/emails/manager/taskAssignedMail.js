export const taskAssignedMailTemplate = ({
  teamLeadName,
  taskTitle,
  taskDescription,
}) => {
  return `
    <div style="font-family: Arial; padding:20px;">
      <h2 style="color:#2563eb;">New Task Assigned</h2>
      <p>Hello <strong>${teamLeadName}</strong>,</p>
      <p>You have been assigned a new task.</p>

      <div style="background:#f3f4f6; padding:15px; border-radius:6px;">
        <p><strong>Title:</strong> ${taskTitle}</p>
        <p><strong>Description:</strong> ${taskDescription || "N/A"}</p>
      </div>

      <p style="margin-top:20px;">
        Please login to your dashboard to claim and start working on it.
      </p>

      <hr />
      <small>This is an automated email, do not reply.</small>
    </div>
  `;
};
