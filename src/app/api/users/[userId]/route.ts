import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(req: NextRequest, context: { params: { userId: string } }) {
  const { userId } = context.params;

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5005/api";

  try {
    const res = await fetch(`${apiUrl}/users/${userId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      console.error("Erro ao verificar rosto registrado:", res.statusText);
      return NextResponse.json(
        { error: 'Erro ao verificar rosto registrado' },
        { status: 500 }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error("Erro de rede:", error);
    return NextResponse.json({ error: 'Erro de rede' }, { status: 500 });
  }
}
