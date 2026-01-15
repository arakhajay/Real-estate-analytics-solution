import { NextResponse } from 'next/server';

const PY_API_URL = 'http://127.0.0.1:8000';

export async function GET() {
    try {
        const res = await fetch(`${PY_API_URL}/properties`);
        if (!res.ok) throw new Error("Failed to fetch properties");
        const data = await res.json();
        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
