const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const multer = require('multer');
const path = require('path');
const authRoutes = require('./routes/auth');
const Message = require('./models/Message');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server);


app.use(express.json());
app.use('/uploads', express.static('uploads')); // Serve uploaded files
app.use('/api/auth', authRoutes);

const storage = multer.diskStorage({
    destination: './uploads',
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});
const upload = multer({ storage });


app.post('/upload', upload.single('file'), (req, res) => {
    res.status(201).json({ filePath: `/uploads/${req.file.filename}` });
});

io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('joinRoom', ({ room }) => {
        socket.join(room);
        console.log(`User joined room: ${room}`);
    });

    socket.on('chatMessage', async ({ room, sender, text }) => {
        const message = new Message({ room, sender, text });
        await message.save();
        io.to(room).emit('message', message);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});
 
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => console.log('MongoDB connected')).catch((err) => console.log(err));


const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
app.use(express.static('public'));
