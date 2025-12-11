export function deletedMailTemplate(name, formTitle, deletedBy, deletedAt) {
  return `
    <div style="font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5;">
      <div style="max-width: 480px; margin: auto; background: #ffffff; padding: 25px; border-radius: 10px;">

        <h2 style="text-align: center; color: #d9534f;">Submission Deleted</h2>

        <p>Hi <b>${name}</b>,</p>
        <p>The following submission has been deleted by <b>${deletedBy}</b> on <b>${deletedAt}</b>.</p>

        <div style="background: #f0f0f0; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p><b>Form Title:</b> ${formTitle}</p>
        </div>

        <p style="margin-top: 25px; font-size: 12px; color: #777; text-align:center;">
          If this was a mistake, please contact your manager immediately.
        </p>
      </div>
    </div>
  `;
}
