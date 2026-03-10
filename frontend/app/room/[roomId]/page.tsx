"use client";

import { useSocket } from "@/components/SocketProvider";
import { useEffect, useState } from "react";
import ChatBox from "@/components/ChatBox";
import { Loader2, Ghost } from "lucide-react";
import { useRouter, useParams } from "next/navigation";

export default function GroupRoomPage() {
    const { socket, isConnected } = useSocket();
    const [joined, setJoined] = useState(false);
    const router = useRouter();
    const params = useParams();
    const roomId = params.roomId as string;

    useEffect(() => {
        if (!socket || !isConnected) return;

        // Automatically join the group room on load
        socket.emit("join_group", roomId);
        setJoined(true);

        return () => {
            // Socket handle leave happens in ChatBox or globally on unmount
        };
    }, [socket, isConnected, roomId]);

    const handleLeave = () => {
        if (socket) {
            socket.emit("leave_chat");
        }
        router.push("/");
    };

    if (!joined) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4">
                <div className="flex items-center gap-3 text-[#05d9e8] mb-4 text-lg">
                    <Loader2 className="animate-spin" size={24} />
                    <span className="font-medium animate-pulse">Joining Group Room...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 pt-10 pb-20 z-10 relative">
            <ChatBox room={roomId} onLeave={handleLeave} isGroup={true} />
        </div>
    );
}
