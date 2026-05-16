require('dotenv').config();
const http = require('http');
const app = require('./app');
const { Server } = require('socket.io');

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// Socket.io Initialization
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join_project', (projectId) => {
    socket.join(`project_${projectId}`);
    console.log(`User joined project: project_${projectId}`);
  });

  socket.on('send_message', (data) => {
    // data: { projectId, content, sender }
    io.to(`project_${data.projectId}`).emit('receive_message', data);
  });

  socket.on('task_updated', (data) => {
    io.to(`project_${data.projectId}`).emit('task_status_changed', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Error: Port ${PORT} is already in use.`);
    console.error(`💡 Suggestion: Kill the process running on port ${PORT} or change PORT in .env`);
    process.exit(1);
  } else {
    console.error('❌ Server error:', error);
    process.exit(1);
  }
});

server.listen(PORT, () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  console.log(`📡 API Base URL: http://localhost:${PORT}/api`);
});
