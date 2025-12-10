
export const updatedMailTemplate = (teamLeadName, formTitle, managerName, status, comments) => `
<div style="font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5;">
  <div style="max-width: 480px; margin: auto; background: #ffffff; padding: 25px; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
    
    <h2 style="text-align: center; color: #333;">Form Status Updated</h2>
    
    <p>Hi <b>${teamLeadName}</b>,</p>
    <p>The form <b>"${formTitle}"</b> has been updated by Manager <b>${managerName}</b>.</p>
    
    <div style="margin: 20px 0; padding: 15px; background: #f0f4ff; border-left: 4px solid #007bff; border-radius: 8px;">
      <p><strong>Status:</strong> ${status}</p>
      <p><strong>Comments:</strong> ${comments || "No comments provided."}</p>
    </div>

  

    <p style="margin-top: 25px; font-size: 12px; color: #777; text-align:center;">
      This is an automated notification. Please do not reply to this email.
    </p>
  </div>
</div>
`;
