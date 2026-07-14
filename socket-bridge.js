const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('WebSockets Bridge is running successfully!');
});

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Broadcast API route called by Laravel
app.post('/broadcast', (req, res) => {
  const { event, channel, data } = req.body;
  console.log(`Received broadcast event [${event}] on channel [${channel}]`);
  
  if (channel) {
    // Broadcast to the specific socket.io room
    io.to(channel).emit(event, data);
  } else {
    // Broadcast to all clients globally
    io.emit(event, data);
  }
  
  return res.json({ success: true });
});

// Socket.io connection logic
io.on('connection', (socket) => {
  console.log('Client connected to WebSockets Bridge:', socket.id);
  
  socket.on('join_room', (roomName) => {
    socket.join(roomName);
    console.log(`Socket [${socket.id}] joined room: [${roomName}]`);
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected from WebSockets Bridge:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`WebSockets bridge server is running on port ${PORT}`);
});
