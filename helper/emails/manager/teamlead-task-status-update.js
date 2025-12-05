

// helper/emails/manager/teamlead-task-status-update.js
export function managerTeamLeadTaskStatusUpdateMailTemplate(teamLeadName, employeeName, taskTitle, updatedBy, status, taskLink, feedback = "No feedback") {
  return `
  <html>
  <body>
    <h2>Hello ${teamLeadName},</h2>
    <p>Manager ${updatedBy} updated the submission of "${employeeName}" for task "${taskTitle}".</p>
    <p>Status: ${status}</p>
    <p>Feedback: ${feedback}</p>
    <a href="${taskLink}">View Submission</a>
  </body>
  </html>
  `;
}
