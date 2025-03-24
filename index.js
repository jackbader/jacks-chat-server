const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const messageRoutes = require('./routes/messages');
const Message = require('./models/Message');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Create HTTP server
const server = http.createServer(app);

// Create Socket.IO server
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? process.env.CLIENT_URL || "https://your-app-name.onrender.com"
      : "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/live-chat')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Socket.IO connection
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);
  
  // Join a room
  socket.on('join_room', (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room: ${roomId}`);
  });
  
  // Listen for chat messages
  socket.on('send_message', async (messageData) => {
    console.log('Message received:', messageData);
    
    try {
      // Save message to database
      const message = new Message({
        room: messageData.room,
        sender: messageData.sender,
        text: messageData.text,
        timestamp: new Date()
      });
      
      await message.save();
      
      // Broadcast message to room
      io.to(messageData.room).emit('receive_message', {
        ...messageData,
        timestamp: message.timestamp
      });
    } catch (error) {
      console.error('Error saving message:', error);
    }
  });
  
  // Disconnection
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

// API routes
app.use('/api/messages', messageRoutes);

// Define port
const PORT = process.env.PORT || 8000;

// Start server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});