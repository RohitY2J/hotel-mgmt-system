const multer = require("multer")
const path = require("path")

// Multer storage configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './server/uploads');  // Directory where files will be stored
    },
    filename: function (req, file, cb) {
      // Rename file to avoid name collisions (e.g., add timestamp)
      cb(null, Date.now() + path.extname(file.originalname));
    }
  });

  // Initialize multer instance
  exports.FileUpload = multer({ storage: storage });


