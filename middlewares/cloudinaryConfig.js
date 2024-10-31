import cloudinary from 'cloudinary'
import {CloudinaryStorage} from 'multer-storage-cloudinary';
import multer from 'multer';

cloudinary.config({
    cloud_name: 'dkngwqe98',
    api_key: '189758236889632',
    api_secret: '2eNIFrBCZB7vJKuSBY5kWVcLPxU'
  });

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'uploads', // Folder name in Cloudinary
      format: async (req, file) => {
        
        const ext = file.originalname.split('.').pop().toLowerCase(); //supprt all types of file extension
        return ext === 'jpeg' ? 'jpg' : ext; 
      },
      public_id: (req, file) => file.originalname.split('.')[0], // Use original file name without extension
    },
  });

const upload = multer({ storage: storage });

export default upload;