import bcrypt from "bcrypt";
import { NextResponse } from "next/server";
import Employee from "@/models/Employee";
import Department from "@/models/Department";
import { dbConnect } from "@/lib/db";
import { sendEmployeeWelcomeEmail } from "@/helper/emails/manager/create-employee";

export async function POST(req) {
  try {
    await dbConnect();
    const { firstName, lastName, email, password, depId, managerId } = await req.json();

    if (!firstName || !lastName || !email || !password || !depId || !managerId) {
      return NextResponse.json(
        { message: "All fields are required" },
        { status: 409 }
      );
    }

    const emailAlreadyExists = await Employee.findOne({ email });
    if (emailAlreadyExists) {
      return NextResponse.json(
        { message: "Employee already exists" },
        { status: 409 }
      );
    }

    // ✅ Correct prefix for Employee
    let userId;
    let isUnique = false;
    while (!isUnique) {
      const randomId = Math.floor(100000 + Math.random() * 900000);
      userId = `EMP${randomId}`;
      const existing = await Employee.findOne({ userId });
      if (!existing) isUnique = true;
    }

    const hashPassword = await bcrypt.hash(password, 12);

    const idx = Math.floor(Math.random() * 100) + 1;
    const avatarUrl = `https://avatar.iran.liara.run/public/${idx}.png`;

    const newEmployee = new Employee({
      userId,
      firstName,
      lastName,
      email,
      password: hashPassword,
      profilePic: avatarUrl,
      depId,
      managerId,
    });

    await newEmployee.save();

    // ✅ Get Department name for email
    const dept = await Department.findById(depId).select("name");

    // ✅ Send Email
    await sendEmployeeWelcomeEmail(email, firstName, userId, password, dept?.name || "Not Assigned");

    return NextResponse.json(
      { message: "Employee created successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Employee creation error:", error);
    return NextResponse.json(
      { message: "Employee creation failed", error: error.message },
      { status: 500 }
    );
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const managerId = searchParams.get("managerId");

    if (!managerId) {
      return NextResponse.json(
        { message: "Manager ID is required" },
        { status: 400 }
      );
    }

    await dbConnect();

    const employees = await Employee.find({ managerId }).select(
      "userId firstName lastName email profilePic createdAt"
    );

    if (employees.length === 0) {
      return NextResponse.json(
        { message: "No Employees found for this manager" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Employees fetched successfully", employees },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching Employees:", error);
    return NextResponse.json(
      { message: "Error fetching Employees", error },
      { status: 500 }
    );
  }
}
