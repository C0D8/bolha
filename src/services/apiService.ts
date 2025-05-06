export async function fetchUserRegistered(userId: string): Promise<FetchUserRegisteredResponse> {
  try {
   
    const url = `/api/faces/${userId}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Erro ao carregar os dados');
    }
    return response.json();
  } catch (error) {
    throw new Error(`Erro na comunicação com a API: ${error}`);
  }
}
