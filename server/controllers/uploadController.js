const { isCloudinaryConfigured, uploadToCloudinary } = require('../config/cloudinary');

// @desc    Upload single file / image
// @route   POST /api/uploads/single
// @access  Private
const uploadSingle = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }

    let fileUrl = `/uploads/${req.file.filename}`;

    // If Cloudinary credentials are set, upload to cloud
    if (isCloudinaryConfigured()) {
      const cloudUrl = await uploadToCloudinary(req.file.path, 'teams-chat-attachments');
      if (cloudUrl) {
        fileUrl = cloudUrl;
      }
    }

    return res.status(200).json({
      success: true,
      file: {
        url: fileUrl,
        name: req.file.originalname,
        size: req.file.size,
        mimeType: req.file.mimetype,
      },
    });
  } catch (error) {
    console.error('Upload single error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during file upload.',
    });
  }
};

// @desc    Upload multiple files
// @route   POST /api/uploads/multiple
// @access  Private
const uploadMultiple = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files uploaded.' });
    }

    const uploadedFiles = [];

    for (const file of req.files) {
      let fileUrl = `/uploads/${file.filename}`;

      if (isCloudinaryConfigured()) {
        const cloudUrl = await uploadToCloudinary(file.path, 'teams-chat-attachments');
        if (cloudUrl) {
          fileUrl = cloudUrl;
        }
      }

      uploadedFiles.push({
        url: fileUrl,
        name: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
      });
    }

    return res.status(200).json({
      success: true,
      files: uploadedFiles,
    });
  } catch (error) {
    console.error('Upload multiple error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during multiple file upload.',
    });
  }
};

module.exports = {
  uploadSingle,
  uploadMultiple,
};
