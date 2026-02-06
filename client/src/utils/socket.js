import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const cleanUrl = SOCKET_URL.replace(/\/api$/, ''); // Socket.io usually runs on the root

export const socket = io(cleanUrl, {
    withCredentials: true,
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000
});

// Logs for debugging
socket.on('connect', () => {
    console.log('⚡ Connected to socket server:', socket.id);
});

socket.on('connect_error', (err) => {
    console.error('❌ Socket connection error:', err.message);
});

export default socket;
