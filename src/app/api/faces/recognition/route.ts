import { NextResponse } from 'next/server';

export async function POST(req: Request): Promise<NextResponse> {
  const formData = await req.formData();

  const image = formData.get("imagem") as File | null;
  // const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5005/api";
  const apiUrl = "http://localhost:8000/api";

  if (!image) {
    return NextResponse.json({ error: "Imagem ou clerk_id não fornecido." }, { status: 400 });
  }

  try {
    const backendForm = new FormData();
    backendForm.append("file", image, image.name);

    const res = await fetch(`${apiUrl}/faces/recognition`, {
      method: "POST",
      body: backendForm,
    });

    if (!res.ok) {
      console.error("Erro ao enviar imagem:", res.statusText);
      return NextResponse.json({ error: "Erro ao enviar imagem para o backend." }, { status: 500 });
    }

    const data = await res.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error("Erro de rede:", error);
    return NextResponse.json({ error: "Erro de rede." }, { status: 500 });
  }
}
