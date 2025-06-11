import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

type Params = {
  params: {
    userId: string;
  };
};

export async function GET(req: NextRequest, { params }: Params) {
  const userId = params.userId;

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5005/api";
  // const apiUrl =  "http://localhost:8000/api";

  try {
    const res = await fetch(`${apiUrl}/users/${userId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const message = await res.text();
      console.error("Erro ao verificar rosto registrado:", message);
      return NextResponse.json(
        { error: 'Erro ao verificar rosto registrado' },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);

  } catch (error: any) {
    console.error("Erro de rede:", error?.message || error);
    return NextResponse.json({ error: 'Erro de rede' }, { status: 500 });
  }
}
