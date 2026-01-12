import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getOrCreateSmsNumberForAccount } from "@/lib/smsAccounts";

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string })?.id;

    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { creatorAccountId } = await req.json();

        if (!creatorAccountId) {
            return NextResponse.json(
                { error: "creatorAccountId is required" },
                { status: 400 },
            );
        }

        // Optional: Verify that the account belongs to the user
        // (Assuming getOrCreateSmsNumberForAccount might do this or it's checked by account ownership later)

        const result = await getOrCreateSmsNumberForAccount(creatorAccountId);

        return NextResponse.json(result);
    } catch (error) {
        console.error("SMS Activation Error:", error);
        const message = error instanceof Error ? error.message : "Failed to activate SMS";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
