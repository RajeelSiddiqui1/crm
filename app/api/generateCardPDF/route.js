import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb, degrees } from "pdf-lib";
import QRCode from "qrcode";
import Manager from "@/models/Manager";
import TeamLead from "@/models/TeamLead";
import Employee from "@/models/Employee";
import Department from "@/models/Department";
import dbConnect from "@/lib/db";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const role = searchParams.get("role");

    if (!id || !role)
      return NextResponse.json({ error: "Missing id or role" }, { status: 400 });

    await dbConnect();

    const roleMap = { Manager, TeamLead, Employee };
    const Model = roleMap[role];
    if (!Model)
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });

    const user = await Model.findById(id);
    if (!user)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    // ✅ Department logic
    let departmentNames = "N/A";
    if (role === "Manager" && Array.isArray(user.departments) && user.departments.length > 0) {
      const deps = await Department.find({ _id: { $in: user.departments } });
      departmentNames = deps.map((d) => d.name).join(", ") || "N/A";
    } else if ((role === "TeamLead" || role === "Employee") && user.depId) {
      const dep = await Department.findById(user.depId);
      departmentNames = dep ? dep.name : "N/A";
    }

    // ✅ Get Employee ID based on role
    let employeeId = "N/A";
    if (role === "Employee" && user.userId) {
      employeeId = user.userId;
    } else if (role === "TeamLead" && user.userId) {
      employeeId = user.userId;
    } else if (role === "Manager") {
      employeeId = `MGR-${id.slice(-6).toUpperCase()}`;
    }

    // ✅ QR Code
    const qrData = `${process.env.NEXT_PUBLIC_BASE_URL}/api/attendance/scan?id=${id}&role=${role}`;
    const qrImageData = await QRCode.toDataURL(qrData);
    const qrImageBytes = Buffer.from(qrImageData.split(",")[1], "base64");

    // ✅ Load Company Logo for watermark
    let logoBytes = null;
    try {
      const logoPath = path.join(process.cwd(), 'public', 'office', 'mh.png');
      logoBytes = fs.readFileSync(logoPath);
    } catch (error) {
      console.warn("Company logo not found");
    }

    // ✅ Create PDF
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontLight = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

    const cardWidth = 350;
    const cardHeight = 220;
    
    // Clean color scheme - no blue
    const textColor = rgb(0.2, 0.2, 0.2);
    const lightText = rgb(0.4, 0.4, 0.4);
    const accentColor = rgb(0.83, 0.69, 0.22); // Gold for highlights only

    // Office contact details
    const officePhone = "+92 627226 276272";
    const officeEmail = "mhn@enterpieses.com";

    // ===================
    // FRONT SIDE - Clean Design
    // ===================
    const front = pdfDoc.addPage([cardWidth, cardHeight]);

    // White background
    front.drawRectangle({
      x: 0,
      y: 0,
      width: cardWidth,
      height: cardHeight,
      color: rgb(1, 1, 1),
    });

    // Watermark logo - light background
    if (logoBytes) {
      try {
        const logoImage = await pdfDoc.embedPng(logoBytes);
        // Large centered watermark
        front.drawImage(logoImage, {
          x: cardWidth / 2 - 75,
          y: cardHeight / 2 - 75,
          width: 150,
          height: 150,
          opacity: 0.1, // Very light watermark
        });
      } catch (error) {
        console.warn("Failed to embed logo watermark");
      }
    }

    // Employee photo area - simple circle
    const photoX = 40;
    const photoY = cardHeight - 80;
    
    // Simple circle
    front.drawCircle({
      x: photoX,
      y: photoY,
      size: 25,
      color: rgb(0.95, 0.95, 0.95), // Light gray
      borderColor: rgb(0.8, 0.8, 0.8),
      borderWidth: 1,
    });

    // Employee initials
    const initials = `${(user.firstName?.[0] || user.name?.[0] || "?").toUpperCase()}${(user.lastName?.[0] || "").toUpperCase()}`;
    front.drawText(initials, {
      x: photoX - 7,
      y: photoY - 5,
      size: 12,
      font: fontBold,
      color: textColor,
    });

    // Employee info section
    const infoX = 100;
    let infoY = cardHeight - 60;

    // Employee Name
    const fullName = `${user.firstName || user.name || ""} ${user.lastName || ""}`.trim();
    front.drawText(fullName.toUpperCase(), {
      x: infoX,
      y: infoY,
      size: 16,
      font: fontBold,
      color: textColor,
    });
    infoY -= 25;

    // Employee ID
    front.drawText(`Employee ID: ${employeeId}`, {
      x: infoX,
      y: infoY,
      size: 10,
      font: fontBold,
      color: accentColor,
    });
    infoY -= 20;

    // Other details
    const details = [
      { label: "Department:", value: departmentNames },
      { label: "Position:", value: role },
      { label: "Email:", value: user.email },
    ];

    details.forEach(detail => {
      // Label
      front.drawText(detail.label, {
        x: infoX,
        y: infoY,
        size: 9,
        font: fontBold,
        color: textColor,
      });
      
      // Value
      front.drawText(detail.value, {
        x: infoX + 70,
        y: infoY,
        size: 9,
        font: font,
        color: textColor,
      });
      
      infoY -= 16;
    });

    // Valid until - bottom
    const validUntil = new Date();
    validUntil.setFullYear(validUntil.getFullYear() + 2);
    const validText = `Valid Until: ${validUntil.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`;
    
    front.drawText(validText, {
      x: cardWidth - 120,
      y: 20,
      size: 7,
      font: fontLight,
      color: lightText,
    });

    // ===================
    // BACK SIDE - Clean Layout
    // ===================
    const back = pdfDoc.addPage([cardWidth, cardHeight]);

    // White background
    back.drawRectangle({
      x: 0,
      y: 0,
      width: cardWidth,
      height: cardHeight,
      color: rgb(1, 1, 1),
    });

    // Watermark logo - light background
    if (logoBytes) {
      try {
        const logoImage = await pdfDoc.embedPng(logoBytes);
        // Large centered watermark
        back.drawImage(logoImage, {
          x: cardWidth / 2 - 75,
          y: cardHeight / 2 - 75,
          width: 150,
          height: 150,
          opacity: 0.1, // Very light watermark
        });
      } catch (error) {
        console.warn("Failed to embed logo watermark");
      }
    }

    // Contact Information Title
    back.drawText("CONTACT INFORMATION", {
      x: cardWidth / 2 - 70,
      y: cardHeight - 40,
      size: 14,
      font: fontBold,
      color: textColor,
    });

    // Contact details - LEFT SIDE
    let contactY = cardHeight - 70;
    
    const contactDetails = [
      { label: "Email:", value: user.email },
      { label: "Phone:", value: user.phone || "Not Provided" },
    ];

    contactDetails.forEach(detail => {
      back.drawText(detail.label, {
        x: 40,
        y: contactY,
        size: 9,
        font: fontBold,
        color: textColor,
      });
      
      back.drawText(detail.value, {
        x: 90,
        y: contactY,
        size: 9,
        font: font,
        color: textColor,
      });
      
      contactY -= 20;
    });

    // Office Contact
    contactY -= 10;
    back.drawText("OFFICE CONTACT", {
      x: 40,
      y: contactY,
      size: 10,
      font: fontBold,
      color: textColor,
    });
    
    contactY -= 15;
    back.drawText(officePhone, {
      x: 40,
      y: contactY,
      size: 9,
      font: font,
      color: textColor,
    });
    
    contactY -= 12;
    back.drawText(officeEmail, {
      x: 40,
      y: contactY,
      size: 9,
      font: font,
      color: textColor,
    });

    // QR Code - RIGHT SIDE
    const qrImage = await pdfDoc.embedPng(qrImageBytes);
    
    back.drawImage(qrImage, {
      x: cardWidth - 110,
      y: 80,
      width: 80,
      height: 80,
    });

    // QR Code label
    back.drawText("SCAN FOR ATTENDANCE", {
      x: cardWidth - 105,
      y: 65,
      size: 8,
      font: fontBold,
      color: textColor,
    });

    // Footer - CENTERED
    back.drawText("This card is property of MN Enterprises. If found, please contact HR.", {
      x: cardWidth / 2 - 150,
      y: 25,
      size: 7,
      font: fontLight,
      color: lightText,
    });

    // ✅ Final Output
    const pdfBytes = await pdfDoc.save();
    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${(user.firstName || user.name)}_ID_Card.pdf"`,
      },
    });
  } catch (error) {
    console.error("PDF Generation Error:", error);
    return NextResponse.json({ error: "Failed to generate PDF", details: error.message }, { status: 500 });
  }
}