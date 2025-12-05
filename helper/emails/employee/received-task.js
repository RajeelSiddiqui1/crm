// Mail template
export const employeeTaskUpdateMailTemplate = (receiverName, employeeName, taskTitle, status, taskLink) => {
  return `
    <div style="font-family: Arial, sans-serif; line-height:1.6;">
      <h3>Hello ${receiverName},</h3>
      <p>Employee <b>${employeeName}</b> has updated the task <b>${taskTitle}</b>.</p>
      <p>Status: <b>${status}</b></p>
      <p>You can view the task details <a href="${taskLink}">here</a>.</p>
      <br>
      <p>-- Task Management System</p>
    </div>
  `;
};

// Notification template
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
