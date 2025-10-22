export const deletedMailTemplate = (teamLeadName, formTitle, managerName) => `
<div style="font-family: 'Segoe UI', sans-serif; background: #f9fafc; padding: 30px;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.05); overflow: hidden;">
    <div style="background: linear-gradient(90deg, #dc3545, #b02a37); color: white; padding: 18px 25px;">
      <h2 style="margin: 0; font-size: 22px;">Form Deleted</h2>
    </div>
    <div style="padding: 25px;">
      <p>Hi <strong>${teamLeadName}</strong>,</p>
      <p>The form <strong>"${formTitle}"</strong> assigned to you has been <strong>deleted</strong> by Manager <b>${managerName}</b>.</p>

      <div style="margin: 20px 0; padding: 15px; background: #fff0f0; border-left: 4px solid #dc3545; border-radius: 8px;">
        <p>This form will no longer appear in your dashboard.</p>
      </div>

      <p style="margin-top: 20px;">If this was a mistake, please contact your manager immediately.</p>
      <p style="margin-top: 20px;">Regards,<br><b>Manager Portal</b></p>
    </div>
  </div>
</div>
`;
