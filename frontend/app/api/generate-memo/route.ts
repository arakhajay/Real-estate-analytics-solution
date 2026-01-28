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

        const res = await fetch(`${PY_API_URL}/generate-memo`, {
            method: 'POST',
            headers,
            body: JSON.stringify(body)
        });

        if (!res.ok) throw new Error("PDF Generation Failed");

        // Return PDF Blob
        const pdfBuffer = await res.arrayBuffer();

        return new NextResponse(pdfBuffer, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': 'attachment; filename="investment_memo.pdf"'
            }
        });
    } catch (error: any) {
        return NextResponse.json({ result: "Error: " + error.message }, { status: 500 });
    }
}
