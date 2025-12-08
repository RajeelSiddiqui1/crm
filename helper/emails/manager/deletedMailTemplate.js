export function deletedMailTemplate(name, formTitle, deletedBy) {
  return `
    <div style="font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5;">
      <div style="max-width: 480px; margin: auto; background: #ffffff; padding: 25px; border-radius: 10px;">

        <h2 style="text-align: center; color: #d9534f;">Submission Deleted</h2>

        <p>Hi <b>${name}</b>,</p>
        <p>The following form submission has been deleted by <b>${deletedBy}</b>.</p>

        <div style="
          background: #ffe6e6;
          padding: 15px;
          border-radius: 8px;
          margin: 20px 0;
        ">
          <p><b>Form Title:</b> ${formTitle}</p>
        </div>

        <p style="font-size: 12px; color: #777; text-align:center;">
          If this was a mistake, please contact the manager.
        </p>
      </div>
    </div>
  `;
}
