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
const chatHistory = []; // Хранилище истории чата

io.on('connection', (socket) => {
  console.log(`Игрок подключился: ${socket.id}`);

  // Регистрируем игрока
  players[socket.id] = {
    id: socket.id,
    x: (Math.random() - 0.5) * 4,
    y: 0,
    z: (Math.random() - 0.5) * 4,
    rotY: 0,
    appearance: null
  };

  // 1. Отправляем историю чата новому игроку
  socket.emit('chatHistory', chatHistory);

  // 2. Получаем внешность от нового игрока и уведомляем остальных
  socket.on('setAppearance', (appData) => {
    if (players[socket.id]) {
      players[socket.id].appearance = appData;
      
      // Отправляем новому игроку текущий список всех игроков
      socket.emit('currentPlayers', players);
      
      // Сообщаем всем остальным о появлении нового игрока
      socket.broadcast.emit('newPlayer', players[socket.id]);
    }
  });

  // 3. Передвижение
  socket.on('playerMovement', (movementData) => {
    if (players[socket.id]) {
      players[socket.id].x = movementData.x;
      players[socket.id].y = movementData.y;
      players[socket.id].z = movementData.z;
      players[socket.id].rotY = movementData.rotY;

      socket.broadcast.emit('playerMoved', players[socket.id]);
    }
  });

  // 4. Сообщения чата
  socket.on('chatMessage', (msg) => {
    const msgData = { id: socket.id, message: msg };
    
    // Сохраняем в историю
    chatHistory.push(msgData);
    if (chatHistory.length > 50) chatHistory.shift();

    io.emit('chatMessage', msgData);
  });

  // 5. Отключение
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
