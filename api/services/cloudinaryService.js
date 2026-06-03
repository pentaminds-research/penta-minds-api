const { cloudinary } = require('../config/cloudinary');
const { ApiError } = require('../middleware/errorHandler');

const uploadMemberImage = (fileBuffer, memberSlug) => new Promise((resolve, reject) => {
  const uploadStream = cloudinary.uploader.upload_stream({
    folder: 'penta-minds/team-members',
    public_id: memberSlug,
    overwrite: true,
    resource_type: 'image',
    transformation: [
      { width: 800, height: 800, crop: 'fill', gravity: 'face:auto' },
      { quality: 'auto', fetch_format: 'auto' }
    ]
  }, (error, result) => {
    if (error) {
      reject(new ApiError(500, 'CLOUDINARY_UPLOAD_FAILED', 'Image upload failed.', {
        message: error.message
      }));
      return;
    }

    resolve({
      imageUrl: result.secure_url,
      publicId: result.public_id
    });
  });

  uploadStream.end(fileBuffer);
});

const deleteImage = async (publicId) => {
  if (!publicId) {
    return;
  }

  const result = await cloudinary.uploader.destroy(publicId, {
    resource_type: 'image'
  });

  if (result.result !== 'ok' && result.result !== 'not found') {
    throw new ApiError(500, 'CLOUDINARY_DELETE_FAILED', 'Cloudinary image deletion failed.', result);
  }
};

module.exports = {
  uploadMemberImage,
  deleteImage
};
