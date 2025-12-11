export function editedMailTemplate(name, formTitle, editorName, link) {
  return `
    <div style="font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5;">
      <div style="max-width: 480px; margin: auto; background: #ffffff; padding: 25px; border-radius: 10px;">

        <h2 style="text-align: center; color: #333;">Submission Updated</h2>

        <p>Hi <b>${name}</b>,</p>
        <p>The submission for the form <b>${formTitle}</b> has been updated by <b>${editorName}</b>.</p>

        <div style="background: #f0f0f0; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p><b>Form Title:</b> ${formTitle}</p>
        </div>

       

        <p style="margin-top: 25px; font-size: 12px; color: #777; text-align:center;">
          Please review the updated information.
        </p>
      </div>
    </div>
  `;
}
