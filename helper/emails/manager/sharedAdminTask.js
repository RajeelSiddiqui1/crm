export function taskClaimedMailTemplate(managerName, taskTitle, assignedManagers, assignedBy) {
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const managerList = assignedManagers.map(m =>
    `<li style="margin-bottom: 8px; padding: 10px; background: #f0f0f0; border-radius: 8px;">
       <strong>${m.name}</strong> - ${m.email}
     </li>`).join('');

  return `
    <div style="font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5;">
      <div style="max-width: 480px; margin: auto; background: #ffffff; padding: 25px; border-radius: 10px;">
        
        <h2 style="text-align: center; color: #4a6cf7;">Task Successfully Assigned</h2>
        
        <p>Hi <b>${managerName}</b>,</p>
        <p>Your task <b>"${taskTitle}"</b> has been shared with ${assignedManagers.length} manager${assignedManagers.length > 1 ? 's' : ''}.</p>
        
        <div style="
          background: #f0f0f0;
          padding: 15px;
          border-radius: 8px;
          margin: 20px 0;">
          <p><b>Assigned By:</b> ${assignedBy.name} (${assignedBy.email})</p>
          <p><b>Assigned Date:</b> ${currentDate}</p>
        </div>

        <h4>Assigned Managers:</h4>
        <ul style="padding-left: 20px; margin-top: 10px;">
          ${managerList}
        </ul>

        
        <p style="margin-top: 25px; font-size: 12px; color: #777; text-align:center;">
          This is an automated notification. Please do not reply to this email.
        </p>
        
      </div>
    </div>
  `;
}
