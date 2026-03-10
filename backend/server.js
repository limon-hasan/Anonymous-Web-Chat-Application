const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = 'super_secret_chatchat_key_123'; // In production, keep this in .env

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

// In-memory state and Live Stats
let waitingQueue = [];
let usersOnlineCount = 0;
const uniqueChatters = new Set();
let totalChatters = 0;
let totalChatsCompleted = 0;
let totalMessagesSent = 0;

function broadcastStats() {
    io.emit('global_stats', {
        usersOnline: usersOnlineCount,
        totalChatters: totalChatters,
        totalChatsCompleted: totalChatsCompleted,
        totalMessagesSent: totalMessagesSent
    });
}

// --- Authentication API ---
app.post('/api/register', async (req, res) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password) return res.status(400).json({ error: 'All fields required' });

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        db.run(`INSERT INTO users (username, email, password) VALUES (?, ?, ?)`, [username, email, hashedPassword], function (err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    return res.status(400).json({ error: 'Username or Email already exists' });
                }
                return res.status(500).json({ error: 'Database error' });
            }
            res.status(201).json({ message: 'User registered successfully!' });
        });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/login', (req, res) => {
    const { email, password } = req.body; // email field from frontend contains the username input
    if (!email || !password) return res.status(400).json({ error: 'All fields required' });

    db.get(`SELECT * FROM users WHERE email = ? OR username = ?`, [email, email], async (err, user) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (!user) return res.status(400).json({ error: 'Invalid credentials' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

        const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, username: user.username });
    });
});
// --------------------------

// Root route
app.get('/', (req, res) => {
    res.send('Anonymous Chat Backend is running.');
});

// Admin stats endpoint
app.get('/admin/stats', (req, res) => {
    const password = req.query.password;
    if (password !== 'admin123') { // hardcoded password
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const activeConnections = io.engine.clientsCount;

    let activeRooms = 0;
    for (const [id, room] of io.sockets.adapter.rooms.entries()) {
        if (id !== room.values().next().value && id.startsWith('room_')) {
            activeRooms++;
        }
    }

    res.json({
        activeConnections,
        activeRooms,
        totalChatters,
        totalChatsCompleted,
        totalMessagesSent
    });
});

function startServer() {
    console.log('Starting matchmaking server...');

    io.on('connection', (socket) => {
        socket.data = {};

        // Parse user identifier from handshake query parameters
        const handShakeId = socket.handshake.query.userId || socket.id;

        // Increment total users online count
        usersOnlineCount++;
        uniqueChatters.add(handShakeId);
        totalChatters = uniqueChatters.size;

        io.emit('users_online', usersOnlineCount);
        broadcastStats();

        socket.on('join_queue', (userId) => {
            // Store user ID on the socket
            socket.data.userId = userId;

            // Check if user is already in a room or queue
            if (socket.data.currentRoom) return;

            // Push to memory queue
            waitingQueue.push(socket.id);
            console.log(`User ${userId} joined queue. Socket: ${socket.id}`);

            // Check if there are 2 or more users in queue
            matchUsers();
        });

        socket.on('join_group', (roomId) => {
            if (socket.data.currentRoom) return; // already in a room
            socket.join(roomId);
            socket.data.currentRoom = roomId;
            console.log(`User joined group room: ${roomId}`);
        });

        function matchUsers() {
            if (waitingQueue.length >= 2) {
                const user1SocketId = waitingQueue.shift();
                const user2SocketId = waitingQueue.shift();

                const socket1 = io.sockets.sockets.get(user1SocketId);
                const socket2 = io.sockets.sockets.get(user2SocketId);

                if (socket1 && socket2) {
                    const roomName = `room_${user1SocketId}_${user2SocketId}`;
                    socket1.join(roomName);
                    socket2.join(roomName);

                    socket1.data.currentRoom = roomName;
                    socket2.data.currentRoom = roomName;

                    console.log(`Matched ${socket1.id} and ${socket2.id} in ${roomName}`);

                    totalChatsCompleted++;
                    broadcastStats();

                    socket1.emit('match_found', { room: roomName, partner: 'Anonymous' });
                    socket2.emit('match_found', { room: roomName, partner: 'Anonymous' });
                } else {
                    // If one disconnected during matchmaking, put the other back if available
                    if (socket1) waitingQueue.unshift(user1SocketId);
                    if (socket2) waitingQueue.unshift(user2SocketId);
                }
            }
        }

        socket.on('send_message', (data) => {
            const room = socket.data.currentRoom;
            if (room) {
                totalMessagesSent++;
                broadcastStats();

                socket.to(room).emit('receive_message', {
                    sender: socket.data.userId || socket.data.username || 'Anonymous',
                    text: data.text,
                    timestamp: Date.now()
                });
            }
        });

        socket.on('leave_chat', () => {
            const room = socket.data.currentRoom;
            if (room) {
                socket.to(room).emit('partner_disconnected');
                socket.leave(room);
                delete socket.data.currentRoom;
                console.log(`User left room ${room}`);
            } else {
                // Might be in queue
                waitingQueue = waitingQueue.filter(id => id !== socket.id);
                console.log(`User left queue ${socket.id}`);
            }
        });

        socket.on('disconnect', () => {
            // Decrement online users
            usersOnlineCount--;
            if (usersOnlineCount < 0) usersOnlineCount = 0;
            io.emit('users_online', usersOnlineCount);
            broadcastStats();

            const room = socket.data.currentRoom;
            if (room) {
                socket.to(room).emit('partner_disconnected');
            } else {
                // Remove from queue if they were waiting
                waitingQueue = waitingQueue.filter(id => id !== socket.id);
            }
            console.log(`Socket disconnected: ${socket.id}`);
        });
    });

    const PORT = process.env.PORT || 4000;
    server.listen(PORT, () => {
        console.log(`Backend server running on port ${PORT}`);
    });
}

startServer();
