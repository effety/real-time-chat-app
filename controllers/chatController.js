const Message = require('../models/Message');

const getChatHistory = async (req, res) => {
    try {
        const { room } = req.params;
        const messages = await Message.find({ room }).sort('timestamp');
        res.status(200).json(messages);
    } catch (error) {
        res.status(500).json({ error: 'Error retrieving chat history' });
    }
};

module.exports = { getChatHistory };
