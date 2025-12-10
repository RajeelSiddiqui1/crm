// app/api/auth/profile/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Admin from "@/models/Admin";
import Manager from "@/models/Manager";
import TeamLead from "@/models/TeamLead";
import Employee from "@/models/Employee";
import Department from "@/models/Department";
import dbConnect from "@/lib/db";

// GET: User profile data fetch based on role
export async function GET() {
  try {
    await dbConnect();
    
    // Get session
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id, role } = session.user;
    let userData;

    // Role ke hisaab se model select karo
    switch (role) {
      case "Admin":
        userData = await Admin.findById(id).select("-password -otp -otpExpiry");
        break;
      case "Manager":
        userData = await Manager.findById(id).select("-password -otp -otpExpiry");
        // Agar departments hain to populate karo
        if (userData && userData.departments && userData.departments.length > 0) {
          await userData.populate("departments");
        }
        break;
      case "TeamLead":
        userData = await TeamLead.findById(id).select("-password -otp -otpExpiry");
        if (userData && userData.depId) {
          await userData.populate("depId");
        }
        if (userData && userData.managerId) {
          await userData.populate("managerId", "firstName lastName email");
        }
        break;
      case "Employee":
        userData = await Employee.findById(id).select("-password -otp -otpExpiry");
        if (userData && userData.depId) {
          await userData.populate("depId");
        }
        if (userData && userData.managerId) {
          await userData.populate("managerId", "firstName lastName email");
        }
        break;
      default:
        return NextResponse.json({ message: "Invalid role" }, { status: 400 });
    }

    if (!userData) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      user: userData 
    }, { status: 200 });

  } catch (error) {
    console.error("Profile fetch error:", error);
    return NextResponse.json(
      { message: "Internal server error", error: error.message },
      { status: 500 }
    );
  }
}

// PUT: User profile update based on role
export async function PUT(req) {
  try {
    await dbConnect();
    
    // Get session
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id, role } = session.user;
    const updateData = await req.json();
    
    // Remove sensitive fields that shouldn't be updated via this route
    delete updateData.password;
    delete updateData.role;
    delete updateData._id;
    delete updateData.createdAt;
    delete updateData.updatedAt;

    let updatedUser;
    let Model;

    // Role ke hisaab se model select karo
    switch (role) {
      case "Admin":
        Model = Admin;
        break;
      case "Manager":
        Model = Manager;
        break;
      case "TeamLead":
        Model = TeamLead;
        break;
      case "Employee":
        Model = Employee;
        break;
      default:
        return NextResponse.json({ message: "Invalid role" }, { status: 400 });
    }

    // Update karo
    updatedUser = await Model.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select("-password -otp -otpExpiry");

    if (!updatedUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser
    }, { status: 200 });

  } catch (error) {
    console.error("Profile update error:", error);
    
    // MongoDB duplicate key error
    if (error.code === 11000) {
      return NextResponse.json(
        { message: "Email already exists" },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { message: "Internal server error", error: error.message },
      { status: 500 }
    );
  }
}