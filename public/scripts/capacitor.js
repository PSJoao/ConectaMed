// Capacitor JavaScript - Funcionalidades específicas para mobile

// Verificar se está rodando no Capacitor
const isCapacitor = window.Capacitor !== undefined;

// Inicializar funcionalidades do Capacitor
document.addEventListener('DOMContentLoaded', function() {
    if (isCapacitor) {
        console.log('Capacitor detectado, inicializando funcionalidades mobile...');
        initCapacitorFeatures();
    } else {
        console.log('Rodando no navegador, funcionalidades mobile desabilitadas');
    }
});

// Inicializar funcionalidades do Capacitor
async function initCapacitorFeatures() {
    try {
        // Configurar status bar
        await setupStatusBar();
        
        // Configurar geolocalização
        await setupGeolocation();
        
        // Configurar notificações
        await setupNotifications();
        
        // Configurar splash screen
        await setupSplashScreen();
        
        // Configurar back button
        await setupBackButton();
        
        console.log('Funcionalidades do Capacitor inicializadas com sucesso');
    } catch (error) {
        console.error('Erro ao inicializar funcionalidades do Capacitor:', error);
    }
}

// Configurar status bar
async function setupStatusBar() {
    if (window.Capacitor && window.Capacitor.Plugins.StatusBar) {
        const { StatusBar } = window.Capacitor.Plugins;
        
        try {
            await StatusBar.setStyle({ style: 'DARK' });
            await StatusBar.setBackgroundColor({ color: '#3b82f6' });
        } catch (error) {
            console.error('Erro ao configurar status bar:', error);
        }
    }
}

// Configurar geolocalização
async function setupGeolocation() {
    if (window.Capacitor && window.Capacitor.Plugins.Geolocation) {
        const { Geolocation } = window.Capacitor.Plugins;
        
        try {
            // Solicitar permissões
            const permissions = await Geolocation.requestPermissions();
            
            if (permissions.location === 'granted') {
                console.log('Permissão de geolocalização concedida');
                
                // Obter localização atual
                const position = await Geolocation.getCurrentPosition({
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 300000
                });
                
                if (position && position.coords) {
                    const userLocation = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    
                    // Atualizar mapa se estiver disponível
                    if (typeof updateUserLocation === 'function') {
                        updateUserLocation(userLocation);
                    }
                }
            } else {
                console.warn('Permissão de geolocalização negada');
            }
        } catch (error) {
            console.error('Erro ao configurar geolocalização:', error);
        }
    }
}

// Configurar notificações
async function setupNotifications() {
    if (window.Capacitor && window.Capacitor.Plugins.LocalNotifications) {
        const { LocalNotifications } = window.Capacitor.Plugins;
        
        try {
            // Solicitar permissões
            const permissions = await LocalNotifications.requestPermissions();
            
            if (permissions.display === 'granted') {
                console.log('Permissão de notificações concedida');
            } else {
                console.warn('Permissão de notificações negada');
            }
        } catch (error) {
            console.error('Erro ao configurar notificações:', error);
        }
    }
}

// Configurar splash screen
async function setupSplashScreen() {
    if (window.Capacitor && window.Capacitor.Plugins.SplashScreen) {
        const { SplashScreen } = window.Capacitor.Plugins;
        
        try {
            // Ocultar splash screen após 2 segundos
            setTimeout(async () => {
                await SplashScreen.hide();
            }, 2000);
        } catch (error) {
            console.error('Erro ao configurar splash screen:', error);
        }
    }
}

// Configurar botão voltar
async function setupBackButton() {
    if (window.Capacitor && window.Capacitor.Plugins.App) {
        const { App } = window.Capacitor.Plugins;
        
        try {
            App.addListener('backButton', ({ canGoBack }) => {
                if (!canGoBack) {
                    // Se não pode voltar, mostrar confirmação para sair
                    showExitConfirmation();
                } else {
                    // Deixar o comportamento padrão
                    window.history.back();
                }
            });
        } catch (error) {
            console.error('Erro ao configurar botão voltar:', error);
        }
    }
}

// Mostrar confirmação de saída
function showExitConfirmation() {
    if (window.Capacitor && window.Capacitor.Plugins.Modals) {
        const { Modals } = window.Capacitor.Plugins;
        
        Modals.confirm({
            title: 'Sair do ConectaMed',
            message: 'Deseja realmente sair do aplicativo?',
            okButtonTitle: 'Sair',
            cancelButtonTitle: 'Cancelar'
        }).then((result) => {
            if (result.value) {
                App.exitApp();
            }
        });
    }
}

// Enviar notificação local
async function sendLocalNotification(title, body, data = {}) {
    if (window.Capacitor && window.Capacitor.Plugins.LocalNotifications) {
        const { LocalNotifications } = window.Capacitor.Plugins;
        
        try {
            await LocalNotifications.schedule({
                notifications: [
                    {
                        title: title,
                        body: body,
                        id: Date.now(),
                        schedule: { at: new Date(Date.now() + 1000) },
                        sound: 'beep.wav',
                        attachments: [],
                        actionTypeId: '',
                        extra: data
                    }
                ]
            });
        } catch (error) {
            console.error('Erro ao enviar notificação:', error);
        }
    }
}

// Obter informações do dispositivo
async function getDeviceInfo() {
    if (window.Capacitor && window.Capacitor.Plugins.Device) {
        const { Device } = window.Capacitor.Plugins;
        
        try {
            const info = await Device.getInfo();
            return info;
        } catch (error) {
            console.error('Erro ao obter informações do dispositivo:', error);
            return null;
        }
    }
    return null;
}

// Verificar conectividade
async function checkConnectivity() {
    if (window.Capacitor && window.Capacitor.Plugins.Network) {
        const { Network } = window.Capacitor.Plugins;
        
        try {
            const status = await Network.getStatus();
            return status;
        } catch (error) {
            console.error('Erro ao verificar conectividade:', error);
            return null;
        }
    }
    return null;
}

// Abrir URL externa
async function openExternalUrl(url) {
    if (window.Capacitor && window.Capacitor.Plugins.Browser) {
        const { Browser } = window.Capacitor.Plugins;
        
        try {
            await Browser.open({ url: url });
        } catch (error) {
            console.error('Erro ao abrir URL externa:', error);
        }
    } else {
        // Fallback para navegador
        window.open(url, '_blank');
    }
}

// Fazer chamada telefônica
async function makePhoneCall(phoneNumber) {
    if (window.Capacitor && window.Capacitor.Plugins.CallNumber) {
        const { CallNumber } = window.Capacitor.Plugins;
        
        try {
            await CallNumber.call({ number: phoneNumber });
        } catch (error) {
            console.error('Erro ao fazer chamada:', error);
        }
    } else {
        // Fallback para navegador
        window.location.href = `tel:${phoneNumber}`;
    }
}

// Compartilhar conteúdo
async function shareContent(title, text, url) {
    if (window.Capacitor && window.Capacitor.Plugins.Share) {
        const { Share } = window.Capacitor.Plugins;
        
        try {
            await Share.share({
                title: title,
                text: text,
                url: url
            });
        } catch (error) {
            console.error('Erro ao compartilhar:', error);
        }
    } else {
        // Fallback para navegador
        if (navigator.share) {
            try {
                await navigator.share({
                    title: title,
                    text: text,
                    url: url
                });
            } catch (error) {
                console.error('Erro ao compartilhar:', error);
            }
        }
    }
}

// Vibrar dispositivo
async function vibrateDevice(duration = 100) {
    if (window.Capacitor && window.Capacitor.Plugins.Haptics) {
        const { Haptics } = window.Capacitor.Plugins;
        
        try {
            await Haptics.vibrate({ duration: duration });
        } catch (error) {
            console.error('Erro ao vibrar dispositivo:', error);
        }
    }
}

// Obter localização atual
async function getCurrentLocation() {
    if (window.Capacitor && window.Capacitor.Plugins.Geolocation) {
        const { Geolocation } = window.Capacitor.Plugins;
        
        try {
            const position = await Geolocation.getCurrentPosition({
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 300000
            });
            
            return {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
                accuracy: position.coords.accuracy
            };
        } catch (error) {
            console.error('Erro ao obter localização:', error);
            return null;
        }
    }
    return null;
}

// Monitorar mudanças de conectividade
function monitorConnectivity() {
    if (window.Capacitor && window.Capacitor.Plugins.Network) {
        const { Network } = window.Capacitor.Plugins;
        
        Network.addListener('networkStatusChange', (status) => {
            if (!status.connected) {
                showAlert('Sem conexão com a internet', 'warning');
            } else {
                showAlert('Conexão restaurada', 'success');
            }
        });
    }
}

// Inicializar monitoramento de conectividade
document.addEventListener('DOMContentLoaded', function() {
    if (isCapacitor) {
        monitorConnectivity();
    }
});

// Exportar funções para uso global
window.CapacitorUtils = {
    isCapacitor,
    sendLocalNotification,
    getDeviceInfo,
    checkConnectivity,
    openExternalUrl,
    makePhoneCall,
    shareContent,
    vibrateDevice,
    getCurrentLocation
};

console.log('Capacitor JavaScript carregado');



