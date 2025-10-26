// Controle de Modais e Animações
document.addEventListener('DOMContentLoaded', function() {
    // Elementos
    const loginModal = document.getElementById('loginModal');
    const registerModal = document.getElementById('registerModal');
    const modalOverlay = document.getElementById('modalOverlay');
    const sideMenu = document.getElementById('sideMenu');
    const filterMenu = document.getElementById('filterMenu');
    const filterOverlay = document.getElementById('filterOverlay');
    const resultsPanel = document.getElementById('resultsPanel');

    // Botões
    const menuBtn = document.getElementById('menuBtn');
    const menuClose = document.getElementById('menuClose');
    const filterBtn = document.getElementById('filterBtn');
    const filterClose = document.getElementById('filterClose');
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const loginModalClose = document.getElementById('loginModalClose');
    const registerModalClose = document.getElementById('registerModalClose');
    const showLoginModal = document.getElementById('showLoginModal');
    const showRegisterModal = document.getElementById('showRegisterModal');
    const resultsClose = document.getElementById('resultsClose');

    // Função para mostrar modal
    function showModal(modal) {
        modalOverlay.classList.add('show');
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    // Função para esconder modal
    function hideModal(modal) {
        modalOverlay.classList.remove('show');
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }

    // Função para mostrar menu lateral
    function showSideMenu() {
        sideMenu.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    // Função para esconder menu lateral
    function hideSideMenu() {
        sideMenu.classList.remove('open');
        document.body.style.overflow = '';
    }

    // Função para mostrar menu de filtros
    function showFilterMenu() {
        filterOverlay.classList.add('show');
        filterMenu.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    // Função para esconder menu de filtros
    function hideFilterMenu() {
        filterOverlay.classList.remove('show');
        filterMenu.classList.remove('open');
        document.body.style.overflow = '';
    }

    // Função para mostrar painel de resultados
    function showResultsPanel() {
        resultsPanel.classList.add('show');
    }

    // Função para esconder painel de resultados
    function hideResultsPanel() {
        resultsPanel.classList.remove('show');
    }

    // Event Listeners para Menu Lateral
    if (menuBtn) {
        menuBtn.addEventListener('click', showSideMenu);
    }

    if (menuClose) {
        menuClose.addEventListener('click', hideSideMenu);
    }

    // Event Listeners para Menu de Filtros
    if (filterBtn) {
        filterBtn.addEventListener('click', showFilterMenu);
    }

    if (filterClose) {
        filterClose.addEventListener('click', hideFilterMenu);
    }

    // Event Listeners para Modais
    if (loginBtn) {
        loginBtn.addEventListener('click', () => showModal(loginModal));
    }

    if (registerBtn) {
        registerBtn.addEventListener('click', () => showModal(registerModal));
    }

    if (loginModalClose) {
        loginModalClose.addEventListener('click', () => hideModal(loginModal));
    }

    if (registerModalClose) {
        registerModalClose.addEventListener('click', () => hideModal(registerModal));
    }

    if (showLoginModal) {
        showLoginModal.addEventListener('click', (e) => {
            e.preventDefault();
            hideModal(registerModal);
            showModal(loginModal);
        });
    }

    if (showRegisterModal) {
        showRegisterModal.addEventListener('click', (e) => {
            e.preventDefault();
            hideModal(loginModal);
            showModal(registerModal);
        });
    }

    // Event Listeners para Painel de Resultados
    if (resultsClose) {
        resultsClose.addEventListener('click', hideResultsPanel);
    }

    // Fechar modais clicando no overlay
    if (modalOverlay) {
        modalOverlay.addEventListener('click', () => {
            hideModal(loginModal);
            hideModal(registerModal);
        });
    }

    if (filterOverlay) {
        filterOverlay.addEventListener('click', hideFilterMenu);
    }

    // Fechar menu lateral clicando fora
    document.addEventListener('click', (e) => {
        if (sideMenu.classList.contains('open') && 
            !sideMenu.contains(e.target) && 
            !menuBtn.contains(e.target)) {
            hideSideMenu();
        }
    });

    // Toggle de senha
    const passwordToggles = document.querySelectorAll('.password-toggle');
    passwordToggles.forEach(toggle => {
        toggle.addEventListener('click', function() {
            const input = this.parentElement.querySelector('input');
            const icon = this.querySelector('i');
            
            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    });

    // Animações de entrada para elementos
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observar elementos para animação
    const animatedElements = document.querySelectorAll('.result-card, .menu-item, .filter-section');
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'all 0.3s ease';
        observer.observe(el);
    });

    // Efeito de hover nos botões de ação
    const actionBtns = document.querySelectorAll('.action-btn');
    actionBtns.forEach(btn => {
        btn.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px) scale(1.05)';
        });
        
        btn.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });

    // Efeito de ripple nos botões
    function createRipple(event) {
        const button = event.currentTarget;
        const circle = document.createElement('span');
        const diameter = Math.max(button.clientWidth, button.clientHeight);
        const radius = diameter / 2;

        circle.style.width = circle.style.height = `${diameter}px`;
        circle.style.left = `${event.clientX - button.offsetLeft - radius}px`;
        circle.style.top = `${event.clientY - button.offsetTop - radius}px`;
        circle.classList.add('ripple');

        const ripple = button.getElementsByClassName('ripple')[0];
        if (ripple) {
            ripple.remove();
        }

        button.appendChild(circle);
    }

    // Adicionar efeito ripple aos botões
    const rippleButtons = document.querySelectorAll('.btn, .action-btn');
    rippleButtons.forEach(button => {
        button.addEventListener('click', createRipple);
    });

    // Adicionar estilos para o efeito ripple
    const style = document.createElement('style');
    style.textContent = `
        .ripple {
            position: absolute;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.6);
            transform: scale(0);
            animation: ripple 600ms linear;
            pointer-events: none;
        }

        @keyframes ripple {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
});
