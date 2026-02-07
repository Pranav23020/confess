import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const cleanUrl = SOCKET_URL.replace(/\/api$/, ''); // Socket.io usually runs on the root

export const socket = io(cleanUrl, {
    withCredentials: true,
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 10, // More attempts
    reconnectionDelay: 2000, // Wait longer between attempts
    timeout: 60000, // 60 second timeout to handle cold starts
    transports: ['websocket', 'polling'] // Try multiple transports
});

// Logs for debugging
socket.on('connect', () => {
    console.log('⚡ Connected to socket server:', socket.id);
});

socket.on('connect_error', (err) => {
    console.error('❌ Socket connection error:', err.message);
});

socket.on('reconnect_attempt', () => {
    console.log('🔄 Attempting to reconnect to socket...');
});

socket.on('reconnect', (attemptNumber) => {
    console.log('✅ Socket reconnected after', attemptNumber, 'attempts');
});

export default socket;
