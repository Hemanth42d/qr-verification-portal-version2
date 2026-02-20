import { v4 as uuidv4 } from "uuid";
import Template from "../models/Template.js";
import Certificate from "../models/Certificate.js";
import CertificateGenerationService from "../services/CertificateGenerationService.js";
import GoogleDriveService from "../services/GoogleDriveService.js";
import BatchProcessorService from "../services/BatchProcessorService.js";
import { parseParticipantFile } from "../utils/parseFile.js";

export const generateBulk = async (req, res) => {
  try {
    const { templateId, eventName, eventDate, venue } = req.body;

    if (!req.file) return res.status(400).json({ message: "CSV/XLSX file is required" });

    const template = await Template.findOne({ _id: templateId, ownerUserId: req.user._id });
    if (!template) return res.status(404).json({ message: "Template not found" });

    // Parse uploaded file
    let participants;
    try {
      participants = parseParticipantFile(req.file.buffer, req.file.mimetype, req.file.originalname);
    } catch (parseError) {
      return res.status(400).json({ message: "File parsing failed", error: parseError.message });
    }

    // Override event details if provided in request body
    if (eventName || eventDate || venue) {
      participants = participants.map((p) => ({
        ...p,
        eventName: eventName || p.eventName,
        eventDate: eventDate || p.eventDate,
        venue: venue || p.venue,
      }));
    }

    const jobId = uuidv4();

    // Start batch processing (non-blocking)
    BatchProcessorService.processBatch(
      jobId,
      participants,
      async (participant) => {
        // Check for duplicate custom ID
        const customId = participant.certificateId || null;
        if (customId) {
          const existing = await Certificate.findOne({ certificateId: customId });
          if (existing) throw new Error(`Certificate ID "${customId}" already exists`);
        }

        const { certificateId, pdfBuffer } = await CertificateGenerationService.generateCertificate(
          template,
          participant,
          customId
        );

        let driveData = { driveFileId: null, driveLink: null };
        try {
          driveData = await GoogleDriveService.uploadCertificate(
            pdfBuffer,
            certificateId,
            participant.eventName
          );
        } catch (driveError) {
          // Drive upload failed — continue without link
        }

        const certificate = await Certificate.create({
          certificateId,
          participantName: participant.participantName,
          email: participant.email,
          eventName: participant.eventName,
          eventDate: participant.eventDate,
          venue: participant.venue,
          driveFileId: driveData.driveFileId,
          driveLink: driveData.driveLink,
          templateId: template._id,
          issuedBy: req.user._id,
        });

        return certificate;
      },
      { batchSize: 3, delayMs: 1000 }
    );

    res.status(202).json({
      message: "Bulk generation started",
      jobId,
      totalParticipants: participants.length,
    });
  } catch (error) {
    res.status(500).json({ message: "Bulk generation failed", error: error.message });
  }
};

export const getJobStatus = async (req, res) => {
  const job = BatchProcessorService.getJobStatus(req.params.jobId);
  if (!job) return res.status(404).json({ message: "Job not found" });

  res.json({
    status: job.status,
    total: job.total,
    processed: job.processed,
    failed: job.failed,
    errors: job.errors.slice(0, 10),
  });
};

export const getCertificates = async (req, res) => {
  try {
    const { eventName, page = 1, limit = 20 } = req.query;
    const query = { issuedBy: req.user._id };
    if (eventName) query.eventName = { $regex: eventName, $options: "i" };

    const certificates = await Certificate.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Certificate.countDocuments(query);

    res.json({ certificates, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch certificates", error: error.message });
  }
};

export const getCertificateBatches = async (req, res) => {
  try {
    const batches = await Certificate.aggregate([
      { $match: { issuedBy: req.user._id } },
      {
        $group: {
          _id: { eventName: "$eventName", eventDate: "$eventDate", venue: "$venue" },
          total: { $sum: 1 },
          emailsSent: { $sum: { $cond: ["$emailSent", 1, 0] } },
          emailsPending: { $sum: { $cond: ["$emailSent", 0, 1] } },
          createdAt: { $min: "$createdAt" },
          certificateIds: { $push: "$certificateId" },
        },
      },
      { $sort: { createdAt: -1 } },
    ]);

    const formatted = batches.map((b) => ({
      eventName: b._id.eventName,
      eventDate: b._id.eventDate,
      venue: b._id.venue,
      total: b.total,
      emailsSent: b.emailsSent,
      emailsPending: b.emailsPending,
      createdAt: b.createdAt,
      certificateIds: b.certificateIds,
    }));

    res.json({ batches: formatted });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch batches", error: error.message });
  }
};

export const deleteBatch = async (req, res) => {
  try {
    const { eventName, eventDate, venue } = req.body;
    if (!eventName) return res.status(400).json({ message: "Event name is required" });

    const query = { issuedBy: req.user._id, eventName };
    if (eventDate) query.eventDate = eventDate;
    if (venue) query.venue = venue;

    const result = await Certificate.deleteMany(query);

    res.json({ message: `Deleted ${result.deletedCount} certificates`, deletedCount: result.deletedCount });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete batch", error: error.message });
  }
};

export const verifyCertificate = async (req, res) => {
  try {
    const { certificateId } = req.params;
    const certificate = await Certificate.findOne({ certificateId }).select(
      "certificateId participantName email eventName eventDate venue driveLink driveFileId createdAt"
    );

    if (!certificate) {
      return res.status(404).json({ message: "Certificate not found", valid: false });
    }

    res.json({ valid: true, certificate });
  } catch (error) {
    res.status(500).json({ message: "Verification failed", error: error.message });
  }
};

/**
 * Re-generate Drive links for certificates that have null driveLink.
 * Re-creates the PDF and uploads to Drive.
 */
export const regenerateDriveLinks = async (req, res) => {
  try {
    const { eventName, eventDate, venue } = req.body;
    if (!eventName) return res.status(400).json({ message: "Event name is required" });

    const query = { issuedBy: req.user._id, eventName, driveLink: null };
    if (eventDate) query.eventDate = eventDate;
    if (venue) query.venue = venue;

    const certs = await Certificate.find(query).populate("templateId");
    if (certs.length === 0) return res.json({ message: "No certificates need re-upload", updated: 0 });

    let updated = 0;
    let errors = [];

    for (const cert of certs) {
      try {
        if (!cert.templateId) {
          errors.push({ certificateId: cert.certificateId, error: "Template not found" });
          continue;
        }

        const participant = {
          participantName: cert.participantName,
          email: cert.email,
          eventName: cert.eventName,
          eventDate: cert.eventDate,
          venue: cert.venue,
        };

        const { pdfBuffer } = await CertificateGenerationService.generateCertificate(
          cert.templateId,
          participant,
          cert.certificateId
        );

        const driveData = await GoogleDriveService.uploadCertificate(
          pdfBuffer,
          cert.certificateId,
          cert.eventName
        );

        cert.driveFileId = driveData.driveFileId;
        cert.driveLink = driveData.driveLink;
        await cert.save();
        updated++;
      } catch (err) {
        errors.push({ certificateId: cert.certificateId, error: err.message });
      }
    }

    res.json({ message: `Re-uploaded ${updated}/${certs.length} certificates`, updated, errors });
  } catch (error) {
    res.status(500).json({ message: "Re-upload failed", error: error.message });
  }
};
