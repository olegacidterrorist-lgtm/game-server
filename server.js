const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const players = {};
const chatHistory = [];

io.on('connection', (socket) => {
  console.log(`Игрок подключился: ${socket.id}`);

  players[socket.id] = {
    id: socket.id,
    x: 0,
    y: 0,
    z: 0,
    rotY: 0,
    appearance: null
  };

  // Отправляем историю чата
  socket.emit('chatHistory', chatHistory);

  // Получаем внешность игрока
  socket.on('setAppearance', (appData) => {
    if (players[socket.id]) {
      players[socket.id].appearance = appData;
      socket.emit('currentPlayers', players);
      socket.broadcast.emit('newPlayer', players[socket.id]);
    }
  });

  // Перемещение
  socket.on('playerMovement', (movementData) => {
    if (players[socket.id]) {
      players[socket.id].x = movementData.x;
      players[socket.id].y = movementData.y;
      players[socket.id].z = movementData.z;
      players[socket.id].rotY = movementData.rotY;

      socket.broadcast.emit('playerMoved', players[socket.id]);
    }
  });

  // Чат
  socket.on('chatMessage', (msg) => {
    const msgData = { id: socket.id, message: msg };
    chatHistory.push(msgData);
    if (chatHistory.length > 50) chatHistory.shift();
    io.emit('chatMessage', msgData);
  });

  // Отключение
  socket.on('disconnect', () => {
    console.log(`Игрок отключился: ${socket.id}`);
    delete players[socket.id];
    io.emit('disconnectPlayer', socket.id);
  });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
  console.log(`Игровой сервер запущен на порту ${PORT}`);
});
