/* ============================================================
   APP.JS — Orquestador Principal
   ============================================================
   Punto de entrada de la aplicación. Inicializa todos los
   módulos, bindea eventos (click, keyboard), gestiona el
   flujo del juego y coordina entre los componentes.

   States: idle → playing → paused/extracting → finished
   ============================================================ */

import { $, getCurrentTimeFormatted } from './helpers.js';
import { NumberGenerator } from './numbers.js';
import { GameTimer } from './timer.js';
import { FullscreenManager } from './fullscreen.js';
import { SoundManager } from './sound.js';
import { ParticleSystem } from './effects.js';
import { AnimationEngine } from './animation.js';
import { TombolaRenderer } from './tombola.js';
import { UIManager } from './ui.js';
import { NetworkManager } from './network.js';


/**
 * Clase BingoApp
 * Controlador principal de la aplicación de Tómbola de Bingo.
 */
class BingoApp {

    constructor() {
        /* ==================== ESTADO DEL JUEGO ==================== */

        /**
         * Estado actual del juego
         * @type {'idle'|'playing'|'paused'|'extracting'|'finished'}
         */
        this._state = 'idle';

        /* ==================== MÓDULOS ==================== */

        /** @type {NumberGenerator} Motor de números */
        this._numbers = new NumberGenerator();

        /** @type {GameTimer} Cronómetro y reloj */
        this._timer = new GameTimer();

        /** @type {FullscreenManager} Fullscreen API */
        this._fullscreen = new FullscreenManager();

        /** @type {SoundManager} Motor de audio */
        this._sound = new SoundManager();

        /** @type {ParticleSystem} Sistema de partículas */
        this._particles = new ParticleSystem($('#particles-canvas'));

        /** @type {AnimationEngine} Motor de animaciones */
        this._animation = new AnimationEngine({
            particles: this._particles,
            sound: this._sound
        });

        /** @type {TombolaRenderer} Renderer de la tómbola */
        this._tombola = new TombolaRenderer($('#tombola-canvas'));

        /** @type {UIManager} Gestor de UI e interacción */
        this._ui = new UIManager(this._animation);

        /** @type {NetworkManager} Gestor de conexión remota (P2P) */
        this._network = new NetworkManager(this);

        /** @type {Function|null} Resolve function para confirmación pendiente */
        this._pendingConfirmResolve = null;
    }


    /* ==================== INICIALIZACIÓN ==================== */

    /**
     * Inicializa la aplicación completa
     */
    init() {
        // Configurar callbacks del timer
        this._timer.onTimerUpdate((short, long, ms) => {
            this._ui.updateTimer(short);
        });

        this._timer.onClockUpdate((time) => {
            this._ui.updateClock(time);
        });

        // Iniciar la tómbola (renderizado)
        this._tombola.start();

        // Bind de todos los eventos
        this._bindClickEvents();
        this._bindKeyboardEvents();
        this._bindWindowEvents();

        // Estado inicial de la UI
        this._setState('idle');
        this._ui.updateStats(0, 75);

        console.log('🎱 Tómbola de Bingo — Inicializada');
    }


    /* ==================== EVENTOS DE CLICK ==================== */

    /**
     * Bindea todos los eventos de click de la interfaz
     * @private
     */
    _bindClickEvents() {
        // === Botón: Siguiente Número ===
        $('#btn-next-number').addEventListener('click', () => {
            this._sound.playClick();
            this.nextNumber();
        });

        // === Botón: Nuevo Juego ===
        $('#btn-new-game').addEventListener('click', () => {
            this._sound.playClick();
            this.newGame();
        });

        // === Botón: Pausar ===
        $('#btn-pause').addEventListener('click', () => {
            this._sound.playClick();
            this.pause();
        });

        // === Botón: Reanudar ===
        $('#btn-resume').addEventListener('click', () => {
            this._sound.playClick();
            this.resume();
        });

        // === Botón: Mezclar ===
        $('#btn-shuffle').addEventListener('click', () => {
            this._sound.playClick();
            this.reshuffle();
        });

        // === Botón: Reiniciar ===
        $('#btn-reset').addEventListener('click', () => {
            this._sound.playClick();
            this.reset();
        });

        // === Botón: Toggle Sonido ===
        $('#btn-sound-toggle').addEventListener('click', () => {
            this.toggleSound();
        });

        // === Botón: Toggle Tema ===
        $('#btn-theme-toggle').addEventListener('click', () => {
            this._sound.playClick();
            this.toggleTheme();
        });

        // === Botón: Fullscreen ===
        $('#btn-fullscreen').addEventListener('click', () => {
            this._sound.playClick();
            this.toggleFullscreen();
        });

        // === Botón: Ayuda ===
        $('#btn-help').addEventListener('click', () => {
            this._sound.playClick();
            this.toggleHelp();
        });

        // === Modal Ayuda: Cerrar ===
        $('#btn-modal-close').addEventListener('click', () => {
            this._sound.playClick();
            this._ui.hideModal('help');
        });

        $('#btn-modal-ok').addEventListener('click', () => {
            this._sound.playClick();
            this._ui.hideModal('help');
        });

        // === Modal Ayuda: Click en overlay para cerrar ===
        $('#modal-help').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                this._ui.hideModal('help');
            }
        });

        // === Modal Confirm: Click en overlay para cancelar ===
        $('#modal-confirm').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                this._ui.hideModal('confirm');
            }
        });

        // === Game Over: Nuevo Juego ===
        $('#btn-game-over-new').addEventListener('click', () => {
            this._sound.playClick();
            this._ui.hideGameOver();
            this.newGame();
        });
    }


    /* ==================== EVENTOS DE TECLADO ==================== */

    /**
     * Bindea todos los atajos de teclado
     * @private
     */
    _bindKeyboardEvents() {
        document.addEventListener('keydown', (e) => {
            // No procesar atajos si hay un input enfocado
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            switch (e.code) {
                // ESPACIO — Extraer siguiente número
                case 'Space':
                    e.preventDefault();
                    if (this._state === 'playing') {
                        this.nextNumber();
                    }
                    break;

                // F11 — Pantalla completa
                case 'F11':
                    e.preventDefault();
                    this.toggleFullscreen();
                    break;

                // ESC — Salir de fullscreen o cerrar modal
                case 'Escape':
                    if (this._ui.isAnyModalOpen()) {
                        this._ui.hideModal('help');
                        this._ui.hideModal('confirm');
                    } else if (this._fullscreen.isFullscreen()) {
                        this._fullscreen.exit();
                    }
                    break;

                // N — Nuevo juego
                case 'KeyN':
                    if (!this._ui.isAnyModalOpen()) {
                        this.newGame();
                    }
                    break;

                // P — Pausar / Reanudar
                case 'KeyP':
                    if (!this._ui.isAnyModalOpen()) {
                        if (this._state === 'playing') {
                            this.pause();
                        } else if (this._state === 'paused') {
                            this.resume();
                        }
                    }
                    break;

                // M — Toggle sonido
                case 'KeyM':
                    this.toggleSound();
                    break;

                // T — Toggle tema
                case 'KeyT':
                    if (!this._ui.isAnyModalOpen()) {
                        this.toggleTheme();
                    }
                    break;

                // H — Ayuda
                case 'KeyH':
                    if (!this._ui.isAnyModalOpen()) {
                        this.toggleHelp();
                    } else {
                        this._ui.hideModal('help');
                    }
                    break;
            }
        });

        // Interceptar Ctrl+R (recargar)
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.code === 'KeyR') {
                if (this._state === 'playing' || this._state === 'paused') {
                    e.preventDefault();
                    this._handleReloadConfirm();
                }
            }
        });
    }


    /* ==================== EVENTOS DE VENTANA ==================== */

    /**
     * Bindea eventos de la ventana
     * @private
     */
    _bindWindowEvents() {
        // Advertir al cerrar/recargar si hay juego en curso
        window.addEventListener('beforeunload', (e) => {
            if (this._state === 'playing' || this._state === 'paused') {
                e.preventDefault();
                e.returnValue = '';
                return '';
            }
        });
    }


    /* ==================== ACCIONES DEL JUEGO ==================== */

    /**
     * Inicia un nuevo juego
     */
    async newGame(skipConfirm = false) {
        // Si hay un juego en curso, pedir confirmación
        if (!skipConfirm && (this._state === 'playing' || this._state === 'paused')) {
            const confirmed = await this._ui.showConfirm(
                '¿Iniciar un nuevo juego? Se perderá el progreso actual.'
            );
            if (!confirmed) return;
        }

        // Reiniciar todo
        this._numbers.reset();
        this._timer.reset();
        this._timer.start();
        this._tombola.reset();
        this._particles.clear();

        // Actualizar UI
        this._ui.resetAll();
        this._setState('playing');

        this._ui.showToast('🎱 ¡Nuevo juego iniciado!', 'success');
    }


    /**
     * Extrae el siguiente número
     */
    async nextNumber() {
        // Verificar estado
        if (this._state !== 'playing') return;
        if (this._animation.isAnimating()) return;

        // Extraer número
        const result = this._numbers.draw();
        if (!result) return;

        const { number, letter, color, order } = result;

        // Cambiar estado a extracting
        this._setState('extracting');
        this._ui.setNextButtonDisabled(true);

        // Remover la bola de la tómbola
        this._tombola.removeBall(number);

        // Ejecutar secuencia de animación completa
        await this._animation.playExtractionSequence(result, this._tombola);

        // Actualizar UI después de la animación
        this._ui.updateGrid(this._numbers.drawnNumbers(), number);
        this._ui.updateStats(this._numbers.drawnCount(), this._numbers.remaining());

        // Añadir al historial
        this._ui.addHistoryEntry({
            number,
            letter,
            order,
            time: getCurrentTimeFormatted()
        });

        // Finalizar si ya no quedan números
        if (this._numbers.isComplete()) {
            this._handleGameComplete();
        } else {
            this._setState('playing');
        }
    }


    /**
     * Pausa el juego
     */
    pause() {
        if (this._state !== 'playing') return;

        this._timer.pause();
        this._setState('paused');
        this._ui.showToast('⏸️ Juego pausado', 'warning');
    }


    /**
     * Reanuda el juego
     */
    resume() {
        if (this._state !== 'paused') return;

        this._timer.resume();
        this._setState('playing');
        this._ui.showToast('▶️ Juego reanudado', 'success');
    }


    /**
     * Reinicia el juego
     */
    async reset(skipConfirm = false) {
        if (this._state === 'idle') return;

        if (!skipConfirm) {
            const confirmed = await this._ui.showConfirm(
                '¿Reiniciar el juego? Se perderá todo el progreso.'
            );
            if (!confirmed) return;
        }

        this._numbers.reset();
        this._timer.reset();
        this._tombola.reset();
        this._particles.clear();

        this._ui.resetAll();
        this._setState('idle');

        this._ui.showToast('🔄 Juego reiniciado', 'info');
    }


    /**
     * Remezcla los números restantes
     */
    reshuffle() {
        if (this._state !== 'playing' && this._state !== 'paused') return;

        this._numbers.reshuffle();
        this._ui.showToast('🔀 Números mezclados nuevamente', 'info');
    }


    /**
     * Toggle sonido
     */
    toggleSound() {
        const muted = this._sound.toggleMute();
        this._ui.updateSoundIcon(muted);

        // Reproducir un click solo si se acaba de activar el sonido
        if (!muted) {
            this._sound.playClick();
        }

        this._ui.showToast(
            muted ? '🔇 Sonido desactivado' : '🔊 Sonido activado',
            'info',
            2000
        );
    }


    /**
     * Toggle tema
     */
    toggleTheme() {
        const newTheme = this._ui.toggleTheme();
        this._tombola.setTheme(newTheme === 'dark');

        this._ui.showToast(
            newTheme === 'dark' ? '🌙 Modo oscuro' : '☀️ Modo claro',
            'info',
            2000
        );
    }


    /**
     * Toggle pantalla completa
     */
    async toggleFullscreen() {
        await this._fullscreen.toggle();
    }


    /**
     * Toggle modal de ayuda
     */
    toggleHelp() {
        const modal = $('#modal-help');
        if (modal.classList.contains('hidden')) {
            this._ui.showModal('help');
        } else {
            this._ui.hideModal('help');
        }
    }


    /* ==================== MÉTODOS INTERNOS ==================== */

    /**
     * Cambia el estado del juego y actualiza la UI
     * @private
     * @param {'idle'|'playing'|'paused'|'extracting'|'finished'} newState
     */
    _setState(newState) {
        this._state = newState;
        this._ui.setGameState(newState);
        this._network.syncState();
        // Actualizar botones (extracting usa los botones de playing)
        const buttonState = newState === 'extracting' ? 'playing' : newState;
        this._ui.updateButtonVisibility(buttonState);

        // Durante extracción, deshabilitar siguiente número
        if (newState === 'extracting') {
            this._ui.setNextButtonDisabled(true);
        }
    }


    /**
     * Maneja el fin del juego (75 bolas extraídas)
     * @private
     */
    _handleGameComplete() {
        this._timer.stop();
        this._setState('finished');

        const totalTime = this._timer.getElapsedFormattedLong();
        this._ui.showGameOver(totalTime);
    }


    /**
     * Maneja la confirmación de Ctrl+R
     * @private
     */
    async _handleReloadConfirm() {
        const confirmed = await this._ui.showConfirm(
            '¿Recargar la página? Se perderá todo el progreso del juego.'
        );
        if (confirmed) {
            window.location.reload();
        }
    }
}


/* ==================== ENTRY POINT ==================== */

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    try {
        const app = new BingoApp();
        app.init();
    } catch (error) {
        console.error('🎱 Error inicializando Tómbola de Bingo:', error);
    }
});

