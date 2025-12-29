import { NextResponse } from "next/server";
import AdminTask from "@/models/AdminTask";
import Manager from "@/models/Manager";
import TeamLead from "@/models/TeamLead";
import Employee from "@/models/Employee";
import dbConnect from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import cloudinary from "@/lib/cloudinary";
import { sendNotification } from "@/lib/sendNotification";
import mongoose from "mongoose";

export async function PATCH(req, { params }) {
  try {
    await dbConnect();

    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "Admin") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    
    // Get form data
    const formData = await req.formData();
    const title = formData.get("title");
    const clientName = formData.get("clientName");
    const priority = formData.get("priority");
    const endDate = formData.get("endDate");
    
    // Get updated user arrays
    const managersId = JSON.parse(formData.get("managersId") || "[]");
    const teamLeadsId = JSON.parse(formData.get("teamLeadsId") || "[]");
    const employeesId = JSON.parse(formData.get("employeesId") || "[]");

    const file = formData.get("file");
    const audio = formData.get("audio");
    const removeFile = formData.get("removeFile");
    const removeAudio = formData.get("removeAudio");

    // Find existing task
    const existingTask = await AdminTask.findById(id);
    if (!existingTask) {
      return NextResponse.json(
        { success: false, message: "Task not found" },
        { status: 404 }
      );
    }

    // Check ownership
    if (existingTask.submittedBy.toString() !== session.user.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized to update this task" },
        { status: 403 }
      );
    }

    // Prepare update data
    const updateData = {
      title: title || existingTask.title,
      clientName: clientName || existingTask.clientName,
      priority: priority || existingTask.priority,
      updatedAt: new Date()
    };

    // Handle end date
    if (endDate) {
      updateData.endDate = new Date(endDate);
    }

    // Handle user assignments
    if (managersId.length > 0 || teamLeadsId.length > 0 || employeesId.length > 0) {
      // Fetch assigned users for department collection
      const [managers, teamLeads, employees] = await Promise.all([
        Manager.find({ _id: { $in: managersId } }),
        TeamLead.find({ _id: { $in: teamLeadsId } }),
        Employee.find({ _id: { $in: employeesId } })
      ]);

      // Collect updated departments
      const departmentSet = new Set();
      managers.forEach(manager => {
        manager.departments?.forEach(dep => departmentSet.add(dep.toString()));
      });
      teamLeads.forEach(tl => tl.depId && departmentSet.add(tl.depId.toString()));
      employees.forEach(emp => emp.depId && departmentSet.add(emp.depId.toString()));

      updateData.departments = Array.from(departmentSet);

      // Create updated user arrays with existing statuses where applicable
      const existingManagerMap = new Map();
      existingTask.managers.forEach(m => {
        existingManagerMap.set(m.managerId.toString(), m.status);
      });

      const existingTeamLeadMap = new Map();
      existingTask.teamleads.forEach(tl => {
        existingTeamLeadMap.set(tl.teamleadId.toString(), tl.status);
      });

      const existingEmployeeMap = new Map();
      existingTask.employees.forEach(e => {
        existingEmployeeMap.set(e.employeeId.toString(), e.status);
      });

      updateData.managers = managersId.map(id => ({
        managerId: new mongoose.Types.ObjectId(id),
        status: existingManagerMap.get(id) || "pending",
        assignedAt: new Date()
      }));

      updateData.teamleads = teamLeadsId.map(id => ({
        teamleadId: new mongoose.Types.ObjectId(id),
        status: existingTeamLeadMap.get(id) || "pending",
        assignedAt: new Date()
      }));

      updateData.employees = employeesId.map(id => ({
        employeeId: new mongoose.Types.ObjectId(id),
        status: existingEmployeeMap.get(id) || "pending",
        assignedAt: new Date()
      }));
    }

    // Handle file updates
    if (removeFile === "true") {
      // Remove existing file from Cloudinary
      if (existingTask.filePublicId) {
        await cloudinary.uploader.destroy(existingTask.filePublicId);
      }
      updateData.fileAttachments = null;
      updateData.fileName = null;
      updateData.fileType = null;
      updateData.filePublicId = null;
    } else if (file && file.size > 0) {
      // Upload new file
      if (existingTask.filePublicId) {
        await cloudinary.uploader.destroy(existingTask.filePublicId);
      }
      
      const buffer = Buffer.from(await file.arrayBuffer());
      const mime = file.type;
      
      let resourceType = "raw";
      if (mime.startsWith("image/")) resourceType = "image";
      else if (mime.startsWith("video/") || mime.startsWith("audio/")) resourceType = "video";

      const uploadRes = await cloudinary.uploader.upload(
        `data:${mime};base64,${buffer.toString("base64")}`,
        { 
          folder: "admin_tasks/files",
          resource_type: resourceType,
          public_id: `task_file_${Date.now()}`
        }
      );

      updateData.fileAttachments = uploadRes.secure_url;
      updateData.fileName = file.name;
      updateData.fileType = mime;
      updateData.filePublicId = uploadRes.public_id;
    }

    // Handle audio updates
    if (removeAudio === "true") {
      if (existingTask.audioPublicId) {
        await cloudinary.uploader.destroy(existingTask.audioPublicId, { resource_type: "video" });
      }
      updateData.audioUrl = null;
      updateData.audioPublicId = null;
    } else if (audio && audio.size > 0) {
      if (existingTask.audioPublicId) {
        await cloudinary.uploader.destroy(existingTask.audioPublicId, { resource_type: "video" });
      }
      
      const buffer = Buffer.from(await audio.arrayBuffer());
      const uploadAudio = await cloudinary.uploader.upload(
        `data:${audio.type};base64,${buffer.toString("base64")}`,
        { 
          folder: "admin_tasks/audio",
          resource_type: "video",
          public_id: `task_audio_${Date.now()}`
        }
      );

      updateData.audioUrl = uploadAudio.secure_url;
      updateData.audioPublicId = uploadAudio.public_id;
    }

    // Update task
    const updatedTask = await AdminTask.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
    .populate({
      path: "managers.managerId",
      select: "firstName lastName email profilePic",
    })
    .populate({
      path: "teamleads.teamleadId",
      select: "firstName lastName email profilePic",
    })
    .populate({
      path: "employees.employeeId",
      select: "firstName lastName email profilePic",
    });

    return NextResponse.json(
      { 
        success: true, 
        message: "Task updated successfully", 
        task: updatedTask 
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("Task Update Error:", error);
    return NextResponse.json(
      { success: false, message: "Task update failed", error: error.message },
      { status: 500 }
    );
  }
}