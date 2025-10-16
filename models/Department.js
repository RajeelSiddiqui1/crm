import mongoose from "mongoose";

const departmentSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: false
    },
    logoUrl: {
        type: String,
        required: false
    }
}, {
    timestamps: true
})

const Department = mongoose.models.Department || mongoose.model("Department", departmentSchema)

export default Department;