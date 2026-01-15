import { NextResponse } from 'next/server';

const PY_API_URL = 'http://127.0.0.1:8000';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const res = await fetch(`${PY_API_URL}/analyze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (!res.ok) throw new Error("Agent failed");
        const data = await res.json();
        return NextResponse.json(data); // returns { result: "markdown string" }
    } catch (error: any) {
        return NextResponse.json({ result: "Error: " + error.message }, { status: 500 });
    }
}
