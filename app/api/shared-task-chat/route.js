import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import SharedTaskChat from "@/models/SharedTaskChat";
import SharedTask from "@/models/SharedTask";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import { sendNotification } from "@/lib/sendNotification";
import { sendMail } from "@/lib/mail";
import Admin from "@/models/Admin";
import Manager from "@/models/Manager";
import TeamLead from "@/models/TeamLead";
import Employee from "@/models/Employee";
import FormSubmission from "@/models/FormSubmission";

// Email template for shared task chat
export function newSharedTaskChatEmailTemplate({ recipientName, taskTitle, link, senderName }) {
  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
      <div style="max-width: 480px; margin: 30px auto; background: white; padding: 40px; border-radius: 16px; box-shadow: 0 20px 40px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #4a6cf7, #6c8bff); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="white">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
            </svg>
          </div>
          <h1 style="color: #333; margin: 0; font-size: 28px; font-weight: 700;">New Task Chat</h1>
        </div>
        
        <div style="background: #f8f9ff; border-radius: 12px; padding: 25px; margin-bottom: 30px; border-left: 4px solid #4a6cf7;">
          <p style="color: #555; line-height: 1.6; margin: 0 0 15px 0;">
            Hi <strong style="color: #333;">${recipientName}</strong>,
          </p>
          <p style="color: #555; line-height: 1.6; margin: 0;">
            <strong style="color: #4a6cf7;">${senderName}</strong> has created a new chat for the shared task: 
            <strong style="color: #333;">${taskTitle}</strong>
          </p>
        </div>
        
        <div style="text-align: center;">
          <a href="${link}" style="background: linear-gradient(135deg, #4a6cf7, #6c8bff); color: white; padding: 16px 40px; border-radius: 50px; text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block; transition: all 0.3s; box-shadow: 0 5px 15px rgba(74, 108, 247, 0.3);">
            Open Task Chat
          </a>
          <p style="color: #999; font-size: 14px; margin-top: 20px;">
            Click the button above to access the task chat and start collaborating.
          </p>
        </div>
        
        <div style="border-top: 1px solid #eee; margin-top: 30px; padding-top: 20px; text-align: center;">
          <p style="color: #777; font-size: 12px; margin: 0;">
            This is an automated notification from Task Collaboration Platform.
          </p>
        </div>
      </div>
    </div>
  `;
}

// Helper functions
async function getSharedTaskParticipants(sharedTask, currentUserEmail) {
  const participants = new Map();
  
  // Add current user
  const currentUser = await getUserByEmail(currentUserEmail);
  if (currentUser) {
    participants.set(currentUser.email.toLowerCase(), {
      userId: currentUser._id,
      userModel: currentUser.constructor.modelName,
      email: currentUser.email,
      name: getUserName(currentUser),
      role: getUserRole(currentUser),
      department: currentUser.department
    });
  }

  // Add sharedBy (Manager who shared the task)
  if (sharedTask.sharedBy) {
    const sharedByManager = await Manager.findById(sharedTask.sharedBy);
    if (sharedByManager && sharedByManager.email?.toLowerCase() !== currentUserEmail.toLowerCase()) {
      participants.set(sharedByManager.email.toLowerCase(), {
        userId: sharedByManager._id,
        userModel: 'Manager',
        email: sharedByManager.email,
        name: `${sharedByManager.firstName} ${sharedByManager.lastName}`,
        role: 'Manager',
        department: sharedByManager.department
      });
    }
  }

  // Add sharedManager
  if (sharedTask.sharedManager) {
    const sharedManager = await Manager.findById(sharedTask.sharedManager);
    if (sharedManager && sharedManager.email?.toLowerCase() !== currentUserEmail.toLowerCase()) {
      participants.set(sharedManager.email.toLowerCase(), {
        userId: sharedManager._id,
        userModel: 'Manager',
        email: sharedManager.email,
        name: `${sharedManager.firstName} ${sharedManager.lastName}`,
        role: 'Manager',
        department: sharedManager.department
      });
    }
  }

  // Add sharedTeamlead
  if (sharedTask.sharedTeamlead) {
    const sharedTeamlead = await TeamLead.findById(sharedTask.sharedTeamlead);
    if (sharedTeamlead && sharedTeamlead.email?.toLowerCase() !== currentUserEmail.toLowerCase()) {
      participants.set(sharedTeamlead.email.toLowerCase(), {
        userId: sharedTeamlead._id,
        userModel: 'TeamLead',
        email: sharedTeamlead.email,
        name: `${sharedTeamlead.firstName} ${sharedTeamlead.lastName}`,
        role: 'TeamLead',
        department: sharedTeamlead.department
      });
    }
  }

  // Add sharedEmployee
  if (sharedTask.sharedEmployee) {
    const sharedEmployee = await Employee.findById(sharedTask.sharedEmployee);
    if (sharedEmployee && sharedEmployee.email?.toLowerCase() !== currentUserEmail.toLowerCase()) {
      participants.set(sharedEmployee.email.toLowerCase(), {
        userId: sharedEmployee._id,
        userModel: 'Employee',
        email: sharedEmployee.email,
        name: `${sharedEmployee.firstName} ${sharedEmployee.lastName}`,
        role: 'Employee',
        department: sharedEmployee.department
      });
    }
  }

  // Add sharedOperationTeamlead
  if (sharedTask.sharedOperationTeamlead) {
    const operationTeamlead = await TeamLead.findById(sharedTask.sharedOperationTeamlead);
    if (operationTeamlead && operationTeamlead.email?.toLowerCase() !== currentUserEmail.toLowerCase()) {
      participants.set(operationTeamlead.email.toLowerCase(), {
        userId: operationTeamlead._id,
        userModel: 'TeamLead',
        email: operationTeamlead.email,
        name: `${operationTeamlead.firstName} ${operationTeamlead.lastName}`,
        role: 'TeamLead',
        department: operationTeamlead.department
      });
    }
  }

  // Add sharedOperationEmployee
  if (sharedTask.sharedOperationEmployee) {
    const operationEmployee = await Employee.findById(sharedTask.sharedOperationEmployee);
    if (operationEmployee && operationEmployee.email?.toLowerCase() !== currentUserEmail.toLowerCase()) {
      participants.set(operationEmployee.email.toLowerCase(), {
        userId: operationEmployee._id,
        userModel: 'Employee',
        email: operationEmployee.email,
        name: `${operationEmployee.firstName} ${operationEmployee.lastName}`,
        role: 'Employee',
        department: operationEmployee.department
      });
    }
  }

  // Get original task submission to add more participants
  if (sharedTask.formId) {
    const submission = await FormSubmission.findById(sharedTask.formId)
      .populate("submittedBy", "firstName lastName email department")
      .lean();

    if (submission) {
      // Add submittedBy manager
      if (submission.submittedBy) {
        const submittedByManager = submission.submittedBy;
        if (submittedByManager.email?.toLowerCase() !== currentUserEmail.toLowerCase()) {
          participants.set(submittedByManager.email.toLowerCase(), {
            userId: submittedByManager._id,
            userModel: 'Manager',
            email: submittedByManager.email,
            name: `${submittedByManager.firstName} ${submittedByManager.lastName}`,
            role: 'Manager',
            department: submittedByManager.department
          });
        }
      }

      // Add assigned team leads from original submission
      if (submission.assignedTo?.length > 0) {
        const teamLeads = await TeamLead.find({ 
          _id: { $in: submission.assignedTo } 
        });
        
        teamLeads.forEach(teamLead => {
          if (teamLead.email?.toLowerCase() !== currentUserEmail.toLowerCase()) {
            participants.set(teamLead.email.toLowerCase(), {
              userId: teamLead._id,
              userModel: 'TeamLead',
              email: teamLead.email,
              name: `${teamLead.firstName} ${teamLead.lastName}`,
              role: 'TeamLead',
              department: teamLead.department
            });
          }
        });
      }

      // Add assigned employees from original submission
      if (submission.assignedEmployees?.length > 0) {
        const employeeIds = submission.assignedEmployees.map(emp => emp.employeeId);
        const employees = await Employee.find({ 
          _id: { $in: employeeIds } 
        });
        
        employees.forEach(employee => {
          if (employee.email?.toLowerCase() !== currentUserEmail.toLowerCase()) {
            participants.set(employee.email.toLowerCase(), {
              userId: employee._id,
              userModel: 'Employee',
              email: employee.email,
              name: `${employee.firstName} ${employee.lastName}`,
              role: 'Employee',
              department: employee.department
            });
          }
        });
      }
    }
  }

  // Add all admins for oversight
  const admins = await Admin.find({});
  admins.forEach(admin => {
    if (admin.email?.toLowerCase() !== currentUserEmail.toLowerCase()) {
      participants.set(admin.email.toLowerCase(), {
        userId: admin._id,
        userModel: 'Admin',
        email: admin.email,
        name: admin.name || admin.email,
        role: 'Admin',
        department: admin.department
      });
    }
  });

  return Array.from(participants.values());
}

async function getUserByEmail(email) {
  if (!email) return null;
  
  const normalizedEmail = email.toLowerCase().trim();
  
  const admin = await Admin.findOne({ email: normalizedEmail });
  if (admin) return admin;
  
  const manager = await Manager.findOne({ email: normalizedEmail });
  if (manager) return manager;
  
  const teamLead = await TeamLead.findOne({ email: normalizedEmail });
  if (teamLead) return teamLead;
  
  const employee = await Employee.findOne({ email: normalizedEmail });
  return employee;
}

function getUserName(user) {
  if (user.firstName && user.lastName) {
    return `${user.firstName} ${user.lastName}`;
  }
  if (user.name) return user.name;
  if (user.email) return user.email.split('@')[0];
  return 'User';
}

function getUserRole(user) {
  const modelName = user.constructor.modelName;
  switch (modelName) {
    case 'Admin': return 'Admin';
    case 'Manager': return 'Manager';
    case 'TeamLead': return 'Team Lead';
    case 'Employee': return 'Employee';
    default: return 'User';
  }
}

// Check user access to shared task
async function checkUserAccessToSharedTask(sharedTaskId, user) {
  if (!user || !sharedTaskId) return false;
  
  const sharedTask = await SharedTask.findById(sharedTaskId).lean();
  if (!sharedTask) return false;
  
  const userModel = user.role;
  const userId = user.id;
  
  // Admin can access all shared tasks
  if (userModel === 'Admin') {
    return true;
  }
  
  // Manager checks
  if (userModel === 'Manager') {
    // Check if manager shared the task
    if (sharedTask.sharedBy?.toString() === userId) {
      return true;
    }
    
    // Check if manager is the sharedManager
    if (sharedTask.sharedManager?.toString() === userId) {
      return true;
    }
    
    // Get original submission to check department access
    if (sharedTask.formId) {
      const submission = await FormSubmission.findById(sharedTask.formId).lean();
      if (submission && submission.department) {
        const manager = await Manager.findById(userId);
        if (manager && manager.department === submission.department) {
          return true;
        }
      }
    }
  }
  
  // Team Lead checks
  if (userModel === 'TeamLead') {
    // Check if team lead is sharedTeamlead
    if (sharedTask.sharedTeamlead?.toString() === userId) {
      return true;
    }
    
    // Check if team lead is sharedOperationTeamlead
    if (sharedTask.sharedOperationTeamlead?.toString() === userId) {
      return true;
    }
  }
  
  // Employee checks
  if (userModel === 'Employee') {
    // Check if employee is sharedEmployee
    if (sharedTask.sharedEmployee?.toString() === userId) {
      return true;
    }
    
    // Check if employee is sharedOperationEmployee
    if (sharedTask.sharedOperationEmployee?.toString() === userId) {
      return true;
    }
  }
  
  return false;
}

// Create or get shared task chat
export async function POST(req) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sharedTaskId } = await req.json();

    if (!sharedTaskId) {
      return NextResponse.json({ error: "Shared Task ID required" }, { status: 400 });
    }

    // Check if user has access to this shared task
    const hasAccess = await checkUserAccessToSharedTask(sharedTaskId, session.user);
    if (!hasAccess) {
      return NextResponse.json({ 
        error: "Access denied",
        message: "You don't have permission to access this shared task" 
      }, { status: 403 });
    }

    // Fetch shared task
    const sharedTask = await SharedTask.findById(sharedTaskId).lean();

    if (!sharedTask) {
      return NextResponse.json({ error: "Shared task not found" }, { status: 404 });
    }

    // Check if chat exists
    let sharedTaskChat = await SharedTaskChat.findOne({ sharedTaskId })
      .populate('participants.userId');

    if (!sharedTaskChat) {
      // Get participants based on shared task
      const participants = await getSharedTaskParticipants(sharedTask, session.user.email);
      
      // Create shared task chat
      sharedTaskChat = new SharedTaskChat({
        sharedTaskId,
        taskTitle: sharedTask.taskTitle,
        taskDescription: sharedTask.taskDescription || '',
        participants: participants.map(p => ({
          userId: p.userId,
          userModel: p.userModel,
          email: p.email,
          name: p.name,
          role: p.role,
          department: p.department,
          joinedAt: new Date(),
          isActive: true
        })),
        messages: [],
        lastActivity: new Date(),
        isActive: true
      });

      await sharedTaskChat.save();

      // Send notifications
      const chatName = `${sharedTask.taskTitle} Task Chat`;
      const chatLink = `${process.env.NEXT_PUBLIC_BASE_URL}/shared-task-chat?sharedTaskId=${sharedTaskId}`;
      const senderName = session.user.name || session.user.firstName || 'A team member';

      const notificationPromises = participants.map(async (participant) => {
        if (participant.email.toLowerCase() === session.user.email.toLowerCase()) {
          return;
        }

        try {
          await sendNotification({
            senderId: session.user.id,
            senderModel: session.user.role,
            senderName: senderName,
            receiverId: participant.userId,
            receiverModel: participant.userModel,
            type: "new_shared_task_chat",
            title: "New Task Chat Created",
            message: `You have been added to the task chat: ${chatName}`,
            link: chatLink,
            referenceId: sharedTaskChat._id,
            referenceModel: "SharedTaskChat"
          });

          const emailHtml = newSharedTaskChatEmailTemplate({
            recipientName: participant.name,
            taskTitle: sharedTask.taskTitle,
            link: chatLink,
            senderName
          });

          await sendMail(
            participant.email,
            `📢 New Task Chat: ${chatName}`,
            emailHtml
          );
        } catch (error) {
          console.error(`Failed to notify ${participant.email}:`, error);
        }
      });

      await Promise.allSettled(notificationPromises);

    } else {
      // Add current user if not already participant
      const isParticipant = sharedTaskChat.participants.some(
        p => p.email.toLowerCase() === session.user.email.toLowerCase()
      );

      if (!isParticipant) {
        const currentUser = await getUserByEmail(session.user.email);
        if (currentUser) {
          sharedTaskChat.participants.push({
            userId: currentUser._id,
            userModel: currentUser.constructor.modelName,
            email: currentUser.email,
            name: getUserName(currentUser),
            role: getUserRole(currentUser),
            department: currentUser.department,
            joinedAt: new Date(),
            isActive: true
          });
          
          await sharedTaskChat.save();
        }
      }
    }

    // Populate chat
    const populatedChat = await SharedTaskChat.findById(sharedTaskChat._id)
      .populate({
        path: 'participants.userId',
        select: 'firstName lastName email department phone profileImage',
      })
      .populate({
        path: 'messages.senderId',
        select: 'firstName lastName email department profileImage',
      })
      .lean();

    return NextResponse.json({
      success: true,
      chat: populatedChat,
      message: sharedTaskChat.isNew ? "Task chat created successfully" : "Task chat loaded successfully"
    });

  } catch (error) {
    console.error("Error in shared task chat POST:", error);
    return NextResponse.json(
      { 
        error: "Failed to process request", 
        details: error.message 
      }, 
      { status: 500 }
    );
  }
}

// Get shared task chat
export async function GET(req) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const sharedTaskId = searchParams.get('sharedTaskId');
    
    if (!sharedTaskId) {
      return NextResponse.json({ error: "Shared Task ID required" }, { status: 400 });
    }

    // Check if user has access to this shared task
    const hasAccess = await checkUserAccessToSharedTask(sharedTaskId, session.user);
    if (!hasAccess) {
      return NextResponse.json({ 
        error: "Access denied",
        message: "You don't have permission to access this shared task" 
      }, { status: 403 });
    }

    const sharedTaskChat = await SharedTaskChat.findOne({ sharedTaskId })
      .populate({
        path: 'participants.userId',
        select: 'firstName lastName email department phone profileImage',
      })
      .populate({
        path: 'messages.senderId',
        select: 'firstName lastName email department profileImage',
      })
      .populate('messages.replyTo')
      .sort({ 'messages.createdAt': 1 })
      .lean();

    if (!sharedTaskChat) {
      return NextResponse.json({ error: "Task chat not found" }, { status: 404 });
    }

    // Check if user is participant
    const isParticipant = sharedTaskChat.participants.some(
      p => p.email?.toLowerCase() === session.user.email?.toLowerCase()
    );

    if (!isParticipant) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json({ 
      success: true, 
      chat: sharedTaskChat 
    });

  } catch (error) {
    console.error("Error fetching shared task chat:", error);
    return NextResponse.json(
      { error: "Failed to fetch task chat" },
      { status: 500 }
    );
  }
}