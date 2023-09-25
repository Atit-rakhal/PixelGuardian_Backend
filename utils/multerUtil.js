const multer = require("multer");
const path = require("path");

const configureMulter = (destinationFolder) => {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, destinationFolder);
    },
    filename: (req, file, cb) => {
      const { citizenshipNo } = req.body;
      if (!citizenshipNo) {
        return cb(new Error("Citizenship number is required"));
      }

      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const extension = path.extname(file.originalname);
      const fileName = citizenshipNo + "-" + uniqueSuffix + extension;
      cb(null, fileName);
    },
  });

  const upload = multer({
    storage: storage,
    limits: {
      fileSize: 1024 * 1024 * 50, // 50MB file size limit
    },
  });

  return upload;
};
module.exports = configureMulter;
