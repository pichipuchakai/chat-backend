const express = require('express');
const { Server } = require('socket.io');
const http = require('http');
const mongoose = require('mongoose');

// MongoDB Connection
mongoose.connect('YOUR_MONGODB_CONNECTION_STRING');
const userSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  publicKey: String,
  profilePic: String,
  socketId: String
});
const User = mongoose.model('User', userSchema);

// Server Setup
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' }});

io.on('connection', async (socket) => {
  // Save new user
  socket.on('register', async (userData) => {
    const user = new User({ ...userData, socketId: socket.id });
    await user.save();
    io.emit('user-list', await User.find());
  });

  // Handle messages
  socket.on('encrypted-message', (data) => {
    io.to(data.receiverId).emit('encrypted-message', data);
  });

  // Remove on disconnect
  socket.on('disconnect', async () => {
    await User.deleteOne({ socketId: socket.id });
    io.emit('user-list', await User.find());
  });
});

server.listen(3000, () => console.log('Server running'));
