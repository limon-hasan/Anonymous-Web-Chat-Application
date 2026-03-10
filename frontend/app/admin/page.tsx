"use client";

import { useState, useEffect } from "react";
import { Activity, Users, Radio } from "lucide-react";

export default function AdminDashboard() {
    const [password, setPassword] = useState("");
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [stats, setStats] = useState<{ activeConnections: number; activeRooms: number } | null>(null);
    const [error, setError] = useState("");

    const fetchStats = async (pwd: string) => {
        try {
            const res = await fetch(`http://localhost:4000/admin/stats?password=${pwd}`);
            if (res.ok) {
                const data = await res.json();
                setStats(data);
                setIsAuthenticated(true);
                setError("");
            } else {
                setError("Invalid password");
                setIsAuthenticated(false);
            }
        } catch (err) {
            setError("Failed to connect to backend server");
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        fetchStats(password);
    };

    useEffect(() => {
        if (isAuthenticated) {
            const interval = setInterval(() => {
                fetchStats(password);
            }, 5000);
            return () => clearInterval(interval);
        }
    }, [isAuthenticated, password]);

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <form onSubmit={handleSubmit} className="glass-panel p-8 rounded-3xl w-full max-w-sm flex flex-col items-center">
                    <Activity size={48} className="text-neon-pink mb-6" />
                    <h1 className="text-2xl font-bold text-white mb-6">Admin Login</h1>

                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter admin password (admin123)"
                        className="w-full bg-[#0f0a1a] border border-white/20 rounded-lg px-4 py-3 mb-4 outline-none focus:border-neon-purple text-white"
                    />

                    {error && <div className="text-red-400 text-sm mb-4">{error}</div>}

                    <button
                        type="submit"
                        className="w-full bg-neon-purple text-white rounded-lg py-3 font-semibold hover:opacity-90 transition-opacity cursor-pointer"
                    >
                        Access Dashboard
                    </button>
                </form>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-8 max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-12 border-b border-white/10 pb-6">
                <div className="flex items-center gap-3">
                    <Activity size={32} className="text-neon-pink" />
                    <h1 className="text-3xl font-bold text-white">Live Server Stats</h1>
                </div>
                <button
                    onClick={() => setIsAuthenticated(false)}
                    className="text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                    Logout
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass-panel p-8 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden group">
                    <div className="absolute inset-0 bg-neon-blue/5 group-hover:bg-neon-blue/10 transition-colors"></div>
                    <Users size={48} className="text-neon-blue mb-4" />
                    <div className="text-6xl font-black text-white mb-2">{stats?.activeConnections || 0}</div>
                    <div className="text-gray-400 text-lg uppercase tracking-wider font-medium">Active Sockets</div>
                </div>

                <div className="glass-panel p-8 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden group">
                    <div className="absolute inset-0 bg-neon-purple/5 group-hover:bg-neon-purple/10 transition-colors"></div>
                    <Radio size={48} className="text-neon-purple mb-4" />
                    <div className="text-6xl font-black text-white mb-2">{stats?.activeRooms || 0}</div>
                    <div className="text-gray-400 text-lg uppercase tracking-wider font-medium">Active Chat Rooms</div>
                </div>
            </div>

            <div className="mt-8 text-center text-gray-500 text-sm">
                Auto-refreshing every 5 seconds
            </div>
        </div>
    );
}
