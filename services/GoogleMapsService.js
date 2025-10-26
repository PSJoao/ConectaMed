const axios = require('axios');

class GoogleMapsService {
  constructor() {
    this.apiKey = process.env.GOOGLE_MAPS_API_KEY;
    this.baseUrl = 'https://maps.googleapis.com/maps/api';
  }

  // Geocodificar endereço para coordenadas
  async geocodificar(endereco) {
    try {
      if (!this.apiKey) {
        throw new Error('Chave da API do Google Maps não configurada');
      }

      const response = await axios.get(`${this.baseUrl}/geocode/json`, {
        params: {
          address: endereco,
          key: this.apiKey,
          language: 'pt-BR',
          region: 'BR'
        }
      });

      if (response.data.status !== 'OK') {
        throw new Error(`Erro na geocodificação: ${response.data.status}`);
      }

      return response.data;
    } catch (error) {
      console.error('Erro na geocodificação:', error);
      throw error;
    }
  }

  // Obter direções entre dois pontos
  async obterDirecoes(origin, destination) {
    try {
      if (!this.apiKey) {
        throw new Error('Chave da API do Google Maps não configurada');
      }

      const response = await axios.get(`${this.baseUrl}/directions/json`, {
        params: {
          origin: origin,
          destination: destination,
          key: this.apiKey,
          language: 'pt-BR',
          region: 'BR',
          mode: 'driving',
          avoid: 'tolls'
        }
      });

      if (response.data.status !== 'OK') {
        throw new Error(`Erro ao obter direções: ${response.data.status}`);
      }

      return response.data;
    } catch (error) {
      console.error('Erro ao obter direções:', error);
      throw error;
    }
  }

  // Buscar lugares próximos
  async buscarLugaresProximos(latitude, longitude, tipo = 'hospital', raio = 5000) {
    try {
      if (!this.apiKey) {
        throw new Error('Chave da API do Google Maps não configurada');
      }

      const response = await axios.get(`${this.baseUrl}/place/nearbysearch/json`, {
        params: {
          location: `${latitude},${longitude}`,
          radius: raio,
          type: tipo,
          key: this.apiKey,
          language: 'pt-BR'
        }
      });

      if (response.data.status !== 'OK') {
        throw new Error(`Erro na busca de lugares: ${response.data.status}`);
      }

      return response.data;
    } catch (error) {
      console.error('Erro na busca de lugares:', error);
      throw error;
    }
  }

  // Obter detalhes de um lugar
  async obterDetalhesLugar(placeId) {
    try {
      if (!this.apiKey) {
        throw new Error('Chave da API do Google Maps não configurada');
      }

      const response = await axios.get(`${this.baseUrl}/place/details/json`, {
        params: {
          place_id: placeId,
          key: this.apiKey,
          language: 'pt-BR',
          fields: 'name,formatted_address,geometry,formatted_phone_number,website,opening_hours'
        }
      });

      if (response.data.status !== 'OK') {
        throw new Error(`Erro ao obter detalhes: ${response.data.status}`);
      }

      return response.data;
    } catch (error) {
      console.error('Erro ao obter detalhes do lugar:', error);
      throw error;
    }
  }

  // Calcular distância entre dois pontos
  calcularDistancia(lat1, lng1, lat2, lng2) {
    const R = 6371; // Raio da Terra em km
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // Converter graus para radianos
  toRad(deg) {
    return deg * (Math.PI / 180);
  }

  // Validar coordenadas
  validarCoordenadas(latitude, longitude) {
    return latitude >= -90 && latitude <= 90 && 
           longitude >= -180 && longitude <= 180;
  }

  // Formatar endereço para geocodificação
  formatarEndereco(endereco) {
    return endereco
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s,.-]/g, '');
  }
}

// Instância singleton
const googleMapsService = new GoogleMapsService();

// Middleware para rotas
googleMapsService.geocodificar = async (req, res) => {
  try {
    const { endereco } = req.body;
    
    if (!endereco) {
      return res.status(400).json({ 
        error: 'Endereço é obrigatório' 
      });
    }

    const resultado = await googleMapsService.geocodificar(endereco);
    res.json({
      success: true,
      data: resultado
    });
  } catch (error) {
    res.status(500).json({ 
      error: error.message 
    });
  }
};

googleMapsService.obterDirecoes = async (req, res) => {
  try {
    const { origin, destination } = req.params;
    
    const resultado = await googleMapsService.obterDirecoes(origin, destination);
    res.json({
      success: true,
      data: resultado
    });
  } catch (error) {
    res.status(500).json({ 
      error: error.message 
    });
  }
};

module.exports = googleMapsService;


