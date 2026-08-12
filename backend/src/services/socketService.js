const { Server } = require('socket.io');
const env = require('../config/env');

let io = null;

function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: env.clientUrl,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log('[Socket] Client connected:', socket.id);

    socket.on('join:role', (role) => {
      socket.join(`role:${role}`);
    });

    socket.on('disconnect', () => {
      console.log('[Socket] Client disconnected:', socket.id);
    });
  });

  return io;
}

function getIO() {
  return io;
}

function broadcast(event, data) {
  if (io) io.emit(event, data);
}

function broadcastToRole(role, event, data) {
  if (io) io.to(`role:${role}`).emit(event, data);
}

module.exports = { initSocket, getIO, broadcast, broadcastToRole };
