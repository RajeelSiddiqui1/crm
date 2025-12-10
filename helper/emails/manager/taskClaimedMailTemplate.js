export function taskClaimedMailTemplate(managerName, teamLeadName, taskTitle, claimDate) {
  return `
    <div style="font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5;">
      <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 10px; overflow: hidden;">
        
        <div style="background: #10b981; color: white; padding: 30px; text-align: center;">
          <h1>🎯 Task Claimed Successfully</h1>
        </div>
        
        <div style="padding: 30px;">
          <h2>Hello ${managerName},</h2>
          <p>One of your submitted tasks has been claimed by <b>${teamLeadName}</b>.</p>
          
          <div style="
            background: #f0fdf4;
            border: 1px solid #bbf7d0;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;">
            <h3>📋 Task Details</h3>
            <p><b>Task Title:</b> ${taskTitle}</p>
            <p><b>Claimed By:</b> ${teamLeadName}</p>
            <p><b>Claim Date:</b> ${claimDate}</p>
            <p><b>New Status:</b> In Progress</p>
          </div>
          
          <p>The team lead will start working on this task and assign it to their employees. Track progress from your dashboard.</p>
          
          <h4>Next Steps:</h4>
          <ol>
            <li>Team lead will assign tasks to employees</li>
            <li>Employees complete their tasks</li>
            <li>Team lead submits completed tasks for your review</li>
            <li>You approve or request changes</li>
          </ol>

          <p style="margin-top: 20px; font-size: 12px; color: #777;">
            This is an automated notification. Please do not reply to this email.
          </p>
        </div>
      </div>
    </div>
  `;
}
