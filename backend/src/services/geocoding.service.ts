import axios from 'axios';

interface ViaCepResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

interface NominatimItem {
  lat: string;
  lon: string;
  display_name: string;
}

export async function lookupCep(cep: string) {
  const clean = cep.replace(/\D/g, '');
  if (clean.length !== 8) return null;

  try {
    const { data } = await axios.get<ViaCepResponse>(`https://viacep.com.br/ws/${clean}/json/`, {
      timeout: 5000,
    });
    if (data.erro) return null;
    return {
      zipCode: data.cep,
      street: data.logradouro,
      complement: data.complemento,
      neighborhood: data.bairro,
      city: data.localidade,
      state: data.uf,
    };
  } catch {
    return null;
  }
}

export async function geocode(
  address: string,
): Promise<{ latitude: number; longitude: number } | null> {
  try {
    const { data } = await axios.get<NominatimItem[]>(
      'https://nominatim.openstreetmap.org/search',
      {
        params: { q: address, format: 'json', limit: 1, countrycodes: 'br' },
        headers: { 'User-Agent': 'cogep-test-app/1.0' },
        timeout: 8000,
      },
    );
    if (!data.length) return null;
    return { latitude: parseFloat(data[0].lat), longitude: parseFloat(data[0].lon) };
  } catch {
    return null;
  }
}
