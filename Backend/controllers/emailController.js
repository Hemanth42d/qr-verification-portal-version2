import { v4 as uuidv4 } from "uuid";
import Certificate from "../models/Certificate.js";
import EmailService from "../services/EmailService.js";
import BatchProcessorService from "../services/BatchProcessorService.js";

export const sendBulkEmails = async (req, res) => {
  try {
    const { certificateIds, customBody } = req.body;

    if (!certificateIds || !Array.isArray(certificateIds) || certificateIds.length === 0) {
      return res.status(400).json({ message: "Certificate IDs array is required" });
    }

    const certificates = await Certificate.find({
      certificateId: { $in: certificateIds },
      issuedBy: req.user._id,
      emailSent: false,
    });

    if (certificates.length === 0) {
      return res.status(404).json({ message: "No unsent certificates found" });
    }

    const jobId = uuidv4();

    BatchProcessorService.processBatch(
      jobId,
      certificates,
      async (cert) => {
        await EmailService.sendCertificateEmail(cert, customBody || null);
        cert.emailSent = true;
        await cert.save();
        return { certificateId: cert.certificateId, email: cert.email };
      },
      { batchSize: 5, delayMs: 1000 }
    );

    res.status(202).json({
      message: "Email sending started",
      jobId,
      totalEmails: certificates.length,
    });
  } catch (error) {
    res.status(500).json({ message: "Email sending failed", error: error.message });
  }
};

export const sendEmailsByEvent = async (req, res) => {
  try {
    const { eventName, customBody } = req.body;

    if (!eventName) return res.status(400).json({ message: "Event name is required" });

    const certificates = await Certificate.find({
      eventName,
      issuedBy: req.user._id,
      emailSent: false,
    });

    if (certificates.length === 0) {
      return res.status(404).json({ message: "No unsent certificates found for this event" });
    }

    const jobId = uuidv4();

    BatchProcessorService.processBatch(
      jobId,
      certificates,
      async (cert) => {
        await EmailService.sendCertificateEmail(cert, customBody || null);
        cert.emailSent = true;
        await cert.save();
        return { certificateId: cert.certificateId, email: cert.email };
      },
      { batchSize: 3, delayMs: 2000 }
    );

    res.status(202).json({
      message: "Email sending started",
      jobId,
      totalEmails: certificates.length,
    });
  } catch (error) {
    res.status(500).json({ message: "Email sending failed", error: error.message });
  }
};

export const getEmailJobStatus = async (req, res) => {
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
