import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import mongoose from "mongoose";
import FormSubmission from "@/models/FormSubmission";

export async function GET(req) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 12;
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status");
    const adminStatus = searchParams.get("adminStatus");
    const date = searchParams.get("date");

    const skip = (page - 1) * limit;

    // Build match stage for aggregation
    const match = {};
    
    if (search) {
      match.$or = [
        { "submittedBy.firstName": { $regex: search, $options: "i" } },
        { "submittedBy.lastName": { $regex: search, $options: "i" } },
        { "submittedBy.email": { $regex: search, $options: "i" } },
        { "formId.title": { $regex: search, $options: "i" } }
      ];
    }
    
    if (status && status !== "all") {
      match.status = status;
    }
    
    if (adminStatus && adminStatus !== "all") {
      match.adminStatus = adminStatus;
    }
    
    if (date && date !== "all") {
      const now = new Date();
      let startDate = new Date();
      
      if (date === "today") {
        startDate.setHours(0, 0, 0, 0);
      } else if (date === "week") {
        startDate.setDate(now.getDate() - 7);
      } else if (date === "month") {
        startDate.setMonth(now.getMonth() - 1);
      }
      
      match.createdAt = { $gte: startDate };
    }

    // First, get total count
    const countPipeline = [
      {
        $lookup: {
          from: "managers",
          localField: "submittedBy",
          foreignField: "_id",
          as: "submittedBy",
        },
      },
      { $unwind: { path: "$submittedBy", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "teamleads",
          localField: "assignedTo",
          foreignField: "_id",
          as: "assignedTo",
        },
      },
      { $unwind: { path: "$assignedTo", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "forms",
          localField: "formId",
          foreignField: "_id",
          as: "formId",
        },
      },
      { $unwind: { path: "$formId", preserveNullAndEmptyArrays: true } },
      { $match: match },
      { $count: "total" }
    ];

    const countResult = await FormSubmission.aggregate(countPipeline);
    const total = countResult[0]?.total || 0;

    // Then, get paginated data
    const dataPipeline = [
      {
        $lookup: {
          from: "managers",
          localField: "submittedBy",
          foreignField: "_id",
          as: "submittedBy",
        },
      },
      { $unwind: { path: "$submittedBy", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "teamleads",
          localField: "assignedTo",
          foreignField: "_id",
          as: "assignedTo",
        },
      },
      { $unwind: { path: "$assignedTo", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "forms",
          localField: "formId",
          foreignField: "_id",
          as: "formId",
        },
      },
      { $unwind: { path: "$formId", preserveNullAndEmptyArrays: true } },
      { $match: match },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      // Add computed fields
      {
        $addFields: {
          submittedByName: {
            $concat: [
              { $ifNull: ["$submittedBy.firstName", ""] },
              " ",
              { $ifNull: ["$submittedBy.lastName", ""] }
            ]
          },
          submittedByEmail: { $ifNull: ["$submittedBy.email", "N/A"] },
          submittedByDepartment: { 
            $ifNull: [
              { $arrayElemAt: ["$submittedBy.departments.name", 0] },
              "N/A"
            ]
          },
          assignedToName: {
            $cond: {
              if: { $eq: ["$assignedTo", null] },
              then: "Not Assigned",
              else: {
                $concat: [
                  { $ifNull: ["$assignedTo.firstName", ""] },
                  " ",
                  { $ifNull: ["$assignedTo.lastName", ""] }
                ]
              }
            }
          },
          formattedCreatedAt: {
            $dateToString: {
              format: "%b %d, %Y",
              date: "$createdAt"
            }
          },
          formattedDateTime: {
            $dateToString: {
              format: "%b %d, %Y %H:%M",
              date: "$createdAt"
            }
          }
        }
      }
    ];

    const tasks = await FormSubmission.aggregate(dataPipeline);
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      formSubmissions: tasks,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: total,
        hasNext: page < totalPages,
        hasPrev: page > 1,
        limit
      }
    });
  } catch (error) {
    console.error("Error fetching form submissions:", error);
    return NextResponse.json(
      { success: false, message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}