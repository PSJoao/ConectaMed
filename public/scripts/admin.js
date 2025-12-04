// Funções do Modal Admin
function openAdminModal() {
    const modal = document.getElementById('adminModal');
    if(modal) {
        modal.classList.add('show');
        loadEstablishmentsForSelect(); // Carrega lista para o select de médicos
    }
}

function switchAdminTab(tab) {
    const estForm = document.getElementById('adminEstForm');
    const medForm = document.getElementById('adminMedForm');
    const tabs = document.querySelectorAll('.admin-tab');

    if (tab === 'est') {
        estForm.style.display = 'block';
        medForm.style.display = 'none';
        tabs[0].classList.add('active');
        tabs[1].classList.remove('active');
    } else {
        estForm.style.display = 'none';
        medForm.style.display = 'block';
        tabs[0].classList.remove('active');
        tabs[1].classList.add('active');
    }
}

function fillCurrentLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => {
            document.querySelector('input[name="latitude"]').value = pos.coords.latitude;
            document.querySelector('input[name="longitude"]').value = pos.coords.longitude;
        });
    } else {
        alert('Geolocalização não suportada.');
    }
}

// Carregar estabelecimentos para o Select Múltiplo
async function loadEstablishmentsForSelect() {
    const select = document.getElementById('estSelectMultiple');
    try {
        const res = await fetch('/api/estabelecimentos'); // endpoint de listagem
        const data = await res.json();
        
        if(data.success) {
            select.innerHTML = '';
            data.data.forEach(est => {
                const opt = document.createElement('option');
                opt.value = est.id;
                opt.textContent = `${est.nome} (${est.tipo})`;
                select.appendChild(opt);
            });
        }
    } catch (e) {
        console.error('Erro ao carregar locais:', e);
        select.innerHTML = '<option>Erro ao carregar</option>';
    }
}

// Submissão do Estabelecimento
document.getElementById('adminEstForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    const formData = new FormData(this);
    const data = Object.fromEntries(formData.entries());
    
    // Converter string de convênios para array
    if(data.conveniosGerais) {
        data.conveniosGerais = data.conveniosGerais.split(',').map(s => s.trim());
    }

    try {
        const res = await fetch('/api/admin/estabelecimentos', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        });
        
        if(res.ok) {
            alert('Estabelecimento criado com sucesso!');
            this.reset();
            loadEstablishmentsForSelect(); // Atualiza a lista
            // Opcional: Recarregar mapa
            if(window.fetchAndRenderEstablishments) window.fetchAndRenderEstablishments({});
        } else {
            alert('Erro ao criar estabelecimento.');
        }
    } catch(err) {
        alert('Erro de conexão.');
    }
});

// Submissão do Médico (N:N)
document.getElementById('adminMedForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Captura manual para multi-select
    const select = document.getElementById('estSelectMultiple');
    const selectedEstIds = Array.from(select.selectedOptions).map(opt => opt.value);
    
    if(selectedEstIds.length === 0) {
        alert('Selecione pelo menos um estabelecimento.');
        return;
    }

    const formData = new FormData(this);
    const data = Object.fromEntries(formData.entries());
    
    // Tratamento de Arrays
    data.especialidades = data.especialidades.split(',').map(s => s.trim());
    data.conveniosAceitos = data.conveniosAceitos ? data.conveniosAceitos.split(',').map(s => s.trim()) : [];
    data.estabelecimentoIds = selectedEstIds; // Array de IDs

    try {
        const res = await fetch('/api/admin/medicos', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        });
        
        if(res.ok) {
            alert('Médico cadastrado com sucesso!');
            this.reset();
        } else {
            alert('Erro ao cadastrar médico.');
        }
    } catch(err) {
        alert('Erro de conexão.');
    }
});