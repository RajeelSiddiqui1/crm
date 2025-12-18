import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import connectDB from "@/lib/db";
import TeamLead from "@/models/TeamLead";
import { authOptions } from "@/lib/auth";
import Department from "@/models/Department";

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "TeamLead") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    // Logged in team lead کی معلومات حاصل کریں
    const currentTeamLead = await TeamLead.findOne({ email: session.user.email });
    if (!currentTeamLead) {
      return NextResponse.json({ error: "Team lead not found" }, { status: 404 });
    }

    // دوسرے team leads جن کا department مختلف ہو
    const otherTeamLeads = await TeamLead.find({
      _id: { $ne: currentTeamLead._id }
    })
    .select("-password -otp -otpExpiry")
    .populate({
      path: 'depId',
      select: 'name'
    })
    .sort({ firstName: 1 });

    return NextResponse.json({
      currentTeamLead: {
        _id: currentTeamLead._id,
        firstName: currentTeamLead.firstName,
        lastName: currentTeamLead.lastName,
        email: currentTeamLead.email,
        depId: currentTeamLead.depId
      },
      teamLeads: otherTeamLeads
    }, { status: 200 });

  } catch (error) {
    console.error("Error fetching team leads:", error);
    return NextResponse.json({ error: "Failed to fetch team leads" }, { status: 500 });
  }
}