import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

type Params = {
  params: {
    userId: string;
  };
};

export async function POST(req: NextRequest, { params }: Params) {
  const followed_clerk_id = params.userId; // The ID of the user to follow

  try {
    // Parse the request body to get clerk_id
    const { clerk_id } = await req.json();

    if (!clerk_id) {
      return NextResponse.json(
        { error: 'clerk_id is required in the request body' },
        { status: 400 }
      );
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005/api';

    // Send POST request to the backend
    const res = await fetch(`${apiUrl}/users/${followed_clerk_id}/follow`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        clerk_id, // Form data for the clerk_id
      }).toString(),
    });

    if (!res.ok) {
      const message = await res.text();
      console.error('Erro ao seguir usuário:', message);
      return NextResponse.json(
        { error: 'Erro ao seguir usuário' },
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