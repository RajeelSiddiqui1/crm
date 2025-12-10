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
    <div style="font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5;">
      <div style="max-width: 480px; margin: auto; background: #ffffff; padding: 25px; border-radius: 10px;">
        
        <h2 style="text-align: center; color: #4a6cf7;">New Task Shared with You</h2>
        
        <p>Hi <b>${receiverName}</b>,</p>
        <p><b>${senderName}</b> has shared a new task with you.</p>
        
        <div style="
          background: #f0f0f0;
          padding: 15px;
          border-radius: 8px;
          margin: 20px 0;">
          <p><b>Task Title:</b> ${taskTitle}</p>
          <p><b>Description:</b> ${taskDescription}</p>
          <p><b>Due Date:</b> ${dueDate ? new Date(dueDate).toLocaleString() : "N/A"}</p>
          <p><b>Priority:</b> ${priority}</p>
          ${notes ? `<p><b>Notes:</b> ${notes}</p>` : ""}
        </div>

        

        <p style="margin-top: 25px; font-size: 12px; color: #777; text-align:center;">
          This is an automated notification. Please do not reply to this email.
        </p>

      </div>
    </div>
  `;
};
