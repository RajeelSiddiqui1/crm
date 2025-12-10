export function operationTaskUpdateMailTemplate(employeeName, taskTitle, teamLeadName, taskLink, VendorStatus, MachineStatus) {
  return `
    <div style="font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5;">
      <div style="max-width: 480px; margin: auto; background: #ffffff; padding: 25px; border-radius: 10px;">
        <h2 style="text-align: center; color: #333;">Task Updated by Employee</h2>
        <p>Hi <b>${teamLeadName}</b>,</p>
        <p>The employee <b>${employeeName}</b> has updated the operation task: <strong>${taskTitle}</strong>.</p>
        <p>Vendor Status: <b>${VendorStatus || "No change"}</b></p>
        <p>Machine Status: <b>${MachineStatus || "No change"}</b></p>

        

        <p style="font-size: 12px; color: #777; text-align:center;">
          This is an automated notification. Please do not reply.
        </p>
      </div>
    </div>
  `;
}
