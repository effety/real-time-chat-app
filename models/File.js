const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
    filename: { type: String, required: true },
    originalname: { type: String, required: true },
    room: { type: String, required: true },
    sender: { type: String, required: true },
});

module.exports = mongoose.model('File', fileSchema);
