import Template from "../models/Template.js";
import User from "../models/User.js";

export const createTemplate = async (req, res) => {
  try {
    const { templateName, namePosition, qrPosition } = req.body;

    const namePos = typeof namePosition === "string" ? JSON.parse(namePosition) : namePosition;
    const qrPos = typeof qrPosition === "string" ? JSON.parse(qrPosition) : qrPosition;

    const template = await Template.create({
      templateName,
      templateImage: req.file.buffer,
      templateMimeType: req.file.mimetype,
      ownerUserId: req.user._id,
      namePosition: namePos,
      qrPosition: qrPos,
    });

    // Add template to user's templates array
    await User.findByIdAndUpdate(req.user._id, { $push: { templates: template._id } });

    res.status(201).json({
      message: "Template created",
      template: {
        id: template._id,
        templateName: template.templateName,
        namePosition: template.namePosition,
        qrPosition: template.qrPosition,
        createdAt: template.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to create template", error: error.message });
  }
};

export const getTemplates = async (req, res) => {
  try {
    const templates = await Template.find({ ownerUserId: req.user._id })
      .select("-templateImage")
      .sort({ createdAt: -1 });

    res.json({ templates });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch templates", error: error.message });
  }
};

export const getTemplateById = async (req, res) => {
  try {
    const template = await Template.findOne({
      _id: req.params.id,
      ownerUserId: req.user._id,
    }).select("-templateImage");

    if (!template) return res.status(404).json({ message: "Template not found" });

    res.json({ template });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch template", error: error.message });
  }
};

export const getTemplateImage = async (req, res) => {
  try {
    const template = await Template.findById(req.params.id).select("templateImage templateMimeType");
    if (!template) return res.status(404).json({ message: "Template not found" });

    res.set("Content-Type", template.templateMimeType);
    res.send(template.templateImage);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch template image", error: error.message });
  }
};

export const updateTemplate = async (req, res) => {
  try {
    const { templateName, namePosition, qrPosition } = req.body;

    const template = await Template.findOne({ _id: req.params.id, ownerUserId: req.user._id });
    if (!template) return res.status(404).json({ message: "Template not found" });

    if (templateName) template.templateName = templateName;

    if (namePosition) {
      const namePos = typeof namePosition === "string" ? JSON.parse(namePosition) : namePosition;
      template.namePosition = namePos;
    }

    if (qrPosition) {
      const qrPos = typeof qrPosition === "string" ? JSON.parse(qrPosition) : qrPosition;
      template.qrPosition = qrPos;
    }

    // Update image if a new one was uploaded
    if (req.file) {
      template.templateImage = req.file.buffer;
      template.templateMimeType = req.file.mimetype;
    }

    await template.save();

    res.json({
      message: "Template updated",
      template: {
        _id: template._id,
        templateName: template.templateName,
        namePosition: template.namePosition,
        qrPosition: template.qrPosition,
        createdAt: template.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to update template", error: error.message });
  }
};

export const deleteTemplate = async (req, res) => {
  try {
    const template = await Template.findOneAndDelete({
      _id: req.params.id,
      ownerUserId: req.user._id,
    });

    if (!template) return res.status(404).json({ message: "Template not found" });

    await User.findByIdAndUpdate(req.user._id, { $pull: { templates: template._id } });

    res.json({ message: "Template deleted" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete template", error: error.message });
  }
};
