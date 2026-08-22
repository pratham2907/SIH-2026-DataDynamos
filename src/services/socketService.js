let ioInstance = null;

const initSocket = (io) => {
  ioInstance = io;

  io.on('connection', (socket) => {
    console.log('⚡ Client connected to real-time stream:', socket.id);

    socket.on('join_center', (centerId) => {
      socket.join(`center_${centerId}`);
      console.log(`Socket ${socket.id} joined center channel: center_${centerId}`);
    });

    socket.on('join_farmer', (farmerId) => {
      socket.join(`farmer_${farmerId}`);
      console.log(`Socket ${socket.id} joined farmer channel: farmer_${farmerId}`);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });
};

const emitToAll = (event, data) => {
  if (ioInstance) {
    ioInstance.emit(event, data);
  }
};

const emitToCenter = (centerId, event, data) => {
  if (ioInstance) {
    ioInstance.to(`center_${centerId}`).emit(event, data);
    ioInstance.emit(event, data); // also broadcast globally for display board / admin
  }
};

const emitToFarmer = (farmerId, event, data) => {
  if (ioInstance) {
    ioInstance.to(`farmer_${farmerId}`).emit(event, data);
  }
};

module.exports = {
  initSocket,
  emitToAll,
  emitToCenter,
  emitToFarmer
};
