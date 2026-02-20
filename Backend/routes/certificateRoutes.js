import { Router } from "express";
import { generateSingle } from "../controllers/certificateController.js";
import { generateBulk, getJobStatus, getCertificates, getCertificateBatches, deleteBatch, verifyCertificate, regenerateDriveLinks } from "../controllers/certificateController2.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { uploadCSV } from "../middleware/upload.js";
import { validateCertificateGeneration } from "../middleware/validate.js";

const router = Router();

// Public verification route
router.get("/verify/:certificateId", verifyCertificate);

// Protected admin routes
router.use(authenticate, authorize("admin"));

router.post("/generate", validateCertificateGeneration, generateSingle);
router.post("/generate-bulk", uploadCSV.single("file"), generateBulk);
router.get("/job/:jobId", getJobStatus);
router.get("/batches", getCertificateBatches);
router.post("/delete-batch", deleteBatch);
router.post("/regenerate-drive-links", regenerateDriveLinks);
router.get("/", getCertificates);

export default router;
