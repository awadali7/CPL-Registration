import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: NextRequest) {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();

        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expected = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
            .update(body)
            .digest("hex");

        const isValid = expected === razorpay_signature;
        return NextResponse.json({ success: isValid });
    } catch (err) {
        console.error("Razorpay verify error:", err);
        return NextResponse.json({ success: false }, { status: 500 });
    }
}
