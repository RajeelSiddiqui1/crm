// helper/emails/manager/managerTaskStatusUpdate.js
export function managerTaskStatusUpdateMailTemplate(
  managerName,
  employeeName,
  taskTitle,
  updatedBy,
  status,
  taskLink,
  feedback = "No feedback provided"
) {
  return `
  <div style="font-family: Arial, sans-serif; padding: 20px; background: #f9fafb;">
    <div style="max-width: 480px; margin: auto; background: #ffffff; padding: 25px; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">

      <h2 style="text-align:center; color: #3b82f6;">📢 Team Lead Submission Update</h2>
      
      <p>Hi <b>${managerName}</b>,</p>
      <p>Team Lead <strong>${updatedBy}</strong> updated the submission of <strong>${employeeName}</strong> for the task "<strong>${taskTitle}</strong>".</p>

      <div style="margin:20px 0; padding:15px; background:#dbeafe; border-left:4px solid #3b82f6; border-radius:8px;">
        <p><strong>Task Title:</strong> ${taskTitle}</p>
        <p><strong>Employee:</strong> ${employeeName}</p>
        <p><strong>Updated By:</strong> ${updatedBy}</p>
        <p><strong>Status:</strong> <span style="font-weight:bold; color:#1e40af;">${status}</span></p>
        <p><strong>Feedback:</strong> ${feedback}</p>
      </div>

   

      <p style="margin-top:25px; font-size:12px; color:#777; text-align:center;">
        This is an automated notification. Please do not reply.
      </p>
    </div>
  </div>
  `;
}
