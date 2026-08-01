/* ============================================================
   REMOTE.JS — Lógica del Cliente Móvil (Control Remoto)
   ============================================================ */

const UI = {
    badge: document.getElementById('connection-status'),
    statusText: document.getElementById('status-text'),
    btnNext: document.getElementById('btn-next'),
    btnNewGame: document.getElementById('btn-new-game'),
    btnSync: document.getElementById('btn-sync'),
    displayValue: document.getElementById('display-value'),
    displayContainer: document.getElementById('remote-display'),
    statDrawn: document.getElementById('stat-drawn'),
    statRemaining: document.getElementById('stat-remaining'),
    errorOverlay: document.getElementById('error-overlay'),
    errorMessage: document.getElementById('error-message')
};

// Colores CSS correspondientes a las letras
const COLORS = {
    'B': 'var(--color-bingo-B)',
    'I': 'var(--color-bingo-I)',
    'N': 'var(--color-bingo-N)',
    'G': 'var(--color-bingo-G)',
    'O': 'var(--color-bingo-O)'
};

let peer = null;
let conn = null;

// Obtener el ID de la sala desde la URL
const urlParams = new URLSearchParams(window.location.search);
const roomId = urlParams.get('room');

if (!roomId) {
    showError('No se proporcionó un ID de sala válido en el enlace.');
} else {
    initConnection();
}

function initConnection() {
    peer = new Peer(); // ID automático para el cliente

    peer.on('open', () => {
        console.log('Conectando a la sala:', roomId);
        
        // Conectar al host (la PC)
        conn = peer.connect(roomId);

        conn.on('open', () => {
            console.log('¡Conectado al Host!');
            updateConnectionStatus('connected');
            
            // Pedir estado inicial
            sendCommand('SYNC_REQUEST');
        });

        conn.on('data', (data) => {
            if (data.type === 'STATE_SYNC') {
                updateGameState(data.data);
            }
        });

        conn.on('close', () => {
            updateConnectionStatus('disconnected');
            showError('El Host cerró la conexión. Recarga la página en la PC y vuelve a escanear el QR.');
        });
    });

    peer.on('error', (err) => {
        console.error(err);
        updateConnectionStatus('error');
        showError('Error de conexión: ' + err.type);
    });
}

function sendCommand(action) {
    if (conn && conn.open) {
        // Vibración háptica si está disponible en el móvil
        if (navigator.vibrate) navigator.vibrate(50);
        
        conn.send({ action });
    }
}

function updateConnectionStatus(status) {
    if (status === 'connected') {
        UI.badge.className = 'status-badge status-badge--playing';
        UI.statusText.textContent = 'Conectado al Host';
        UI.btnSync.disabled = false;
    } else {
        UI.badge.className = 'status-badge status-badge--error';
        UI.statusText.textContent = 'Desconectado';
        UI.btnNext.disabled = true;
        UI.btnNewGame.disabled = true;
        UI.btnSync.disabled = true;
    }
}

function updateGameState(stateData) {
    console.log('Estado sincronizado:', stateData);
    
    // Actualizar números
    UI.statDrawn.textContent = stateData.drawnCount;
    UI.statRemaining.textContent = 75 - stateData.drawnCount;

    // Actualizar último número
    if (stateData.lastNumber) {
        const letter = stateData.lastNumber.letter;
        UI.displayValue.textContent = `${letter}-${stateData.lastNumber.number}`;
        UI.displayValue.style.color = COLORS[letter];
        UI.displayContainer.style.borderColor = COLORS[letter];
        UI.displayContainer.style.boxShadow = `inset 0 0 40px ${COLORS[letter]}40`;
    } else {
        UI.displayValue.textContent = '--';
        UI.displayValue.style.color = 'var(--color-text-primary)';
        UI.displayContainer.style.borderColor = 'var(--color-border)';
        UI.displayContainer.style.boxShadow = 'inset 0 0 40px rgba(0,0,0,0.5)';
    }

    // Botones habilitados según estado
    // Si state === 'extracting', inhabilitar botón next para no spam
    const canExtract = (stateData.state === 'playing' || stateData.state === 'paused') && stateData.drawnCount < 75;
    UI.btnNext.disabled = !canExtract;
    
    // Solo permitir nuevo juego/reiniciar si no está extrayendo
    UI.btnNewGame.disabled = stateData.state === 'extracting';
    
    // Cambiar el texto del botón dependiendo del estado
    const span = UI.btnNewGame.querySelector('span');
    if (stateData.state === 'playing' || stateData.state === 'paused') {
        span.textContent = 'Reiniciar';
        UI.btnNewGame.style.color = 'var(--color-danger)';
        UI.btnNewGame.style.borderColor = 'rgba(239, 68, 68, 0.5)'; // Rojo semi-transparente
    } else {
        span.textContent = 'Nuevo Juego';
        UI.btnNewGame.style.color = 'var(--color-text-primary)';
        UI.btnNewGame.style.borderColor = 'var(--color-border)';
    }
}

function showError(msg) {
    UI.errorMessage.textContent = msg;
    UI.errorOverlay.classList.remove('hidden');
}

// Event Listeners
UI.btnNext.addEventListener('click', () => sendCommand('NEXT_NUMBER'));
UI.btnNewGame.addEventListener('click', () => {
    // Si el botón dice Reiniciar, preguntamos de forma diferente
    const isRestart = UI.btnNewGame.querySelector('span').textContent === 'Reiniciar';
    const msg = isRestart ? '¿Seguro que quieres Reiniciar la partida actual?' : '¿Iniciar un Nuevo Juego?';
    
    if (confirm(msg)) {
        sendCommand('NEW_GAME');
    }
});
UI.btnSync.addEventListener('click', () => sendCommand('SYNC_REQUEST'));
