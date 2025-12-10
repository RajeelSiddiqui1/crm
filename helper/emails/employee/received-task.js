// helper/emails/employee/submissionTask.js

// Employee Task Update Mail Template (Card Style)
export const employeeTaskUpdateMailTemplate = (receiverName, employeeName, taskTitle, status, taskLink) => {
  return `
  <div style="font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5;">
    <div style="max-width: 480px; margin: auto; background: #ffffff; padding: 25px; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
      
      <h2 style="text-align: center; color: #333;">Task Update Notification</h2>
      
      <p>Hi <b>${receiverName}</b>,</p>
      <p>Employee <b>${employeeName}</b> has updated the task:</p>

      <div style="margin: 20px 0; padding: 15px; background: #f0f4ff; border-left: 4px solid #6366f1; border-radius: 8px;">
        <p><strong>Task Title:</strong> ${taskTitle}</p>
        <p><strong>Status:</strong> ${status}</p>
      </div>

     

      <p style="margin-top: 25px; font-size: 12px; color: #777; text-align:center;">
        -- Task Management System
      </p>
    </div>
  </div>
  `;
};

// Employee Task Update Notification (for push/DB)
export const employeeTaskUpdateNotification = (receiverId, receiverRole, employeeName, taskTitle, status, link, taskId) => ({
  sender: {
    id: receiverId,
    model: receiverRole,
    name: employeeName
  },
  receiver: {
    id: receiverId,
    model: receiverRole
  },
  type: "task_update",
  referenceId: taskId,
  referenceModel: "SharedTask",
  title: `Task Updated: ${taskTitle}`,
  message: `Employee ${employeeName} updated the task "${taskTitle}" with status "${status}"`,
  link
});
