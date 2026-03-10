"use client";
import { useEffect, useState } from "react";

export default function StarryBackground() {
    const [stars, setStars] = useState<{ id: number; top: string; left: string; size: number; color: string; duration: string; delay: string }[]>([]);

    useEffect(() => {
        const newStars = Array.from({ length: 70 }).map((_, i) => {
            const colors = ["#ff2a6d", "#05d9e8", "#b537f2", "#ffffff"];
            return {
                id: i,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                size: Math.random() * 5 + 3,
                color: colors[Math.floor(Math.random() * colors.length)],
                duration: `${Math.random() * 15 + 15}s`, // 15 to 30 seconds
                delay: `-${Math.random() * 30}s` // negative delay so they start already on screen
            };
        });
        setStars(newStars);
    }, []);

    return (
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-[-1]">
            <div className="absolute inset-0 bg-[#080411]"></div>
            {stars.map((star) => (
                <div
                    key={star.id}
                    className="absolute rounded-full opacity-60 animate-drift"
                    style={{
                        top: star.top,
                        left: star.left,
                        width: `${star.size}px`,
                        height: `${star.size}px`,
                        backgroundColor: star.color,
                        animationDuration: star.duration,
                        animationDelay: star.delay
                    }}
                />
            ))}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-neon-purple rounded-full blur-[200px] opacity-10 blur-glow"></div>
        </div>
    );
}
