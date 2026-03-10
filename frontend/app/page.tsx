"use client";

import { useSocket } from "@/components/SocketProvider";
import React, { useState, useEffect, FormEvent } from "react";
import ChatBox from "@/components/ChatBox";
import {
  Users, Loader2, Ghost, Sun, Moon,
  UserPlus, Zap, Smile, Star, Shield,
  MessageSquare, Send, Clock, HomeIcon, Download, X,
  User, Mail, Lock, Eye, EyeOff, RefreshCw, ShieldCheck
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Home() {
  const { socket, isConnected, usersOnline, globalStats } = useSocket();
  const [isQueueing, setIsQueueing] = useState(false);
  const [currentRoom, setCurrentRoom] = useState<string | null>(null);
  const router = useRouter();

  // Theme State
  const [theme, setTheme] = useState<"pink" | "cyan">("pink");

  // Auth State
  const [activeModal, setActiveModal] = useState<"signin" | "register" | "groupchat" | "history" | null>(null);
  const [username, setUsername] = useState<string | null>(null);

  // Auth Form
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authUsername, setAuthUsername] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authConfirmPassword, setAuthConfirmPassword] = useState("");
  const [authTerms, setAuthTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Captcha State
  const [captchaCode, setCaptchaCode] = useState("");
  const [userCaptchaInput, setUserCaptchaInput] = useState("");
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  // Group Chat
  const [generatedRoomId, setGeneratedRoomId] = useState("");

  // History & PWA Install
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Check local storage for existing session
    const storedUser = localStorage.getItem("chatchat_username");
    if (storedUser) setUsername(storedUser);

    if (!socket) return;

    const handleMatchFound = (data: { room: string }) => {
      setIsQueueing(false);
      setCurrentRoom(data.room);
    };

    socket.on("match_found", handleMatchFound);

    // PWA Install Prompt Interception
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      socket.off("match_found", handleMatchFound);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, [socket]);

  // Load History when opening the modal
  useEffect(() => {
    if (activeModal === "history") {
      const stored = JSON.parse(localStorage.getItem("chatchat_history") || "[]");
      setHistoryItems(stored);
    }
  }, [activeModal]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setDeferredPrompt(null);
      }
    } else {
      alert("Installation is not fully supported or already installed. Try adding to Home Screen from your browser menu.");
    }
  };

  const joinQueue = () => {
    if (!socket || !isConnected) return;
    setIsQueueing(true);
    const userId = username || localStorage.getItem("anon_user_id");
    socket.emit("join_queue", userId);
  };

  const leaveQueue = () => {
    if (!socket) return;
    setIsQueueing(false);
    socket.emit("leave_chat");
  };

  const leaveChat = () => {
    setCurrentRoom(null);
  };

  const generateGroupRoom = () => {
    const id = Math.random().toString(36).substring(2, 10);
    setGeneratedRoomId(id);
    setActiveModal("groupchat");
  };

  const generateCaptcha = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Generate random 5 character string
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
    let code = "";
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaCode(code);

    // Draw Background
    ctx.fillStyle = "#140b2a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add noise (dots)
    for (let i = 0; i < 50; i++) {
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.5})`;
      ctx.beginPath();
      ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, Math.random() * 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Add noise (lines)
    for (let i = 0; i < 4; i++) {
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.1 + Math.random() * 0.2})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.stroke();
    }

    // Draw text with distortion
    ctx.font = "bold 24px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (let i = 0; i < code.length; i++) {
      const char = code[i];
      const x = 30 + (i * 35);
      const y = canvas.height / 2;

      ctx.save();
      ctx.translate(x, y);
      const angle = (Math.random() - 0.5) * 0.4;
      ctx.rotate(angle);

      // Randomly pick neon pink or neon blue for characters
      ctx.fillStyle = Math.random() > 0.5 ? "#ff2a6d" : "#05d9e8";
      ctx.fillText(char, 0, 0);
      ctx.restore();
    }
  };

  useEffect(() => {
    if (activeModal === "register" || activeModal === "signin") {
      generateCaptcha();
      setUserCaptchaInput("");
      setAuthTerms(false);
      setAuthError("");
    }
  }, [activeModal]);

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError("");

    // Strict Input Validation
    const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
    if (!usernameRegex.test(authUsername)) {
      return setAuthError("Username must be 3-30 characters (letters, digits, or underscores only).");
    }
    if (authPassword.length < 6) return setAuthError("Password must be at least 6 characters.");
    if (authPassword !== authConfirmPassword) return setAuthError("Passwords do not match.");
    if (userCaptchaInput.toLowerCase() !== captchaCode.toLowerCase()) return setAuthError("Verification code is incorrect.");
    if (!authTerms) return setAuthError("You must agree to the terms.");

    setAuthLoading(true);
    try {
      const res = await fetch("http://localhost:4000/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: authUsername, email: authEmail, password: authPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Auto login after register
      handleLogin(e, true);
    } catch (err: any) {
      setAuthError(err.message);
      setAuthLoading(false);
    }
  };

  const handleLogin = async (e: FormEvent, skipPrevent?: boolean) => {
    if (!skipPrevent) e.preventDefault();
    setAuthError("");

    if (!skipPrevent) {
      if (authEmail.length < 3) return setAuthError("Username must be at least 3 characters.");
      if (authPassword.length < 6) return setAuthError("Password must be at least 6 characters.");
      if (userCaptchaInput.toLowerCase() !== captchaCode.toLowerCase()) return setAuthError("Verification code is incorrect.");
    }

    setAuthLoading(true);
    try {
      const res = await fetch("http://localhost:4000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: authEmail, password: authPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      localStorage.setItem("chatchat_token", data.token);
      localStorage.setItem("chatchat_username", data.username);
      setUsername(data.username);
      setActiveModal(null);
      setAuthEmail("");
      setAuthPassword("");
      setAuthUsername("");
    } catch (err: any) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("chatchat_token");
    localStorage.removeItem("chatchat_username");
    setUsername(null);
  };

  // Fallback stats if backend disconnected natively
  const stats = globalStats || {
    totalChatters: 0,
    totalChatsCompleted: 0,
    totalMessagesSent: 0
  };

  // Theme Colors
  const tColors = theme === "pink" ? {
    gradient: "from-[#ff2a6d] to-[#b537f2]",
    textGradient: "bg-gradient-to-r from-[#ff2a6d] to-[#b537f2]",
    primary: "#ff2a6d",
    secondary: "#b537f2",
    shadow: "shadow-[0_0_20px_rgba(181,55,242,0.4)]"
  } : {
    gradient: "from-[#05d9e8] to-[#0182ce]",
    textGradient: "bg-gradient-to-r from-[#05d9e8] to-[#0182ce]",
    primary: "#05d9e8",
    secondary: "#0182ce",
    shadow: "shadow-[0_0_20px_rgba(5,217,232,0.4)]"
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans relative z-10 transition-colors duration-500`}>

      {/* Top Navigation */}
      <header className="w-full flex justify-between items-center p-4 lg:px-8 border-b border-transparent">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
            <Ghost className="text-white" size={24} />
          </div>
          <span className={`text-2xl font-bold bg-clip-text text-transparent ${tColors.textGradient} transition-all`}>
            ChatChat
          </span>
        </div>

        <div className="flex flex-wrap justify-end items-center gap-2 md:gap-4">
          <button
            onClick={() => setTheme(theme === "pink" ? "cyan" : "pink")}
            className="w-10 h-10 rounded-full bg-[#1b1429] flex items-center justify-center border border-white/5 hover:bg-[#2a1b42] transition-colors cursor-pointer"
          >
            {theme === "pink" ? <Sun className="text-[#f5a623]" size={18} /> : <Moon className="text-[#05d9e8]" size={18} />}
          </button>

          {username ? (
            <div className="flex items-center gap-3 bg-[#1b1429] rounded-full px-4 py-2 border border-white/5">
              <span className="text-sm font-medium text-white/90 hidden md:block">Hi, {username}</span>
              <button onClick={handleLogout} className="text-xs text-red-400 hover:text-red-300 transition-colors cursor-pointer">Logout</button>
            </div>
          ) : (
            <>
              <button
                onClick={() => setActiveModal("signin")}
                className="px-4 py-2 md:px-6 md:py-2.5 rounded-full bg-[#1b1429] text-white/80 font-medium border border-white/5 hover:bg-[#2a1b42] transition-colors text-sm cursor-pointer"
              >
                Sign In
              </button>
              <button
                onClick={() => setActiveModal("register")}
                className={`px-4 py-2 md:px-6 md:py-2.5 rounded-full bg-gradient-to-r ${tColors.gradient} text-white font-medium hover:opacity-90 transition-opacity text-sm shadow-[0_0_15px_rgba(255,42,109,0.4)] cursor-pointer`}
              >
                Register
              </button>
            </>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 pt-10 pb-24">

        {!currentRoom ? (
          <div className="flex flex-col items-center w-full max-w-4xl animate-in fade-in zoom-in duration-500">

            {/* Center Logo Glowing SVG */}
            <div className="relative mb-8 group animate-float flex justify-center w-full max-w-[150px]">
              <div className={`absolute inset-0 bg-[#b537f2] rounded-full blur-[50px] opacity-30 group-hover:opacity-50 transition-opacity`}></div>

              <svg width="140" height="140" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative z-10 drop-shadow-[0_0_25px_rgba(181,55,242,0.5)] transition-transform duration-500 group-hover:scale-105">
                {/* Ghost Body */}
                <path
                  d="M 25 70 C 25 20, 95 20, 95 70 V 95 
                     A 11.66 11.66 0 0 1 71.66 95 
                     A 11.66 11.66 0 0 1 48.33 95 
                     A 11.66 11.66 0 0 1 25 95 Z"
                  fill="url(#ghost-bg)"
                  stroke="url(#ghost-border)"
                  strokeWidth="1.5"
                />

                {/* Glowing Eyes */}
                <g className="animate-blink" style={{ transformOrigin: "60px 48px" }}>
                  <circle cx="48" cy="48" r="6" fill="#c084fc" className="shadow-[0_0_15px_#c084fc]" style={{ filter: "drop-shadow(0 0 8px #c084fc)" }} />
                  <circle cx="72" cy="48" r="6" fill="#c084fc" className="shadow-[0_0_15px_#c084fc]" style={{ filter: "drop-shadow(0 0 8px #c084fc)" }} />
                </g>

                {/* Smile */}
                <path d="M 54 60 Q 60 66 66 60" stroke="#d946ef" strokeWidth="3" strokeLinecap="round" fill="none" />

                <defs>
                  <linearGradient id="ghost-bg" x1="60" y1="20" x2="60" y2="100" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#1e1b4b" stopOpacity="0.9" />
                  </linearGradient>
                  <linearGradient id="ghost-border" x1="60" y1="20" x2="60" y2="100" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#a855f7" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#4c1d95" stopOpacity="0.2" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            <h1 className={`text-5xl md:text-7xl font-bold mb-4 tracking-tight bg-clip-text text-transparent ${tColors.textGradient} transition-all`}>
              ChatChat
            </h1>

            <p className="text-gray-400 mb-10 text-lg md:text-xl text-center">
              Chat with Strangers. Vanish Like a Jinn.
            </p>

            {/* Actions Row */}
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 w-full md:w-auto mb-6 px-4">
              {!isQueueing ? (
                <button
                  onClick={joinQueue}
                  disabled={!isConnected}
                  className={`flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r ${tColors.gradient} ${tColors.shadow} text-white font-semibold text-lg hover:scale-105 active:scale-95 transition-all w-full md:w-auto justify-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <Ghost fill="white" size={20} />
                  <span>Start Chatting 1v1</span>
                </button>
              ) : (
                <div className="flex flex-col items-center px-8 py-2 w-full md:w-auto">
                  <div className={`flex items-center gap-3 text-[${tColors.primary}] mb-4 text-lg`}>
                    <Loader2 className="animate-spin" size={24} />
                    <span className="font-medium animate-pulse">Waiting for a chatter...</span>
                  </div>
                  <button
                    onClick={leaveQueue}
                    className="text-gray-500 hover:text-white transition-colors text-sm cursor-pointer"
                  >
                    Cancel Matchmaking
                  </button>
                </div>
              )}

              {!isQueueing && (
                <>
                  <button
                    onClick={generateGroupRoom}
                    className={`flex items-center gap-3 px-6 py-4 rounded-2xl bg-[#140b22] border border-white/10 hover:border-[${tColors.primary}]/50 text-white/70 font-medium transition-all hover:bg-[#1a0e2a] w-full md:w-auto justify-center group cursor-pointer`}
                  >
                    <Users size={20} className="group-hover:text-white transition-colors" />
                    <span className="group-hover:text-white transition-colors">Start Group Chat</span>
                  </button>

                  {!username && (
                    <button
                      onClick={() => setActiveModal("register")}
                      className={`flex items-center gap-3 px-6 py-4 rounded-2xl bg-[#140b22] border border-white/10 hover:border-[${tColors.primary}]/50 text-white/70 font-medium transition-all hover:bg-[#1a0e2a] w-full md:w-auto justify-center group cursor-pointer`}
                    >
                      <UserPlus size={20} className="group-hover:text-white transition-colors" />
                      <span className="group-hover:text-white transition-colors">Create Account</span>
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Hint text */}
            <div className="flex items-center gap-2 text-xs text-gray-400 mb-10">
              <Zap size={14} className="text-[#f5a623]" fill="#f5a623" />
              <span>Members get <strong className={`text-[${tColors.secondary}]`}>67% longer</strong> chats</span>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap items-center justify-center gap-3 mb-10 max-w-2xl">
              {[
                { icon: Shield, text: "100% Anonymous" },
                { icon: Zap, text: "Instant Match" },
                { icon: Smile, text: "Emoji & Stickers" },
                { icon: Star, text: "Rate & Rank" }
              ].map((badge, i) => (
                <div key={i} className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#140b22] border border-white/5 text-gray-400 text-sm whitespace-nowrap">
                  <badge.icon size={16} />
                  <span>{badge.text}</span>
                </div>
              ))}
            </div>

            {/* Stats Pill */}
            <div className="w-full max-w-5xl grid grid-cols-2 md:grid-cols-4 items-center justify-between px-6 md:px-10 py-5 rounded-[2rem] bg-[#12091d]/70 border border-white/5 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] relative overflow-hidden gap-y-6 md:gap-y-0 mt-4">
              {/* Optional background glow inside the pill to match the left-side light in the image */}
              <div
                className="absolute top-0 left-0 w-32 h-full blur-3xl pointer-events-none opacity-20"
                style={{ backgroundColor: tColors.primary }}
              ></div>

              {/* Online */}
              <div className="flex items-center justify-center md:justify-start gap-4 relative z-10">
                <div className="w-2 h-2 rounded-full bg-[#10b981] shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
                <div className="flex flex-col items-center md:items-start leading-tight">
                  <span className="font-bold text-xl drop-shadow-[0_0_8px_rgba(255,255,255,0.1)] transition-colors" style={{ color: tColors.primary }}>
                    {usersOnline}
                  </span>
                  <span className="text-gray-400 text-sm">online</span>
                </div>
                <div className="hidden md:block absolute right-0 w-px h-10 bg-white/10"></div>
              </div>

              {/* Chatters */}
              <div className="flex items-center justify-center gap-4 relative z-10 border-l border-white/5 md:border-transparent">
                <Ghost size={20} className="text-gray-400 hidden sm:block" />
                <div className="flex flex-col items-center md:items-start leading-tight">
                  <span className="font-bold text-xl drop-shadow-[0_0_8px_rgba(255,255,255,0.1)] transition-colors" style={{ color: tColors.primary }}>
                    {stats.totalChatters.toLocaleString()}
                  </span>
                  <span className="text-gray-400 text-sm">Jinns</span>
                </div>
                <div className="hidden md:block absolute right-0 w-px h-10 bg-white/10"></div>
              </div>

              {/* Chats */}
              <div className="flex items-center justify-center gap-4 relative z-10 pt-4 md:pt-0 border-t border-white/5 md:border-transparent">
                <MessageSquare size={20} className="text-gray-400 hidden sm:block" />
                <div className="flex flex-col items-center md:items-start leading-tight">
                  <span className="font-bold text-gray-200 text-base lg:text-lg">
                    {stats.totalChatsCompleted.toLocaleString()} <span className="font-normal text-sm lg:text-base text-gray-400">chats</span>
                  </span>
                  <span className="text-gray-500 text-sm">completed</span>
                </div>
                <div className="hidden md:block absolute right-0 w-px h-10 bg-white/10"></div>
              </div>

              {/* Messages */}
              <div className="flex items-center justify-center md:justify-end gap-4 relative z-10 border-l border-t border-white/5 md:border-transparent pt-4 md:pt-0">
                <Send size={20} className="text-gray-400 hidden sm:block" />
                <div className="flex flex-col items-center md:items-start leading-tight">
                  <span className="font-bold text-gray-200 text-base lg:text-lg">
                    {stats.totalMessagesSent.toLocaleString()} <span className="font-normal text-sm lg:text-base text-gray-400">messages</span>
                  </span>
                  <span className="text-gray-500 text-sm">sent</span>
                </div>
              </div>
            </div>

          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center animate-in fade-in duration-300">
            <ChatBox room={currentRoom} onLeave={leaveChat} />
          </div>
        )}

      </main>

      {/* Footer Area */}
      <footer className="w-full py-6 flex flex-col items-center justify-center pb-24 md:pb-6">
        <div className="text-xs text-gray-500 flex items-center gap-2">
          <span>ChatChat © 2026</span>
          <span>•</span>
          <Link href="/admin" className={`text-[${tColors.primary}] hover:underline`}>Admin</Link>
        </div>
      </footer>

      {/* Sticky Bottom Nav */}
      <nav className="fixed bottom-0 w-full bg-[#0b0615]/90 backdrop-blur-xl border-t border-white/5 py-3 flex items-center justify-center gap-12 sm:gap-24 z-40">
        <button className={`flex flex-col items-center gap-1.5 text-[${tColors.primary}] transition-colors group cursor-pointer`}>
          <HomeIcon size={24} fill="currentColor" strokeWidth={1.5} className="group-hover:-translate-y-1 transition-transform" />
          <span className="text-[10px] font-medium tracking-wide">Home</span>
        </button>
        <button onClick={() => setActiveModal("history")} className="flex flex-col items-center gap-1.5 text-gray-500 hover:text-white transition-colors group cursor-pointer">
          <Clock size={24} strokeWidth={1.5} className="group-hover:-translate-y-1 transition-transform" />
          <span className="text-[10px] font-medium tracking-wide">History</span>
        </button>
        <button
          onClick={handleInstallClick}
          className="flex flex-col items-center gap-1.5 text-gray-500 hover:text-white transition-colors group cursor-pointer"
        >
          <Download size={24} strokeWidth={1.5} className="group-hover:-translate-y-1 transition-transform" />
          <span className="text-[10px] font-medium tracking-wide">Install</span>
        </button>
      </nav>

      {/* Modals Overlay */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#140b2a] border border-white/10 p-8 rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto relative shadow-[0_0_50px_rgba(255,42,109,0.15)] animate-in zoom-in-95 duration-200 custom-scrollbar">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors z-10 bg-[#140b2a]"
            >
              <X size={20} />
            </button>

            {activeModal === "signin" && (
              <form onSubmit={handleLogin} className="flex flex-col items-center w-full">
                <h2 className="text-2xl font-bold text-gray-200 mb-2 self-start">Welcome Back</h2>
                <p className="text-gray-400 text-sm mb-8 self-start">Sign in to your haunted account</p>

                {authError && <div className="w-full bg-red-500/10 border border-red-500/50 text-red-400 text-sm p-3 rounded-xl mb-4 text-center">{authError}</div>}

                <div className="w-full mb-4">
                  <label className="flex items-center gap-2 text-sm text-gray-400 mb-2 font-medium">
                    <User size={14} /> Username
                  </label>
                  <input required type="text" value={authEmail} onChange={e => setAuthEmail(e.target.value)} placeholder="Your username" className={`w-full bg-[#1b1429] border border-white/5 rounded-lg px-4 py-3 text-white outline-none focus:border-[${tColors.primary}] transition-colors placeholder-gray-600`} />
                </div>

                <div className="w-full mb-6">
                  <label className="flex items-center gap-2 text-sm text-gray-400 mb-2 font-medium">
                    <Lock size={14} /> Password
                  </label>
                  <div className="relative">
                    <input required minLength={6} type={showPassword ? "text" : "password"} value={authPassword} onChange={e => setAuthPassword(e.target.value)} placeholder="Your password" className={`w-full bg-[#1b1429] border border-white/5 rounded-lg px-4 py-3 text-white outline-none focus:border-[${tColors.primary}] transition-colors placeholder-gray-600`} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors">
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="w-full mb-6">
                  <label className="flex items-center gap-2 text-sm text-gray-400 mb-2 font-medium">
                    <ShieldCheck size={14} /> Verification
                  </label>
                  <div className="flex gap-3 mb-3">
                    <canvas ref={canvasRef} width={200} height={50} className={`rounded-lg border border-[${tColors.primary}]/30 bg-[#140b2a] shadow-[0_0_15px_rgba(255,255,255,0.05)]`} />
                    <button type="button" onClick={generateCaptcha} className="p-3 rounded-lg bg-[#2a1b42] border border-white/5 hover:bg-[#3d275c] transition-colors text-white flex items-center justify-center cursor-pointer">
                      <RefreshCw size={18} />
                    </button>
                  </div>
                  <input required type="text" value={userCaptchaInput} onChange={e => setUserCaptchaInput(e.target.value)} placeholder="Enter the code shown above" className={`w-full bg-[#1b1429] border border-white/5 rounded-lg px-4 py-3 text-white outline-none focus:border-[${tColors.primary}] transition-colors placeholder-gray-600`} />
                </div>

                <button disabled={authLoading} type="submit" className={`w-full py-3.5 rounded-xl bg-gradient-to-r ${tColors.gradient} text-white font-bold mb-6 hover:opacity-90 cursor-pointer disabled:opacity-50`}>
                  {authLoading ? "Signing in..." : "Sign In"}
                </button>
                <div className="flex flex-col gap-3 w-full text-center">
                  <span className="text-sm text-gray-400">
                    New to ChatChat? <button type="button" onClick={() => setActiveModal("register")} className={`text-[${tColors.secondary}] hover:underline`}>Create account</button>
                  </span>
                  <button type="button" onClick={() => setActiveModal(null)} className="text-sm text-[${tColors.secondary}] hover:text-white transition-colors hover:underline flex justify-center items-center gap-1 mt-2">
                    &larr; Back to Home
                  </button>
                </div>
              </form>
            )}

            {activeModal === "register" && (
              <form onSubmit={handleRegister} className="flex flex-col items-center w-full">
                <h2 className="text-xl font-bold text-gray-300 mb-6 self-start">Create your anonymous identity</h2>

                {authError && <div className="w-full bg-red-500/10 border border-red-500/50 text-red-400 text-sm p-3 rounded-xl mb-4 text-center">{authError}</div>}

                <div className="w-full mb-4">
                  <label className="flex items-center gap-2 text-sm text-gray-400 mb-2 font-medium">
                    <User size={14} /> Username
                  </label>
                  <input required minLength={3} maxLength={30} type="text" value={authUsername} onChange={e => setAuthUsername(e.target.value)} placeholder="3-30 chars (letters, digits, _ )" className={`w-full bg-[#1b1429] border border-white/5 rounded-lg px-4 py-3 text-white outline-none focus:border-[${tColors.secondary}] transition-colors placeholder-gray-600`} />
                </div>

                <div className="w-full mb-4">
                  <label className="flex items-center gap-2 text-sm text-gray-400 mb-2 font-medium">
                    <Mail size={14} /> Email
                  </label>
                  <input required type="email" value={authEmail} onChange={e => setAuthEmail(e.target.value)} placeholder="your@email.com" className={`w-full bg-[#1b1429] border border-white/5 rounded-lg px-4 py-3 text-white outline-none focus:border-[${tColors.secondary}] transition-colors placeholder-gray-600`} />
                </div>

                <div className="w-full mb-4">
                  <label className="flex items-center gap-2 text-sm text-gray-400 mb-2 font-medium">
                    <Lock size={14} /> Password
                  </label>
                  <div className="relative">
                    <input required minLength={6} type={showPassword ? "text" : "password"} value={authPassword} onChange={e => setAuthPassword(e.target.value)} placeholder="At least 6 characters" className={`w-full bg-[#1b1429] border border-white/5 rounded-lg px-4 py-3 text-white outline-none focus:border-[${tColors.secondary}] transition-colors placeholder-gray-600`} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors">
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="w-full mb-4">
                  <label className="flex items-center gap-2 text-sm text-gray-400 mb-2 font-medium">
                    <Lock size={14} /> Confirm Password
                  </label>
                  <div className="relative">
                    <input required minLength={6} type={showConfirmPassword ? "text" : "password"} value={authConfirmPassword} onChange={e => setAuthConfirmPassword(e.target.value)} placeholder="Repeat password" className={`w-full bg-[#1b1429] border border-white/5 rounded-lg px-4 py-3 text-white outline-none focus:border-[${tColors.secondary}] transition-colors placeholder-gray-600`} />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors">
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="w-full mb-6 flex items-center gap-3">
                  <input type="checkbox" id="terms" checked={authTerms} onChange={e => setAuthTerms(e.target.checked)} className="w-4 h-4 rounded border-gray-600 text-[#b537f2] focus:ring-[#b537f2] bg-[#1b1429]" />
                  <label htmlFor="terms" className="text-sm text-gray-300 select-none">I agree to be a decent human being 👻</label>
                </div>

                <div className="w-full mb-6">
                  <label className="flex items-center gap-2 text-sm text-gray-400 mb-2 font-medium">
                    <ShieldCheck size={14} /> Verification
                  </label>
                  <div className="flex gap-3 mb-3">
                    <canvas ref={canvasRef} width={200} height={50} className={`rounded-lg border border-[${tColors.secondary}]/30 bg-[#140b2a] shadow-[0_0_15px_rgba(255,255,255,0.05)]`} />
                    <button type="button" onClick={generateCaptcha} className="p-3 rounded-lg bg-[#2a1b42] border border-white/5 hover:bg-[#3d275c] transition-colors text-white flex items-center justify-center cursor-pointer">
                      <RefreshCw size={18} />
                    </button>
                  </div>
                  <input required type="text" value={userCaptchaInput} onChange={e => setUserCaptchaInput(e.target.value)} placeholder="Enter the code shown above" className={`w-full bg-[#1b1429] border border-white/5 rounded-lg px-4 py-3 text-white outline-none focus:border-[${tColors.secondary}] transition-colors placeholder-gray-600`} />
                </div>

                <button disabled={authLoading || !authTerms} type="submit" className={`w-full flex justify-center items-center gap-2 py-3.5 rounded-xl bg-gradient-to-r ${tColors.gradient} text-white font-bold mb-4 hover:opacity-90 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}>
                  <Ghost size={18} fill="white" /> {authLoading ? "Registering..." : "Create Account"}
                </button>
                <div className="flex flex-col gap-2 w-full text-center">
                  <span className="text-sm text-gray-400">
                    Already have an account? <button type="button" onClick={() => setActiveModal("signin")} className={`text-[${tColors.secondary}] hover:underline`}>Sign In</button>
                  </span>
                  <button type="button" onClick={() => setActiveModal(null)} className="text-sm text-[${tColors.secondary}] hover:text-white transition-colors hover:underline flex justify-center items-center gap-1 mt-4">
                    &larr; Back to Home
                  </button>
                </div>
              </form>
            )}

            {activeModal === "groupchat" && (
              <div className="flex flex-col items-center w-full">
                <Users size={48} className="text-[#05d9e8] mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">Start a Group Chat</h2>
                <p className="text-gray-400 text-sm mb-6 text-center">Create a private room link and share it with multiple strangers or friends.</p>

                <div className="bg-[#0a0515] border border-[#05d9e8]/30 w-full p-4 rounded-xl flex items-center justify-between mb-6">
                  <span className="text-gray-300 font-mono text-sm truncate">chatchat.net/room/{generatedRoomId}</span>
                  <button onClick={() => navigator.clipboard.writeText(`http://localhost:3000/room/${generatedRoomId}`)} className="text-[#05d9e8] text-sm font-bold hover:underline cursor-pointer">Copy</button>
                </div>

                <Link onClick={() => setActiveModal(null)} prefetch={false} href={`/room/${generatedRoomId}`} className="w-full text-center py-3 rounded-xl bg-gradient-to-r from-[#05d9e8] to-[#0182ce] text-white font-bold hover:opacity-90 shadow-[0_0_15px_rgba(5,217,232,0.3)] cursor-pointer">
                  Enter Group Room
                </Link>
              </div>
            )}

            {activeModal === "history" && (
              <div className="flex flex-col items-center w-full">
                <Clock size={48} className={`text-[${tColors.primary}] mb-4`} />
                <h2 className="text-2xl font-bold text-white mb-2">Chat History</h2>
                <p className="text-gray-400 text-sm mb-6 text-center">Your recent chat sessions saved locally on your device.</p>

                <div className="w-full max-h-64 overflow-y-auto pr-2 space-y-3">
                  {historyItems.length === 0 ? (
                    <div className="text-center text-gray-500 py-8 italic font-light">No chats yet. Go make some friends!</div>
                  ) : (
                    historyItems.map((item) => (
                      <div key={item.id} className="bg-[#0a0515] border border-white/5 w-full p-4 rounded-xl flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-white font-medium">{item.type}</span>
                          <span className="text-xs text-gray-500">{item.date} at {item.time}</span>
                        </div>
                        <div className="text-sm text-gray-400 bg-white/5 px-3 py-1 rounded-lg">
                          {item.messagesCount} Msgs
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
