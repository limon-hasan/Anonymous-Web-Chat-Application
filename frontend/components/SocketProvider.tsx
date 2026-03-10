"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

type GlobalStats = {
    usersOnline: number;
    totalChatters: number;
    totalChatsCompleted: number;
    totalMessagesSent: number;
};

type SocketContextType = {
    socket: Socket | null;
    isConnected: boolean;
    usersOnline: number;
    globalStats: GlobalStats | null;
};

const SocketContext = createContext<SocketContextType>({
    socket: null,
    isConnected: false,
    usersOnline: 0,
    globalStats: null
});

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [usersOnline, setUsersOnline] = useState(0);
    const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null);

    useEffect(() => {
        // Generate UUID if not exists
        let userId = localStorage.getItem("anon_user_id");
        if (!userId) {
            userId = crypto.randomUUID();
            localStorage.setItem("anon_user_id", userId);
        }

        const socketInstance = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000", {
            query: { userId }
        });

        socketInstance.on("connect", () => {
            setIsConnected(true);
        });

        socketInstance.on("disconnect", () => {
            setIsConnected(false);
        });

        socketInstance.on("users_online", (count: number) => {
            setUsersOnline(count);
        });

        socketInstance.on("global_stats", (stats: GlobalStats) => {
            setGlobalStats(stats);
        });

        setSocket(socketInstance);

        return () => {
            socketInstance.disconnect();
        };
    }, []);

    return (
        <SocketContext.Provider value={{ socket, isConnected, usersOnline, globalStats }}>
            {children}
        </SocketContext.Provider>
    );
};
