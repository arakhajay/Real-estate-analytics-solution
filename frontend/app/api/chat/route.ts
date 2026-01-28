import { NextResponse } from 'next/server';

const PY_API_URL = 'http://127.0.0.1:8000';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const authHeader = req.headers.get('Authorization');

        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (authHeader) {
            headers['Authorization'] = authHeader;
        }

        const res = await fetch(`${PY_API_URL}/chat`, {
            method: 'POST',
            headers,
            body: JSON.stringify(body)
        });

        if (!res.ok) throw new Error("Chat request failed");
        const data = await res.json();
        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ response: "Error: " + error.message, source: "System" }, { status: 500 });
    }
}
