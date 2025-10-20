import { getServerSession } from "next-auth/next";
import dbConnect from "@/lib/db";
import Admin from "@/models/Admin";
import Manager from "@/models/Manager";
import TeamLead from "@/models/TeamLead";
import Employee from "@/models/Employee";
import { authOptions } from "@/lib/auth";

const roleModelMap = {
  Admin: Admin,
  Manager: Manager,
  TeamLead: TeamLead,
  Employee: Employee
};

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return new Response(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
      });
    }

    await dbConnect();

    const Model = roleModelMap[session.user.role];
    if (!Model) {
      return new Response(JSON.stringify({ message: "Invalid role" }), {
        status: 400,
      });
    }

    const user = await Model.findById(session.user.id).select("-password -otp -otpExpiry");
    
    if (!user) {
      return new Response(JSON.stringify({ message: "User not found" }), {
        status: 404,
      });
    }

    return new Response(JSON.stringify({ 
      user: {
        ...user.toObject(),
        role: session.user.role
      }
    }), {
      status: 200,
    });
  } catch (error) {
    console.error("Profile fetch error:", error);
    return new Response(JSON.stringify({ message: "Internal server error" }), {
      status: 500,
    });
  }
}

export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return new Response(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
      });
    }

    const body = await request.json();
    const { firstName, lastName, email, phone, address, profilePic } = body;

    await dbConnect();

    const Model = roleModelMap[session.user.role];
    if (!Model) {
      return new Response(JSON.stringify({ message: "Invalid role" }), {
        status: 400,
      });
    }

    if (email && email !== session.user.email) {
      const existingUser = await Model.findOne({ 
        email, 
        _id: { $ne: session.user.id } 
      });
      
      if (existingUser) {
        return new Response(JSON.stringify({ message: "Email already in use" }), {
          status: 400,
        });
      }
    }

    const updateFields = {};
    if (firstName) updateFields.firstName = firstName;
    if (lastName) updateFields.lastName = lastName;
    if (email) updateFields.email = email;
    if (phone !== undefined) updateFields.phone = phone;
    if (address !== undefined) updateFields.address = address;
    if (profilePic !== undefined) updateFields.profilePic = profilePic;

    const updatedUser = await Model.findByIdAndUpdate(
      session.user.id,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).select("-password -otp -otpExpiry");

    if (!updatedUser) {
      return new Response(JSON.stringify({ message: "User not found" }), {
        status: 404,
      });
    }

    return new Response(JSON.stringify({ 
      message: "Profile updated successfully",
      user: updatedUser 
    }), {
      status: 200,
    });
  } catch (error) {
    console.error("Profile update error:", error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return new Response(JSON.stringify({ message: errors.join(', ') }), {
        status: 400,
      });
    }
    
    if (error.code === 11000) {
      return new Response(JSON.stringify({ message: "Email already exists" }), {
        status: 400,
      });
    }

    return new Response(JSON.stringify({ message: "Internal server error" }), {
      status: 500,
    });
  }
}