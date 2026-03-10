"use client";

import { useEffect, useRef, useState } from "react";
import { useSocket } from "@/components/SocketProvider";
import { Send, LogOut, AlertCircle, Ghost } from "lucide-react";
import { cn } from "@/lib/utils";

type Message = {
    id: string;
    sender: "me" | "partner" | "system";
    text: string;
    timestamp: number;
};

export default function ChatBox({ room, onLeave, isGroup = false }: { room: string; onLeave: () => void; isGroup?: boolean }) {
    const { socket } = useSocket();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [partnerDisconnected, setPartnerDisconnected] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!socket) return;

        const handleReceive = (data: { sender: string; text: string; timestamp: number }) => {
            setMessages((prev) => [
                ...prev,
                {
                    id: data.timestamp.toString() + Math.random(),
                    sender: "partner",
                    text: data.text,
                    timestamp: data.timestamp,
                },
            ]);
        };

        const handleDisconnect = () => {
            setPartnerDisconnected(true);
            setMessages((prev) => [
                ...prev,
                {
                    id: Date.now().toString(),
                    sender: "system",
                    text: "Partner has disconnected.",
                    timestamp: Date.now(),
                },
            ]);
        };

        socket.on("receive_message", handleReceive);
        socket.on("partner_disconnected", handleDisconnect);

        return () => {
            socket.off("receive_message", handleReceive);
            socket.off("partner_disconnected", handleDisconnect);
        };
    }, [socket]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || partnerDisconnected) return;

        socket?.emit("send_message", { text: input });

        setMessages((prev) => [
            ...prev,
            {
                id: Date.now().toString() + Math.random(),
                sender: "me",
                text: input,
                timestamp: Date.now(),
            },
        ]);

        setInput("");
    };

    const saveHistory = () => {
        if (messages.length === 0) return;

        try {
            const historyObj = {
                id: Date.now().toString(),
                date: new Date().toLocaleDateString(),
                time: new Date().toLocaleTimeString(),
                messagesCount: messages.length,
                type: isGroup ? "Group Chat" : "1v1 Stranger",
                room: room
            };

            const existing = JSON.parse(localStorage.getItem("chatchat_history") || "[]");
            existing.unshift(historyObj); // Add to beginning
            // Keep last 50 chats
            if (existing.length > 50) existing.pop();
            localStorage.setItem("chatchat_history", JSON.stringify(existing));
        } catch (e) {
            console.error("Failed to save history", e);
        }
    };

    const handleLeave = () => {
        saveHistory();
        socket?.emit("leave_chat");
        onLeave();
    };

    return (
        <div className="flex flex-col h-[75vh] w-full max-w-3xl mx-auto glass-panel rounded-3xl overflow-hidden shadow-[0_0_30px_rgba(181,55,242,0.1)] border border-white/5 relative bg-[#140b2a] z-50">
            <div className="bg-[#1a0e36] border-b border-white/10 p-5 flex justify-between items-center shadow-md">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#ff2a6d] to-[#b537f2] flex items-center justify-center animate-pulse shadow-[0_0_10px_#ff2a6d]">
                        <Ghost size={16} fill="white" className="text-white" />
                    </div>
                    <span className="font-bold text-xl text-white tracking-wide">ChatChat {isGroup && <span className="text-xs text-[#05d9e8] font-normal ml-2 tracking-normal bg-[#05d9e8]/10 px-2 py-0.5 rounded-full border border-[#05d9e8]/30">GROUP</span>}</span>
                </div>
                <button
                    onClick={handleLeave}
                    className="text-gray-400 hover:text-[#ff2a6d] transition-colors flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/5"
                >
                    <LogOut size={16} />
                    <span className="text-sm font-medium">Leave Chat</span>
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && (
                    <div className="text-center text-gray-500 mt-10 w-full flex justify-center">
                        <span className="max-w-xs block text-sm">
                            {isGroup ? "You have joined a private custom group room. Share the link for others to join!" : "You are now connected with a random stranger. Say hi!"}
                        </span>
                    </div>
                )}

                {messages.map((msg) => (
                    <div key={msg.id} className={cn("flex flex-col", msg.sender === "me" ? "items-end" : msg.sender === "partner" ? "items-start" : "items-center")}>
                        {isGroup && msg.sender === "partner" && msg.id.includes("partner") && <span className="text-xs text-gray-500 mb-1 ml-2">Chatter</span>}
                        <div
                            className={cn(
                                "max-w-[70%] rounded-2xl px-4 py-2",
                                msg.sender === "me" ? "bg-neon-purple text-white rounded-tr-sm" :
                                    msg.sender === "partner" ? "bg-[#2a1b42] text-white rounded-tl-sm border border-white/5" :
                                        "bg-transparent text-gray-400 text-sm italic border-0"
                            )}
                        >
                            {msg.text}
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {partnerDisconnected && !isGroup && (
                <div className="bg-red-500/10 border-y border-red-500/20 p-2 flex items-center justify-center gap-2 text-neon-pink">
                    <AlertCircle size={16} />
                    <span>Stranger has disconnected.</span>
                </div>
            )}

            <form onSubmit={handleSend} className="p-4 bg-[#1a112c] border-t border-white/10 flex gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={partnerDisconnected}
                    placeholder={partnerDisconnected ? "Chat ended" : "Type a message..."}
                    className="flex-1 bg-[#0f0a1a] border border-white/20 rounded-full px-4 py-2 outline-none focus:border-neon-blue transition-all text-white placeholder-gray-500"
                />
                <button
                    type="submit"
                    disabled={partnerDisconnected || !input.trim()}
                    className="bg-neon-pink text-white rounded-full p-3 flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                    <Send size={18} />
                </button>
            </form>
        </div>
    );
}
