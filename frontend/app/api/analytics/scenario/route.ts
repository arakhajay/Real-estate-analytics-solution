import { NextResponse } from 'next/server';

const PY_API_URL = 'http://127.0.0.1:8000';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const res = await fetch(`${PY_API_URL}/analytics/scenario`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error("Scenario run failed");
        const data = await res.json();
        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
