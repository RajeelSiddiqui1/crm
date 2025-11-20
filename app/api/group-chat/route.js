// app/api/group-chat/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import GroupChat from "@/models/GroupChat";
import FormSubmission from "@/models/FormSubmission";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";

export async function POST(req) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { submissionId } = await req.json();

    // Check if submission exists
    const submission = await FormSubmission.findById(submissionId)
      .populate('formId')
      .populate('assignedEmployees.employeeId');

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    // Check if group chat already exists
    const existingChat = await GroupChat.findOne({ submissionId });
    if (existingChat) {
      return NextResponse.json({ 
        chat: existingChat,
        message: "Group chat already exists"
      });
    }

    // Get all participants
    const participants = [];

    // Add Admin if exists
    if (submission.adminTask) {
      // You might need to populate admin details based on your admin model
      participants.push({
        userId: submission.adminTask, // Adjust based on your admin model
        userModel: 'Admin',
        email: 'admin@system.com', // Adjust based on your admin data
        name: 'System Admin',
        role: 'Admin'
      });
    }

    // Add Manager (submittedBy)
    participants.push({
      userId: session.user.id, // Adjust based on your user management
      userModel: 'Manager',
      email: submission.submittedBy,
      name: 'Manager',
      role: 'Manager'
    });

    // Add TeamLead (assignedTo)
    participants.push({
      userId: session.user.id, // Adjust based on your user management
      userModel: 'TeamLead',
      email: submission.assignedTo,
      name: 'Team Lead',
      role: 'TeamLead'
    });

    // Add Employees
    if (submission.assignedEmployees && submission.assignedEmployees.length > 0) {
      submission.assignedEmployees.forEach(emp => {
        participants.push({
          userId: emp.employeeId._id,
          userModel: 'Employee',
          email: emp.email,
          name: `${emp.employeeId.firstName} ${emp.employeeId.lastName}`,
          role: 'Employee'
        });
      });
    }

    // Create group chat
    const groupChat = new GroupChat({
      submissionId,
      participants
    });

    await groupChat.save();

    return NextResponse.json({ 
      chat: groupChat,
      message: "Group chat created successfully"
    });

  } catch (error) {
    console.error("Error creating group chat:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(req) {
  try {
    await connectToDatabase();
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const submissionId = searchParams.get('submissionId');

    if (!submissionId) {
      return NextResponse.json({ error: "Submission ID required" }, { status: 400 });
    }

    const groupChat = await GroupChat.findOne({ submissionId })
      .populate('messages.senderId')
      .populate('messages.replyTo')
      .sort({ 'messages.createdAt': 1 });

    if (!groupChat) {
      return NextResponse.json({ error: "Group chat not found" }, { status: 404 });
    }

    // Check if user is participant
    const isParticipant = groupChat.participants.some(
      p => p.email === session.user.email
    );

    if (!isParticipant) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json({ chat: groupChat });

  } catch (error) {
    console.error("Error fetching group chat:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}