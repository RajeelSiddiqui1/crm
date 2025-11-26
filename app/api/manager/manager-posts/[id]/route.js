import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import ManagerPost from "@/models/ManagerPost";
import cloudinary from "@/lib/cloudinary";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Admin from "@/models/Admin";
import Manager from "@/models/Manager";
import TeamLead from "@/models/TeamLead";
import Employee from "@/models/Employee";

function extractPublicId(url) {
  const parts = url.split("/manager_posts/posts/")[1];
  return "admin_posts/posts/" + parts.split(".")[0];
}

export async function PATCH(req, { params }) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "Manager") {
      return NextResponse.json(
        { success: false, message: "Unauthorized access" },
        { status: 401 }
      );
    }

    const { id } = params;
    const { title, description, attachmentUrl, visible } = await req.json();

    const post = await ManagerPost.findById(id);
    if (!post) {
      return NextResponse.json(
        { success: false, message: "Post not found" },
        { status: 404 }
      );
    }

    let uploadAttachment = post.attachmentUrl;

    if (attachmentUrl && attachmentUrl !== post.attachmentUrl) {
      if (post.attachmentUrl) {
        const publicId = extractPublicId(post.attachmentUrl);
        await cloudinary.uploader.destroy(publicId);
      }

      const uploaded = await cloudinary.uploader.upload(attachmentUrl, {
        folder: "manager_posts/posts",
      });

      uploadAttachment = uploaded.secure_url;
    }

    const updatedPost = await ManagerPost.findByIdAndUpdate(
      id,
      {
        title,
        description,
        attachmentUrl: uploadAttachment,
        visible: visible !== undefined ? visible : post.visible,
      },
      { new: true }
    );

    return NextResponse.json(
      {
        success: true,
        message: "Post updated successfully",
        post: updatedPost,
      },
      { status: 200 }
    );
  } catch (error) {
    console.log("PATCH ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Post update failed" },
      { status: 500 }
    );
  }
}

export async function DELETE(req, { params }) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "Manager") {
      return NextResponse.json(
        { success: false, message: "Unauthorized access" },
        { status: 401 }
      );
    }

    const { id } = params;

    const post = await ManagerPost.findById(id);
    if (!post) {
      return NextResponse.json(
        { success: false, message: "Post not found" },
        { status: 404 }
      );
    }

    if (post.attachmentUrl) {
      const publicId = extractPublicId(post.attachmentUrl);
      await cloudinary.uploader.destroy(publicId);
    }

    await ManagerPost.findByIdAndDelete(id);

    return NextResponse.json(
      {
        success: true,
        message: "Post deleted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.log("DELETE ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Post deletion failed" },
      { status: 500 }
    );
  }
}




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

    const post = await ManagerPost.findById(id)
      .populate('submmittedBy', 'firstName lastName email profilePic')
      .populate('views.userId', 'firstName lastName email profilePic')
      .populate('reactions.userId', 'firstName lastName email profilePic')
      .populate('comments.userId', 'firstName lastName email profilePic')
      .populate('comments.likes.userId', 'firstName lastName email profilePic');

    if (!post) {
      return NextResponse.json(
        { success: false, message: "Post not found" },
        { status: 404 }
      );
    }

    const hasViewed = post.views.some(
      view => view.userId._id.toString() === session.user.id
    );

    if (!hasViewed) {
      post.views.push({
        userId: session.user.id,
        userModel: session.user.role
      });
      await post.save();
    }

    return NextResponse.json(
      {
        success: true,
        post,
      },
      { status: 200 }
    );
  } catch (error) {
    console.log("GET POST DETAILS ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Error fetching post details" },
      { status: 500 }
    );
  }
}

export async function POST(req, { params }) {
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

    const post = await ManagerPost.findById(id);
    if (!post) {
      return NextResponse.json(
        { success: false, message: "Post not found" },
        { status: 404 }
      );
    }

    let updatedPost;

    switch (action) {
      case 'add_reaction':
        const existingReactionIndex = post.reactions.findIndex(
          reaction => reaction.userId.toString() === session.user.id
        );

        if (existingReactionIndex > -1) {
          post.reactions[existingReactionIndex].reactionType = data.reactionType;
        } else {
          post.reactions.push({
            userId: session.user.id,
            userModel: session.user.role,
            reactionType: data.reactionType
          });
        }
        updatedPost = await post.save();
        break;

      case 'remove_reaction':
        post.reactions = post.reactions.filter(
          reaction => reaction.userId.toString() !== session.user.id
        );
        updatedPost = await post.save();
        break;

      case 'add_comment':
        post.comments.push({
          userId: session.user.id,
          userModel: session.user.role,
          comment: data.comment
        });
        updatedPost = await post.save();
        break;

      case 'like_comment':
        const commentIndex = post.comments.findIndex(
          comment => comment._id.toString() === data.commentId
        );
        
        if (commentIndex > -1) {
          const existingLikeIndex = post.comments[commentIndex].likes.findIndex(
            like => like.userId.toString() === session.user.id
          );

          if (existingLikeIndex > -1) {
            post.comments[commentIndex].likes.splice(existingLikeIndex, 1);
          } else {
            post.comments[commentIndex].likes.push({
              userId: session.user.id,
              userModel: session.user.role
            });
          }
          updatedPost = await post.save();
        }
        break;

      default:
        return NextResponse.json(
          { success: false, message: "Invalid action" },
          { status: 400 }
        );
    }

    await updatedPost.populate('submmittedBy', 'firstName lastName email profilePic');
    await updatedPost.populate('views.userId', 'firstName lastName email profilePic');
    await updatedPost.populate('reactions.userId', 'firstName lastName email profilePic');
    await updatedPost.populate('comments.userId', 'firstName lastName email profilePic');
    await updatedPost.populate('comments.likes.userId', 'firstName lastName email profilePic');

    return NextResponse.json(
      {
        success: true,
        message: "Action completed successfully",
        post: updatedPost
      },
      { status: 200 }
    );

  } catch (error) {
    console.log("POST ACTION ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Action failed" },
      { status: 500 }
    );
  }
}
