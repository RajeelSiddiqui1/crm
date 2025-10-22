export const editedMailTemplate = (teamLeadName, formTitle, managerName) => `
<div style="font-family: 'Segoe UI', sans-serif; background: #f9fafc; padding: 30px;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.05); overflow: hidden;">
    <div style="background: linear-gradient(90deg, #28a745, #218838); color: white; padding: 18px 25px;">
      <h2 style="margin: 0; font-size: 22px;">Form Edited</h2>
    </div>
    <div style="padding: 25px;">
      <p>Dear <strong>${teamLeadName}</strong>,</p>
      <p>The form <strong>"${formTitle}"</strong> has been <strong>edited</strong> by <b>${managerName}</b>.</p>
      <p>Please check the updated fields in your portal.</p>

      <div style="margin-top: 25px;">
        <a href="#" style="background: #28a745; color: white; padding: 10px 16px; border-radius: 6px; text-decoration: none;">View Form</a>
      </div>

      <p style="margin-top: 30px;">Best Regards,<br><b>Manager Portal</b></p>
    </div>
  </div>
</div>
`;
