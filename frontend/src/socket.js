import { io } from 'socket.io-client';

const socket = io('http://localhost:5001', {
    autoConnect: false
});

let lastRegisteredUserId = null;

export const connectSocket = (userId) => {
    if (!socket.connected) {
        socket.connect();
    }
    
    if (userId && lastRegisteredUserId !== userId) {
        socket.emit('register', userId);
        lastRegisteredUserId = userId;
        console.log('Socket registered user:', userId);
    }
};

export const disconnectSocket = () => {
    if (socket.connected) {
        socket.disconnect();
    }
};

export default socket;
