/* ============================================================
   NETWORK.JS — Gestión de conexión P2P (Host)
   ============================================================
   Utiliza PeerJS (WebRTC) para permitir que un dispositivo
   móvil controle el juego.
   ============================================================ */

import { $, uniqueId, getLetterForNumber } from './helpers.js';

export class NetworkManager {
    constructor(appInstance) {
        this._app = appInstance;
        this._peer = null;
        this._connection = null;
        this._roomId = `bingo-${uniqueId()}`;
        
        // DOM Elements
        this._els = {
            modal: $('#modal-qr'),
            btnClose: $('#btn-modal-qr-close'),
            btnOpen: $('#btn-remote'),
            qrContainer: $('#qr-container'),
            link: $('#remote-link'),
            statusBadge: $('#remote-status-badge'),
            statusText: $('#remote-status-text')
        };

        this._bindEvents();
    }

    /**
     * Inicializa el servidor PeerJS
     */
    init() {
        if (!window.Peer) {
            console.error('PeerJS no está cargado');
            return;
        }

        // Crear instancia Peer
        this._peer = new Peer(this._roomId);

        this._peer.on('open', (id) => {
            console.log('📡 Sala creada con ID:', id);
            this._generateQRCode(id);
        });

        this._peer.on('connection', (conn) => {
            console.log('📱 Dispositivo remoto conectado!');
            
            // Si ya había una conexión, la cerramos (solo permitimos 1 remoto)
            if (this._connection) {
                this._connection.close();
            }

            this._connection = conn;
            this._updateStatus('conectado');
            this._app._ui.showToast('Control remoto conectado', 'success');

            // Escuchar mensajes del celular
            conn.on('data', (data) => {
                this._handleCommand(data);
            });

            conn.on('close', () => {
                console.log('📱 Dispositivo desconectado');
                this._connection = null;
                this._updateStatus('esperando');
                this._app._ui.showToast('Control remoto desconectado', 'warning');
            });
        });

        this._peer.on('error', (err) => {
            console.error('Error PeerJS:', err);
            this._updateStatus('error');
        });
    }

    /**
     * Procesa los comandos que llegan desde el celular
     */
    _handleCommand(command) {
        console.log('Comando remoto recibido:', command);
        
        switch (command.action) {
            case 'NEXT_NUMBER':
                // Solo si el juego está en curso y no está extrayendo
                if (this._app._state === 'playing' || this._app._state === 'paused') {
                    const btn = $('#btn-next-number');
                    if (!btn.disabled) {
                        // Simulamos el click para que pase por todo el flujo de UI
                        btn.click();
                    }
                }
                break;
            case 'NEW_GAME':
                if (this._app._state === 'idle' || this._app._state === 'finished') {
                    $('#btn-new-game').click();
                }
                break;
            case 'SYNC_REQUEST':
                this.syncState();
                break;
        }
    }

    /**
     * Envía el estado actual al celular para que actualice su interfaz
     */
    syncState() {
        if (!this._connection) return;
        
        const lastNum = this._app._numbers.lastDrawn();
        const lastNumberObj = lastNum ? {
            number: lastNum,
            letter: getLetterForNumber(lastNum)
        } : null;

        this._connection.send({
            type: 'STATE_SYNC',
            data: {
                state: this._app._state,
                drawnCount: this._app._numbers.drawnNumbers().length,
                lastNumber: lastNumberObj
            }
        });
    }

    /**
     * Genera el QR Code para escanear
     */
    _generateQRCode(id) {
        const baseUrl = window.location.href.split('?')[0].split('#')[0].replace('index.html', '');
        // El link apuntará a remote.html
        const remoteUrl = `${baseUrl}${baseUrl.endsWith('/') ? '' : '/'}remote.html?room=${id}`;
        
        this._els.link.href = remoteUrl;
        this._els.link.textContent = remoteUrl;

        this._els.qrContainer.innerHTML = '';
        if (window.QRCode) {
            new QRCode(this._els.qrContainer, {
                text: remoteUrl,
                width: 200,
                height: 200,
                colorDark: "#000000",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.H
            });
        }
    }

    _bindEvents() {
        // Abrir modal
        if (this._els.btnOpen) {
            this._els.btnOpen.addEventListener('click', () => {
                if (!this._peer) this.init();
                this._els.modal.classList.remove('hidden');
            });
        }

        // Cerrar modal
        if (this._els.btnClose) {
            this._els.btnClose.addEventListener('click', () => {
                this._els.modal.classList.add('hidden');
            });
        }
    }

    _updateStatus(status) {
        if (status === 'conectado') {
            this._els.statusBadge.className = 'status-badge status-badge--playing';
            this._els.statusText.textContent = 'Conectado';
        } else if (status === 'error') {
            this._els.statusBadge.className = 'status-badge status-badge--finished'; // Rojo/Dorado
            this._els.statusText.textContent = 'Error de conexión';
        } else {
            this._els.statusBadge.className = 'status-badge status-badge--idle';
            this._els.statusText.textContent = 'Esperando conexión...';
        }
    }
}
