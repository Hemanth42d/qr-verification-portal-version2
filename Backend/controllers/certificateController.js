import { v4 as uuidv4 } from "uuid";
import Template from "../models/Template.js";
import Certificate from "../models/Certificate.js";
import CertificateGenerationService from "../services/CertificateGenerationService.js";
import GoogleDriveService from "../services/GoogleDriveService.js";
import BatchProcessorService from "../services/BatchProcessorService.js";
import { parseParticipantFile } from "../utils/parseFile.js";

export const generateSingle = async (req, res) => {
  try {
    const { templateId, participantName, email, eventName, eventDate, venue, certificateId: customId } = req.body;

    const template = await Template.findOne({ _id: templateId, ownerUserId: req.user._id });
    if (!template) return res.status(404).json({ message: "Template not found" });

    // Check for duplicate custom ID
    if (customId) {
      const existing = await Certificate.findOne({ certificateId: customId });
      if (existing) return res.status(409).json({ message: "Certificate ID already exists" });
    }

    const participant = { participantName, email, eventName, eventDate, venue };

    // Generate certificate PDF
    const { certificateId, pdfBuffer } = await CertificateGenerationService.generateCertificate(
      template,
      participant,
      customId || null
    );

    // Upload to Google Drive
    let driveData = { driveFileId: null, driveLink: null };
    try {
      driveData = await GoogleDriveService.uploadCertificate(pdfBuffer, certificateId, eventName);
    } catch (driveError) {
      // Drive upload failed — certificate still saved without download link
    }

    // Save metadata to DB
    const certificate = await Certificate.create({
      certificateId,
      participantName,
      email,
      eventName,
      eventDate,
      venue,
      driveFileId: driveData.driveFileId,
      driveLink: driveData.driveLink,
      templateId: template._id,
      issuedBy: req.user._id,
    });

    res.status(201).json({ message: "Certificate generated", certificate });
  } catch (error) {
    res.status(500).json({ message: "Certificate generation failed", error: error.message });
  }
};
