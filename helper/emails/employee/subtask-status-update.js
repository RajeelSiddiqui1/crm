function subtaskStatusUpdateMailTemplate(recipientName, subtaskTitle, updaterName, status, feedback) {
  return `
    <div style="font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5;">
      <div style="max-width: 480px; margin: auto; background: #ffffff; padding: 25px; border-radius: 10px;">
        
        <h2 style="text-align: center; color: #333;">Subtask Status Update</h2>
        <p>Hi <b>${recipientName}</b>,</p>
        <p>The subtask "<b>${subtaskTitle}</b>" has been updated by <b>${updaterName}</b>.</p>
        
        <div style="
          font-size: 18px; 
          text-align: center; 
          font-weight: bold; 
          margin: 15px 0; 
          background: #f0f0f0; 
          padding: 12px; 
          border-radius: 8px;">
          Status: ${status}
        </div>

        ${feedback ? `
        <p><b>Feedback:</b> ${feedback}</p>
        ` : ''}

        <div style="text-align: center; margin-top: 20px;">
          <a href="${process.env.NEXT_PUBLIC_DOMAIN}/teamlead/subtasks"
            style="
              background: #4a6cf7;
              color: white;
              padding: 12px 25px;
              border-radius: 6px;
              text-decoration: none;
              font-size: 14px;">
            View Subtask
          </a>
        </div>

        <p style="margin-top: 25px; font-size: 12px; color: #777; text-align:center;">
          If you did not expect this update, you can ignore this email.
        </p>
      </div>
    </div>
  `;
}

function subtaskFeedbackMailTemplate(recipientName, subtaskTitle, updaterName, feedback) {
  return `
    <div style="font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5;">
      <div style="max-width: 480px; margin: auto; background: #ffffff; padding: 25px; border-radius: 10px;">
        
        <h2 style="text-align: center; color: #333;">New Feedback Received</h2>
        <p>Hi <b>${recipientName}</b>,</p>
        <p>New feedback has been submitted for subtask "<b>${subtaskTitle}</b>" by <b>${updaterName}</b>.</p>
        
        <div style="
          margin: 20px 0; 
          background: #f8f9fa; 
          padding: 15px; 
          border-radius: 8px;
          border-left: 4px solid #4a6cf7;">
          <p style="margin: 0; font-size: 14px; color: #333;"><b>Feedback:</b></p>
          <p style="margin: 10px 0 0 0; font-size: 14px; color: #555;">${feedback}</p>
        </div>

        <div style="text-align: center; margin-top: 20px;">
          <a href="${process.env.NEXT_PUBLIC_DOMAIN}/teamlead/subtasks"
            style="
              background: #4a6cf7;
              color: white;
              padding: 12px 25px;
              border-radius: 6px;
              text-decoration: none;
              font-size: 14px;">
            View Subtask Details
          </a>
        </div>

        <p style="margin-top: 25px; font-size: 12px; color: #777; text-align:center;">
          This feedback was submitted by the employee working on the subtask.
        </p>
      </div>
    </div>
  `;
}

export { subtaskStatusUpdateMailTemplate, subtaskFeedbackMailTemplate };