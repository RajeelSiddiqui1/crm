// helper/emails/teamlead/employee-removed-from-task.js
export function sendEmployeeRemovedFromTaskMail({ name, formTitle, removedBy, taskId }) {
  return `
  <div style="font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5;">
    <div style="max-width: 480px; margin: auto; background: #ffffff; padding: 25px; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">

      <h2 style="text-align: center; color: #ef4444;">⚠️ Task Assignment Update</h2>
      <p>Hi <b>${name}</b>,</p>
      <p>You have been removed from the task <b>"${formTitle}"</b> by <b>${removedBy}</b>.</p>

     

      <p style="text-align:center; color: #555;">
        If you think this was a mistake, please contact your Team Lead.
      </p>

      <p style="margin-top:25px; font-size:12px; color:#777; text-align:center;">
        This is an automated notification. No reply is needed.
      </p>

    </div>
  </div>
  `;
}
