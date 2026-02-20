import mongoose from "mongoose";

const certificateSchema = new mongoose.Schema(
  {
    certificateId: { type: String, required: true, unique: true, index: true },
    participantName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    eventName: { type: String, required: true, trim: true },
    eventDate: { type: String, required: true },
    venue: { type: String, required: true, trim: true },
    driveFileId: { type: String, default: null },
    driveLink: { type: String, default: null },
    templateId: { type: mongoose.Schema.Types.ObjectId, ref: "Template", required: true },
    issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    emailSent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

certificateSchema.index({ eventName: 1 });
certificateSchema.index({ email: 1 });

export default mongoose.model("Certificate", certificateSchema);
