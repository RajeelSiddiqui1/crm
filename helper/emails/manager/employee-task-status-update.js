// helper/emails/manager/employee-task-status-update.js
export function managerEmployeeTaskStatusUpdateMailTemplate(employeeName, taskTitle, updatedBy, status, taskLink, feedback = "No feedback") {
  return `
  <html>
  <body>
    <h2>Hello ${employeeName},</h2>
    <p>Manager ${updatedBy} updated your submission for task "${taskTitle}".</p>
    <p>Status: ${status}</p>
    <p>Feedback: ${feedback}</p>
    <a href="${taskLink}">View Submission</a>
  </body>
  </html>
  `;
}
