import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    // Establish connection to backend server
    const socketConnection = io('http://localhost:5000', {
      withCredentials: true,
      transports: ['websocket', 'polling']
    });

    setSocket(socketConnection);

    socketConnection.on('connect', () => {
      console.log('Connected to real-time WebSockets gateway.');
    });

    return () => {
      socketConnection.close();
    };
  }, []);

  // Set up room joins when user logs in
  useEffect(() => {
    if (socket && user) {
      if (user.role === 'admin') {
        socket.emit('join_room', 'admin');
      } else if (user.role === 'student' && user.studentProfile) {
        socket.emit('join_room', 'students');
        const deptId = user.studentProfile.departmentId?._id || user.studentProfile.departmentId;
        if (deptId) {
          socket.emit('join_room', deptId.toString());
        }
      }
    }
  }, [socket, user]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
