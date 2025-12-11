export function createTaskTemplate({
  name,
  managerName,
  formTitle,
  status = "Pending",
  message,
  taskLink
}) {
  return `
  <div style="font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5;">
    <div style="max-width: 480px; margin: auto; background: #ffffff; padding: 25px; border-radius: 10px;">

      <h2 style="text-align: center; color: #333;">New Task Assigned</h2>

      <p>Hi <b>${name}</b>,</p>
      <p>A new form-based task has been assigned to you by <b>${managerName}</b>.</p>

      <div style="
        background: #f0f0f0;
        padding: 15px;
        border-radius: 8px;
        margin: 20px 0;
      ">
        <p><b>Form Title:</b> ${formTitle}</p>
        <p><b>Status:</b> ${status}</p>
        <p><b>Message:</b> ${message}</p>
      </div>

      <div style="text-align: center; margin-top: 20px;">
        <a href="${taskLink}" 
          style="
            background: #4a6cf7;
            color: white;
            padding: 12px 25px;
            border-radius: 6px;
            text-decoration: none;
            font-size: 14px;">
          View Task
        </a>
      </div>

      <p style="margin-top: 25px; font-size: 12px; color: #777; text-align:center;">
        You are required to complete this task as per assigned instructions.
      </p>
    </div>
  </div>
  `;
}
