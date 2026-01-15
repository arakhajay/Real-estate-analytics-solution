import { NextResponse } from 'next/server';

const PY_API_URL = 'http://127.0.0.1:8000';

export async function GET(request: Request, { params }: { params: { id: string } }) {
    try {
        const res = await fetch(`${PY_API_URL}/properties/${params.id}/yield`);
        if (!res.ok) throw new Error("Failed to fetch yield data");
        const data = await res.json();
        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
