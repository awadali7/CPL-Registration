"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import Logo from "../assets/logo.jpg";

export default function HomePage() {
    // Set countdown deadline (5 days from now)
    const countdownDeadline = new Date();
    countdownDeadline.setDate(countdownDeadline.getDate() + 5);

    // State for timer
    const [timeLeft, setTimeLeft] = useState({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
    });

    useEffect(() => {
        const updateTimer = () => {
            const now = new Date().getTime();
            const distance = countdownDeadline.getTime() - now;

            if (distance <= 0) {
                setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
                return;
            }

            setTimeLeft({
                days: Math.floor(distance / (1000 * 60 * 60 * 24)),
                hours: Math.floor(
                    (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
                ),
                minutes: Math.floor(
                    (distance % (1000 * 60 * 60)) / (1000 * 60)
                ),
                seconds: Math.floor((distance % (1000 * 60)) / 1000),
            });
        };

        // Initial call and update every second
        updateTimer();
        const interval = setInterval(updateTimer, 1000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div
            className="min-h-screen flex flex-col items-center justify-center text-white relative overflow-hidden"
            style={{
                backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url('/group.jpg')`,
                backgroundSize: "cover",
                backgroundPosition: "center",
            }}
        >
            <div className="z-10 text-center px-4 sm:px-6 md:px-8 max-w-4xl w-full">
                {/* CPL Logo */}
                <div className="mb-6 sm:mb-8 mx-auto">
                    <div className="w-28 h-28 sm:w-36 sm:h-36 md:w-48 md:h-48 p-2 bg-white rounded-full flex items-center justify-center shadow-lg mx-auto">
                        <div className="w-24 h-24 sm:w-32 sm:h-32 md:w-44 md:h-44 relative overflow-hidden rounded-full bg-green-700 flex items-center justify-center border-2 sm:border-3 md:border-4 border-yellow-500">
                            <Image
                                src={Logo}
                                alt="Logo"
                                fill
                                priority
                                className="object-cover"
                            />
                        </div>
                    </div>
                </div>

                {/* League Title with animation */}
                <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold mb-4 sm:mb-6 tracking-tight">
                    <span className="block text-green-400">CHENNARATHADAM</span>
                    <span className="block text-white">PREMIER LEAGUE</span>
                </h1>

                {/* Season info */}
                <div className="mb-6 sm:mb-8">
                    <p className="text-lg sm:text-xl md:text-2xl font-medium text-yellow-400">
                        Season 2025
                    </p>
                    <p className="text-base sm:text-lg md:text-xl mt-2 text-gray-300">
                        The Ultimate Football Experience
                    </p>
                </div>

                {/* Countdown Timer */}
                <div className="bg-black bg-opacity-50 p-4 sm:p-6 rounded-lg inline-block text-center">
                    <p className="text-xl sm:text-2xl font-semibold text-yellow-400">
                        Time Left:
                    </p>
                    <div className="flex justify-center space-x-4 mt-2">
                        <div className="text-center">
                            <p className="text-3xl sm:text-4xl font-bold text-yellow-400">
                                {timeLeft.days}
                            </p>
                            <p className="text-sm sm:text-base text-gray-300">
                                Days
                            </p>
                        </div>
                        <div className="text-center">
                            <p className="text-3xl sm:text-4xl font-bold text-yellow-400">
                                {timeLeft.hours}
                            </p>
                            <p className="text-sm sm:text-base text-gray-300">
                                Hours
                            </p>
                        </div>
                        <div className="text-center">
                            <p className="text-3xl sm:text-4xl font-bold text-yellow-400">
                                {timeLeft.minutes}
                            </p>
                            <p className="text-sm sm:text-base text-gray-300">
                                Minutes
                            </p>
                        </div>
                        <div className="text-center">
                            <p className="text-3xl sm:text-4xl font-bold text-yellow-400">
                                {timeLeft.seconds}
                            </p>
                            <p className="text-sm sm:text-base text-gray-300">
                                Seconds
                            </p>
                        </div>
                    </div>
                </div>

                {/* Register Button */}
                <div className="mt-6 sm:mt-8">
                    <Link
                        href="/register"
                        className="inline-block bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-green-900 font-bold py-3 sm:py-4 px-6 sm:px-8 rounded-lg text-lg sm:text-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
                    >
                        Register Now
                    </Link>
                </div>

                {/* Tournament details */}
            </div>

            {/* Footer */}
            <footer className="absolute bottom-0 w-full bg-black bg-opacity-70 py-2 sm:py-3 text-center z-10 text-xs sm:text-sm">
                <p className="text-gray-400">
                    © 2025 Chennarathadam Premier League. All Rights Reserved.
                </p>
            </footer>
        </div>
    );
}
