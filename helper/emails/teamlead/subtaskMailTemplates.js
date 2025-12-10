export function updatedSubtaskMailTemplate(
  employeeName,
  subtaskTitle,
  description,
  teamLeadName,
  startDate,
  endDate,
  updateMessage,
  link
) {
  return `
  <div style="font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5;">
    <div style="max-width: 480px; margin: auto; background: #ffffff; padding: 25px; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
      
      <h2 style="text-align:center; color:#3b82f6;">🔄 Subtask Updated</h2>
      
      <p>Hi <b>${employeeName}</b>,</p>
      <p>The following subtask has been updated:</p>

      <div style="background:#fef3c7; border:1px solid #fbbf24; border-radius:8px; padding:15px; margin:20px 0;">
        <strong>${updateMessage}</strong>
      </div>

      <div style="background:#eff6ff; border:1px solid #bfdbfe; border-radius:8px; padding:15px; margin:20px 0;">
        <p><strong>Subtask Title:</strong> ${subtaskTitle}</p>
        <p><strong>Description:</strong> ${description || "No description added"}</p>
        <p><strong>Updated By:</strong> ${teamLeadName}</p>
        <p><strong>Start Date:</strong> ${startDate}</p>
        <p><strong>End Date:</strong> ${endDate}</p>
      </div>

      <div style="text-align:center; margin-top:20px;">
        <a href="${link}" style="background:#3b82f6; color:white; padding:12px 25px; text-decoration:none; border-radius:6px; font-weight:bold;">
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
