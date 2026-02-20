import mongoose from "mongoose";

const templateSchema = new mongoose.Schema(
  {
    templateName: { type: String, required: true, trim: true },
    templateImage: { type: Buffer, required: true },
    templateMimeType: { type: String, required: true },
    ownerUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    namePosition: {
      x: { type: Number, required: true },
      y: { type: Number, required: true },
      fontSize: { type: Number, default: 36 },
      fontFamily: { type: String, default: "Helvetica" },
      color: { type: String, default: "#000000" },
    },
    qrPosition: {
      x: { type: Number, required: true },
      y: { type: Number, required: true },
      size: { type: Number, default: 100 },
    },
  },
  { timestamps: true }
);

export default mongoose.model("Template", templateSchema);
