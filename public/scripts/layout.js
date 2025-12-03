// Layout JavaScript - Funcionalidades gerais do layout

document.addEventListener('DOMContentLoaded', function() {
    // User Menu Toggle
    const userMenuBtn = document.getElementById('userMenuBtn');
    const userDropdown = document.getElementById('userDropdown');
    
    if (userMenuBtn && userDropdown) {
        userMenuBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            userDropdown.classList.toggle('show');
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (!userMenuBtn.contains(e.target) && !userDropdown.contains(e.target)) {
                userDropdown.classList.remove('show');
            }
        });
    }
    
    // Mobile Menu Toggle (if exists)
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileMenu = document.getElementById('mobileMenu');
    
    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', function() {
            mobileMenu.classList.toggle('show');
        });
    }
    
    // Smooth scrolling for anchor links
    const anchorLinks = document.querySelectorAll('a[href^="#"]');
    anchorLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                e.preventDefault();
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Form validation helpers
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            const requiredFields = form.querySelectorAll('[required]');
            let isValid = true;
            
            requiredFields.forEach(field => {
                if (!field.value.trim()) {
                    isValid = false;
                    field.classList.add('error');
                    
                    // Remove error class after user starts typing
                    field.addEventListener('input', function() {
                        this.classList.remove('error');
                    });
                }
            });
            
            if (!isValid) {
                e.preventDefault();
                showAlert('Por favor, preencha todos os campos obrigatórios.', 'error');
            }
        });
    });
    
    // Loading state helpers
    window.showLoading = function(button) {
        const btnText = button.querySelector('.btn-text');
        const btnLoading = button.querySelector('.btn-loading');
        
        if (btnText && btnLoading) {
            btnText.style.display = 'none';
            btnLoading.style.display = 'block';
            button.disabled = true;
        }
    };
    
    window.hideLoading = function(button) {
        const btnText = button.querySelector('.btn-text');
        const btnLoading = button.querySelector('.btn-loading');
        
        if (btnText && btnLoading) {
            btnText.style.display = 'block';
            btnLoading.style.display = 'none';
            button.disabled = false;
        }
    };
    
    // Alert helper
    window.showAlert = function(message, type = 'info') {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type}`;
        alertDiv.innerHTML = `
            <i class="icon-alert"></i>
            ${message}
        `;
        
        // Insert at the top of the main content
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.insertBefore(alertDiv, mainContent.firstChild);
        } else {
            document.body.insertBefore(alertDiv, document.body.firstChild);
        }
        
        // Remove alert after 5 seconds
        setTimeout(() => {
            alertDiv.remove();
        }, 5000);
    };
    
    // Phone number formatting
    const phoneInputs = document.querySelectorAll('input[type="tel"]');
    phoneInputs.forEach(input => {
        input.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length <= 10) {
                value = value.replace(/^(\d{2})(\d{4})(\d)/, '($1) $2-$3');
            } else {
                value = value.replace(/^(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
            }
            e.target.value = value;
        });
    });
    
    // CNPJ formatting
    const cnpjInputs = document.querySelectorAll('input[name="cnpj"]');
    cnpjInputs.forEach(input => {
        input.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            value = value.replace(/^(\d{2})(\d)/, '$1.$2');
            value = value.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
            value = value.replace(/\.(\d{3})(\d)/, '.$1/$2');
            value = value.replace(/(\d{4})(\d)/, '$1-$2');
            e.target.value = value;
        });
    });
    
    // CEP formatting
    const cepInputs = document.querySelectorAll('input[name="cep"]');
    cepInputs.forEach(input => {
        input.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            value = value.replace(/^(\d{5})(\d)/, '$1-$2');
            e.target.value = value;
        });
    });
    
    // Copy to clipboard functionality
    window.copyToClipboard = function(text) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => {
                showAlert('Copiado para a área de transferência!', 'success');
            }).catch(() => {
                showAlert('Erro ao copiar para a área de transferência.', 'error');
            });
        } else {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            try {
                document.execCommand('copy');
                showAlert('Copiado para a área de transferência!', 'success');
            } catch (err) {
                showAlert('Erro ao copiar para a área de transferência.', 'error');
            }
            document.body.removeChild(textArea);
        }
    };
    
    // Lazy loading for images
    const images = document.querySelectorAll('img[data-src]');
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.remove('lazy');
                    imageObserver.unobserve(img);
                }
            });
        });
        
        images.forEach(img => imageObserver.observe(img));
    } else {
        // Fallback for browsers without IntersectionObserver
        images.forEach(img => {
            img.src = img.dataset.src;
            img.classList.remove('lazy');
        });
    }
    
    // Back to top button
    const backToTopBtn = document.createElement('button');
    backToTopBtn.innerHTML = '<i class="icon-arrow-up"></i>';
    backToTopBtn.className = 'back-to-top';
    backToTopBtn.style.cssText = `
        position: fixed;
        bottom: 2rem;
        right: 2rem;
        width: 3rem;
        height: 3rem;
        background: #3b82f6;
        color: white;
        border: none;
        border-radius: 50%;
        cursor: pointer;
        display: none;
        z-index: 1000;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        transition: all 0.2s ease;
    `;
    
    document.body.appendChild(backToTopBtn);
    
    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 300) {
            backToTopBtn.style.display = 'block';
        } else {
            backToTopBtn.style.display = 'none';
        }
    });
    
    backToTopBtn.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
    
    // Keyboard navigation
    document.addEventListener('keydown', function(e) {
        // Escape key to close modals/dropdowns
        if (e.key === 'Escape') {
            const openDropdowns = document.querySelectorAll('.user-dropdown.show');
            openDropdowns.forEach(dropdown => {
                dropdown.classList.remove('show');
            });
            
            const openModals = document.querySelectorAll('.modal.show');
            openModals.forEach(modal => {
                modal.classList.remove('show');
            });
        }
    });
    
    // Touch gestures for mobile
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
        
        // Swipe left to close filter menu
        if (Math.abs(diffX) > Math.abs(diffY) && diffX > 50) {
            const filterMenu = document.getElementById('filterMenu');
            if (filterMenu && filterMenu.classList.contains('open')) {
                filterMenu.classList.remove('open');
                const filterOverlay = document.getElementById('filterOverlay');
                if (filterOverlay) {
                    filterOverlay.classList.remove('show');
                }
            }
        }
        
        // Swipe right to close side menu
        if (Math.abs(diffX) > Math.abs(diffY) && diffX < -50) {
            const sideMenu = document.getElementById('sideMenu');
            if (sideMenu && sideMenu.classList.contains('open')) {
                sideMenu.classList.remove('open');
            }
        }
    });
    
    // Controles do mapa
    const centerMapBtn = document.getElementById('centerMapBtn');
    const zoomInBtn = document.getElementById('zoomInBtn');
    const zoomOutBtn = document.getElementById('zoomOutBtn');
    
    if (centerMapBtn) {
        centerMapBtn.addEventListener('click', function() {
            if (typeof centerMap === 'function') {
                centerMap();
            }
        });
    }
    
    if (zoomInBtn) {
        zoomInBtn.addEventListener('click', function() {
            if (typeof zoomIn === 'function') {
                zoomIn();
            }
        });
    }
    
    if (zoomOutBtn) {
        zoomOutBtn.addEventListener('click', function() {
            if (typeof zoomOut === 'function') {
                zoomOut();
            }
        });
    }
    
    // Busca
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    
    if (searchInput && searchBtn) {
        const performSearch = () => {
            const query = searchInput.value.trim();
            if (query && typeof searchEstablishments === 'function') {
                searchEstablishments(query);
            }
        };
        
        searchBtn.addEventListener('click', performSearch);
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
    }
    
    // Mostrar painel de resultados quando houver resultados
    window.showResults = function(results) {
        const resultsPanel = document.getElementById('resultsPanel');
        const resultsCount = document.getElementById('resultsCount');
        const resultsList = document.getElementById('resultsList');
        
        if (resultsPanel && resultsCount && resultsList) {
            resultsCount.textContent = results.length;
            
            // Limpar lista anterior
            resultsList.innerHTML = '';
            
            // Adicionar novos resultados
            results.forEach(establishment => {
                const resultCard = createResultCard(establishment);
                resultsList.appendChild(resultCard);
            });
            
            // Mostrar painel
            resultsPanel.classList.add('show');
        }
    };
    
    // Criar card de resultado
    function createResultCard(establishment) {
        const card = document.createElement('div');
        card.className = 'result-card';
        card.innerHTML = `
            <div class="result-header">
                <div>
                    <div class="result-name">${establishment.nome}</div>
                    <div class="result-type">${establishment.tipo}</div>
                </div>
            </div>
            <div class="result-info">
                <div class="result-item">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>${establishment.endereco}</span>
                </div>
                <div class="result-item">
                    <i class="fas fa-phone"></i>
                    <span>${establishment.telefone || 'Não informado'}</span>
                </div>
                <div class="result-item">
                    <i class="fas fa-clock"></i>
                    <span>${establishment.horario || 'Não informado'}</span>
                </div>
            </div>
            <div class="result-actions">
                <button class="btn btn-sm btn-primary" onclick="viewEstablishment('${establishment._id}')">
                    <i class="fas fa-eye"></i>
                    Ver Detalhes
                </button>
                <button class="btn btn-sm btn-outline" onclick="getDirections('${establishment._id}')">
                    <i class="fas fa-route"></i>
                    Como Chegar
                </button>
            </div>
        `;
        
        return card;
    }
    
    // Funções globais para o mapa
    window.viewEstablishment = function(id) {
        window.open(`/local/${id}`, '_blank');
    };
    
    window.getDirections = function(id) {
        // Implementar navegação
        console.log('Navegar para estabelecimento:', id);
    };
    
    // Lógica para garantir que apenas um menu abra por vez no celular
    function isMobile() {
        return window.innerWidth <= 768;
    }
    
    function closeAllMenus() {
        const sideMenu = document.getElementById('sideMenu');
        const filterMenu = document.getElementById('filterMenu');
        const sideMenuBtn = document.getElementById('menuBtn');
        const filterOverlay = document.getElementById('filterOverlay');
        
        if (sideMenu) sideMenu.classList.remove('open');
        if (filterMenu) filterMenu.classList.remove('open');
        if (filterOverlay) filterOverlay.classList.remove('show');
        
        if (sideMenuBtn) {
            sideMenuBtn.classList.remove('menu-open');
        }
    }
    
    // Event listeners para os botões dos menus
    const sideMenuBtn = document.getElementById('menuBtn');
    const filterBtnElement = document.getElementById('filterBtn');
    const sideMenu = document.getElementById('sideMenu');
    const filterMenu = document.getElementById('filterMenu');
    const filterOverlay = document.getElementById('filterOverlay');
    
    if (sideMenuBtn && sideMenu) {
        sideMenuBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            if (isMobile()) {
                // No mobile, fechar o outro menu se estiver aberto
                if (filterMenu && filterMenu.classList.contains('open')) {
                    filterMenu.classList.remove('open');
                    filterOverlay?.classList.remove('show');
                }
            }
            
            // Toggle do menu lateral
            sideMenu.classList.toggle('open');
            sideMenuBtn.classList.toggle('menu-open');
        });
    }
    
    // Fechar menus ao clicar fora deles
    document.addEventListener('click', function(e) {
        if (isMobile()) {
            const isClickInsideMenu = sideMenu?.contains(e.target) || filterMenu?.contains(e.target);
            const isClickOnMenuBtn = sideMenuBtn?.contains(e.target) || filterBtnElement?.contains(e.target);
            
            if (!isClickInsideMenu && !isClickOnMenuBtn) {
                closeAllMenus();
            }
        }
    });
    
    // Fechar menus ao redimensionar a tela
    window.addEventListener('resize', function() {
        if (!isMobile()) {
            closeAllMenus();
        }
    });

    console.log('Layout JavaScript carregado');
});



