import dbConnect from "@/lib/db";
import Manager from "@/models/Manager";
import TeamLead from "@/models/TeamLead";
import Employee from "@/models/Employee";
import Department from "@/models/Department";
import FormSubmission from "@/models/FormSubmission";
import EmployeeFormSubmission from "@/models/EmployeeFormSubmission";
import SharedTask from "@/models/SharedTask";
import { NextResponse } from "next/server";
import AdminTask from "@/models/AdminTask";

export async function GET() {
  try {
    await dbConnect();

    // Basic counts
    const totalManagers = await Manager.countDocuments();
    const totalTeamLeads = await TeamLead.countDocuments();
    const totalEmployees = await Employee.countDocuments();
    const totalDepartments = await Department.countDocuments();
    const totalFormSubmissions = await FormSubmission.countDocuments();
    const totalEmployeeFormSubmissions =
      await EmployeeFormSubmission.countDocuments();
    const totalSharedTasks = await SharedTask.countDocuments();
    const adminTasks = await AdminTask.countDocuments();

    // Monthly Created Count (last 12 months)
    const last12Months = [
      { model: Employee, label: "monthlyEmployees" },
      { model: FormSubmission, label: "monthlyFormSubmissions" },
      { model: SharedTask, label: "monthlySharedTasks" },
    ];

    const monthlyData = {};

    for (let item of last12Months) {
      const stats = await item.model.aggregate([
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]);

      monthlyData[item.label] = stats;
    }

    return NextResponse.json(
      {
        success: true,
        stats: {
          totals: {
            managers: totalManagers,
            teamLeads: totalTeamLeads,
            employees: totalEmployees,
            departments: totalDepartments,
            formSubmissions: totalFormSubmissions,
            employeeFormSubmissions: totalEmployeeFormSubmissions,
            sharedTasks: totalSharedTasks,
            adminTasks: adminTasks,
          },
          charts: {
            monthlyEmployees: monthlyData.monthlyEmployees,
            monthlyFormSubmissions: monthlyData.monthlyFormSubmissions,
            monthlySharedTasks: monthlyData.monthlySharedTasks,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.log("ADMIN STATS ERROR =>", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
