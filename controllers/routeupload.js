import cloudinary from 'cloudinary';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

// Configure Cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET_KEY,
});

function imgupload(req, res, next) {
  // Check if a file was uploaded
  if (!req.file) {
    console.log("no image added for vendor")
    return ;
  }

  // Convert the file path to a normalized format
  const normalizedPath = path.resolve(req.file.path);

  cloudinary.v2.uploader.upload(normalizedPath, function (err, result) {
    if (err) {
      console.log(err);
      return res.status(500).json({
        success: false,
        message: 'Error uploading to Cloudinary',
      });
    } else {
      req.image_url = result.secure_url;
      console.log(result.secure_url);
      next();
    }
  });
}

export default imgupload;
