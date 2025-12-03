// Map JavaScript - Implementação com Leaflet e OpenStreetMap

const DEFAULT_COORDINATES = [-23.5505, -46.6333]; // São Paulo como fallback

let mapInstance;
let markersLayer;
let markersIndex = new Map();
let establishmentsCache = [];
let userLocation = null;
let userMarker = null;
let lastFilters = {};

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
}

async function fetchAndRenderEstablishments(filters = {}) {
    if (!mapInstance) return;

    showMapLoading(true);
    lastFilters = { ...filters };

    try {
        const queryString = buildQueryParams(filters);
        const url = queryString ? `/api/estabelecimentos?${queryString}` : '/api/estabelecimentos';
        const response = await fetch(url);
        const payload = await response.json();

        if (!payload.success) {
            throw new Error(payload.error || 'Erro ao buscar estabelecimentos');
        }

        establishmentsCache = payload.data || [];
        renderMarkers(establishmentsCache);
        updateResultsList(establishmentsCache);
        toggleResultsPanel(true);
    } catch (error) {
        console.error('Erro ao carregar estabelecimentos:', error);
        showMapError('Erro ao carregar estabelecimentos. Tente novamente em instantes.');
    } finally {
        showMapLoading(false);
    }
}

function renderMarkers(establishments) {
    markersLayer.clearLayers();
    markersIndex.clear();

    establishments.forEach(est => {
        if (!est.localizacao || !Array.isArray(est.localizacao.coordinates)) {
            return;
        }

        const [lng, lat] = est.localizacao.coordinates;
        const marker = L.marker([lat, lng], {
            icon: createMarkerIcon(est.tipo)
        });

        marker.bindPopup(createPopupContent(est));
        marker.addTo(markersLayer);
        markersIndex.set(est._id, marker);
    });

    fitMapToMarkers(establishments);
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
    const rating = Array.isArray(est.avaliacoes) && est.avaliacoes.length > 0
        ? (est.avaliacoes.reduce((sum, aval) => sum + (aval.nota || 0), 0) / est.avaliacoes.length).toFixed(1)
        : 'N/D';

    return `
        <div class="marker-popup">
            <h4>${est.nome || 'Estabelecimento'}</h4>
            <p><strong>Tipo:</strong> ${formatTipo(est.tipo)}</p>
            <p><strong>Endereço:</strong> ${est.enderecoCompleto || 'Não informado'}</p>
            <p><strong>Telefone:</strong> ${est.telefone || 'Não informado'}</p>
            <p><strong>Horário:</strong> ${est.horarioFuncionamento || 'Não informado'}</p>
            <p><strong>Avaliação:</strong> ${rating}</p>
            <div class="popup-actions">
                <button class="btn btn-primary" onclick="openDirections('${est._id}')">
                    <i class="fas fa-route"></i> Rota
                </button>
                <a class="btn btn-secondary" href="/local/${est._id}">
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
            <a class="btn btn-outline" href="/local/${est._id}">
                <i class="fas fa-eye"></i> Ver detalhes
            </a>
        </div>
    `;

    const focusBtn = card.querySelector('.result-focus');
    if (focusBtn) {
        focusBtn.addEventListener('click', () => highlightMarker(est._id));
    }

    const routeBtn = card.querySelector('[data-action="route"]');
    if (routeBtn) {
        routeBtn.addEventListener('click', () => openDirections(est._id));
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
        if (est.localizacao && est.localizacao.coordinates) {
            const [lng, lat] = est.localizacao.coordinates;
            bounds.extend([lat, lng]);
        }
    });

    if (bounds.isValid()) {
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
    if (filters.lat && filters.lng) {
        return {
            lat: filters.lat,
            lng: filters.lng
        };
    }
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

window.openDirections = function(establishmentId) {
    const establishment = establishmentsCache.find(est => est._id === establishmentId);
    if (!establishment || !establishment.localizacao || !establishment.localizacao.coordinates) {
        return;
    }

    const [lng, lat] = establishment.localizacao.coordinates;
    let url;

    if (userLocation) {
        url = `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${userLocation.lat},${userLocation.lng};${lat},${lng}`;
    } else {
        url = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=15/${lat}/${lng}`;
    }

    window.open(url, '_blank');
};

