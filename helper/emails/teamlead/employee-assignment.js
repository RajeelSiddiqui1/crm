// helper/emails/employee/task-status-update.js
export function sendEmployeeTaskUpdateMail({ name, formTitle, updatedBy, newStatus, comments }) {
  const statusColors = {
    completed: "#10b981",
    in_progress: "#3b82f6",
    rejected: "#ef4444",
    pending: "#f59e0b"
  };

  return `
  <div style="font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5;">
    <div style="max-width: 480px; margin: auto; background: #ffffff; padding: 25px; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">

      <h2 style="text-align: center; color: #333;">🔄 Task Status Updated</h2>

      <p>Hi <b>${name}</b>,</p>
      <p>Your task has been updated by <b>${updatedBy}</b>.</p>

      <div style="margin: 20px 0; padding: 15px; background: #fff0f6; border-left: 4px solid ${statusColors[newStatus] || "#f59e0b"}; border-radius: 8px;">
        <p><strong>Task Title:</strong> ${formTitle}</p>
        <p><strong>Updated By:</strong> ${updatedBy}</p>
        <p><strong>New Status:</strong> 
          <span style="color:white; background:${statusColors[newStatus] || "#f59e0b"}; padding:5px 12px; border-radius:20px; font-weight:bold;">
            ${newStatus.replace('_', ' ').toUpperCase()}
          </span>
        </p>
        ${comments ? `<p><strong>Comments:</strong> ${comments}</p>` : ''}
        <p><strong>Updated Date:</strong> ${new Date().toLocaleDateString()}</p>
      </div>

      
      <p style="margin-top: 25px; font-size: 12px; color: #777; text-align:center;">
        This is an automated notification. Please do not reply.
      </p>
    </div>
  </div>
  `;
}
