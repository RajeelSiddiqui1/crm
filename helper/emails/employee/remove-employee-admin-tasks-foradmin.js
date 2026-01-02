export function removeEmployeeTaskForAdminTemplate(
  adminName,
  taskTitle,
  employeeName,
  removedBy,
  link
) {
  return `
    <div style="font-family: Arial; background:#f5f5f5; padding:20px;">
      <div style="max-width:520px; margin:auto; background:#fff; padding:25px; border-radius:10px;">
        <h2 style="color:#333;">Employee Removed From Task</h2>

        <p>Hi <b>${adminName}</b>,</p>

        <p>
          <b>${employeeName}</b> has been removed from task:
        </p>

        <h3 style="color:#4a6cf7;">${taskTitle}</h3>

        <p>Action performed by: <b>${removedBy}</b></p>

        <div style="margin:25px 0; text-align:center;">
          <a href="${link}"
            style="background:#4a6cf7;color:#fff;padding:12px 25px;
            border-radius:6px;text-decoration:none;">
            View Task
          </a>
        </div>

        <p style="font-size:12px;color:#777;text-align:center;">
          This is an automated notification.
        </p>
      </div>
    </div>
  `;
}
