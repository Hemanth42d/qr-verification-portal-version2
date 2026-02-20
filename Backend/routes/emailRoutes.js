import { Router } from "express";
import { sendBulkEmails, sendEmailsByEvent, getEmailJobStatus } from "../controllers/emailController.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = Router();

router.use(authenticate, authorize("admin"));

router.post("/send-bulk", sendBulkEmails);
router.post("/send-by-event", sendEmailsByEvent);
router.get("/job/:jobId", getEmailJobStatus);

export default router;
