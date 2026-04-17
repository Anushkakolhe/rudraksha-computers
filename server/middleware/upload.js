const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (_req, file) => {
    const isImage = ["image/jpeg", "image/png"].includes(file.mimetype);
    return {
      folder: "notes",
      // "raw" ensures PDFs/DOCs are stored under /raw/upload/ with correct
      // content-type headers. "image" for actual images.
      resource_type: isImage ? "image" : "raw",
    };
  },
});

const fileFilter = (_req, file, cb) => {
  const allowedMimes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "image/jpeg",
    "image/png",
  ];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only PDF, DOC, DOCX, PPT, PPTX, and images are allowed"), false);
  }
};

const upload = multer({ storage, fileFilter });

module.exports = upload;
