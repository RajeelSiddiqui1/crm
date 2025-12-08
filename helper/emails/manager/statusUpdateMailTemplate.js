export function statusUpdateMailTemplate(name, formTitle, oldStatus, newStatus) {
  return `
    <div style="font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5;">
      <div style="max-width: 480px; margin: auto; background: #ffffff; padding: 25px; border-radius: 10px;">

        <h2 style="text-align: center; color: #333;">Status Updated</h2>

        <p>Hi <b>${name}</b>,</p>
        <p>The status of your submitted form has been updated.</p>

        <div style="
          background: #f0f0f0;
          padding: 15px;
          border-radius: 8px;
          margin: 20px 0;
        ">
          <p><b>Form Title:</b> ${formTitle}</p>
          <p><b>Previous Status:</b> ${oldStatus}</p>
          <p><b>New Status:</b> ${newStatus}</p>
        </div>

        <p style="font-size: 12px; color: #777; text-align:center;">
          Please review the updated form status.
        </p>
      </div>
    </div>
  `;
}
