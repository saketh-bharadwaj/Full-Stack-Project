const DatauriParser = require('datauri/parser'); // DataURI parser for reading buffer to string
const path = require('path');
//const cloudinary = require('../config/cloudinary.js'); // Import your Cloudinary configuration

// Initialize DataURI parser
const parser = new DatauriParser();

async function imageUploadToCloudinary(req, res, next) {
    console.log("Reached image upload section");
    // Dynamically import Cloudinary
    const cloudinary = await import('../config/cloudinary.js');

    if (!req.files || req.files.length === 0) {
        return res.status(400).json({
            success: false,
            message: 'No files uploaded',
        });
    }

    try {
        
        const imageUrls = [];

        // Iterate over each file and upload to Cloudinary
        for (const file of req.files) {
            // Convert file buffer to a DataURI format
            const fileDataUri = parser.format(path.extname(file.originalname).toString(), file.buffer);

            // Upload file to Cloudinary
            const result = await cloudinary.default.uploader.upload(fileDataUri.content);

            // Push the uploaded image URL into array
            imageUrls.push(result.secure_url);
        }

        // Attach image URLs to the request object for later use in your route
        req.image_url = imageUrls;

        // Move to the next middleware or route handler
        next();
    } catch (err) {
        console.error("Cloudinary upload error: ", err);
        return res.status(500).json({
            success: false,
            message: 'Error uploading images to Cloudinary',
        });
    }
}

module.exports = imageUploadToCloudinary; // Export the middleware function
