const multer = require('multer');

const storage = multer.memoryStorage();

const singleUpload = multer({ storage }).array("files");

module.exports = { singleUpload };