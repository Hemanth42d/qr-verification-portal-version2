import Template from "../models/template-model.js";
import User from "../models/user-model.js";
import fs from "fs";
import path from "path";

/**
 * Create a new certificate template
 * POST /api/templates
 */
export const createTemplate = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: "Template image is required" });
    }

    const { templateName, nameX, nameY, nameFontSize, nameFontFamily, nameColor, qrX, qrY, qrSize } =
        req.body;

    if (!templateName) {
        return res.status(400).json({ message: "Template name is required" });
    }

    if (nameX === undefined || nameY === undefined || qrX === undefined || qrY === undefined) {
        return res.status(400).json({
            message: "Name position (nameX, nameY) and QR position (qrX, qrY) are required",
        });
    }

    const template = await Template.create({
        templateName,
        templateImage: path.relative(
            path.resolve(process.cwd()),
            req.file.path
        ),
        ownerUserId: req.user._id,
        namePosition: {
            x: parseFloat(nameX),
            y: parseFloat(nameY),
            fontSize: parseInt(nameFontSize) || 36,
            fontFamily: nameFontFamily || "Helvetica",
            color: nameColor || "#1a1a2e",
        },
        qrPosition: {
            x: parseFloat(qrX),
            y: parseFloat(qrY),
            size: parseInt(qrSize) || 100,
        },
    });

    // Add template to user
    await User.findByIdAndUpdate(req.user._id, {
        $push: { templates: template._id },
    });

    res.status(201).json({
        message: "Template created successfully",
        template,
    });
};

/**
 * Get all templates for current user
 * GET /api/templates
 */
export const getTemplates = async (req, res) => {remove custome css and use utility class for evry styling
    const templates = await Template.find({ ownerUserId: req.user._id }).sort({
        createdAt: -1,
    });

    res.json({ templates });
};

/**
 * Get a single template
 * GET /api/templates/:id
 */
export const getTemplate = async (req, res) => {
    const template = await Template.findOne({
        _id: req.params.id,
        ownerUserId: req.user._id,
    });

    if (!template) {
        return res.status(404).json({ message: "Template not found" });
    }

    res.json({ template });
};

/**
 * Delete a template
 * DELETE /api/templates/:id
 */
export const deleteTemplate = async (req, res) => {
    const template = await Template.findOneAndDelete({
        _id: req.params.id,
        ownerUserId: req.user._id,
    });

    if (!template) {
        return res.status(404).json({ message: "Template not found" });
    }

    // Remove from user's templates
    await User.findByIdAndUpdate(req.user._id, {
        $pull: { templates: template._id },
    });

    // Delete template image file
    try {
        const filePath = path.resolve(process.cwd(), template.templateImage);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch {
        // non-critical
    }

    res.json({ message: "Template deleted successfully" });
};

/**
 * Serve template image
 * GET /api/templates/:id/image
 */
export const getTemplateImage = async (req, res) => {
    const template = await Template.findOne({
        _id: req.params.id,
        ownerUserId: req.user._id,
    });

    if (!template) {
        return res.status(404).json({ message: "Template not found" });
    }

    const filePath = path.resolve(process.cwd(), template.templateImage);
    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: "Template image file not found" });
    }

    res.sendFile(filePath);
};
