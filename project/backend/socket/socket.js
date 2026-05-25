const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

const initSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];

    if (!token) {
      socket.user = { role: 'guest', name: 'Guest' };
      return next();
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (err) {
      socket.user = { role: 'guest', name: 'Guest' };
      next();
    }
  });

  io.on('connection', (socket) => {
    const role = socket.user?.role || 'guest';
    console.log(`🔌 Socket connected: [${role}] ${socket.user?.name || 'Guest'} (${socket.id})`);

    
    socket.join(role); 

    
    if (['chef', 'admin'].includes(role)) {
      socket.join('kitchen');
      console.log(`   → Joined kitchen room`);
    }

    
    socket.on('join_room', (room) => {
      socket.join(room);
      console.log(`   → ${socket.user?.name} joined room: ${room}`);
    });

   
    socket.on('order_acknowledged', ({ orderId }) => {
      io.emit('order_acknowledged', { orderId, by: socket.user?.name });
    });

    
    socket.on('kitchen_update', (data) => {
      io.emit('kitchen_update', { ...data, updatedBy: socket.user?.name });
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

module.exports = { initSocket };
