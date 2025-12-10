// Email template when TeamLead assigns task to Employee
export function sharedTaskAssignEmployeeMailTemplate(employeeName, taskTitle, teamLeadName, managerName, taskLink) {
  return `
    <div style="font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5;">
      <div style="max-width: 480px; margin: auto; background: #fff; padding: 25px; border-radius: 10px;">
        <h2 style="text-align:center; color: #333;">New Task Assigned</h2>
        <p>Hi <b>${employeeName}</b>,</p>
        <p>A new task "<b>${taskTitle}</b>" has been assigned to you by <b>${teamLeadName}</b>.</p>
        <p>Manager: <b>${managerName}</b></p>
        <div style="text-align:center; margin: 20px 0;">
         
        </div>
        <p style="font-size:12px;color:#777;text-align:center;">This is an automated email. Please do not reply.</p>
      </div>
    </div>
  `;
}

// Notification object when TeamLead assigns task to Employee
export function sharedTaskAssignEmployeeNotification(employeeId, teamLeadId, teamLeadName, taskTitle, taskLink, taskId) {
  return {
    senderId: teamLeadId,
    senderModel: "TeamLead",
    senderName: teamLeadName,
    receiverId: employeeId,
    receiverModel: "Employee",
    type: "task_assigned",
    title: "New Task Assigned",
    message: `You have been assigned a new task: "${taskTitle}" by ${teamLeadName}.`,
  
    referenceId: taskId,
    referenceModel: "SharedTask"
  };
}

// Email template for Manager when TeamLead assigns Employee
export function sharedTaskAssignManagerMailTemplate(managerName, employeeName, taskTitle, teamLeadName, taskLink) {
  return `
    <div style="font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5;">
      <div style="max-width: 480px; margin: auto; background: #fff; padding: 25px; border-radius: 10px;">
        <h2 style="text-align:center; color: #333;">Employee Assigned by TeamLead</h2>
        <p>Hi <b>${managerName}</b>,</p>
        <p><b>${teamLeadName}</b> assigned the employee <b>${employeeName}</b> to the task "<b>${taskTitle}</b>".</p>
        <div style="text-align:center; margin: 20px 0;">
         
        </div>
        <p style="font-size:12px;color:#777;text-align:center;">This is an automated email. Please do not reply.</p>
      </div>
    </div>
  `;
}

// Notification object for Manager
export function sharedTaskAssignManagerNotification(managerId, teamLeadId, teamLeadName, employeeName, taskTitle, taskLink, taskId) {
  return {
    senderId: teamLeadId,
    senderModel: "TeamLead",
    senderName: teamLeadName,
    receiverId: managerId,
    receiverModel: "Manager",
    type: "employee_assigned",
    title: "Employee Assigned",
    message: `${teamLeadName} assigned ${employeeName} to the task "${taskTitle}".`,
    link: taskLink,
    referenceId: taskId,
    referenceModel: "SharedTask"
  };
}
