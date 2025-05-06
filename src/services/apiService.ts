export async function fetchUserRegistered(userId: string): Promise<FetchUserRegisteredResponse> {
  try {
   
    let url = `/api/faces/${userId}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Erro ao carregar os dados');
    }
    return response.json(); // O retorno será tipado automaticamente como FetchBalancoEstudoResponse
  } catch (error) {
    throw new Error(`Erro na comunicação com a API: ${error}`);
  }
}
