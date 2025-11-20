const multer = require("multer");
const path = require("path");
const fs = require("fs").promises;

// Configure multer for course thumbnail upload
const courseThumbnailStorage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../../uploads/courses/thumbnails");
    try {
      await fs.mkdir(uploadPath, { recursive: true });
      cb(null, uploadPath);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      `course-thumbnail-${uniqueSuffix}${path.extname(file.originalname)}`
    );
  },
});

// Configure multer for lesson video upload
const lessonVideoStorage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../../uploads/courses/videos");
    try {
      await fs.mkdir(uploadPath, { recursive: true });
      cb(null, uploadPath);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      `lesson-video-${uniqueSuffix}${path.extname(file.originalname)}`
    );
  },
});

// File filter for course thumbnails (images only)
const courseThumbnailFilter = (req, file, cb) => {
  const allowedImageTypes = /jpeg|jpg|png|gif|webp/;
  const extname = path.extname(file.originalname).toLowerCase().replace(".", "");

  if (allowedImageTypes.test(extname)) {
    return cb(null, true);
  }

  cb(
    new Error(
      "File type not allowed. Only images (jpeg, jpg, png, gif, webp) are allowed."
    )
  );
};

// File filter for lesson videos
const lessonVideoFilter = (req, file, cb) => {
  const allowedVideoTypes = /mp4|webm|ogg|mov|avi/;
  const extname = path.extname(file.originalname).toLowerCase().replace(".", "");

  if (allowedVideoTypes.test(extname)) {
    return cb(null, true);
  }

  cb(
    new Error(
      "File type not allowed. Only videos (mp4, webm, ogg, mov, avi) are allowed."
    )
  );
};

// Multer instances
const courseThumbnailUpload = multer({
  storage: courseThumbnailStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for images
  },
  fileFilter: courseThumbnailFilter,
});

const lessonVideoUpload = multer({
  storage: lessonVideoStorage,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB limit for videos
  },
  fileFilter: lessonVideoFilter,
});

// Upload course thumbnail
const uploadCourseThumbnail = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    // Get base URL from request or environment
    const protocol = req.protocol || 'http';
    const host = req.get('host') || process.env.API_HOST || 'localhost:3000';
    const baseUrl = process.env.API_BASE_URL || `${protocol}://${host}`;
    
    // Return full URL for production, relative URL for development (with proxy)
    const fileUrl = process.env.NODE_ENV === 'production' 
      ? `${baseUrl}/uploads/courses/thumbnails/${req.file.filename}`
      : `/uploads/courses/thumbnails/${req.file.filename}`;
    
    const fileSize = req.file.size;
    const fileName = req.file.originalname;

    res.status(200).json({
      success: true,
      data: {
        file_url: fileUrl,
        file_name: fileName,
        file_size: fileSize,
        type: "image",
      },
    });
  } catch (error) {
    console.error("Error uploading course thumbnail:", error);
    // Clean up uploaded file on error
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (cleanupError) {
        console.error("Error cleaning up file:", cleanupError);
      }
    }
    res.status(500).json({
      success: false,
      message: "Failed to upload course thumbnail",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Upload lesson video
const uploadLessonVideo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    // Get base URL from request or environment
    const protocol = req.protocol || 'http';
    const host = req.get('host') || process.env.API_HOST || 'localhost:3000';
    const baseUrl = process.env.API_BASE_URL || `${protocol}://${host}`;
    
    // Return full URL for production, relative URL for development (with proxy)
    const fileUrl = process.env.NODE_ENV === 'production' 
      ? `${baseUrl}/uploads/courses/videos/${req.file.filename}`
      : `/uploads/courses/videos/${req.file.filename}`;
    
    const fileSize = req.file.size;
    const fileName = req.file.originalname;

    res.status(200).json({
      success: true,
      data: {
        file_url: fileUrl,
        file_name: fileName,
        file_size: fileSize,
        type: "video",
      },
    });
  } catch (error) {
    console.error("Error uploading lesson video:", error);
    // Clean up uploaded file on error
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (cleanupError) {
        console.error("Error cleaning up file:", cleanupError);
      }
    }
    res.status(500).json({
      success: false,
      message: "Failed to upload lesson video",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

module.exports = {
  courseThumbnailUpload,
  lessonVideoUpload,
  uploadCourseThumbnail,
  uploadLessonVideo,
};

