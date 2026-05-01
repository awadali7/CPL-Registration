"use client";

import { useState } from "react";
import { Heart, Loader2, CheckCircle2, X, IndianRupee } from "lucide-react";

interface DonateSectionProps {
    donorName: string;
    donorEmail: string;
    onSkip: () => void;
}

declare global {
    interface Window {
        Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
    }
}

interface RazorpayOptions {
    key: string;
    amount: number;
    currency: string;
    name: string;
    description: string;
    order_id: string;
    prefill?: { name?: string; email?: string; contact?: string };
    theme?: { color?: string };
    image?: string;
    handler: (response: RazorpayResponse) => void;
    modal?: { ondismiss?: () => void };
}

interface RazorpayResponse {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
}

interface RazorpayInstance {
    open: () => void;
    on: (event: string, handler: () => void) => void;
}

const PRESETS = [50, 100, 200, 500];

function loadRazorpayScript(): Promise<boolean> {
    return new Promise((resolve) => {
        if (document.querySelector('script[src*="checkout.razorpay"]')) {
            resolve(true);
            return;
        }
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
}

export default function DonateSection({ donorName, donorEmail, onSkip }: DonateSectionProps) {
    const [selected, setSelected] = useState<number | null>(100);
    const [custom, setCustom] = useState("");
    const [isCustom, setIsCustom] = useState(false);
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [paidAmount, setPaidAmount] = useState(0);

    const finalAmount = isCustom ? parseInt(custom || "0", 10) : (selected ?? 0);

    const handleCustomFocus = () => {
        setIsCustom(true);
        setSelected(null);
    };

    const handlePresetClick = (val: number) => {
        setIsCustom(false);
        setSelected(val);
        setCustom("");
    };

    const handleDonate = async () => {
        if (!finalAmount || finalAmount < 1) return;
        setStatus("loading");

        const loaded = await loadRazorpayScript();
        if (!loaded) { setStatus("error"); return; }

        try {
            const res = await fetch("/api/razorpay/order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amount: finalAmount }),
            });
            const { orderId, error } = await res.json();
            if (error || !orderId) { setStatus("error"); return; }

            const options: RazorpayOptions = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
                amount: finalAmount * 100,
                currency: "INR",
                name: "Chennarathadam Premier League",
                description: "Support CPL 2026",
                order_id: orderId,
                prefill: { name: donorName, email: donorEmail },
                theme: { color: "#eab308" },
                handler: async (response) => {
                    const verifyRes = await fetch("/api/razorpay/verify", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(response),
                    });
                    const { success } = await verifyRes.json();
                    if (success) {
                        setPaidAmount(finalAmount);
                        setStatus("success");
                    } else {
                        setStatus("error");
                    }
                },
                modal: {
                    ondismiss: () => setStatus("idle"),
                },
            };

            const rzp = new window.Razorpay(options);
            rzp.on("payment.failed", () => setStatus("error"));
            rzp.open();
            setStatus("idle");
        } catch {
            setStatus("error");
        }
    };

    if (status === "success") {
        return (
            <div className="bg-white/[0.08] backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden mt-4">
                <div className="p-8 text-center">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-yellow-500/30">
                        <Heart className="h-9 w-9 text-white fill-white" />
                    </div>
                    <h3 className="text-2xl font-extrabold text-white mb-1">Thank You! 🎉</h3>
                    <p className="text-gray-400 text-sm">
                        Your donation of{" "}
                        <span className="text-yellow-400 font-bold">₹{paidAmount}</span>{" "}
                        supports CPL 2026. We truly appreciate it!
                    </p>
                    <div className="mt-5 flex items-center justify-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-400" />
                        <span className="text-green-400 text-sm font-medium">Payment confirmed</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white/[0.08] backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden mt-4">
            {/* Header */}
            <div className="relative bg-gradient-to-r from-yellow-600/30 to-amber-700/20 px-5 py-4 border-b border-white/10">
                <button
                    onClick={onSkip}
                    className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/20 transition-all"
                    aria-label="Skip donation"
                >
                    <X className="h-3.5 w-3.5" />
                </button>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-yellow-500/20 border border-yellow-500/30 flex items-center justify-center shrink-0">
                        <Heart className="h-5 w-5 text-yellow-400 fill-yellow-400/30" />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-white">Support CPL 2026</h3>
                        <p className="text-xs text-gray-400 mt-0.5">
                            Help us make this season unforgettable
                        </p>
                    </div>
                </div>
            </div>

            <div className="p-5 space-y-4">
                {/* Preset amounts */}
                <div>
                    <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">Choose an amount</p>
                    <div className="grid grid-cols-4 gap-2">
                        {PRESETS.map((val) => (
                            <button
                                key={val}
                                type="button"
                                onClick={() => handlePresetClick(val)}
                                className={`py-3 rounded-2xl border text-sm font-bold transition-all active:scale-95 touch-manipulation ${
                                    !isCustom && selected === val
                                        ? "bg-yellow-500 border-yellow-400 text-green-900 shadow-lg shadow-yellow-500/25 scale-[1.04]"
                                        : "bg-white/10 border-white/15 text-gray-300 hover:bg-white/15 hover:border-white/30"
                                }`}
                            >
                                ₹{val}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Custom amount */}
                <div>
                    <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Or enter custom</p>
                    <div className="relative">
                        <IndianRupee className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                        <input
                            type="number"
                            min="1"
                            placeholder="Enter amount"
                            value={custom}
                            onFocus={handleCustomFocus}
                            onChange={(e) => setCustom(e.target.value)}
                            inputMode="numeric"
                            className={`w-full pl-10 pr-4 py-3.5 rounded-xl bg-white/10 border text-sm placeholder-gray-500 focus:outline-none focus:ring-2 transition-all ${
                                isCustom
                                    ? "border-yellow-400/70 focus:ring-yellow-400/20"
                                    : "border-white/15 hover:border-white/30 focus:border-yellow-400/70 focus:ring-yellow-400/15"
                            }`}
                        />
                    </div>
                </div>

                {/* Summary */}
                {finalAmount > 0 && (
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl px-4 py-3 flex items-center justify-between">
                        <span className="text-yellow-300 text-sm font-medium">Donation total</span>
                        <span className="text-yellow-400 text-lg font-extrabold">₹{finalAmount}</span>
                    </div>
                )}

                {status === "error" && (
                    <p className="text-red-400 text-xs text-center">
                        ⚠ Payment failed. Please try again.
                    </p>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-1">
                    <button
                        type="button"
                        onClick={onSkip}
                        className="flex-1 py-3.5 rounded-2xl border border-white/15 text-gray-400 text-sm font-semibold hover:bg-white/10 active:scale-95 transition-all touch-manipulation"
                    >
                        Skip
                    </button>
                    <button
                        type="button"
                        onClick={handleDonate}
                        disabled={!finalAmount || finalAmount < 1 || status === "loading"}
                        className={`flex-[2] py-3.5 rounded-2xl bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-green-900 font-extrabold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-yellow-500/20 active:scale-[0.98] touch-manipulation ${
                            !finalAmount || finalAmount < 1 ? "opacity-50 cursor-not-allowed" : "hover:scale-[1.01]"
                        }`}
                    >
                        {status === "loading" ? (
                            <>
                                <Loader2 className="animate-spin h-4 w-4" />
                                Processing…
                            </>
                        ) : (
                            <>
                                <Heart className="h-4 w-4 fill-green-900/30" />
                                Donate ₹{finalAmount || "—"}
                            </>
                        )}
                    </button>
                </div>

                <p className="text-center text-[10px] text-gray-600">
                    Secured by Razorpay · UPI, Cards, Net Banking accepted
                </p>
            </div>
        </div>
    );
}
