// helper/emails/employee/task-assignment.js
export function sendEmployeeTaskAssignmentMail({ name, formTitle, assignedBy, taskId }) {
  return `
  <div style="font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5;">
    <div style="max-width: 480px; margin: auto; background: #ffffff; padding: 25px; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
      
      <h2 style="text-align: center; color: #333;">📌 New Task Assigned</h2>
      
      <p>Hi <b>${name}</b>,</p>
      <p>You have been assigned a new task by <b>${assignedBy}</b>.</p>

      <div style="margin: 20px 0; padding: 15px; background: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 8px;">
        <p><strong>Task Title:</strong> ${formTitle}</p>
        <p><strong>Assigned By:</strong> ${assignedBy}</p>
        <p><strong>Task ID:</strong> ${taskId}</p>
        <p><strong>Assigned Date:</strong> ${new Date().toLocaleDateString()}</p>
      </div>

      <p>Please log in to your account to start working on this task.</p>

    

      <p style="margin-top: 25px; font-size: 12px; color: #777; text-align:center;">
        This is an automated notification. Please do not reply.
      </p>
    </div>
  </div>
  `;
}
