// app/api/admin/manager-tasks/route.js
import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import FormSubmission from "@/models/FormSubmission";
import AdminTask from "@/models/AdminTask";
import Employee from "@/models/Employee";
import Form from "@/models/Form"; 
import Manager from "@/models/Manager";
import mongoose from "mongoose";

export async function GET(req) {
  await dbConnect();

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 20;

    const query = {};

    // Status filter
    if (status && status !== "all") {
      query.status = status;
    }

    // Search filter
    if (search) {
      query.$or = [
        { submittedBy: { $regex: search, $options: "i" } },
        { assignedTo: { $regex: search, $options: "i" } },
        { "formData.$**": { $regex: search, $options: "i" } }
      ];
    }

    const skip = (page - 1) * limit;

    const formSubmissions = await FormSubmission.find(query)
      .populate({
        path: "formId",
        select: "title description fields",
        model: Form,
      })
      .populate({
        path: "assignedEmployees.employeeId",
        select: "name email role department firstName lastName avatar",
        model: Employee,
      })
      .populate({
        path: "adminTask",
        select: "title clientName endDate priority managers",
        model: AdminTask,
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await FormSubmission.countDocuments(query);

    // Process submissions with manager names and formatted form data
    const submissionsWithManagerNames = await Promise.all(
      formSubmissions.map(async (submission) => {
        try {
          // Get manager details if submittedBy is ObjectId
          if (mongoose.Types.ObjectId.isValid(submission.submittedBy)) {
            const manager = await Manager.findById(submission.submittedBy)
              .select("firstName lastName email phone department")
              .lean();
            
            if (manager) {
              submission.submittedBy = `${manager.firstName} ${manager.lastName}`;
              submission.managerEmail = manager.email;
              submission.managerPhone = manager.phone;
              submission.managerDepartment = manager.department;
            }
          }

          // Convert Map to Object for formData
          if (submission.formData && submission.formData instanceof Map) {
            submission.formData = Object.fromEntries(submission.formData);
          } else if (!submission.formData) {
            submission.formData = {};
          }

          // Format dates
          submission.formattedCreatedAt = new Date(submission.createdAt).toLocaleDateString();
          submission.formattedUpdatedAt = new Date(submission.updatedAt).toLocaleDateString();

          return submission;
        } catch (error) {
          console.error("Error processing submission:", error);
          return submission;
        }
      })
    );

    return NextResponse.json({ 
      success: true, 
      formSubmissions: submissionsWithManagerNames,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error("Error fetching manager tasks:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to fetch manager tasks",
        formSubmissions: [] 
      },
      { status: 500 }
    );
  }
}