import { verifyWebhook } from '@clerk/nextjs/webhooks'
import { NextRequest } from 'next/server'
export async function POST(req: NextRequest) {
  try {
    const evt = await verifyWebhook(req)

    const { id } = evt.data
    const eventType = evt.type
    console.log(`Received webhook with ID ${id} and event type of ${eventType}`)
    console.log('Webhook payload:', evt.data)

    if (eventType === 'user.created') {
        const clerkId = evt.data.id;
        const username = evt.data.first_name || "sem nome";
    
        const formData = new FormData();
        formData.append("username", username);
        formData.append("clerk_id", clerkId);
    
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5005/api";
    
        const res = await fetch(`${apiUrl}/users`, {
            method: "POST",
            body: formData,
        });
        
        if (!res.ok) {
            console.error("Erro ao criar usuário:", res.statusText);
            return new Response('Error creating user', { status: 500 })
        }
        const data = await res.json()
        console.log('User created in database:', data)
    } else if (eventType === 'user.updated') {
        console.log('User updated:', evt.data)
        const clerkId = evt.data.id
        const username = evt.data.first_name
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5005/api"
        const res = await fetch(`${apiUrl}/users/${clerkId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username,
          }),
        }
        )
        if (!res.ok) {
            console.error("Erro ao atualizar usuário:", res.statusText);
            return new Response('Error updating user', { status: 500 })
        }
        const data = await res.json()
        console.log('User updated in database:', data)
    } else if (eventType === 'user.deleted') {
        console.log('User deleted:', evt.data)
        const clerkId = evt.data.id
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5005/api"
        const res = await fetch(`${apiUrl}/users/${clerkId}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            clerkId,
          }),
        }
        )
    }
    return new Response('Webhook received', { status: 200 })
  } catch (err) {
    console.error('Error verifying webhook:', err)
    return new Response('Error verifying webhook', { status: 400 })
  }
}