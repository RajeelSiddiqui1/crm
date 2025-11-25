import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import AdminPost from "@/models/AdminPost";
import ManagerPost from "@/models/ManagerPost";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req, { params }) {
  try {
    await dbConnect();

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized access" },
        { status: 401 }
      );
    }

    const { id } = params;

    // Try to find post in both collections
    let post = await AdminPost.findById(id)
      .populate('views.userId', 'firstName lastName email role')
      .populate('reactions.userId', 'firstName lastName email role')
      .populate('comments.userId', 'firstName lastName email role')
      .populate('comments.likes.userId', 'firstName lastName email role');

    if (!post) {
      post = await ManagerPost.findById(id)
        .populate('submmittedBy', 'firstName lastName email department')
        .populate('views.userId', 'firstName lastName email role')
        .populate('reactions.userId', 'firstName lastName email role')
        .populate('comments.userId', 'firstName lastName email role')
        .populate('comments.likes.userId', 'firstName lastName email role');
    }

    if (!post) {
      return NextResponse.json(
        { success: false, message: "Post not found" },
        { status: 404 }
      );
    }

    // Add view if not already viewed by this user
    const hasViewed = post.views.some(view => 
      view.userId._id.toString() === session.user.id
    );

    if (!hasViewed) {
      post.views.push({
        userId: session.user.id,
        userModel: session.user.role
      });
      await post.save();
    }

    return NextResponse.json({
      success: true,
      post
    });

  } catch (error) {
    console.log("POST FETCH ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch post" },
      { status: 500 }
    );
  }
}

export async function PATCH(req, { params }) {
  try {
    await dbConnect();

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized access" },
        { status: 401 }
      );
    }

    const { id } = params;
    const { action, data } = await req.json();

    // Find post
    let post = await AdminPost.findById(id) || await ManagerPost.findById(id);
    if (!post) {
      return NextResponse.json(
        { success: false, message: "Post not found" },
        { status: 404 }
      );
    }

    switch (action) {
      case 'reaction':
        const existingReactionIndex = post.reactions.findIndex(
          reaction => reaction.userId.toString() === session.user.id
        );

        if (existingReactionIndex > -1) {
          // Update existing reaction
          post.reactions[existingReactionIndex].reactionType = data.reactionType;
          post.reactions[existingReactionIndex].reactedAt = new Date();
        } else {
          // Add new reaction
          post.reactions.push({
            userId: session.user.id,
            userModel: session.user.role,
            reactionType: data.reactionType
          });
        }
        break;

      case 'comment':
        post.comments.push({
          userId: session.user.id,
          userModel: session.user.role,
          comment: data.comment
        });
        break;

      case 'like_comment':
        const comment = post.comments.id(data.commentId);
        if (comment) {
          const existingLikeIndex = comment.likes.findIndex(
            like => like.userId.toString() === session.user.id
          );

          if (existingLikeIndex > -1) {
            // Unlike
            comment.likes.splice(existingLikeIndex, 1);
          } else {
            // Like
            comment.likes.push({
              userId: session.user.id,
              userModel: session.user.role
            });
          }
        }
        break;

      default:
        return NextResponse.json(
          { success: false, message: "Invalid action" },
          { status: 400 }
        );
    }

    await post.save();

    // Populate the updated post
    post = await (post instanceof AdminPost ? AdminPost : ManagerPost)
      .findById(id)
      .populate('submmittedBy', 'firstName lastName email department')
      .populate('views.userId', 'firstName lastName email role')
      .populate('reactions.userId', 'firstName lastName email role')
      .populate('comments.userId', 'firstName lastName email role')
      .populate('comments.likes.userId', 'firstName lastName email role');

    return NextResponse.json({
      success: true,
      message: "Action completed successfully",
      post
    });

  } catch (error) {
    console.log("POST ACTION ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Action failed" },
      { status: 500 }
    );
  }
}