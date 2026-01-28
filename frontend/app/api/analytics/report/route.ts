import { NextResponse } from 'next/server';

const PY_API_URL = 'http://127.0.0.1:8000';

export async function POST(request: Request) {
    try {
        const authHeader = request.headers.get('Authorization');

        const headers: Record<string, string> = {};
        if (authHeader) {
            headers['Authorization'] = authHeader;
        }

        // Long timeout needed for deep research
        const res = await fetch(`${PY_API_URL}/analytics/report`, {
            method: 'POST',
            headers
        });
        if (!res.ok) throw new Error("Report generation failed");
        const data = await res.json();
        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
