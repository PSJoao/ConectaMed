// Filters JavaScript - Funcionalidades do menu de filtros

let currentFilters = {
    search: '',
    especialidade: [],
    convenio: [],
    tipo: [],
    raio: 10
};

// Inicializar filtros
document.addEventListener('DOMContentLoaded', function() {
    console.log('Inicializando filtros...');
    
    // Carregar opções de filtros
    loadFilterOptions();
    
    // Configurar eventos
    setupFilterEvents();
    
    console.log('Filtros inicializados');
});

// Carregar opções de filtros
function loadFilterOptions() {
    // Carregar especialidades
    fetch('/api/filtros/especialidades')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                populateFilterOptions('especialidadesContainer', data.data, 'especialidade');
            }
        })
        .catch(error => {
            console.error('Erro ao carregar especialidades:', error);
        });
    
    // Carregar convênios
    fetch('/api/filtros/convenios')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                populateFilterOptions('conveniosContainer', data.data, 'convenio');
            }
        })
        .catch(error => {
            console.error('Erro ao carregar convênios:', error);
        });
    
    // Carregar tipos
    fetch('/api/filtros/tipos')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                populateFilterOptions('tiposContainer', data.data, 'tipo');
            }
        })
        .catch(error => {
            console.error('Erro ao carregar tipos:', error);
        });
}

// Popular opções de filtros
function populateFilterOptions(containerId, options, filterType) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
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

// Configurar eventos dos filtros
function setupFilterEvents() {
    // Botão para abrir filtros
    const openFiltersBtn = document.getElementById('openFiltersBtn');
    const filterMenu = document.getElementById('filterMenu');
    const filterOverlay = document.getElementById('filterOverlay');
    const filterClose = document.getElementById('filterClose');
    
    if (openFiltersBtn && filterMenu) {
        openFiltersBtn.addEventListener('click', () => {
            filterMenu.classList.add('show');
            filterOverlay.classList.add('show');
            document.body.style.overflow = 'hidden';
        });
    }
    
    // Botão para fechar filtros
    if (filterClose && filterMenu) {
        filterClose.addEventListener('click', closeFilters);
    }
    
    // Overlay para fechar filtros
    if (filterOverlay) {
        filterOverlay.addEventListener('click', closeFilters);
    }
    
    // Campo de busca
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                currentFilters.search = e.target.value;
                applyFilters();
            }, 500);
        });
    }
    
    // Checkboxes de filtros
    const filterCheckboxes = document.querySelectorAll('.filter-checkbox');
    filterCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            updateFilterFromCheckboxes();
            applyFilters();
        });
    });
    
    // Slider de raio
    const raioSlider = document.getElementById('raioSlider');
    const raioValue = document.getElementById('raioValue');
    
    if (raioSlider && raioValue) {
        raioSlider.addEventListener('input', (e) => {
            raioValue.textContent = e.target.value;
            currentFilters.raio = parseInt(e.target.value);
            applyFilters();
        });
    }
    
    // Botão aplicar filtros
    const applyFiltersBtn = document.getElementById('applyFilters');
    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', () => {
            applyFilters();
            closeFilters();
        });
    }
    
    // Botão limpar filtros
    const clearFiltersBtn = document.getElementById('clearFilters');
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', clearFilters);
    }
}

// Fechar menu de filtros
function closeFilters() {
    const filterMenu = document.getElementById('filterMenu');
    const filterOverlay = document.getElementById('filterOverlay');
    
    if (filterMenu) {
        filterMenu.classList.remove('show');
    }
    
    if (filterOverlay) {
        filterOverlay.classList.remove('show');
    }
    
    document.body.style.overflow = '';
}

// Atualizar filtros a partir dos checkboxes
function updateFilterFromCheckboxes() {
    // Limpar arrays de filtros
    currentFilters.especialidade = [];
    currentFilters.convenio = [];
    currentFilters.tipo = [];
    
    // Coletar valores selecionados
    const especialidadeCheckboxes = document.querySelectorAll('input[name="especialidade"]:checked');
    especialidadeCheckboxes.forEach(checkbox => {
        currentFilters.especialidade.push(checkbox.value);
    });
    
    const convenioCheckboxes = document.querySelectorAll('input[name="convenio"]:checked');
    convenioCheckboxes.forEach(checkbox => {
        currentFilters.convenio.push(checkbox.value);
    });
    
    const tipoCheckboxes = document.querySelectorAll('input[name="tipo"]:checked');
    tipoCheckboxes.forEach(checkbox => {
        currentFilters.tipo.push(checkbox.value);
    });
}

// Aplicar filtros
function applyFilters() {
    console.log('Aplicando filtros:', currentFilters);
    
    // Verificar se a função de filtro está disponível
    if (typeof filterEstablishments === 'function') {
        filterEstablishments(currentFilters);
    } else {
        console.warn('Função filterEstablishments não encontrada');
    }
}

// Debounce para evitar chamadas excessivas
let filterTimeout;
function debouncedApplyFilters() {
    clearTimeout(filterTimeout);
    filterTimeout = setTimeout(applyFilters, 300);
}

// Limpar filtros
function clearFilters() {
    console.log('Limpando filtros');
    
    // Resetar filtros
    currentFilters = {
        search: '',
        especialidade: [],
        convenio: [],
        tipo: [],
        raio: 10
    };
    
    // Limpar campos
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.value = '';
    }
    
    // Desmarcar checkboxes
    const filterCheckboxes = document.querySelectorAll('.filter-checkbox');
    filterCheckboxes.forEach(checkbox => {
        checkbox.checked = false;
    });
    
    // Resetar slider de raio
    const raioSlider = document.getElementById('raioSlider');
    const raioValue = document.getElementById('raioValue');
    
    if (raioSlider && raioValue) {
        raioSlider.value = 10;
        raioValue.textContent = '10';
    }
    
    // Aplicar filtros limpos
    applyFilters();
}

// Buscar estabelecimentos com filtros
function searchEstablishments(query) {
    currentFilters.search = query;
    applyFilters();
}

// Filtrar por especialidade
function filterBySpecialty(specialty) {
    currentFilters.especialidade = [specialty];
    currentFilters.convenio = [];
    currentFilters.tipo = [];
    applyFilters();
}

// Filtrar por convênio
function filterByInsurance(insurance) {
    currentFilters.convenio = [insurance];
    currentFilters.especialidade = [];
    currentFilters.tipo = [];
    applyFilters();
}

// Filtrar por tipo
function filterByType(type) {
    currentFilters.tipo = [type];
    currentFilters.especialidade = [];
    currentFilters.convenio = [];
    applyFilters();
}

// Obter filtros ativos
function getActiveFilters() {
    return { ...currentFilters };
}

// Definir filtros
function setFilters(filters) {
    currentFilters = { ...currentFilters, ...filters };
    applyFilters();
}

// Event listeners para teclado
document.addEventListener('keydown', function(e) {
    // Escape para fechar filtros
    if (e.key === 'Escape') {
        const filterMenu = document.getElementById('filterMenu');
        if (filterMenu && filterMenu.classList.contains('show')) {
            closeFilters();
        }
    }
});

// Event listeners para touch (mobile)
let touchStartX = 0;
let touchStartY = 0;

document.addEventListener('touchstart', function(e) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
});

document.addEventListener('touchend', function(e) {
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const diffX = touchStartX - touchEndX;
    const diffY = touchStartY - touchEndY;
    
    // Swipe left para fechar filtros
    if (Math.abs(diffX) > Math.abs(diffY) && diffX > 50) {
        const filterMenu = document.getElementById('filterMenu');
        if (filterMenu && filterMenu.classList.contains('show')) {
            closeFilters();
        }
    }
});

// Funções utilitárias
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Debounced search
const debouncedSearch = debounce((query) => {
    currentFilters.search = query;
    applyFilters();
}, 300);

// Aplicar debounce ao campo de busca
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            debouncedSearch(e.target.value);
        });
    }
});

console.log('Filters JavaScript carregado');


