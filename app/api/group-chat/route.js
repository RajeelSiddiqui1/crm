import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/db";
import { authOptions } from "@/lib/auth";
import GroupChat from "@/models/GroupChat";
import FormSubmission from "@/models/FormSubmission";
import Admin from "@/models/Admin";
import Manager from "@/models/Manager";
import TeamLead from "@/models/TeamLead";
import Employee from "@/models/Employee";
import { sendNotification } from "@/lib/sendNotification";
import { sendMail } from "@/lib/mail";

// --- Email Template ---
export function newGroupChatEmailTemplate({
  recipientName,
  chatName,
  taskTitle,
  link,
  senderName,
}) {
  return `
    <div style="font-family: 'Segoe UI', sans-serif; padding: 20px; background: linear-gradient(135deg, #667eea, #764ba2);">
      <div style="max-width: 480px; margin: auto; background: #fff; padding: 30px; border-radius: 16px;">
        <h2>New Group Chat</h2>
        <p>Hi <strong>${recipientName}</strong>,</p>
        <p><strong>${senderName}</strong> has created a new group chat for the task: <strong>${taskTitle}</strong>.</p>
        <a href="${link}" style="display:inline-block; padding:12px 30px; background:#4a6cf7; color:#fff; border-radius:50px; text-decoration:none;">Join Chat</a>
        <p style="margin-top:20px; font-size:12px; color:#777;">Automated notification from Team Collaboration Platform.</p>
      </div>
    </div>
  `;
}

// --- Helpers ---
async function getUserByEmail(email) {
  if (!email) return null;
  const normalizedEmail = email.toLowerCase().trim();
  return (
    (await Admin.findOne({ email: normalizedEmail })) ||
    (await Manager.findOne({ email: normalizedEmail })) ||
    (await TeamLead.findOne({ email: normalizedEmail })) ||
    (await Employee.findOne({ email: normalizedEmail }))
  );
}

function getUserName(user) {
  return user.firstName && user.lastName
    ? `${user.firstName} ${user.lastName}`
    : user.name || user.email.split("@")[0];
}

function getUserRole(user) {
  const map = {
    Admin: "Admin",
    Manager: "Manager",
    TeamLead: "TeamLead",
    Employee: "Employee",
  };
  return map[user.constructor.modelName] || "User";
}

// --- Access Control ---
async function checkUserAccessToSubmission(submissionId, user) {
  if (!user || !submissionId) return false;
  const submission = await FormSubmission.findById(submissionId).lean();
  if (!submission) return false;

  const role = user.role;
  const userIdStr = user.id.toString();

  if (role === "Admin") return true;
  if (role === "Manager") {
    if (submission.submittedBy?.toString() === userIdStr) return true;
    if (
      submission.multipleManagerShared
        ?.map((id) => id.toString())
        .includes(userIdStr)
    )
      return true;
  }
  if (role === "TeamLead") {
    // Normalize assignedTo and multipleTeamLeadShared as arrays
    const assignedToArray = Array.isArray(submission.assignedTo)
      ? submission.assignedTo
      : submission.assignedTo
      ? [submission.assignedTo]
      : [];

    const sharedTLArray = Array.isArray(submission.multipleTeamLeadShared)
      ? submission.multipleTeamLeadShared
      : submission.multipleTeamLeadShared
      ? [submission.multipleTeamLeadShared]
      : [];

    const assignedToIds = assignedToArray.map((id) => id.toString());
    const sharedTLIds = sharedTLArray.map((id) => id.toString());

    if (assignedToIds.includes(userIdStr) || sharedTLIds.includes(userIdStr))
      return true;
  }

  if (role === "Employee") {
    const assignedEmployeeIds =
      submission.assignedEmployees?.map((e) => e.employeeId.toString()) || [];
    if (assignedEmployeeIds.includes(userIdStr)) return true;
  }

  return false;
}

// --- Get Participants ---
async function getUniqueParticipants(submission, currentUserEmail) {
  const participants = new Map();

  const currentUser = await getUserByEmail(currentUserEmail);
  if (currentUser)
    participants.set(currentUser.email.toLowerCase(), {
      userId: currentUser._id,
      userModel: currentUser.constructor.modelName,
      email: currentUser.email,
      name: getUserName(currentUser),
      role: getUserRole(currentUser),
      department: currentUser.department,
    });

  // submittedBy
  if (submission.submittedBy) {
    const manager = await Manager.findById(submission.submittedBy);
    if (
      manager &&
      manager.email.toLowerCase() !== currentUserEmail.toLowerCase()
    ) {
      participants.set(manager.email.toLowerCase(), {
        userId: manager._id,
        userModel: "Manager",
        email: manager.email,
        name: getUserName(manager),
        role: "Manager",
        department: manager.department,
      });
    }
  }

  // multipleManagerShared
  if (submission.multipleManagerShared?.length) {
    const managers = await Manager.find({
      _id: { $in: submission.multipleManagerShared },
    });
    managers.forEach((m) => {
      if (m.email.toLowerCase() !== currentUserEmail.toLowerCase()) {
        participants.set(m.email.toLowerCase(), {
          userId: m._id,
          userModel: "Manager",
          email: m.email,
          name: getUserName(m),
          role: "Manager",
          department: m.department,
        });
      }
    });
  }

  // assignedTo TeamLeads
  if (submission.assignedTo?.length) {
    const teamLeads = await TeamLead.find({
      _id: { $in: submission.assignedTo },
    });
    teamLeads.forEach((tl) => {
      if (tl.email.toLowerCase() !== currentUserEmail.toLowerCase()) {
        participants.set(tl.email.toLowerCase(), {
          userId: tl._id,
          userModel: "TeamLead",
          email: tl.email,
          name: getUserName(tl),
          role: "TeamLead",
          department: tl.department,
        });
      }
    });
  }

  // multipleTeamLeadShared
  if (submission.multipleTeamLeadShared?.length) {
    const sharedTLs = await TeamLead.find({
      _id: { $in: submission.multipleTeamLeadShared },
    });
    sharedTLs.forEach((tl) => {
      if (tl.email.toLowerCase() !== currentUserEmail.toLowerCase()) {
        participants.set(tl.email.toLowerCase(), {
          userId: tl._id,
          userModel: "TeamLead",
          email: tl.email,
          name: getUserName(tl),
          role: "TeamLead",
          department: tl.department,
        });
      }
    });
  }

  // assignedEmployees
  if (submission.assignedEmployees?.length) {
    const empIds = submission.assignedEmployees.map((e) => e.employeeId);
    const employees = await Employee.find({ _id: { $in: empIds } });
    employees.forEach((emp) => {
      if (emp.email.toLowerCase() !== currentUserEmail.toLowerCase()) {
        participants.set(emp.email.toLowerCase(), {
          userId: emp._id,
          userModel: "Employee",
          email: emp.email,
          name: getUserName(emp),
          role: "Employee",
          department: emp.department,
        });
      }
    });
  }

  // Admins
  const admins = await Admin.find({});
  admins.forEach((a) => {
    if (a.email.toLowerCase() !== currentUserEmail.toLowerCase()) {
      participants.set(a.email.toLowerCase(), {
        userId: a._id,
        userModel: "Admin",
        email: a.email,
        name: getUserName(a),
        role: "Admin",
        department: a.department,
      });
    }
  });

  return Array.from(participants.values());
}

// --- POST: Create/Get Chat ---
export async function POST(req) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session?.user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { submissionId } = await req.json();
    if (!submissionId)
      return NextResponse.json(
        { error: "Submission ID required" },
        { status: 400 }
      );

    const hasAccess = await checkUserAccessToSubmission(
      submissionId,
      session.user
    );
    if (!hasAccess)
      return NextResponse.json({ error: "Access denied" }, { status: 403 });

    let submission = await FormSubmission.findById(submissionId)
      .populate("formId", "title description")
      .lean();
    if (!submission)
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );

    // Existing chat
    let groupChat = await GroupChat.findOne({ submissionId }).populate(
      "participants.userId"
    );
    if (!groupChat) {
      const participants = await getUniqueParticipants(
        submission,
        session.user.email
      );
      groupChat = new GroupChat({
        submissionId,
        participants: participants.map((p) => ({
          ...p,
          joinedAt: new Date(),
          isActive: true,
        })),
        messages: [],
        lastActivity: new Date(),
        isActive: true,
      });
      await groupChat.save();

      // Send notifications & emails
      const taskTitle =
        submission.formId?.title || submission.clinetName || "Task";
      const chatName = `${taskTitle} Discussion`;
      const chatLink = `${process.env.NEXT_PUBLIC_BASE_URL}/group-chat?submissionId=${submissionId}`;
      const senderName =
        session.user.name || session.user.firstName || "A team member";

      await Promise.allSettled(
        participants.map(async (p) => {
          if (p.email.toLowerCase() === session.user.email.toLowerCase())
            return;
          try {
            await sendNotification({
              senderId: session.user.id,
              senderModel: session.user.role,
              senderName,
              receiverId: p.userId,
              receiverModel: p.userModel,
              type: "new_group_chat",
              title: "New Group Chat Created",
              message: `You have been added to the group chat: ${chatName}`,
              link: chatLink,
              referenceId: groupChat._id,
              referenceModel: "GroupChat",
            });
            await sendMail(
              p.email,
              `📢 New Group Chat: ${chatName}`,
              newGroupChatEmailTemplate({
                recipientName: p.name,
                chatName,
                taskTitle,
                link: chatLink,
                senderName,
              })
            );
          } catch (err) {
            console.error(`Notify failed for ${p.email}:`, err);
          }
        })
      );
    }

    const populatedChat = await GroupChat.findById(groupChat._id)
      .populate({
        path: "participants.userId",
        select: "firstName lastName email department phone profileImage",
      })
      .populate({
        path: "messages.senderId",
        select: "firstName lastName email department profileImage",
      })
      .lean();

    return NextResponse.json({ success: true, chat: populatedChat });
  } catch (err) {
    console.error("Group Chat POST error:", err);
    return NextResponse.json(
      { error: "Failed", details: err.message },
      { status: 500 }
    );
  }
}

// --- GET: Fetch Chat ---
export async function GET(req) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session?.user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const submissionId = searchParams.get("submissionId");
    if (!submissionId)
      return NextResponse.json(
        { error: "Submission ID required" },
        { status: 400 }
      );

    const hasAccess = await checkUserAccessToSubmission(
      submissionId,
      session.user
    );
    if (!hasAccess)
      return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const groupChat = await GroupChat.findOne({ submissionId })
      .populate({
        path: "participants.userId",
        select: "firstName lastName email department phone profileImage",
      })
      .populate({
        path: "messages.senderId",
        select: "firstName lastName email department profileImage",
      })
      .populate("messages.replyTo")
      .sort({ "messages.createdAt": 1 })
      .lean();

    if (!groupChat)
      return NextResponse.json(
        { error: "Group chat not found" },
        { status: 404 }
      );

    return NextResponse.json({ success: true, chat: groupChat });
  } catch (err) {
    console.error("Group Chat GET error:", err);
    return NextResponse.json(
      { error: "Failed to fetch", details: err.message },
      { status: 500 }
    );
  }
}
