import { NextRequest, NextResponse } from "next/server";

const APPS_SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbwAVyskJCsM_mFWjAfOHEHEZ6CukvGN7BjIkdfvIo1acAXkOS2NZHIeozO5ZHFVucdg/exec";

export async function GET(req: NextRequest) {
    const phone = req.nextUrl.searchParams.get("phone");

    if (!phone || !/^\d{10}$/.test(phone)) {
        return NextResponse.json({ exists: false });
    }

    try {
        const res = await fetch(`${APPS_SCRIPT_URL}?phone=${encodeURIComponent(phone)}`, {
            cache: "no-store",
        });
        const data = await res.json();
        return NextResponse.json(data);
    } catch {
        return NextResponse.json({ exists: false });
    }
}
