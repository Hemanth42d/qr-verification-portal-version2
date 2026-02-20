export const validateRegistration = (req, res, next) => {
  const { name, email, password } = req.body;
  const errors = [];

  if (!name || name.trim().length < 2) errors.push("Name must be at least 2 characters");
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push("Valid email is required");
  if (!password || password.length < 6) errors.push("Password must be at least 6 characters");

  if (errors.length) return res.status(400).json({ message: "Validation failed", errors });
  next();
};

export const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = [];

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push("Valid email is required");
  if (!password) errors.push("Password is required");

  if (errors.length) return res.status(400).json({ message: "Validation failed", errors });
  next();
};

export const validateTemplate = (req, res, next) => {
  const { templateName, namePosition, qrPosition } = req.body;
  const errors = [];

  if (!templateName || templateName.trim().length < 1) errors.push("Template name is required");
  if (!req.file) errors.push("Template image is required");

  try {
    const namePos = typeof namePosition === "string" ? JSON.parse(namePosition) : namePosition;
    const qrPos = typeof qrPosition === "string" ? JSON.parse(qrPosition) : qrPosition;

    if (!namePos || typeof namePos.x !== "number" || typeof namePos.y !== "number") {
      errors.push("Valid name position (x, y) is required");
    }
    if (!qrPos || typeof qrPos.x !== "number" || typeof qrPos.y !== "number") {
      errors.push("Valid QR position (x, y) is required");
    }
  } catch {
    errors.push("Invalid position data format");
  }

  if (errors.length) return res.status(400).json({ message: "Validation failed", errors });
  next();
};

export const validateCertificateGeneration = (req, res, next) => {
  const { templateId, participantName, email, eventName, eventDate, venue } = req.body;
  const errors = [];

  if (!templateId) errors.push("Template ID is required");
  if (!participantName) errors.push("Participant name is required");
  if (!email) errors.push("Email is required");
  if (!eventName) errors.push("Event name is required");
  if (!eventDate) errors.push("Event date is required");
  if (!venue) errors.push("Venue is required");

  if (errors.length) return res.status(400).json({ message: "Validation failed", errors });
  next();
};
