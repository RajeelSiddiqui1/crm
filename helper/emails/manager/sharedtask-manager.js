export const sharedTaskMailTemplate = (
  receiverName,
  senderName,
  taskTitle,
  taskDescription,
  dueDate,
  priority,
  notes,
  taskLink
) => {
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <h2 style="color: #1a73e8;">New Task Shared with You</h2>
      <p>Hi <strong>${receiverName}</strong>,</p>
      <p><strong>${senderName}</strong> has shared a task with you.</p>
      <p><strong>Task Title:</strong> ${taskTitle}</p>
      <p><strong>Description:</strong> ${taskDescription}</p>
      <p><strong>Due Date:</strong> ${dueDate ? new Date(dueDate).toLocaleString() : "N/A"}</p>
      <p><strong>Priority:</strong> ${priority}</p>
      ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ""}
      <p>You can view the task and take action by clicking the link below:</p>
      <a href="${taskLink}" style="color: #1a73e8;">View Task</a>
      <p>Best regards,<br/>${senderName}</p>
    </div>
  `;
};
