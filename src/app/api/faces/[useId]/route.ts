import { NextResponse } from 'next/server';


export async function GET(req: Request): Promise<NextResponse> {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    // const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5005/api";
    const apiUrl = "http://localhost:8000/api";
    
    try {
        const res = await fetch(`${apiUrl}/users/faces/${userId}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
        });
    
        if (!res.ok) {
        console.error("Erro ao verificar rosto registrado:", res.statusText);
        return NextResponse.json({ error: 'Erro ao verificar rosto registrado' }, { status: 500 });
        }
    
        const data = await res.json();
    
        return NextResponse.json(data);
    
    } catch (error) {
        console.error("Erro de rede:", error);
        return NextResponse.json({ error: 'Erro de rede' }, { status: 500 });
    }
    }
  