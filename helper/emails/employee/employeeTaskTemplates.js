export function employeeTaskCreatedTemplate(name, title, description) {
  return `
    <div style="font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5;">
      <div style="max-width: 480px; margin: auto; background: #ffffff; padding: 25px; border-radius: 10px;">
        
        <h2 style="text-align: center; color: #333;">New Task Assigned</h2>
        
        <p>Hi <b>${name}</b>,</p>
        <p>A new task has been created by your employee:</p>

        <div style="background: #f0f0f0; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: #4a6cf7;">${title}</h3>
          <p style="margin: 0; color: #555;">${description}</p>
        </div>

        <p style="text-align:center; font-size: 14px; color: #333;">
          Please review and update your status or provide feedback as needed.
        </p>

      

        <p style="margin-top: 25px; font-size: 12px; color: #777; text-align:center;">
          If you did not expect this task, please contact your employee.
        </p>
      </div>
    </div>
  `;
}
