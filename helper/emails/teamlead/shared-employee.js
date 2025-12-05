// helper/emails/teamlead/shared-employee/index.js

// Employee mail template
export const sharedTaskAssignEmployeeMailTemplate = (
  employeeName,
  taskTitle,
  teamLeadName,
  managerName,
  taskLink
) => {
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.5;">
      <h2>New Task Assigned</h2>
      <p>Hi ${employeeName},</p>
      <p>You have been assigned a new task: <strong>${taskTitle}</strong>.</p>
      <p>Assigned by Team Lead: ${teamLeadName}</p>
      <p>Shared by Manager: ${managerName}</p>
      <p>View the task here: <a href="${taskLink}">${taskLink}</a></p>
      <p>Best regards,<br/>Task Management System</p>
    </div>
  `;
};

// Employee notification object
export const sharedTaskAssignEmployeeNotification = (
  employeeId,
  teamLeadName,
  taskTitle,
  taskLink,
  taskId
) => ({
  senderId: null,
  senderModel: "TeamLead",
  senderName: teamLeadName,
  receiverId: employeeId,
  receiverModel: "Employee",
  type: "task_assigned_by_teamlead",
  title: "New Task Assigned",
  message: `You have been assigned a new task "${taskTitle}" by Team Lead ${teamLeadName}.`,
  link: taskLink,
  referenceId: taskId,
  referenceModel: "SharedTask",
});

// Shared Manager mail template
export const sharedTaskAssignManagerMailTemplate = (
  managerName,
  employeeName,
  taskTitle,
  teamLeadName,
  taskLink
) => {
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.5;">
      <h2>Employee Assigned to Shared Task</h2>
      <p>Hi ${managerName},</p>
      <p>Team Lead ${teamLeadName} has assigned <strong>${employeeName}</strong> to the shared task: <strong>${taskTitle}</strong>.</p>
      <p>View the task here: <a href="${taskLink}">${taskLink}</a></p>
      <p>Best regards,<br/>Task Management System</p>
    </div>
  `;
};

// Shared Manager notification object
export const sharedTaskAssignManagerNotification = (
  managerId,
  employeeName,
  taskTitle,
  taskLink,
  taskId
) => ({
  senderId: null,
  senderModel: "TeamLead",
  senderName: "TeamLead",
  receiverId: managerId,
  receiverModel: "Manager",
  type: "employee_assigned_to_shared_task",
  title: "Employee Assigned to Shared Task",
  message: `Employee ${employeeName} has been assigned to the shared task "${taskTitle}".`,
  link: taskLink,
  referenceId: taskId,
  referenceModel: "SharedTask",
});
