const express = require('express');
const multer = require('multer');
const { requireAdmin } = require('../middleware/auth');
const { ApiError, asyncHandler } = require('../middleware/errorHandler');
const { uploadMemberImage } = require('../services/cloudinaryService');
const {
  getMemberBySlug,
  updateMemberImage
} = require('../services/supabaseService');

const router = express.Router();
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1
  },
  fileFilter(req, file, callback) {
    if (!allowedMimeTypes.has(file.mimetype)) {
      callback(new ApiError(400, 'INVALID_FILE_TYPE', 'Only JPEG, PNG, and WebP images are allowed.'));
      return;
    }

    callback(null, true);
  }
});

router.post('/team-member-image', requireAdmin, upload.single('image'), asyncHandler(async (req, res) => {
  const memberSlug = req.body.member_slug || req.body.slug;

  if (typeof memberSlug !== 'string' || !slugPattern.test(memberSlug)) {
    throw new ApiError(400, 'INVALID_MEMBER_SLUG', 'A valid member_slug is required.');
  }

  if (!req.file) {
    throw new ApiError(400, 'IMAGE_REQUIRED', 'Image file is required.');
  }

  const member = await getMemberBySlug(memberSlug);

  if (!member) {
    throw new ApiError(404, 'MEMBER_NOT_FOUND', 'Team member was not found.');
  }

  const uploaded = await uploadMemberImage(req.file.buffer, memberSlug);
  const updated = await updateMemberImage(memberSlug, uploaded.imageUrl, uploaded.publicId);

  res.status(200).json({
    success: true,
    data: updated
  });
}));

module.exports = router;
