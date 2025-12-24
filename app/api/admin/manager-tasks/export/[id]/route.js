import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import FormSubmission from "@/models/FormSubmission";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import ExcelJS from 'exceljs';

export async function GET(req, { params }) {
  try {
    await dbConnect();
    const { id } = params;

    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "Admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const submission = await FormSubmission.findById(id)
      .populate('formId', 'title')
      .populate('submittedBy', 'firstName lastName email')
      .populate('depId', 'name')
      .populate('assignedEmployees.employeeId', 'firstName lastName email')
      .lean();

    if (!submission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Submission Details');

    // Add headers
    worksheet.columns = [
      { header: 'Field', key: 'field', width: 30 },
      { header: 'Value', key: 'value', width: 50 }
    ];

    // Add submission details
    worksheet.addRow({ field: 'Submission ID', value: submission._id.toString() });
    worksheet.addRow({ field: 'Form Title', value: submission.formId?.title || 'N/A' });
    worksheet.addRow({ field: 'Submitted By', value: 
      submission.submittedBy ? 
      `${submission.submittedBy.firstName} ${submission.submittedBy.lastName} (${submission.submittedBy.email})` : 
      'N/A'
    });
    worksheet.addRow({ field: 'Department', value: submission.depId?.name || 'N/A' });
    worksheet.addRow({ field: 'Status', value: submission.status });
    worksheet.addRow({ field: 'Created At', value: new Date(submission.createdAt).toLocaleString() });
    worksheet.addRow({ field: 'Updated At', value: new Date(submission.updatedAt).toLocaleString() });

    // Add form data
    worksheet.addRow({ field: '', value: '' });
    worksheet.addRow({ field: 'FORM DATA', value: '' });
    
    if (submission.formData) {
      Object.entries(submission.formData).forEach(([key, value]) => {
        worksheet.addRow({ 
          field: key.replace(/([A-Z])/g, ' $1').trim(), 
          value: value || 'N/A' 
        });
      });
    }

    // Add employees section
    if (submission.assignedEmployees && submission.assignedEmployees.length > 0) {
      worksheet.addRow({ field: '', value: '' });
      worksheet.addRow({ field: 'ASSIGNED EMPLOYEES', value: '' });
      
      submission.assignedEmployees.forEach((emp, index) => {
        worksheet.addRow({ 
          field: `Employee ${index + 1}`, 
          value: emp.employeeId ? 
            `${emp.employeeId.firstName} ${emp.employeeId.lastName} (${emp.employeeId.email})` : 
            'N/A' 
        });
        worksheet.addRow({ field: '  Status', value: emp.status });
        worksheet.addRow({ field: '  Assigned At', value: emp.assignedAt ? new Date(emp.assignedAt).toLocaleString() : 'N/A' });
        worksheet.addRow({ field: '  Completed At', value: emp.completedAt ? new Date(emp.completedAt).toLocaleString() : 'N/A' });
      });
    }

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Return as downloadable file
    const headers = new Headers();
    headers.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    headers.set('Content-Disposition', `attachment; filename="submission-${id}.xlsx"`);

    return new NextResponse(buffer, {
      status: 200,
      headers
    });
  } catch (error) {
    console.error("Error exporting submission:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}