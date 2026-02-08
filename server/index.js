const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

const PORT = process.env.PORT || 3000;

const peers = new Map();

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join', ({ deviceId, displayName }) => {
        const room = 'global-room';
        socket.join(room);

        peers.set(socket.id, { deviceId, displayName, room });
        console.log(`Device ${deviceId} (${displayName}) joined ${room}`);

        socket.to(room).emit('player-joined', { socketId: socket.id, deviceId, displayName });

        const peersInRoom = Array.from(io.sockets.adapter.rooms.get(room) || [])
            .filter(id => id !== socket.id)
            .map(id => {
                const peer = peers.get(id);
                return { socketId: id, deviceId: peer.deviceId, displayName: peer.displayName };
            });

        socket.emit('existing-peers', peersInRoom);
    });

    socket.on('signal', ({ target, signal }) => {
        io.to(target).emit('signal', { sender: socket.id, signal });
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        const peer = peers.get(socket.id);
        if (peer) {
            socket.to(peer.room).emit('peer-left', { socketId: socket.id });
            peers.delete(socket.id);
        }
    });
});

server.listen(PORT, () => {
    console.log(`Signaling server running on port ${PORT}`);
});
