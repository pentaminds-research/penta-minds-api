const express = require('express');
const { ApiError, asyncHandler } = require('../middleware/errorHandler');
const { requireAdmin } = require('../middleware/auth');
const { deleteImage } = require('../services/cloudinaryService');
const {
  getAllMembers,
  getMemberBySlug,
  clearMemberImage
} = require('../services/supabaseService');

const router = express.Router();
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

router.get('/', asyncHandler(async (req, res) => {
  const members = await getAllMembers();

  res.status(200).json({
    success: true,
    data: members
  });
}));

router.get('/:slug', asyncHandler(async (req, res) => {
  const { slug } = req.params;

  if (!slugPattern.test(slug)) {
    throw new ApiError(400, 'INVALID_SLUG', 'Member slug format is invalid.');
  }

  const member = await getMemberBySlug(slug);

  if (!member) {
    throw new ApiError(404, 'MEMBER_NOT_FOUND', 'Team member was not found.');
  }

  res.status(200).json({
    success: true,
    data: member
  });
}));

router.delete('/:slug/image', requireAdmin, asyncHandler(async (req, res) => {
  const { slug } = req.params;

  if (!slugPattern.test(slug)) {
    throw new ApiError(400, 'INVALID_SLUG', 'Member slug format is invalid.');
  }

  const member = await getMemberBySlug(slug);

  if (!member) {
    throw new ApiError(404, 'MEMBER_NOT_FOUND', 'Team member was not found.');
  }

  await deleteImage(member.image_public_id);
  const updated = await clearMemberImage(slug);

  res.status(200).json({
    success: true,
    data: updated
  });
}));

module.exports = router;
