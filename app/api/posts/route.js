import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import AdminPost from "@/models/AdminPost";
import ManagerPost from "@/models/ManagerPost";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req) {
  try {
    await dbConnect();

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized access" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const filter = searchParams.get('filter') || 'all';

    // Build query based on user role and filter
    let adminPostsQuery = { visible: true };
    let managerPostsQuery = { visible: true };

    // For employees and teamleads, only show posts from their manager
    if (session.user.role === "Employee" || session.user.role === "TeamLead") {
      if (session.user.managerId) {
        managerPostsQuery.submmittedBy = session.user.managerId;
      }
    }

    let adminPosts = [];
    let managerPosts = [];

    // Fetch posts based on filter
    if (filter === 'all' || filter === 'admin') {
      adminPosts = await AdminPost.find(adminPostsQuery)
        .populate('views.userId', 'firstName lastName email')
        .populate('reactions.userId', 'firstName lastName email')
        .populate('comments.userId', 'firstName lastName email')
        .populate('comments.likes.userId', 'firstName lastName email')
        .sort({ createdAt: -1 });
    }

    if (filter === 'all' || filter === 'manager') {
      managerPosts = await ManagerPost.find(managerPostsQuery)
        .populate('submmittedBy', 'firstName lastName email department')
        .populate('views.userId', 'firstName lastName email')
        .populate('reactions.userId', 'firstName lastName email')
        .populate('comments.userId', 'firstName lastName email')
        .populate('comments.likes.userId', 'firstName lastName email')
        .sort({ createdAt: -1 });
    }

    // Combine and sort posts
    const allPosts = [...adminPosts, ...managerPosts].sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );

    return NextResponse.json({
      success: true,
      posts: allPosts,
      adminPostsCount: adminPosts.length,
      managerPostsCount: managerPosts.length
    });

  } catch (error) {
    console.log("POSTS FETCH ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch posts" },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    await dbConnect();

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized access" },
        { status: 401 }
      );
    }

    const { content, postType, attachmentUrl, attachmentType } = await req.json();

    if (postType === 'admin' && session.user.role !== 'Admin') {
      return NextResponse.json(
        { success: false, message: "Only admins can create admin posts" },
        { status: 403 }
      );
    }

    if (postType === 'manager' && session.user.role !== 'Manager') {
      return NextResponse.json(
        { success: false, message: "Only managers can create manager posts" },
        { status: 403 }
      );
    }

    let newPost;
    if (postType === 'admin') {
      newPost = new AdminPost({
        title: content.title,
        description: content.description,
        attachmentUrl,
        attachmentType
      });
    } else {
      newPost = new ManagerPost({
        title: content.title,
        description: content.description,
        attachmentUrl,
        submmittedBy: session.user.id
      });
    }

    await newPost.save();

    return NextResponse.json(
      {
        success: true,
        message: "Post created successfully",
        post: newPost
      },
      { status: 201 }
    );

  } catch (error) {
    console.log("POST CREATION ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Post creation failed" },
      { status: 500 }
    );
  }
}