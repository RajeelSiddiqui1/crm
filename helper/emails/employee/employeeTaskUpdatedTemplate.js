export function employeeTaskUpdatedTemplate(name, title) {
  return `
    <div style="font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5;">
      <div style="max-width: 480px; margin: auto; background: #ffffff; padding: 25px; border-radius: 10px;">

        <h2 style="text-align: center; color: #333;">Task Updated</h2>
        
        <p>Hi <b>${name}</b>,</p>
        <p>The task <b>${title}</b> has been updated by the employee.</p>

     

        <p style="margin-top: 25px; font-size: 12px; color: #777; text-align:center;">
          If you did not expect this update, please contact the employee.
        </p>
      </div>
    </div>
  `;
}
