import dbConnect from "@/lib/db";
import TeamLead from "@/models/TeamLead";
import Department from "@/models/Department"; // <-- important

export async function GET(req, res) {
  try {
    await dbConnect();
    const teamleads = await TeamLead.find({})
      .populate("depId", "name")
      .select("firstName lastName email depId")
      .sort({ firstName: 1 });

    return res.status(200).json({
      success: true,
      teamleads,
    });
  } catch (error) {
    console.error("TeamLeads fetch error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch teamleads",
    });
  }
}
