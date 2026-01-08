export const subtaskStatusUpdateMailTemplate = (
  recipientName = "Team Lead",
  taskTitle = "Task",
  managerName = "Manager",
  newStatus = "pending",
  feedback = ""
) => {

  // 🔒 SAFETY FIRST
  const safeManagerName =
    typeof managerName === "string" && managerName.trim()
      ? managerName.trim()
      : "Manager";

  const managerInitial = safeManagerName.charAt(0).toUpperCase();

  const statusColors = {
    pending: "#F59E0B",
    in_progress: "#3B82F6",
    completed: "#10B981",
    rejected: "#EF4444"
  };

  const statusText = {
    pending: "Pending",
    in_progress: "In Progress",
    completed: "Completed",
    rejected: "Rejected"
  };

  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Task Status Updated</title>

<style>
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background-color: #F9FAFB;
  margin: 0;
  padding: 0;
  color: #374151;
}
.container {
  max-width: 600px;
  margin: 0 auto;
  background: #FFFFFF;
  border-radius: 12px;
  overflow: hidden;
}
.header {
  background: linear-gradient(135deg, #7C3AED, #5B21B6);
  color: #fff;
  padding: 32px;
  text-align: center;
}
.content {
  padding: 32px;
}
.status-badge {
  display: inline-block;
  padding: 8px 18px;
  border-radius: 20px;
  font-weight: 600;
  color: #fff;
  background: ${statusColors[newStatus] || "#6B7280"};
}
.task-card {
  background: #F3F4F6;
  padding: 24px;
  border-radius: 12px;
  margin-top: 24px;
  border-left: 4px solid #7C3AED;
}
.manager-info {
  display: flex;
  align-items: center;
  gap: 16px;
  background: #F8FAFC;
  padding: 16px;
  border-radius: 10px;
  margin: 24px 0;
}
.avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #7C3AED, #5B21B6);
  color: #fff;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}
.button {
  display: inline-block;
  margin-top: 28px;
  padding: 14px 32px;
  background: linear-gradient(135deg, #7C3AED, #5B21B6);
  color: #fff;
  text-decoration: none;
  border-radius: 8px;
  font-weight: 600;
}
.footer {
  text-align: center;
  padding: 20px;
  font-size: 14px;
  color: #6B7280;
  border-top: 1px solid #E5E7EB;
}
</style>
</head>

<body>
<div class="container">

  <div class="header">
    <h1>📋 Task Status Updated</h1>
    <p>A manager has updated their task status</p>
  </div>

  <div class="content">
    <h2>Hello ${recipientName},</h2>

    <p>A manager has updated their assigned task status.</p>

    <div class="manager-info">
      <div class="avatar">${managerInitial}</div>
      <div>
        <h3 style="margin:0;">${safeManagerName}</h3>
        <p style="margin:4px 0 0; color:#6B7280;">Manager</p>
      </div>
    </div>

    <div class="task-card">
      <h3 style="margin-top:0;">${taskTitle}</h3>

      <div class="status-badge">
        New Status: ${statusText[newStatus] || newStatus}
      </div>

      ${
        feedback
          ? `
        <div style="margin-top:16px;">
          <h4 style="margin-bottom:8px;">Manager Feedback</h4>
          <p style="background:#FEF3C7;padding:12px;border-radius:8px;border-left:3px solid #D97706;">
            ${feedback}
          </p>
        </div>`
          : ""
      }
    </div>

    <div style="text-align:center;">
      <a href="${process.env.NEXT_PUBLIC_DOMAIN}/teamlead/subtasks" class="button">
        View Task Dashboard
      </a>
    </div>

    <p style="margin-top:32px;color:#6B7280;">
      This is an automated notification. Please do not reply.
    </p>
  </div>

  <div class="footer">
    © ${new Date().getFullYear()} Task Management System
  </div>

</div>
</body>
</html>
`;
};
