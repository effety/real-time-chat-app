const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const multer = require('multer');
const path = require('path');
const authRoutes = require('./routes/auth');
const Message = require('./models/Message');
const File = require('./models/File');  // Import the File model

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());
app.use('/uploads', express.static('uploads')); // Serve uploaded files
app.use('/api/auth', authRoutes);

// Setup multer storage for file uploads
const storage = multer.diskStorage({
    destination: './uploads',
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});
const upload = multer({ storage });

// File upload route
app.post('/upload', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    // Save file metadata in the database
    const file = new File({
        filename: req.file.filename,
        originalname: req.file.originalname,
        room: req.body.room,  // You can pass room via the form data
        sender: req.body.sender,  // And sender in the request body
    });

    await file.save();

    // Respond with the file path for the client to use
    res.status(201).json({ filePath: `/uploads/${req.file.filename}` });
});

// Socket.io handling
io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('joinRoom', ({ room }) => {
        socket.join(room);
        console.log(`User joined room: ${room}`);
    });

    // Handle chat messages, including file
    socket.on('chatMessage', async ({ room, sender, text, file }) => {
        // If a file is attached, save it to the database
        if (file) {
            // Save the file information in the database if provided
            const newFile = new File({
                filename: file.filename,  // The filename stored in the uploads folder
                originalname: file.originalname,  // The original name of the file
                room: room,  // The room to which the file belongs
                sender: sender,  // The sender of the file
            });
            await newFile.save();

            // Add the file path to the message
            file = `/uploads/${file.filename}`;
        }

        // Save the message (with or without a file) in the database
        const message = new Message({ room, sender, text, file });
        await message.save();

        // Emit the message (including file URL if available) to clients in the room
        io.to(room).emit('message', { sender, text, file });
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => console.log('MongoDB connected'))
  .catch((err) => console.log(err));

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

app.use(express.static('public'));  // Serve static files from 'public' folder
