require('dotenv').config();
const http = require('http');
const app = require('./app');
const db = require('./config/db');
const { initSocket } = require('./socket/socket');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    
    await db.init();

    
    const httpServer = http.createServer(app);

    const io = initSocket(httpServer);

    app.set('io', io);

    httpServer.listen(PORT, () => {
      console.log('');
      console.log('🍽️  Smart Food Ordering System');
      console.log('================================');
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`🔌 Socket.io ready`);
      console.log(`📋 API docs base: http://localhost:${PORT}/api`);
      console.log('');
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err.message);
    process.exit(1);
  }
};

startServer();
