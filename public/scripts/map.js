// Map JavaScript - Implementação com Leaflet e OpenStreetMap

const DEFAULT_COORDINATES = [-23.5505, -46.6333]; // São Paulo como fallback

let mapInstance;
let markersLayer;
let markersIndex = new Map();
let establishmentsCache = [];
let userLocation = null;
let userMarker = null;
let lastFilters = {};
let isProgrammaticMove = false;

document.addEventListener('DOMContentLoaded', () => {
    initLeafletMap();
    setupResultsPanel();
    setupAdjustFiltersButton();
    fetchAndRenderEstablishments({});
    requestUserLocation();
    console.log('Map JavaScript carregado');
});

function initLeafletMap() {
    const mapElement = document.getElementById('map');
    if (!mapElement || typeof L === 'undefined') {
        console.error('Elemento do mapa ou Leaflet não disponível');
        showMapError('Não foi possível inicializar o mapa.');
        return;
    }

    mapInstance = L.map(mapElement, {
        zoomControl: false,
        minZoom: 3,
        maxZoom: 19
    }).setView(DEFAULT_COORDINATES, 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap colaboradores'
    }).addTo(mapInstance);

    markersLayer = L.layerGroup().addTo(mapInstance);

    // Evento: Ao terminar de mover ou dar zoom no mapa, buscar na nova área
    mapInstance.on('moveend', () => {
        // Evita disparar se o movimento foi programático (pelo fitBounds)
        if (isProgrammaticMove) {
            isProgrammaticMove = false;
            return;
        }

        const center = mapInstance.getCenter();
        
        const newFilters = {
            ...lastFilters,
            lat: center.lat,
            lng: center.lng
        };
        
        // FALSE aqui impede o fitBounds
        fetchAndRenderEstablishments(newFilters, false);
    });
}

async function fetchAndRenderEstablishments(filters = {}, shouldFitBounds = true) {
    if (!mapInstance) return;

    showMapLoading(true);
    lastFilters = { ...filters };

    try {
        const queryString = buildQueryParams(filters);
        const url = queryString ? `/api/estabelecimentos?${queryString}` : '/api/estabelecimentos';
        const response = await fetch(url);
        
        // Verifica se a resposta foi bem sucedida antes de tentar ler JSON
        if (!response.ok) {
            if (response.status === 429) {
                console.warn('Limite de requisições excedido. Tentando novamente em breve.');
                return; // Para a execução silenciosamente
            }
            throw new Error(`Erro HTTP: ${response.status}`);
        }

        const payload = await response.json();

        if (!payload.success) {
            throw new Error(payload.error || 'Erro ao buscar estabelecimentos');
        }

        establishmentsCache = payload.data || [];
        // Passamos o flag shouldFitBounds adiante
        renderMarkers(establishmentsCache, shouldFitBounds);
        updateResultsList(establishmentsCache);
        
        // Só abre o painel se houver busca ativa ou fitBounds (interação explícita)
        if (shouldFitBounds) {
            toggleResultsPanel(true);
        }
    } catch (error) {
        console.error('Erro ao carregar estabelecimentos:', error);
        // Não mostramos erro visual para 429 para não assustar o usuário
    } finally {
        showMapLoading(false);
    }
}

function getEstCoordinates(est) {
    // Novo formato vindo do PostgreSQL: latitude / longitude
    if (typeof est.latitude === 'number' && typeof est.longitude === 'number') {
        return [est.latitude, est.longitude];
    }
    // Fallback para formato antigo (MongoDB) se ainda aparecer em alguma resposta
    if (est.localizacao && Array.isArray(est.localizacao.coordinates)) {
        const [lng, lat] = est.localizacao.coordinates;
        return [lat, lng];
    }
    return null;
}

function renderMarkers(establishments, shouldFitBounds = true) {
    markersLayer.clearLayers();
    markersIndex.clear();

    establishments.forEach(est => {
        const coords = getEstCoordinates(est);
        if (!coords) return;

        const marker = L.marker(coords, {
            icon: createMarkerIcon(est.tipo)
        });

        marker.bindPopup(createPopupContent(est));
        marker.addTo(markersLayer);
        markersIndex.set(est.id, marker);
    });

    // Só ajusta o zoom se solicitado explicitamente
    if (shouldFitBounds) {
        fitMapToMarkers(establishments);
    }
}

function createMarkerIcon(tipo = 'clinica') {
    const label = tipo === 'orgao_publico' ? 'O' : 'C';
    return L.divIcon({
        html: `<span>${label}</span>`,
        className: `custom-marker ${tipo}`,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
    });
}

function createPopupContent(est) {
    // No formato atual da API ainda não recebemos as avaliações agregadas aqui,
    // então exibimos "N/D" por padrão.
    const rating = 'N/D';

    return `
        <div class="marker-popup">
            <h4>${est.nome || 'Estabelecimento'}</h4>
            <p><strong>Tipo:</strong> ${formatTipo(est.tipo)}</p>
            <p><strong>Endereço:</strong> ${est.enderecoCompleto || 'Não informado'}</p>
            <p><strong>Telefone:</strong> ${est.telefone || 'Não informado'}</p>
            <p><strong>Horário:</strong> ${est.horarioFuncionamento || 'Não informado'}</p>
            <p><strong>Avaliação:</strong> ${rating}</p>
            <div class="popup-actions">
                <button class="btn btn-primary" onclick="openDirections('${est.id}')">
                    <i class="fas fa-route"></i> Rota
                </button>
                <a class="btn btn-secondary" href="/local/${est.id}">
                    <i class="fas fa-info-circle"></i> Detalhes
                </a>
            </div>
        </div>
    `;
}

function updateResultsList(establishments) {
    const resultsList = document.getElementById('resultsList');
    const resultsCount = document.getElementById('resultsCount');
    const noResults = document.getElementById('noResults');

    if (!resultsList || !resultsCount) return;

    resultsList.innerHTML = '';
    resultsCount.textContent = establishments.length;

    if (noResults) {
        noResults.style.display = establishments.length === 0 ? 'block' : 'none';
    }

    establishments.forEach(est => {
        const card = createResultCard(est);
        resultsList.appendChild(card);
    });
}

function createResultCard(est) {
    const card = document.createElement('div');
    card.className = 'result-card';
    card.innerHTML = `
        <div class="result-header">
            <div>
                <h3 class="result-name">${est.nome}</h3>
                <span class="result-type">${formatTipo(est.tipo)}</span>
            </div>
            <button class="result-focus" title="Centralizar no mapa">
                <i class="fas fa-crosshairs"></i>
            </button>
        </div>
        <div class="result-info">
            <div class="result-item">
                <i class="fas fa-map-marker-alt"></i>
                <span>${est.enderecoCompleto || 'Endereço não informado'}</span>
            </div>
            <div class="result-item">
                <i class="fas fa-phone-alt"></i>
                <span>${est.telefone || 'Telefone não informado'}</span>
            </div>
            <div class="result-item">
                <i class="fas fa-clock"></i>
                <span>${est.horarioFuncionamento || 'Horário não informado'}</span>
            </div>
        </div>
        <div class="result-actions">
            <button class="btn btn-primary" data-action="route">
                <i class="fas fa-route"></i> Traçar rota
            </button>
            <a class="btn btn-outline" href="tel:${est.telefone || ''}">
                <i class="fas fa-phone"></i> Ligar
            </a>
            <button class="btn btn-outline" onclick="showEstablishmentModal('${est.id}')">
                <i class="fas fa-eye"></i> Ver detalhes
            </button>
        </div>
    `;

    const focusBtn = card.querySelector('.result-focus');
    if (focusBtn) {
        // CORRIGIDO: mudado de est._id para est.id
        focusBtn.addEventListener('click', () => highlightMarker(est.id));
    }

    const routeBtn = card.querySelector('[data-action="route"]');
    if (routeBtn) {
        // CORRIGIDO: mudado de est._id para est.id
        routeBtn.addEventListener('click', () => openDirections(est.id));
    }

    return card;
}

function highlightMarker(estId) {
    const marker = markersIndex.get(estId);
    if (!marker || !mapInstance) return;

    const latLng = marker.getLatLng();
    mapInstance.setView(latLng, Math.max(mapInstance.getZoom(), 15), { animate: true });
    marker.openPopup();
}

function fitMapToMarkers(establishments) {
    if (!mapInstance || establishments.length === 0) return;

    const bounds = L.latLngBounds([]);
    establishments.forEach(est => {
        const coords = getEstCoordinates(est);
        if (coords) {
            bounds.extend(coords);
        }
    });

    if (bounds.isValid()) {
        isProgrammaticMove = true; // Sinaliza que o próximo moveend não deve buscar
        mapInstance.fitBounds(bounds, { padding: [60, 60] });
    }
}

function requestUserLocation() {
    if (!navigator.geolocation) {
        console.warn('Geolocalização não suportada.');
        return;
    }

    navigator.geolocation.getCurrentPosition(
        (position) => {
            userLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            addUserMarker(userLocation);
            mapInstance.setView([userLocation.lat, userLocation.lng], 15, { animate: true });
            // Reaplicar filtros com a nova localização
            fetchAndRenderEstablishments(lastFilters);
        },
        (error) => {
            console.warn('Não foi possível obter a localização do usuário:', error.message);
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 5 * 60 * 1000
        }
    );
}

function addUserMarker(location) {
    if (!mapInstance || !location) return;

    if (userMarker) {
        userMarker.removeFrom(mapInstance);
    }

    userMarker = L.circleMarker([location.lat, location.lng], {
        radius: 8,
        color: '#dc2626',
        fillColor: '#dc2626',
        fillOpacity: 0.8,
        weight: 2
    }).addTo(mapInstance);
    userMarker.bindPopup('Você está aqui').openPopup();
}

function buildQueryParams(filters = {}) {
    const params = new URLSearchParams();

    appendParam(params, 'search', filters.search);
    appendArrayParam(params, 'especialidade', filters.especialidade);
    appendArrayParam(params, 'convenio', filters.convenio);
    appendArrayParam(params, 'tipo', filters.tipo);

    if (filters.raio) {
        params.append('raio', filters.raio);
    }

    const coords = extractCoordinates(filters);
    if (coords) {
        params.append('lat', coords.lat);
        params.append('lng', coords.lng);
    }

    return params.toString();
}

function appendParam(params, key, value) {
    if (value === undefined || value === null || value === '') return;
    params.append(key, value);
}

function appendArrayParam(params, key, values) {
    if (!values) return;
    const array = Array.isArray(values) ? values : [values];
    array.filter(Boolean).forEach(value => params.append(key, value));
}

function extractCoordinates(filters) {
    // 1. Se os filtros já têm lat/lng explícitos (vindos do evento moveend ou input), usa eles
    if (filters.lat && filters.lng) {
        return {
            lat: filters.lat,
            lng: filters.lng
        };
    }
    
    // 2. Se o mapa já está carregado, usa o centro visual dele
    if (mapInstance) {
        const center = mapInstance.getCenter();
        return {
            lat: center.lat,
            lng: center.lng
        };
    }

    // 3. Fallback para a localização do GPS do usuário
    if (userLocation) {
        return userLocation;
    }
    
    return null;
}

function setupResultsPanel() {
    const closeBtn = document.getElementById('resultsClose');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => toggleResultsPanel(false));
    }
}

function setupAdjustFiltersButton() {
    const adjustBtn = document.getElementById('adjustFiltersBtn');
    const filterBtn = document.getElementById('filterBtn');
    if (adjustBtn && filterBtn) {
        adjustBtn.addEventListener('click', () => filterBtn.click());
    }
}

function toggleResultsPanel(show) {
    const panel = document.getElementById('resultsPanel');
    if (!panel) return;

    if (show) {
        panel.classList.add('show');
    } else {
        panel.classList.remove('show');
    }
}

function showMapLoading(show) {
    const loading = document.getElementById('mapLoading');
    if (loading) {
        loading.style.display = show ? 'flex' : 'none';
    }
}

function showMapError(message) {
    const mapContainer = document.querySelector('.map-main') || document.body;
    if (!mapContainer) return;

    const errorDiv = document.createElement('div');
    errorDiv.className = 'map-error';
    errorDiv.innerHTML = `
        <h3>Erro no mapa</h3>
        <p>${message}</p>
        <button class="btn btn-primary" onclick="location.reload()">Recarregar</button>
    `;
    mapContainer.appendChild(errorDiv);
}

function formatTipo(tipo) {
    if (tipo === 'orgao_publico') {
        return 'Órgão Público';
    }
    return 'Clínica';
}

// Funções globais utilizadas por outros scripts
window.filterEstablishments = async function(filters = {}) {
    await fetchAndRenderEstablishments(filters);
};

window.centerMap = function() {
    if (!mapInstance) return;
    if (userLocation) {
        mapInstance.setView([userLocation.lat, userLocation.lng], 15, { animate: true });
    } else {
        requestUserLocation();
    }
};

window.zoomIn = function() {
    if (mapInstance) {
        mapInstance.zoomIn();
    }
};

window.zoomOut = function() {
    if (mapInstance) {
        mapInstance.zoomOut();
    }
};

// Função auxiliar para abrir a rota no navegador
window.openRoute = function(lat, lng) {
    if (!lat || !lng) {
        alert('Localização indisponível para traçar rota.');
        return;
    }

    let url;
    if (userLocation) {
        // Se temos a localização do usuário, traça a rota de carro (OSRM)
        url = `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${userLocation.lat},${userLocation.lng};${lat},${lng}`;
    } else {
        // Se não, apenas abre o mapa centralizado no destino
        url = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`;
    }
    
    window.open(url, '_blank');
};

// Função chamada pelo botão "Traçar Rota" nos cards laterais
window.openDirections = function(id) {
    const est = establishmentsCache.find(e => String(e.id) === String(id));
    if (est) {
        const coords = getEstCoordinates(est); // Retorna [lat, lng]
        if (coords) {
            openRoute(coords[0], coords[1]);
        }
    }
};

// Função chamada pelo botão "Ver Detalhes"
window.showEstablishmentModal = async function(id) {
    const modal = document.getElementById('establishmentModal');
    
    // Reset e Loading
    document.getElementById('estModalName').textContent = 'Carregando...';
    document.getElementById('estModalDoctors').innerHTML = ''; 
    
    modal.classList.add('show');
    
    try {
        const res = await fetch(`/api/estabelecimentos/${id}`);
        const data = await res.json();
        
        if (data.success) {
            const est = data.data;
            
            // Preenche dados básicos
            document.getElementById('estModalName').textContent = est.nome;
            document.getElementById('estModalType').textContent = formatTipo(est.tipo);
            document.getElementById('estModalAddress').textContent = est.enderecoCompleto;
            document.getElementById('estModalPhone').textContent = est.telefone;
            document.getElementById('estModalHours').textContent = est.horarioFuncionamento;
            document.getElementById('estModalRating').textContent = est.notaMedia || 'N/A';
            
            // Configura botão de Ligar
            document.getElementById('estCallBtn').href = `tel:${est.telefone}`;
            
            // Configura botão de Rota dentro do modal
            const routeBtn = document.getElementById('estRouteBtn');
            routeBtn.onclick = (e) => {
                e.preventDefault();
                const lat = est.latitude || (est.localizacao ? est.localizacao.coordinates[1] : null);
                const lng = est.longitude || (est.localizacao ? est.localizacao.coordinates[0] : null);
                openRoute(lat, lng);
            };

            // Renderiza Médicos
            const doctorsContainer = document.getElementById('estModalDoctors');
            
            if (est.medicos && est.medicos.length > 0) {
                est.medicos.forEach(doc => {
                    const card = document.createElement('div');
                    card.className = 'doctor-mini-card';
                    card.innerHTML = `
                        <div class="doc-icon"><i class="fas fa-user-md"></i></div>
                        <div class="doc-info">
                            <h4>${doc.nome}</h4>
                            <p>${doc.especialidades.join(', ')}</p>
                        </div>
                    `;
                    card.onclick = () => showDoctorModal(doc);
                    doctorsContainer.appendChild(card);
                });
            } else {
                doctorsContainer.innerHTML = '<p style="padding:10px; color:#666; width:100%; text-align:center;">Nenhum médico cadastrado.</p>';
            }
        }
    } catch (err) {
        console.error(err);
        alert('Erro ao carregar detalhes do estabelecimento');
    }
};

window.showDoctorModal = function(doc) {
    const modal = document.getElementById('doctorModal');
    
    document.getElementById('docModalName').textContent = doc.nome;
    document.getElementById('docModalCRM').textContent = `CRM: ${doc.crm}`;
    document.getElementById('docModalBio').textContent = doc.biografia || 'Sem biografia.';
    
    // Especialidades
    const specsContainer = document.getElementById('docModalSpecialties');
    specsContainer.innerHTML = (doc.especialidades || []).map(s => `<span class="tag spec">${s}</span>`).join('');
    
    // Convênios
    const insuranceContainer = document.getElementById('docModalInsurances');
    insuranceContainer.innerHTML = (doc.conveniosAceitos || []).map(c => `<span class="tag ins">${c}</span>`).join('');
    
    modal.classList.add('show');
};

window.closeModal = function(id) {
    document.getElementById(id).classList.remove('show');
};