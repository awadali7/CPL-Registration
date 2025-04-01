import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Register for Chennarathadam Premier League (CPL) – Join the Action!",
    description:
        "Sign up now for the Chennarathadam Premier League (CPL) and showcase your football skills! Register today to be part of the most exciting league and compete for glory.",
    openGraph: {
        title: "Register for Chennarathadam Premier League (CPL) – Join the Action!",
        description:
            "Sign up now for the Chennarathadam Premier League (CPL) and showcase your football skills! Register today to be part of the most exciting league and compete for glory.",
        type: "website",
        url: "https://cpl-registration.vercel.app", // Replace with your actual URL
        images: [
            {
                url: "/group.jpg", // Replace with the actual image URL
                width: 1200,
                height: 630,
                alt: "CPL Football Registration",
            },
        ],
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body
                className={`${geistSans.variable} ${geistMono.variable} antialiased`}
            >
                {children}
            </body>
        </html>
    );
}
