export function removeEmployeeTaskTemplate(
  name,
  taskTitle,
  removedBy,
  link
) {
  return `
    <div style="font-family: Arial; background:#f5f5f5; padding:20px;">
      <div style="max-width:520px; margin:auto; background:#fff; padding:25px; border-radius:10px;">
        <h2 style="color:#e63946;">Task Access Removed</h2>

        <p>Hi <b>${name}</b>,</p>

        <p>
          You have been removed from the task:
          <b>${taskTitle}</b>
        </p>

        <p>
          Removed by: <b>${removedBy}</b>
        </p>

       

        <p style="font-size:12px;color:#777;text-align:center;">
          If you think this was a mistake, please contact admin.
        </p>
      </div>
    </div>
  `;
}
