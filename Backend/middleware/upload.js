import multer from "multer";

const templateStorage = multer.memoryStorage();

export const uploadTemplate = multer({
  storage: templateStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ["image/png", "image/jpeg", "image/jpg"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only PNG and JPEG images are allowed"), false);
    }
  },
});

export const uploadCSV = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = [
      "text/csv",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];
    if (allowed.includes(file.mimetype) || file.originalname.match(/\.(csv|xlsx)$/i)) {
      cb(null, true);
    } else {
      cb(new Error("Only CSV and XLSX files are allowed"), false);
    }
  },
});
