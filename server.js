const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Разрешаем подключения с любых сайтов/локалок
    methods: ["GET", "POST"]
  }
});

// Список всех подключенных игроков
const players = {};

io.on('connection', (socket) => {
  console.log(`Игрок подключился: ${socket.id}`);

  // Создаем нового игрока со стартовыми координатами в центре комнаты
  players[socket.id] = {
    id: socket.id,
    x: 0,
    y: 0,
    z: 0,
    rotY: 0,
    color: Math.floor(Math.random() * 0xffffff) // Случайный цвет для кубика-аватара
  };

  // Отправляем новому игроку список уже существующих игроков
  socket.emit('currentPlayers', players);

  // Сообщаем остальным, что появился новый игрок
  socket.broadcast.emit('newPlayer', players[socket.id]);

  // Слушаем перемещение игрока
  socket.on('playerMovement', (movementData) => {
    if (players[socket.id]) {
      players[socket.id].x = movementData.x;
      players[socket.id].y = movementData.y;
      players[socket.id].z = movementData.z;
      players[socket.id].rotY = movementData.rotY;

      // Рассылаем новые координаты всем остальным
      socket.broadcast.emit('playerMoved', players[socket.id]);
    }
  });

  // Слушаем сообщения чата
  socket.on('chatMessage', (msg) => {
    // Рассылаем сообщение чата (и пузырь над головой) всем игрокам
    io.emit('chatMessage', { id: socket.id, message: msg });
  });

  // Когда игрок отключается
  socket.on('disconnect', () => {
    console.log(`Игрок отключился: ${socket.id}`);
    delete players[socket.id];
    // Уведомляем всех, что игрок вышел
    io.emit('disconnectPlayer', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Игровой сервер запущен на порту ${PORT}`);
});