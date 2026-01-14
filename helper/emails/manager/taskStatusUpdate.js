export function managerTaskStatusUpdateMailTemplate(
  adminName,
  taskTitle,
  managerName,
  status,
  feedback,
  taskLink
) {
  const statusColor =
    status === "completed"
      ? "#28a745"
      : status === "rejected"
      ? "#dc3545"
      : "#f0ad4e";

  return `
    <div style="font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5;">
      <div style="max-width: 520px; margin: auto; background: #ffffff; padding: 25px; border-radius: 10px;">
        
        <h2 style="text-align: center; color: #333;">Task Status Updated</h2>

        <p>Hi <b>${adminName}</b>,</p>

        <p>
          The following task has been updated by 
          <b>${managerName}</b>:
        </p>

        <div style="
          background: #f9f9f9;
          padding: 15px;
          border-radius: 8px;
          margin: 20px 0;
        ">
          <p><b>Task:</b> ${taskTitle}</p>
          <p>
            <b>Status:</b> 
            <span style="
              color: ${statusColor};
              font-weight: bold;
              text-transform: capitalize;
            ">
              ${status}
            </span>
          </p>

          ${
            feedback
              ? `<p><b>Manager Feedback:</b><br/>${feedback}</p>`
              : ""
          }
        </div>

        <div style="text-align: center; margin-top: 25px;">
          <a href="${taskLink}" 
            style="
              background: #4a6cf7;
              color: white;
              padding: 12px 25px;
              border-radius: 6px;
              text-decoration: none;
              font-size: 14px;
              display: inline-block;
            ">
            View Task Details
          </a>
        </div>

        <p style="margin-top: 30px; font-size: 12px; color: #777; text-align:center;">
          This is an automated notification from MHCircle Solutions.
        </p>
      </div>
    </div>
  `;
}
