import { NextResponse } from 'next/server';

const PY_API_URL = 'http://127.0.0.1:8000';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { type, data } = body; // type = 'rent' or 'churn'

        if (!type || !data) {
            return NextResponse.json({ error: "Missing type or data" }, { status: 400 });
        }

        const endpoint = type === 'rent' ? '/predict/rent' : '/predict/churn';

        console.log(`Proxying to Python API: ${PY_API_URL}${endpoint}`);

        const res = await fetch(`${PY_API_URL}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!res.ok) {
            const errText = await res.text();
            throw new Error(`Python API Error: ${errText}`);
        }

        const result = await res.json();
        return NextResponse.json(result);

    } catch (error: any) {
        console.error("Prediction Proxy Error:", error);
        return NextResponse.json({ error: error.message || "Prediction failed" }, { status: 500 });
    }
}
