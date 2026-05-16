const { Server } = require('socket.io');

const setupSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*", // Adjust for production
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('join_project', (projectId) => {
      socket.join(`project_${projectId}`);
      console.log(`User ${socket.id} joined project: ${projectId}`);
    });

    socket.on('send_message', (data) => {
      // data: { projectId, message, sender }
      io.to(`project_${data.projectId}`).emit('receive_message', data);
    });

    socket.on('task_updated', (data) => {
      // data: { projectId, taskId, status }
      io.to(`project_${data.projectId}`).emit('task_updated', data);
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });

  return io;
};

module.exports = setupSocket;
