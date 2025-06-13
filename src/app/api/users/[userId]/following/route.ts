import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

type Params = {
  params: {
    userId: string;
  };
};

export async function GET(req: NextRequest, { params }: Params) {
  const userId = params.userId;
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005/api';
    const res = await fetch(`${apiUrl}/users/${userId}/following`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!res.ok) {
      const message = await res.text();
      console.error('Erro ao buscar seguidores:', message);
      return NextResponse.json(
        { error: 'Erro ao buscar seguidores' },
        { status: res.status }
      );
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Erro de rede:', error?.message || error);
    return NextResponse.json({ error: 'Erro de rede' }, { status: 500 });
  }
}