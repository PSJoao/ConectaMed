// Map JavaScript - Funcionalidades do Google Maps

let googleMap;
let markers = [];
let userLocation = null;
let userMarker = null;
let infoWindow = null;
let currentLocation = null;

// Inicializar o mapa
function initMap() {
    console.log('Inicializando mapa...');
    
    // Verificar se a API do Google Maps está carregada
    if (typeof google === 'undefined' || !google.maps) {
        console.error('Google Maps API não carregada');
        showMapError('Erro ao carregar o mapa. Tente recarregar a página.');
        return;
    }
    
    // Configurações padrão do mapa
    const defaultOptions = {
        zoom: 13,
        center: { lat: -23.5505, lng: -46.6333 }, // São Paulo como padrão
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        styles: [
            {
                featureType: 'poi',
                elementType: 'labels',
                stylers: [{ visibility: 'off' }]
            }
        ],
        gestureHandling: 'greedy',
        zoomControl: true,
        mapTypeControl: false,
        scaleControl: true,
        scaleControl: true,
        streetViewControl: false,
        rotateControl: false,
        fullscreenControl: true
    };
    
    // Criar o mapa
    map = new google.maps.Map(document.getElementById('map'), defaultOptions);
    
    // Criar info window
    infoWindow = new google.maps.InfoWindow();
    
    // Carregar estabelecimentos
    loadEstablishments();
    
    // Configurar controles do mapa
    setupMapControls();
    
    // Solicitar localização do usuário
    requestUserLocation();
    
    console.log('Mapa inicializado com sucesso');
}

// Carregar estabelecimentos no mapa
function loadEstablishments() {
    console.log('Carregando estabelecimentos...');
    
    // Mostrar loading
    showMapLoading(true);
    
    // Buscar estabelecimentos via API
    fetch('/api/estabelecimentos')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                addEstablishmentsToMap(data.data);
                updateResultsList(data.data);
                showMapLoading(false);
            } else {
                throw new Error(data.error || 'Erro ao carregar estabelecimentos');
            }
        })
        .catch(error => {
            console.error('Erro ao carregar estabelecimentos:', error);
            showMapError('Erro ao carregar estabelecimentos. Tente novamente.');
            showMapLoading(false);
        });
}

// Adicionar estabelecimentos ao mapa
function addEstablishmentsToMap(establishments) {
    // Limpar marcadores existentes
    clearMarkers();
    
    establishments.forEach(establishment => {
        if (establishment.localizacao && establishment.localizacao.coordinates) {
            const [lng, lat] = establishment.localizacao.coordinates;
            
            // Usar AdvancedMarkerElement se disponível, senão usar Marker tradicional
            let marker;
            
            if (google.maps.marker && google.maps.marker.AdvancedMarkerElement) {
                // Criar elemento HTML para o marcador
                const markerElement = document.createElement('div');
                markerElement.innerHTML = `
                    <div style="
                        width: 32px; 
                        height: 32px; 
                        background-color: ${establishment.tipo === 'clinica' ? '#3b82f6' : '#10b981'};
                        border: 2px solid white;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: white;
                        font-weight: bold;
                        font-size: 14px;
                        cursor: pointer;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                    ">
                        ${establishment.tipo === 'clinica' ? 'C' : 'O'}
                    </div>
                `;
                
                marker = new google.maps.marker.AdvancedMarkerElement({
                    position: { lat, lng },
                    map: map,
                    title: establishment.nome,
                    content: markerElement
                });
            } else {
                // Fallback para Marker tradicional
                marker = new google.maps.Marker({
                    position: { lat, lng },
                    map: map,
                    title: establishment.nome,
                    icon: getMarkerIcon(establishment.tipo),
                    animation: google.maps.Animation.DROP
                });
            }
            
            // Adicionar evento de clique
            marker.addListener('click', () => {
                showEstablishmentInfo(establishment, marker);
            });
            
            markers.push(marker);
        }
    });
    
    console.log(`${markers.length} estabelecimentos adicionados ao mapa`);
}

// Obter ícone do marcador baseado no tipo
function getMarkerIcon(type) {
    const iconConfig = {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                <circle cx="16" cy="16" r="14" fill="${type === 'clinica' ? '#3b82f6' : '#10b981'}" stroke="white" stroke-width="2"/>
                <text x="16" y="20" text-anchor="middle" fill="white" font-size="16" font-weight="bold">${type === 'clinica' ? 'C' : 'O'}</text>
            </svg>
        `),
        scaledSize: new google.maps.Size(32, 32),
        anchor: new google.maps.Point(16, 16)
    };
    
    return iconConfig;
}

// Mostrar informações do estabelecimento
function showEstablishmentInfo(establishment, marker) {
    const content = createInfoWindowContent(establishment);
    
    infoWindow.setContent(content);
    infoWindow.open(map, marker);
    
    // Adicionar eventos aos botões da info window
    setTimeout(() => {
        const directionsBtn = document.getElementById('directionsBtn');
        const callBtn = document.getElementById('callBtn');
        
        if (directionsBtn) {
            directionsBtn.addEventListener('click', () => {
                openDirections(establishment);
            });
        }
        
        if (callBtn) {
            callBtn.addEventListener('click', () => {
                window.location.href = `tel:${establishment.telefone}`;
            });
        }
    }, 100);
}

// Criar conteúdo da info window
function createInfoWindowContent(establishment) {
    const rating = establishment.avaliacoes && establishment.avaliacoes.length > 0 
        ? (establishment.avaliacoes.reduce((sum, aval) => sum + aval.nota, 0) / establishment.avaliacoes.length).toFixed(1)
        : '0';
    
    return `
        <div class="info-window-content">
            <div class="info-window-header">
                <h3 class="info-window-title">${establishment.nome}</h3>
                <span class="info-window-type">${establishment.tipo === 'clinica' ? 'Clínica' : 'Órgão Público'}</span>
            </div>
            
            <div class="info-window-body">
                <div class="info-window-item">
                    <i class="icon-location"></i>
                    <span>${establishment.enderecoCompleto}</span>
                </div>
                
                <div class="info-window-item">
                    <i class="icon-phone"></i>
                    <span>${establishment.telefone}</span>
                </div>
                
                <div class="info-window-item">
                    <i class="icon-clock"></i>
                    <span>${establishment.horarioFuncionamento}</span>
                </div>
                
                ${establishment.medicos && establishment.medicos.length > 0 ? `
                    <div class="info-window-item">
                        <i class="icon-users"></i>
                        <span>${establishment.medicos.length} médico(s)</span>
                    </div>
                ` : ''}
                
                <div class="info-window-item">
                    <i class="icon-star"></i>
                    <span>Avaliação: ${rating}/5</span>
                </div>
            </div>
            
            <div class="info-window-actions">
                <button class="info-window-btn primary" id="directionsBtn">
                    <i class="icon-navigation"></i>
                    Rota
                </button>
                <a href="tel:${establishment.telefone}" class="info-window-btn" id="callBtn">
                    <i class="icon-phone"></i>
                    Ligar
                </a>
            </div>
        </div>
    `;
}

// Abrir direções no Google Maps
function openDirections(establishment) {
    if (userLocation) {
        const userLat = userLocation.lat;
        const userLng = userLocation.lng;
        const destination = establishment.enderecoCompleto;
        
        const url = `https://www.google.com/maps/dir/${userLat},${userLng}/${encodeURIComponent(destination)}`;
        window.open(url, '_blank');
    } else {
        // Se não tiver localização do usuário, abrir apenas o destino
        const url = `https://www.google.com/maps/search/${encodeURIComponent(establishment.enderecoCompleto)}`;
        window.open(url, '_blank');
    }
}

// Solicitar localização do usuário
function requestUserLocation() {
    if (navigator.geolocation) {
        const options = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000 // 5 minutos
        };
        
        navigator.geolocation.getCurrentPosition(
            (position) => {
                userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                
                // Centralizar mapa na localização do usuário
                map.setCenter(userLocation);
                map.setZoom(15);
                
                // Adicionar marcador do usuário
                addUserMarker(userLocation);
                
                console.log('Localização do usuário obtida:', userLocation);
            },
            (error) => {
                console.warn('Erro ao obter localização:', error);
                
                // Usar localização padrão baseada no erro
                let defaultLocation;
                
                switch(error.code) {
                    case error.PERMISSION_DENIED:
                        console.log('Usuário negou permissão de localização');
                        defaultLocation = { lat: -23.5505, lng: -46.6333 }; // São Paulo
                        break;
                    case error.POSITION_UNAVAILABLE:
                        console.log('Localização indisponível');
                        defaultLocation = { lat: -20.4183, lng: -49.9639 }; // Franca
                        break;
                    case error.TIMEOUT:
                        console.log('Timeout na obtenção da localização');
                        defaultLocation = { lat: -23.5505, lng: -46.6333 }; // São Paulo
                        break;
                    default:
                        defaultLocation = { lat: -23.5505, lng: -46.6333 }; // São Paulo
                        break;
                }
                
                map.setCenter(defaultLocation);
                map.setZoom(13);
                
                // Continuar sem localização do usuário
            },
            options
        );
    } else {
        console.warn('Geolocalização não suportada pelo navegador');
        // Usar localização padrão
        const defaultLocation = { lat: -23.5505, lng: -46.6333 }; // São Paulo
        map.setCenter(defaultLocation);
        map.setZoom(13);
    }
}

// Adicionar marcador do usuário
function addUserMarker(location) {
    if (userMarker) {
        userMarker.setMap(null);
    }
    
    userMarker = new google.maps.Marker({
        position: location,
        map: map,
        title: 'Sua localização',
        icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" fill="#dc2626" stroke="white" stroke-width="2"/>
                    <circle cx="12" cy="12" r="4" fill="white"/>
                </svg>
            `),
            scaledSize: new google.maps.Size(24, 24),
            anchor: new google.maps.Point(12, 12)
        }
    });
}

// Configurar controles do mapa
function setupMapControls() {
    const centerMapBtn = document.getElementById('centerMapBtn');
    const zoomInBtn = document.getElementById('zoomInBtn');
    const zoomOutBtn = document.getElementById('zoomOutBtn');
    
    if (centerMapBtn) {
        centerMapBtn.addEventListener('click', () => {
            if (userLocation) {
                map.setCenter(userLocation);
                map.setZoom(15);
            } else {
                requestUserLocation();
            }
        });
    }
    
    if (zoomInBtn) {
        zoomInBtn.addEventListener('click', () => {
            map.setZoom(map.getZoom() + 1);
        });
    }
    
    if (zoomOutBtn) {
        zoomOutBtn.addEventListener('click', () => {
            map.setZoom(map.getZoom() - 1);
        });
    }
}

// Limpar marcadores
function clearMarkers() {
    markers.forEach(marker => {
        marker.setMap(null);
    });
    markers = [];
}

// Mostrar/ocultar loading do mapa
function showMapLoading(show) {
    const loading = document.getElementById('mapLoading');
    if (loading) {
        loading.style.display = show ? 'flex' : 'none';
    }
}

// Mostrar erro no mapa
function showMapError(message) {
    const mapContainer = document.querySelector('.map-container');
    if (mapContainer) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'map-error';
        errorDiv.innerHTML = `
            <h3>Erro no Mapa</h3>
            <p>${message}</p>
            <button class="btn" onclick="location.reload()">Recarregar</button>
        `;
        mapContainer.appendChild(errorDiv);
    }
}

// Atualizar lista de resultados
function updateResultsList(establishments) {
    const resultsList = document.getElementById('resultsList');
    const resultsCount = document.getElementById('resultsCount');
    const noResults = document.getElementById('noResults');
    
    if (!resultsList) return;
    
    // Atualizar contador
    if (resultsCount) {
        resultsCount.textContent = establishments.length;
    }
    
    // Limpar lista
    resultsList.innerHTML = '';
    
    if (establishments.length === 0) {
        if (noResults) {
            noResults.style.display = 'block';
        }
        return;
    }
    
    if (noResults) {
        noResults.style.display = 'none';
    }
    
    // Adicionar estabelecimentos à lista
    establishments.forEach(establishment => {
        const resultCard = createResultCard(establishment);
        resultsList.appendChild(resultCard);
    });
}

// Criar card de resultado
function createResultCard(establishment) {
    const card = document.createElement('div');
    card.className = 'result-card';
    card.innerHTML = `
        <div class="result-header">
            <div>
                <h3 class="result-name">${establishment.nome}</h3>
                <span class="result-type">${establishment.tipo === 'clinica' ? 'Clínica' : 'Órgão Público'}</span>
            </div>
        </div>
        
        <div class="result-info">
            <div class="result-item">
                <i class="icon-location"></i>
                <span>${establishment.enderecoCompleto}</span>
            </div>
            
            <div class="result-item">
                <i class="icon-phone"></i>
                <span>${establishment.telefone}</span>
            </div>
            
            <div class="result-item">
                <i class="icon-clock"></i>
                <span>${establishment.horarioFuncionamento}</span>
            </div>
            
            ${establishment.medicos && establishment.medicos.length > 0 ? `
                <div class="result-item">
                    <i class="icon-users"></i>
                    <span>${establishment.medicos.length} médico(s)</span>
                </div>
            ` : ''}
        </div>
        
        <div class="result-actions">
            <button class="btn btn-primary" onclick="openDirections(${JSON.stringify(establishment).replace(/"/g, '&quot;')})">
                <i class="icon-navigation"></i>
                Traçar Rota
            </button>
            <a href="tel:${establishment.telefone}" class="btn btn-outline">
                <i class="icon-phone"></i>
                Ligar
            </a>
            <a href="/local/${establishment._id}" class="btn btn-outline">
                <i class="icon-eye"></i>
                Ver Detalhes
            </a>
        </div>
    `;
    
    return card;
}

// Filtrar estabelecimentos
function filterEstablishments(filters) {
    console.log('Filtrando estabelecimentos:', filters);
    
    // Mostrar loading
    showMapLoading(true);
    
    // Construir query string
    const params = new URLSearchParams();
    
    if (filters.search) params.append('search', filters.search);
    if (filters.especialidade) params.append('especialidade', filters.especialidade);
    if (filters.convenio) params.append('convenio', filters.convenio);
    if (filters.tipo) params.append('tipo', filters.tipo);
    if (filters.raio) params.append('raio', filters.raio);
    
    if (userLocation) {
        params.append('lat', userLocation.lat);
        params.append('lng', userLocation.lng);
    }
    
    // Buscar estabelecimentos filtrados
    fetch(`/api/estabelecimentos?${params.toString()}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                addEstablishmentsToMap(data.data);
                updateResultsList(data.data);
                showMapLoading(false);
            } else {
                throw new Error(data.error || 'Erro ao filtrar estabelecimentos');
            }
        })
        .catch(error => {
            console.error('Erro ao filtrar estabelecimentos:', error);
            showMapError('Erro ao filtrar estabelecimentos. Tente novamente.');
            showMapLoading(false);
        });
}

// Buscar estabelecimentos próximos
function findNearbyEstablishments() {
    if (!userLocation) {
        requestUserLocation();
        return;
    }
    
    const filters = {
        raio: 10
    };
    
    filterEstablishments(filters);
}

// Event listeners globais
document.addEventListener('DOMContentLoaded', function() {
    // Botão "Encontrar Próximos"
    const findNearbyBtn = document.getElementById('findNearbyBtn');
    if (findNearbyBtn) {
        findNearbyBtn.addEventListener('click', findNearbyEstablishments);
    }
    
    // Botão "Ajustar Filtros"
    const adjustFiltersBtn = document.getElementById('adjustFiltersBtn');
    if (adjustFiltersBtn) {
        adjustFiltersBtn.addEventListener('click', () => {
            const openFiltersBtn = document.getElementById('openFiltersBtn');
            if (openFiltersBtn) {
                openFiltersBtn.click();
            }
        });
    }
});

console.log('Map JavaScript carregado');


