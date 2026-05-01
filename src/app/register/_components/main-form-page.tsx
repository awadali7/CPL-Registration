"use client";

import {
    useState,
    useRef,
    useCallback,
    ChangeEvent,
    FormEvent,
    TouchEvent,
    MouseEvent,
} from "react";
import {
    Loader2, User, Phone, Hash, CheckCircle2,
    Trophy, Camera, X, ShieldCheck, Mail,
} from "lucide-react";
import Image from "next/image";
import Logo from "../../../assets/logo.jpg";
import DonateSection from "./donate-section";

interface FormData {
    name: string;
    email: string;
    phoneNumber: string;
    position: string;
    age: string;
    photo: string;
}

interface FormErrors {
    name?: string;
    email?: string;
    phoneNumber?: string;
    position?: string;
    age?: string;
    photo?: string;
}

interface Position {
    code: string;
    name: string;
    category: string;
}

const APPS_SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbwAVyskJCsM_mFWjAfOHEHEZ6CukvGN7BjIkdfvIo1acAXkOS2NZHIeozO5ZHFVucdg/exec";

const positions: Position[] = [
    { code: "GK", name: "Goalkeeper", category: "Goalkeeper" },
    { code: "CB", name: "Center Back", category: "Defenders" },
    { code: "RB", name: "Right Back", category: "Defenders" },
    { code: "LB", name: "Left Back", category: "Defenders" },
    { code: "CDM", name: "Def. Mid", category: "Midfielders" },
    { code: "CM", name: "Central Mid", category: "Midfielders" },
    { code: "CAM", name: "Att. Mid", category: "Midfielders" },
    { code: "RW", name: "Right Wing", category: "Forwards" },
    { code: "LW", name: "Left Wing", category: "Forwards" },
    { code: "CF", name: "Ctr. Forward", category: "Forwards" },
];

const categories = [
    {
        name: "Goalkeeper",
        accent: "text-amber-400",
        dot: "bg-amber-400",
        selectedBg: "bg-amber-500 border-amber-400 text-white shadow-amber-500/30",
        defaultBg: "bg-amber-500/10 border-amber-500/25 text-gray-300",
        hoverBg: "hover:bg-amber-500/20 hover:border-amber-400/50",
    },
    {
        name: "Defenders",
        accent: "text-sky-400",
        dot: "bg-sky-400",
        selectedBg: "bg-sky-500 border-sky-400 text-white shadow-sky-500/30",
        defaultBg: "bg-sky-500/10 border-sky-500/25 text-gray-300",
        hoverBg: "hover:bg-sky-500/20 hover:border-sky-400/50",
    },
    {
        name: "Midfielders",
        accent: "text-emerald-400",
        dot: "bg-emerald-400",
        selectedBg: "bg-emerald-500 border-emerald-400 text-white shadow-emerald-500/30",
        defaultBg: "bg-emerald-500/10 border-emerald-500/25 text-gray-300",
        hoverBg: "hover:bg-emerald-500/20 hover:border-emerald-400/50",
    },
    {
        name: "Forwards",
        accent: "text-rose-400",
        dot: "bg-rose-400",
        selectedBg: "bg-rose-500 border-rose-400 text-white shadow-rose-500/30",
        defaultBg: "bg-rose-500/10 border-rose-500/25 text-gray-300",
        hoverBg: "hover:bg-rose-500/20 hover:border-rose-400/50",
    },
];

// ─── Photo Cropper ─────────────────────────────────────────────────────────────

interface CropBox { x: number; y: number; size: number }
interface ImgMeta { w: number; h: number }
interface PhotoCropperProps {
    src: string;
    onCrop: (dataUrl: string) => void;
    onCancel: () => void;
}

function PhotoCropper({ src, onCrop, onCancel }: PhotoCropperProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const imgRef = useRef<HTMLImageElement>(null);
    const dragRef = useRef<{
        mode: "move" | "resize";
        startX: number; startY: number;
        startCrop: CropBox;
    } | null>(null);

    const [display, setDisplay] = useState<ImgMeta>({ w: 0, h: 0 });
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [natural, setNatural] = useState<ImgMeta>({ w: 0, h: 0 });
    const [crop, setCrop] = useState<CropBox>({ x: 0, y: 0, size: 0 });

    const handleImgLoad = useCallback(() => {
        const img = imgRef.current;
        const el = containerRef.current;
        if (!img || !el) return;
        const cw = el.clientWidth, ch = el.clientHeight;
        const nw = img.naturalWidth, nh = img.naturalHeight;
        const scale = Math.min(cw / nw, ch / nh);
        const dw = nw * scale, dh = nh * scale;
        const ox = (cw - dw) / 2, oy = (ch - dh) / 2;
        setDisplay({ w: dw, h: dh });
        setOffset({ x: ox, y: oy });
        setNatural({ w: nw, h: nh });
        const size = Math.min(dw, dh) * 0.82;
        setCrop({ x: ox + (dw - size) / 2, y: oy + (dh - size) / 2, size });
    }, []);

    const clampCrop = useCallback(
        (next: CropBox, ox: number, oy: number, dw: number, dh: number): CropBox => ({
            size: Math.max(60, Math.min(Math.min(dw, dh), next.size)),
            x: Math.max(ox, Math.min(ox + dw - next.size, next.x)),
            y: Math.max(oy, Math.min(oy + dh - next.size, next.y)),
        }), []
    );

    const applyDelta = useCallback((clientX: number, clientY: number) => {
        if (!dragRef.current) return;
        const { mode, startX, startY, startCrop } = dragRef.current;
        const dx = clientX - startX, dy = clientY - startY;
        if (mode === "move") {
            setCrop(() => clampCrop(
                { ...startCrop, x: startCrop.x + dx, y: startCrop.y + dy },
                offset.x, offset.y, display.w, display.h
            ));
        } else {
            const newSize = Math.max(60, Math.min(Math.min(display.w, display.h), startCrop.size + (dx + dy) / 2));
            setCrop(() => clampCrop({ ...startCrop, size: newSize }, offset.x, offset.y, display.w, display.h));
        }
    }, [offset, display, clampCrop]);

    const startDrag = (clientX: number, clientY: number, mode: "move" | "resize") => {
        dragRef.current = { mode, startX: clientX, startY: clientY, startCrop: { ...crop } };
    };

    const onMouseDown = (e: MouseEvent, mode: "move" | "resize") => { e.preventDefault(); startDrag(e.clientX, e.clientY, mode); };
    const onMouseMove = (e: MouseEvent) => applyDelta(e.clientX, e.clientY);
    const onMouseUp = () => { dragRef.current = null; };
    const onTouchStart = (e: TouchEvent, mode: "move" | "resize") => { e.preventDefault(); const t = e.touches[0]; startDrag(t.clientX, t.clientY, mode); };
    const onTouchMove = (e: TouchEvent) => { e.preventDefault(); applyDelta(e.touches[0].clientX, e.touches[0].clientY); };
    const onTouchEnd = () => { dragRef.current = null; };

    const handleCrop = () => {
        const img = imgRef.current;
        if (!img || crop.size === 0) return;
        const canvas = document.createElement("canvas");
        canvas.width = 400; canvas.height = 400;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        const sx = ((crop.x - offset.x) / display.w) * natural.w;
        const sy = ((crop.y - offset.y) / display.h) * natural.h;
        const sSize = (crop.size / display.w) * natural.w;
        ctx.drawImage(img, sx, sy, sSize, sSize, 0, 0, 400, 400);
        onCrop(canvas.toDataURL("image/jpeg", 0.88));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="bg-gray-950 w-full sm:max-w-sm sm:rounded-2xl rounded-t-3xl border border-white/10 shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
                    <div>
                        <h3 className="text-white font-bold">Crop Photo</h3>
                        <p className="text-gray-500 text-xs mt-0.5">Drag to move · Resize from corner</p>
                    </div>
                    <button
                        onClick={onCancel}
                        className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/20 transition-all"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Canvas */}
                <div
                    ref={containerRef}
                    className="relative w-full bg-black select-none touch-none"
                    style={{ height: 340 }}
                    onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
                    onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
                >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        ref={imgRef} src={src} alt="crop preview"
                        onLoad={handleImgLoad}
                        className="w-full h-full object-contain"
                        draggable={false}
                    />

                    {crop.size > 0 && (
                        <>
                            <div className="absolute bg-black/60 pointer-events-none" style={{ left: 0, top: 0, right: 0, height: crop.y }} />
                            <div className="absolute bg-black/60 pointer-events-none" style={{ left: 0, top: crop.y + crop.size, right: 0, bottom: 0 }} />
                            <div className="absolute bg-black/60 pointer-events-none" style={{ left: 0, top: crop.y, width: crop.x, height: crop.size }} />
                            <div className="absolute bg-black/60 pointer-events-none" style={{ left: crop.x + crop.size, top: crop.y, right: 0, height: crop.size }} />

                            <div
                                className="absolute border-2 border-yellow-400 cursor-move"
                                style={{ left: crop.x, top: crop.y, width: crop.size, height: crop.size }}
                                onMouseDown={(e) => onMouseDown(e, "move")}
                                onTouchStart={(e) => onTouchStart(e, "move")}
                            >
                                {/* Rule-of-thirds */}
                                <div className="absolute inset-0 pointer-events-none">
                                    <div className="absolute top-0 bottom-0 border-r border-white/20" style={{ left: "33.33%" }} />
                                    <div className="absolute top-0 bottom-0 border-r border-white/20" style={{ left: "66.66%" }} />
                                    <div className="absolute left-0 right-0 border-b border-white/20" style={{ top: "33.33%" }} />
                                    <div className="absolute left-0 right-0 border-b border-white/20" style={{ top: "66.66%" }} />
                                </div>
                                {/* L-shaped corner handles */}
                                {[
                                    "-top-px -left-px border-t-2 border-l-2 rounded-tl",
                                    "-top-px -right-px border-t-2 border-r-2 rounded-tr",
                                    "-bottom-px -left-px border-b-2 border-l-2 rounded-bl",
                                ].map((cls, i) => (
                                    <span key={i} className={`absolute w-4 h-4 border-yellow-400 pointer-events-none ${cls}`} />
                                ))}
                                {/* Resize handle */}
                                <div
                                    className="absolute -bottom-4 -right-4 w-9 h-9 bg-yellow-400 rounded-xl flex items-center justify-center cursor-se-resize shadow-xl"
                                    onMouseDown={(e) => { e.stopPropagation(); onMouseDown(e, "resize"); }}
                                    onTouchStart={(e) => { e.stopPropagation(); onTouchStart(e, "resize"); }}
                                >
                                    <svg viewBox="0 0 10 10" className="w-4 h-4">
                                        <path d="M2 8L8 2M5 8L8 5" stroke="#14532d" strokeWidth="2" strokeLinecap="round" />
                                    </svg>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Actions */}
                <div className="flex gap-3 p-4" style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}>
                    <button
                        onClick={onCancel}
                        className="flex-1 py-3.5 rounded-xl border border-white/20 text-gray-300 text-sm font-semibold hover:bg-white/10 active:scale-95 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleCrop}
                        className="flex-1 py-3.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 active:scale-95 text-green-900 text-sm font-bold transition-all shadow-lg shadow-yellow-500/20"
                    >
                        Use Photo
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Input Field ───────────────────────────────────────────────────────────────

function Field({
    label, icon, error, children,
}: {
    label: string;
    icon: React.ReactNode;
    error?: string;
    children: React.ReactNode;
}) {
    return (
        <div>
            <label className="block text-sm font-semibold mb-2 text-gray-200">{label}</label>
            <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                    {icon}
                </div>
                {children}
            </div>
            {error && (
                <p className="flex items-center gap-1 text-red-400 text-xs mt-1.5 font-medium">
                    <span>⚠</span> {error}
                </p>
            )}
        </div>
    );
}

// ─── Main Registration Page ────────────────────────────────────────────────────

export default function RegistrationPage() {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const photoRef = useRef<HTMLDivElement>(null);
    const positionRef = useRef<HTMLDivElement>(null);

    const [formData, setFormData] = useState<FormData>({
        name: "", email: "", phoneNumber: "", position: "", age: "", photo: "",
    });
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [showSuccessPopup, setShowSuccessPopup] = useState(false);
    const [showDonate, setShowDonate] = useState(false);
    const [errors, setErrors] = useState<FormErrors>({});
    const [isLoading, setIsLoading] = useState(false);
    const [isCheckingPhone, setIsCheckingPhone] = useState(false);
    const [savedData, setSavedData] = useState<{
        name: string; email: string; age: string;
        phoneNumber: string; position: string; photo: string;
    } | null>(null);
    const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((p) => ({ ...p, [name]: value }));
        if (errors[name as keyof FormErrors])
            setErrors((p) => ({ ...p, [name]: undefined }));
    };

    const checkPhoneInSheet = async (phone: string): Promise<boolean> => {
        try {
            const res = await fetch(`/api/check-registration?phone=${encodeURIComponent(phone)}`);
            const data = await res.json();
            if (data.exists) {
                setSavedData({
                    name: data.data.name,
                    email: data.data.email,
                    age: data.data.age,
                    phoneNumber: phone,
                    position: data.data.position,
                    photo: data.data.photoUrl ?? "",
                });
                setIsSubmitted(true);
                return true;
            }
        } catch {
            // fail silently — let submit proceed
        }
        return false;
    };

    const handlePhoneBlur = async () => {
        if (!/^\d{10}$/.test(formData.phoneNumber)) return;
        setIsCheckingPhone(true);
        await checkPhoneInSheet(formData.phoneNumber);
        setIsCheckingPhone(false);
    };

    const handlePositionSelect = (position: string) => {
        setFormData((p) => ({ ...p, position }));
        if (errors.position) setErrors((p) => ({ ...p, position: undefined }));
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => setRawImageSrc(ev.target?.result as string);
        reader.readAsDataURL(file);
        e.target.value = "";
    };

    const validateForm = (): boolean => {
        const e: FormErrors = {};
        if (!formData.photo) e.photo = "Player photo is required";
        if (!formData.name.trim()) e.name = "Name is required";
        if (!formData.email.trim()) e.email = "Email is required";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) e.email = "Enter a valid email address";
        if (!formData.phoneNumber.trim()) e.phoneNumber = "Phone number is required";
        else if (!/^\d{10}$/.test(formData.phoneNumber)) e.phoneNumber = "Enter a valid 10-digit number";
        if (!formData.position) e.position = "Please select your position";
        if (!formData.age.trim()) e.age = "Age is required";
        else {
            const age = parseInt(formData.age, 10);
            if (isNaN(age) || age < 15 || age > 50) e.age = "Must be between 15 and 50";
        }
        setErrors(e);
        if (e.photo) {
            setTimeout(() => photoRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
        } else if (e.position) {
            setTimeout(() => positionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
        }
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!validateForm()) return;
        setIsLoading(true);
        try {
            // Double-check phone against sheet before submitting
            const alreadyRegistered = await checkPhoneInSheet(formData.phoneNumber);
            if (alreadyRegistered) return;

            const fd = new FormData();
            fd.append("name", formData.name);
            fd.append("email", formData.email);
            fd.append("phoneNumber", formData.phoneNumber);
            fd.append("position", formData.position);
            fd.append("age", formData.age);
            if (formData.photo) fd.append("photo", formData.photo);
            await fetch(APPS_SCRIPT_URL, { method: "POST", body: fd, mode: "no-cors" });
            setSavedData({
                name: formData.name,
                email: formData.email,
                age: formData.age,
                phoneNumber: formData.phoneNumber,
                position: formData.position,
                photo: formData.photo,
            });
            setShowSuccessPopup(true);
            setIsSubmitted(true);
            setTimeout(() => { setShowSuccessPopup(false); setShowDonate(true); }, 5000);
        } catch (err) {
            console.error("Submit error:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const inputCls = (hasError?: string) =>
        `w-full pl-10 pr-4 py-3.5 rounded-xl bg-white/10 border text-sm placeholder-gray-500 focus:outline-none focus:ring-2 transition-all ${
            hasError
                ? "border-red-400/70 focus:ring-red-400/20 focus:border-red-400"
                : "border-white/15 focus:border-yellow-400/70 focus:ring-yellow-400/15 hover:border-white/30"
        }`;

    return (
        <>
            {/* iOS-safe fixed background (background-attachment:fixed breaks on iOS Safari) */}
            <div className="fixed inset-0 -z-10">
                <div
                    className="absolute inset-0"
                    style={{ backgroundImage: "url('/group.jpg')", backgroundSize: "cover", backgroundPosition: "center" }}
                />
                <div className="absolute inset-0 bg-black/75" />
            </div>

            <div
                className="min-h-screen text-white flex flex-col"
                style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
            >
                {/* Header */}
                <header className="flex flex-col items-center pt-8 pb-4 px-4">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 p-1.5 bg-white rounded-full flex items-center justify-center shadow-2xl mb-3">
                        <div className="w-full h-full relative overflow-hidden rounded-full bg-green-800 border-2 border-yellow-500">
                            <Image src={Logo} alt="CPL Logo" fill className="object-cover" priority />
                        </div>
                    </div>
                    <h1 className="text-xl sm:text-2xl font-extrabold text-center tracking-wide leading-tight">
                        <span className="text-green-400">CHENNARATHADAM</span>
                        <span className="block text-white">PREMIER LEAGUE</span>
                    </h1>
                    <div className="flex items-center gap-2 mt-2">
                        <span className="h-px w-8 bg-yellow-500/50" />
                        <p className="text-yellow-400 font-semibold text-xs sm:text-sm tracking-widest uppercase">
                            Season 2026 · Player Registration
                        </p>
                        <span className="h-px w-8 bg-yellow-500/50" />
                    </div>
                </header>

                {/* Content */}
                <main className="flex-1 w-full mx-auto px-4 pb-8 max-w-lg">
                    {!isSubmitted ? (
                        <form onSubmit={handleSubmit} className="flex flex-col gap-0">
                            {/* Card */}
                            <div className="bg-white/[0.08] backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden">

                                {/* Form banner */}
                                <div className="relative bg-gradient-to-r from-green-900/80 to-green-800/60 px-5 py-4 border-b border-white/10 overflow-hidden">
                                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-yellow-500/10 rounded-full" />
                                    <div className="absolute -right-1 top-4 w-12 h-12 bg-yellow-500/10 rounded-full" />
                                    <h2 className="text-base sm:text-lg font-bold relative">Register as a Player</h2>
                                    <p className="text-xs text-gray-400 mt-0.5 relative">
                                        Complete your details to join CPL 2026
                                    </p>
                                </div>

                                <div className="p-5 sm:p-6 space-y-5">
                                    {/* Photo Upload */}
                                    <div ref={photoRef} className="flex flex-col items-center py-2">
                                        <input
                                            ref={fileInputRef}
                                            type="file" accept="image/*"
                                            className="hidden"
                                            onChange={handleFileChange}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="relative group focus:outline-none"
                                            aria-label="Upload player photo"
                                        >
                                            {/* Outer ring */}
                                            <div className={`w-28 h-28 sm:w-32 sm:h-32 rounded-full p-[3px] transition-all duration-300 ${
                                                formData.photo
                                                    ? "bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-lg shadow-yellow-500/25"
                                                    : errors.photo
                                                    ? "bg-red-500/60 shadow-lg shadow-red-500/25"
                                                    : "bg-white/20 group-hover:bg-gradient-to-br group-hover:from-yellow-400/60 group-hover:to-yellow-600/60"
                                            }`}>
                                                <div className="w-full h-full rounded-full overflow-hidden bg-white/10 flex items-center justify-center">
                                                    {formData.photo ? (
                                                        // eslint-disable-next-line @next/next/no-img-element
                                                        <img
                                                            src={formData.photo}
                                                            alt="Player photo"
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="flex flex-col items-center gap-1 text-gray-400 group-hover:text-yellow-400 transition-colors">
                                                            <Camera className="h-8 w-8" />
                                                            <span className="text-[10px] font-semibold uppercase tracking-wide">
                                                                Add Photo
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Hover overlay on photo */}
                                            {formData.photo && (
                                                <div className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/45 transition-all flex items-center justify-center">
                                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center gap-1">
                                                        <Camera className="h-6 w-6 text-white" />
                                                        <span className="text-[10px] text-white font-semibold">Change</span>
                                                    </div>
                                                </div>
                                            )}
                                        </button>

                                        <p className="text-xs text-gray-500 mt-2.5">
                                            {formData.photo ? "Tap photo to change" : "Required · Square crop applied"}
                                        </p>
                                        {errors.photo && (
                                            <p className="flex items-center gap-1 text-red-400 text-xs mt-1.5 font-medium">
                                                <span>⚠</span> {errors.photo}
                                            </p>
                                        )}

                                        {formData.photo && (
                                            <button
                                                type="button"
                                                onClick={() => setFormData((p) => ({ ...p, photo: "" }))}
                                                className="mt-1.5 text-xs text-red-400/80 hover:text-red-300 transition-colors flex items-center gap-1"
                                            >
                                                <X className="h-3 w-3" /> Remove photo
                                            </button>
                                        )}
                                    </div>

                                    {/* Divider */}
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1 h-px bg-white/10" />
                                        <span className="text-[10px] text-gray-500 uppercase tracking-widest">Player Details</span>
                                        <div className="flex-1 h-px bg-white/10" />
                                    </div>

                                    {/* Full Name */}
                                    <Field
                                        label="Full Name"
                                        icon={<User className="h-4 w-4" />}
                                        error={errors.name}
                                    >
                                        <input
                                            type="text" name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            placeholder="Enter your full name"
                                            disabled={isLoading}
                                            autoComplete="name"
                                            className={inputCls(errors.name)}
                                        />
                                    </Field>

                                    {/* Email */}
                                    <Field
                                        label="Email Address"
                                        icon={<Mail className="h-4 w-4" />}
                                        error={errors.email}
                                    >
                                        <input
                                            type="email" name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            placeholder="you@example.com"
                                            disabled={isLoading}
                                            autoComplete="email"
                                            inputMode="email"
                                            className={inputCls(errors.email)}
                                        />
                                    </Field>

                                    {/* Age + Phone */}
                                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                                        <Field
                                            label="Age"
                                            icon={<Hash className="h-4 w-4" />}
                                            error={errors.age}
                                        >
                                            <input
                                                type="number" name="age"
                                                value={formData.age}
                                                onChange={handleChange}
                                                min="15" max="50"
                                                placeholder="15–50"
                                                disabled={isLoading}
                                                className={inputCls(errors.age)}
                                            />
                                        </Field>
                                        <Field
                                            label="Phone"
                                            icon={isCheckingPhone
                                                ? <Loader2 className="h-4 w-4 animate-spin text-yellow-400" />
                                                : <Phone className="h-4 w-4" />
                                            }
                                            error={errors.phoneNumber}
                                        >
                                            <input
                                                type="tel" name="phoneNumber"
                                                value={formData.phoneNumber}
                                                onChange={handleChange}
                                                onBlur={handlePhoneBlur}
                                                placeholder="10 digits"
                                                disabled={isLoading || isCheckingPhone}
                                                autoComplete="tel"
                                                inputMode="numeric"
                                                maxLength={10}
                                                className={inputCls(errors.phoneNumber)}
                                            />
                                        </Field>
                                    </div>

                                    {/* Playing Position */}
                                    <div ref={positionRef}>
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-sm font-semibold text-gray-200">Playing Position</span>
                                            {formData.position && (
                                                <span className="text-[11px] bg-yellow-500/20 border border-yellow-500/30 px-2.5 py-1 rounded-full text-yellow-300 font-bold tracking-wide">
                                                    {formData.position}
                                                </span>
                                            )}
                                        </div>
                                        {errors.position && (
                                            <p className="flex items-center gap-1 text-red-400 text-xs mb-2 font-medium">
                                                <span>⚠</span> {errors.position}
                                            </p>
                                        )}
                                        <div className="space-y-3">
                                            {categories.map((cat) => {
                                                const catPositions = positions.filter((p) => p.category === cat.name);
                                                return (
                                                    <div key={cat.name}>
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <span className={`w-1.5 h-1.5 rounded-full ${cat.dot}`} />
                                                            <p className={`text-[11px] font-bold uppercase tracking-widest ${cat.accent}`}>
                                                                {cat.name}
                                                            </p>
                                                        </div>
                                                        <div className={`grid gap-2 ${catPositions.length === 1 ? "grid-cols-1" : "grid-cols-3"}`}>
                                                            {catPositions.map((pos) => {
                                                                const selected = formData.position === pos.code;
                                                                return (
                                                                    <button
                                                                        key={pos.code}
                                                                        type="button"
                                                                        onClick={() => handlePositionSelect(pos.code)}
                                                                        disabled={isLoading}
                                                                        className={`relative py-3 px-2 rounded-2xl border text-center font-semibold transition-all duration-150 active:scale-95 touch-manipulation ${
                                                                            selected
                                                                                ? `${cat.selectedBg} shadow-lg scale-[1.02]`
                                                                                : `${cat.defaultBg} ${cat.hoverBg}`
                                                                        }`}
                                                                    >
                                                                        {selected && (
                                                                            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-white/80" />
                                                                        )}
                                                                        <span className="block text-sm font-extrabold leading-none mb-1">
                                                                            {pos.code}
                                                                        </span>
                                                                        <span className="block text-[10px] opacity-75 font-normal leading-tight">
                                                                            {pos.name}
                                                                        </span>
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Sticky Submit */}
                            <div className="sticky bottom-0 pt-4 pb-2">
                                <div className="absolute inset-x-0 -inset-y-2 -mx-4 bg-gradient-to-t from-black/70 via-black/40 to-transparent pointer-events-none" />
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className={`relative w-full bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-green-900 font-extrabold py-4 sm:py-4.5 rounded-2xl transition-all flex items-center justify-center text-base shadow-xl shadow-yellow-600/30 hover:shadow-yellow-500/40 active:scale-[0.98] touch-manipulation ${
                                        isLoading ? "opacity-75 cursor-not-allowed" : "hover:scale-[1.015]"
                                    }`}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="animate-spin mr-2 h-5 w-5" />
                                            Submitting Registration…
                                        </>
                                    ) : (
                                        <>
                                            <Trophy className="mr-2 h-5 w-5" />
                                            Register Now
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    ) : (
                        /* Already registered card */
                        <div className="bg-white/[0.08] backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
                            <div className="bg-gradient-to-r from-green-900/80 to-emerald-900/60 px-5 py-5 flex flex-col items-center border-b border-white/10">
                                {savedData?.photo ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={savedData.photo}
                                        alt="Player"
                                        className="w-24 h-24 rounded-full object-cover border-[3px] border-yellow-400 shadow-xl mb-3"
                                    />
                                ) : (
                                    <div className="w-20 h-20 rounded-full bg-green-500/20 border-2 border-green-400/40 flex items-center justify-center mb-3">
                                        <ShieldCheck className="h-10 w-10 text-green-400" />
                                    </div>
                                )}
                                <h2 className="text-xl font-bold">Already Registered!</h2>
                                <p className="text-gray-400 text-sm mt-1 text-center">
                                    You&apos;re on the list for CPL 2026
                                </p>
                            </div>

                            {savedData && (
                                <div className="p-5 space-y-3">
                                    {[
                                        { label: "Full Name", value: savedData.name },
                                        { label: "Email", value: savedData.email },
                                        { label: "Age", value: savedData.age + " yrs" },
                                        { label: "Phone", value: savedData.phoneNumber },
                                        { label: "Position", value: savedData.position, badge: true },
                                    ].map(({ label, value, badge }) => (
                                        <div
                                            key={label}
                                            className="flex items-center justify-between py-3 border-b border-white/[0.07] last:border-0"
                                        >
                                            <span className="text-gray-500 text-sm">{label}</span>
                                            {badge ? (
                                                <span className="bg-yellow-500/20 border border-yellow-500/30 text-yellow-300 text-sm font-bold px-3 py-1 rounded-full">
                                                    {value}
                                                </span>
                                            ) : (
                                                <span className="text-white font-semibold text-sm">{value}</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="px-5 pb-5">
                                <div className="bg-green-500/10 border border-green-500/20 rounded-2xl px-4 py-3 flex items-center gap-3">
                                    <CheckCircle2 className="h-5 w-5 text-green-400 shrink-0" />
                                    <p className="text-green-300 text-xs font-medium">
                                        Registration confirmed. We&apos;ll contact you before the season begins.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Donate */}
                    {showDonate && (
                        <DonateSection
                            donorName={savedData?.name ?? ""}
                            donorEmail={savedData?.email ?? ""}
                            onSkip={() => setShowDonate(false)}
                        />
                    )}

                    {/* Follow Us */}
                    <div className="mt-8 text-center">
                        <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-3">Follow Us</p>
                        <a
                            href="https://www.instagram.com/chennarathadampremierleague"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center bg-gradient-to-tr from-purple-600 via-pink-500 to-yellow-500 px-5 py-3 rounded-2xl hover:opacity-90 active:scale-95 transition-all shadow-lg text-sm font-semibold touch-manipulation"
                        >
                            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                                <circle cx="12" cy="12" r="4" />
                                <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
                            </svg>
                            @chennarathadampremierleague
                        </a>
                    </div>
                </main>
            </div>

            {/* Photo Cropper Modal */}
            {rawImageSrc && (
                <PhotoCropper
                    src={rawImageSrc}
                    onCrop={(url) => { setFormData((p) => ({ ...p, photo: url })); setErrors((p) => ({ ...p, photo: undefined })); setRawImageSrc(null); }}
                    onCancel={() => setRawImageSrc(null)}
                />
            )}

            {/* Success Popup */}
            {showSuccessPopup && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/65 backdrop-blur-sm z-50 px-5">
                    <div className="bg-gray-950 border border-white/10 text-white p-7 rounded-3xl shadow-2xl max-w-xs w-full text-center">
                        {formData.photo ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={formData.photo}
                                alt="Player"
                                className="w-24 h-24 rounded-full object-cover border-4 border-yellow-400 mx-auto mb-4 shadow-xl"
                            />
                        ) : (
                            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-500/30">
                                <CheckCircle2 className="h-10 w-10 text-white" />
                            </div>
                        )}
                        <h2 className="text-2xl font-extrabold mb-1">You&apos;re In! 🎉</h2>
                        <p className="text-gray-400 text-sm leading-relaxed">
                            Welcome to CPL 2026,{" "}
                            <strong className="text-white">{formData.name}</strong>!<br />
                            We&apos;ll be in touch soon.
                        </p>
                        <div className="mt-4 flex items-center justify-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                            <span className="w-1.5 h-1.5 rounded-full bg-yellow-400/50" />
                            <span className="w-1.5 h-1.5 rounded-full bg-yellow-400/25" />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
