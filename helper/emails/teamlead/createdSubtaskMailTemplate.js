// helper/emails/employee/createdSubtask.js
export function createdSubtaskMailTemplate(
  teamLeadName,
  taskTitle,
  subtaskTitle,
  description,
  priority,
  startDate,
  endDate,
  link
) {
  return `
  <div style="font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5;">
    <div style="max-width: 480px; margin: auto; background: #ffffff; padding: 25px; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">

      <h2 style="text-align:center; color: #059669;">📝 New Subtask Assigned</h2>
      
      <p>Hi <b>${teamLeadName}</b>,</p>
      <p>A new subtask has been created under the main task:</p>

      <div style="margin: 20px 0; padding: 15px; background: #ecfdf5; border-left: 4px solid #10b981; border-radius: 8px;">
        <p><strong>Main Task:</strong> ${taskTitle}</p>
        <p><strong>Subtask Title:</strong> ${subtaskTitle}</p>
        <p><strong>Description:</strong> ${description || "No description added"}</p>
        <p><strong>Priority:</strong> 
          <span style="font-weight:bold; color:${
            priority.toLowerCase() === 'high' ? '#dc2626' :
            priority.toLowerCase() === 'medium' ? '#d97706' : '#059669'
          }">${priority}</span>
        </p>
        <p><strong>Start Date:</strong> ${startDate}</p>
        <p><strong>End Date:</strong> ${endDate}</p>
      </div>

      <p>You can view and manage this subtask directly in your dashboard.</p>

      <div style="text-align:center; margin-top:20px;">
        <a href="${link}" style="background:#059669; color:white; padding:12px 25px; text-decoration:none; border-radius:6px; font-weight:bold;">
          View Subtask
        </a>
      </div>

      <p style="margin-top:25px; font-size:12px; color:#777; text-align:center;">
        This is an automated notification. Please do not reply.
      </p>
    </div>
  </div>
  `;
}
