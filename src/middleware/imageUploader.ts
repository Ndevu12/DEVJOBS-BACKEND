import multer from 'multer';
import path from 'path';

console.log('Inside multer');

export default multer({
  storage: multer.diskStorage({}),
  fileFilter: (req, file, next) => {
    try {
    const ext = path.extname(file.originalname).toLowerCase();
    console.log(ext);
    const supported = ['.png', '.jpg', '.jpeg', '.webp'];
    
    if (!supported.includes(ext)) {
      console.log('Unsupported file: ', ext);
      return next(new Error(`File type ${ext} is not supported. Supported types are ${supported.join(', ')}.`));
    }
    } catch (error) {
        console.log('Error in multer middleware: ', error);
    }
    next(null, true);
  },
});