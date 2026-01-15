import { NextResponse } from 'next/server';

const PY_API_URL = 'http://127.0.0.1:8000';

export async function POST(request: Request) {
    try {
        const formData = await request.formData();

        // Forwarding FormData to Python Backend
        // Note: fetch automatically sets Content-Type to multipart/form-data with boundary when body is FormData
        const res = await fetch(`${PY_API_URL}/legal/analyze`, {
            method: 'POST',
            body: formData,
            // Do NOT manually set Content-Type header here, let browser/fetch handle boundary
        });

        if (!res.ok) throw new Error("Legal analysis failed");

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
