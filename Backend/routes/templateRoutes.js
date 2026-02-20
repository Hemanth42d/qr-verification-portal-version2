import { Router } from "express";
import { createTemplate, getTemplates, getTemplateById, getTemplateImage, updateTemplate, deleteTemplate } from "../controllers/templateController.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { uploadTemplate } from "../middleware/upload.js";

const router = Router();

router.use(authenticate, authorize("admin"));

router.post("/", uploadTemplate.single("templateImage"), createTemplate);
router.get("/", getTemplates);
router.get("/:id", getTemplateById);
router.get("/:id/image", getTemplateImage);
router.put("/:id", uploadTemplate.single("templateImage"), updateTemplate);
router.delete("/:id", deleteTemplate);

export default router;
