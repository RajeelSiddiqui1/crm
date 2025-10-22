export const updatedMailTemplate = (teamLeadName, formTitle, managerName, status, comments) => `
<div style="font-family: 'Segoe UI', sans-serif; background: #f9fafc; padding: 30px;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.05); overflow: hidden;">
    <div style="background: linear-gradient(90deg, #007bff, #6610f2); color: white; padding: 18px 25px;">
      <h2 style="margin: 0; font-size: 22px;">Form Status Updated</h2>
    </div>
    <div style="padding: 25px;">
      <p>Hi <strong>${teamLeadName}</strong>,</p>
      <p>The form <strong>"${formTitle}"</strong> has been <strong>updated</strong> by Manager <b>${managerName}</b>.</p>

      <div style="margin: 20px 0; padding: 15px; background: #f1f5ff; border-left: 4px solid #007bff; border-radius: 8px;">
        <p><strong>Status:</strong> ${status}</p>
        <p><strong>Comments:</strong> ${comments || "No comments provided."}</p>
      </div>

      <p>Please review the updated details in your dashboard.</p>
      <p style="margin-top: 20px;">Regards,<br><b>Manager Portal</b></p>
    </div>
  </div>
</div>
`;
