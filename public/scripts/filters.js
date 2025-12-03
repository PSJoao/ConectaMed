// Filters JavaScript - Sincroniza filtros com o mapa Leaflet

const defaultFilters = {
    search: '',
    especialidade: [],
    convenio: [],
    tipo: [],
    raio: 10
};

let currentFilters = { ...defaultFilters };

document.addEventListener('DOMContentLoaded', () => {
    console.log('Inicializando filtros...');
    loadFilterOptions();
    setupFilterEvents();
    attachCheckboxDelegation();
    console.log('Filtros prontos');
});

function loadFilterOptions() {
    // Função auxiliar para fazer o fetch com tratamento de erro
    const fetchOption = (url, containerId, type) => {
        fetch(url)
            .then(res => {
                if (!res.ok) {
                    throw new Error(`Erro HTTP: ${res.status}`);
                }
                return res.json();
            })
            .then(data => {
                if (data.success) {
                    // Verifica se data.data é um array válido antes de popular
                    const options = Array.isArray(data.data) ? data.data : [];
                    if (options.length) {
                        populateFilterOptions(containerId, options, type);
                    }
                }
            })
            .catch(error => console.warn(`Falha ao carregar ${type}:`, error.message));
    };

    // Chamadas protegidas
    fetchOption('/api/filtros/especialidades', 'especialidadesContainer', 'especialidade');
    fetchOption('/api/filtros/convenios', 'conveniosContainer', 'convenio');
    fetchOption('/api/filtros/tipos', 'tiposContainer', 'tipo');
}

function populateFilterOptions(containerId, options, filterType) {
    const container = document.getElementById(containerId);
    if (!container || !Array.isArray(options)) return;

    container.innerHTML = '';

    options.forEach(option => {
        const label = document.createElement('label');
        label.className = 'checkbox-label';
        label.innerHTML = `
            <input type="checkbox" name="${filterType}" value="${option}" class="filter-checkbox">
            <span class="checkbox-text">${option}</span>
        `;
        container.appendChild(label);
    });
}

function setupFilterEvents() {
    const filterBtn = document.getElementById('filterBtn');
    const filterMenu = document.getElementById('filterMenu');
    const filterOverlay = document.getElementById('filterOverlay');
    const filterClose = document.getElementById('filterClose');
    const filterSearchInput = document.getElementById('filterSearchInput');
    const applyBtn = document.getElementById('applyFilters');
    const clearBtn = document.getElementById('clearFilters');
    const raioSlider = document.getElementById('raioSlider');
    const raioValue = document.getElementById('raioValue');

    const openMenu = () => {
        filterMenu?.classList.add('open');
        filterOverlay?.classList.add('show');
        document.body.style.overflow = 'hidden';
    };

    const closeMenu = () => {
        filterMenu?.classList.remove('open');
        filterOverlay?.classList.remove('show');
        document.body.style.overflow = '';
    };

    if (filterBtn) {
        filterBtn.addEventListener('click', () => {
            if (filterMenu?.classList.contains('open')) {
                closeMenu();
            } else {
                openMenu();
            }
        });
    }

    filterClose?.addEventListener('click', closeMenu);
    filterOverlay?.addEventListener('click', closeMenu);

    if (filterSearchInput) {
        filterSearchInput.addEventListener('input', (event) => {
            currentFilters.search = event.target.value;
            debouncedApplyFilters();
        });
    }

    if (applyBtn) {
        applyBtn.addEventListener('click', () => {
            applyFilters();
            closeMenu();
        });
    }

    clearBtn?.addEventListener('click', () => {
        clearFilters();
        closeMenu();
    });

    if (raioSlider && raioValue) {
        raioSlider.addEventListener('input', (event) => {
            const value = parseInt(event.target.value, 10);
            raioValue.textContent = value;
            currentFilters.raio = value;
            debouncedApplyFilters();
        });
    }

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && filterMenu?.classList.contains('open')) {
            closeMenu();
        }
    });
}

function attachCheckboxDelegation() {
    document.addEventListener('change', (event) => {
        if (event.target.classList?.contains('filter-checkbox')) {
            updateFilterFromCheckboxes();
            debouncedApplyFilters();
        }
    });
}

function updateFilterFromCheckboxes() {
    currentFilters.especialidade = collectCheckedValues('especialidade');
    currentFilters.convenio = collectCheckedValues('convenio');
    currentFilters.tipo = collectCheckedValues('tipo');
}

function collectCheckedValues(name) {
    return Array.from(document.querySelectorAll(`input[name="${name}"]:checked`))
        .map(cb => cb.value);
}

function applyFilters() {
    if (typeof filterEstablishments === 'function') {
        filterEstablishments({ ...currentFilters });
    } else {
        console.warn('Função filterEstablishments não encontrada');
    }
}

let applyTimeout;
function debouncedApplyFilters() {
    clearTimeout(applyTimeout);
    applyTimeout = setTimeout(applyFilters, 300);
}

function clearFilters() {
    currentFilters = { ...defaultFilters };

    document.querySelectorAll('.filter-checkbox').forEach(cb => {
        cb.checked = false;
    });

    const headerSearchInput = document.getElementById('searchInput');
    if (headerSearchInput) {
        headerSearchInput.value = '';
    }

    const filterSearchInput = document.getElementById('filterSearchInput');
    if (filterSearchInput) {
        filterSearchInput.value = '';
    }

    const raioSlider = document.getElementById('raioSlider');
    const raioValue = document.getElementById('raioValue');
    if (raioSlider && raioValue) {
        raioSlider.value = defaultFilters.raio;
        raioValue.textContent = defaultFilters.raio;
    }

    applyFilters();
}

function searchEstablishments(query) {
    currentFilters.search = query || '';
    const filterSearchInput = document.getElementById('filterSearchInput');
    if (filterSearchInput) {
        filterSearchInput.value = currentFilters.search;
    }
    applyFilters();
}

function filterBySpecialty(specialty) {
    currentFilters.especialidade = specialty ? [specialty] : [];
    currentFilters.convenio = [];
    currentFilters.tipo = [];
    applyFilters();
}

function filterByInsurance(insurance) {
    currentFilters.convenio = insurance ? [insurance] : [];
    currentFilters.especialidade = [];
    currentFilters.tipo = [];
    applyFilters();
}

function filterByType(type) {
    currentFilters.tipo = type ? [type] : [];
    currentFilters.especialidade = [];
    currentFilters.convenio = [];
    applyFilters();
}

function getActiveFilters() {
    return { ...currentFilters };
}

function setFilters(filters) {
    currentFilters = { ...currentFilters, ...filters };
    applyFilters();
}

console.log('Filters JavaScript carregado');

