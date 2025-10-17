import { NextResponse } from 'next/server';
import dbConnect from "@/lib/db";
import Manager from "@/models/Manager";
import TeamLead from "@/models/TeamLead";
import Employee from "@/models/Employee";
import Department from "@/models/Department";

export async function GET(request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const department = searchParams.get('department');
    const search = searchParams.get('search');

    // Build filter object based on query parameters
    let filter = {};
    
    // Role filter
    if (role && ['Manager', 'TeamLead', 'Employee'].includes(role)) {
      filter.role = role;
    }

    // Search filter
    if (search) {
      filter.search = search;
    }

    // Department filter
    if (department) {
      filter.department = department;
    }

    const users = await fetchUsersWithFilters(filter);

    return NextResponse.json({
      success: true,
      users,
      total: users.length,
      filters: filter
    });

  } catch (error) {
    console.error('Fetch users error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error'
      },
      { status: 500 }
    );
  }
}

async function fetchUsersWithFilters(filter) {
  const { role, search, department } = filter;
  
  let managers = [];
  let teamLeads = [];
  let employees = [];

  // Fetch Managers
  if (!role || role === 'Manager') {
    let managerQuery = {};
    
    if (search) {
      managerQuery.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (department) {
      managerQuery.departments = department;
    }

    managers = await Manager.find(managerQuery)
      .select('-password -otp -otpExpiry')
      .populate('departments', 'name')
      .lean();

    // Add role and format data
    managers = managers.map(manager => ({
      ...manager,
      _id: manager._id.toString(),
      role: 'Manager',
      userId: manager.email, // Managers use email as ID
      department: manager.departments?.[0]?.name || 'No Department',
      departments: manager.departments?.map(dept => ({
        _id: dept._id.toString(),
        name: dept.name
      })) || []
    }));
  }

  // Fetch TeamLeads
  if (!role || role === 'TeamLead') {
    let teamLeadQuery = {};
    
    if (search) {
      teamLeadQuery.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { userId: { $regex: search, $options: 'i' } }
      ];
    }

    if (department) {
      teamLeadQuery.depId = department;
    }

    teamLeads = await TeamLead.find(teamLeadQuery)
      .select('-password -otp -otpExpiry')
      .populate('depId', 'name')
      .populate('managerId', 'firstName lastName email')
      .lean();

    // Add role and format data
    teamLeads = teamLeads.map(teamLead => ({
      ...teamLead,
      _id: teamLead._id.toString(),
      role: 'TeamLead',
      department: teamLead.depId?.name || 'No Department',
      manager: teamLead.managerId ? {
        _id: teamLead.managerId._id.toString(),
        name: `${teamLead.managerId.firstName} ${teamLead.managerId.lastName}`,
        email: teamLead.managerId.email
      } : null
    }));
  }

  // Fetch Employees
  if (!role || role === 'Employee') {
    let employeeQuery = {};
    
    if (search) {
      employeeQuery.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { userId: { $regex: search, $options: 'i' } }
      ];
    }

    if (department) {
      employeeQuery.depId = department;
    }

    employees = await Employee.find(employeeQuery)
      .select('-password -otp -otpExpiry')
      .populate('depId', 'name')
      .populate('managerId', 'firstName lastName email')
      .lean();

    // Add role and format data
    employees = employees.map(employee => ({
      ...employee,
      _id: employee._id.toString(),
      role: 'Employee',
      department: employee.depId?.name || 'No Department',
      manager: employee.managerId ? {
        _id: employee.managerId._id.toString(),
        name: `${employee.managerId.firstName} ${employee.managerId.lastName}`,
        email: employee.managerId.email
      } : null
    }));
  }

  // Combine all users
  const allUsers = [...managers, ...teamLeads, ...employees];

  // Sort by creation date (newest first)
  return allUsers.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}