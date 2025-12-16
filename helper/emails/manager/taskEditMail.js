export function taskEditedMailTemplate(recipientName, submissionTitle, updatedBy, submissionLink) {
  return `
    <div style="font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5;">
      <div style="max-width: 480px; margin: auto; background: #ffffff; padding: 25px; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        
        <h2 style="text-align: center; color: #333;">Task Updated</h2>
        
        <p>Hi <b>${recipientName}</b>,</p>
        <p>The submission <strong>${submissionTitle}</strong> has been updated by <strong>${updatedBy}</strong>.</p>
        
        <div style="text-align: center; margin: 25px 0;">
          <a href="${submissionLink}" 
             style="
                background: #4a6cf7;
                color: white;
                padding: 12px 25px;
                border-radius: 6px;
                text-decoration: none;
                font-size: 14px;
                font-weight: bold;">
            View Submission
          </a>
        </div>

        <p style="margin-top: 20px; font-size: 12px; color: #777; text-align:center;">
          This is an automated notification. Do not reply.
        </p>
      </div>
    </div>
  `;
}
