/* ============================================================
   UI.JS — Gestión Completa del DOM
   ============================================================
   Gestiona:
   - Actualización de paneles (último número, stats, timer, clock)
   - Cuadrícula B-I-N-G-O (generación y actualización)
   - Historial de extracción
   - Temas (claro/oscuro)
   - Modales (ayuda, confirmación)
   - Toasts (notificaciones)
   - Estado del juego (badge)
   - Visibilidad de botones
   ============================================================ */

import { $, $$, createElement, getLetterForNumber, getCurrentTimeFormatted } from './helpers.js';
import { NumberGenerator } from './numbers.js';


/**
 * Clase UIManager
 * Controla todas las actualizaciones del DOM.
 */
export class UIManager {

    /**
     * @param {import('./animation.js').AnimationEngine} animationEngine
     */
    constructor(animationEngine) {
        /** @type {import('./animation.js').AnimationEngine} */
        this._animation = animationEngine;

        // Cachear referencias DOM frecuentes
        this._els = {
            // Panel último número
            lastNumberLetter: $('#last-number-letter'),
            lastNumberValue: $('#last-number-value'),
            lastNumberDisplay: $('.last-number-display'),

            // Stats
            statDrawn: $('#stat-drawn'),
            statRemaining: $('#stat-remaining'),
            statTimer: $('#stat-timer'),

            // Clock
            clockTime: $('#clock-time'),

            // Status badge
            statusBadge: $('#game-status-badge'),
            statusText: $('#game-status-text'),

            // Grid
            gridBody: $('#grid-body'),

            // History
            historyList: $('#history-list'),
            historyEmpty: $('#history-empty'),
            historyCount: $('#history-count'),

            // Buttons
            btnNextNumber: $('#btn-next-number'),
            btnNewGame: $('#btn-new-game'),
            btnPause: $('#btn-pause'),
            btnResume: $('#btn-resume'),
            btnShuffle: $('#btn-shuffle'),
            btnReset: $('#btn-reset'),

            // Sound icons
            iconSoundOn: $('#icon-sound-on'),
            iconSoundOff: $('#icon-sound-off'),

            // Theme icons
            iconThemeDark: $('#icon-theme-dark'),
            iconThemeLight: $('#icon-theme-light'),

            // Modals
            modalHelp: $('#modal-help'),
            modalConfirm: $('#modal-confirm'),
            modalConfirmMessage: $('#modal-confirm-message'),

            // Toast container
            toastContainer: $('#toast-container'),

            // Game over
            gameOverOverlay: $('#game-over-overlay'),
            gameOverTime: $('#game-over-time'),
        };

        // Generar la cuadrícula B-I-N-G-O
        this._generateGrid();
    }


    /* ==================== CUADRÍCULA B-I-N-G-O ==================== */

    /**
     * Genera las 75 celdas de la cuadrícula
     * Organizadas en 5 columnas (B, I, N, G, O) de 15 filas
     * @private
     */
    _generateGrid() {
        const gridBody = this._els.gridBody;
        if (!gridBody) return;

        gridBody.innerHTML = '';

        const categories = NumberGenerator.getCategories();
        const letters = ['B', 'I', 'N', 'G', 'O'];

        // Generar por filas (15 filas, 5 columnas)
        for (let row = 0; row < 15; row++) {
            for (const letter of letters) {
                const number = categories[letter][row];

                const cell = createElement('div', {
                    className: 'grid-cell',
                    dataset: { number: String(number), letter }
                });

                const numberSpan = createElement('span', {
                    className: 'grid-cell-number'
                }, String(number));

                cell.appendChild(numberSpan);
                gridBody.appendChild(cell);
            }
        }
    }


    /**
     * Actualiza la cuadrícula marcando números extraídos
     * @param {number[]} drawnNumbers - Lista de números extraídos
     * @param {number|null} lastNumber - Último número extraído
     */
    updateGrid(drawnNumbers, lastNumber) {
        const cells = $$('.grid-cell', this._els.gridBody);

        cells.forEach(cell => {
            const num = parseInt(cell.dataset.number, 10);
            const wasLast = cell.classList.contains('grid-cell--last');
            const wasDrawn = cell.classList.contains('grid-cell--drawn');

            // Resetear clases
            cell.classList.remove('grid-cell--drawn', 'grid-cell--last');

            if (drawnNumbers.includes(num)) {
                if (num === lastNumber) {
                    cell.classList.add('grid-cell--last');
                    // Animar solo si es nuevo
                    if (!wasLast) {
                        this._animation.animateGridCell(cell);
                    }
                } else {
                    cell.classList.add('grid-cell--drawn');
                }
            }
        });
    }


    /**
     * Resetea la cuadrícula (quita todas las marcas)
     */
    resetGrid() {
        const cells = $$('.grid-cell', this._els.gridBody);
        cells.forEach(cell => {
            cell.classList.remove('grid-cell--drawn', 'grid-cell--last');
        });
    }


    /* ==================== PANEL ÚLTIMO NÚMERO ==================== */

    /**
     * Actualiza el panel del último número
     * Nota: La animación la gestiona AnimationEngine._animateLastNumberPanel
     * @param {number|null} number
     * @param {string|null} letter
     */
    updateLastNumber(number, letter) {
        if (number === null) {
            this._els.lastNumberValue.textContent = '—';
            this._els.lastNumberLetter.textContent = '—';
            this._els.lastNumberDisplay.removeAttribute('data-letter');
        }
        // La actualización visual la hace AnimationEngine cuando hay animación
    }


    /**
     * Resetea el panel del último número
     */
    resetLastNumber() {
        this._els.lastNumberValue.textContent = '—';
        this._els.lastNumberLetter.textContent = '—';
        this._els.lastNumberDisplay.removeAttribute('data-letter');
    }


    /* ==================== ESTADÍSTICAS ==================== */

    /**
     * Actualiza las estadísticas (extraídas, restantes)
     * @param {number} drawn - Cantidad extraída
     * @param {number} remaining - Cantidad restante
     */
    updateStats(drawn, remaining) {
        const drawnEl = this._els.statDrawn;
        const remainingEl = this._els.statRemaining;

        if (drawnEl.textContent !== String(drawn)) {
            drawnEl.textContent = drawn;
            this._animation.animateStatUpdate(drawnEl);
        }

        if (remainingEl.textContent !== String(remaining)) {
            remainingEl.textContent = remaining;
            this._animation.animateStatUpdate(remainingEl);
        }
    }


    /**
     * Actualiza el cronómetro mostrado
     * @param {string} timeFormatted - Tiempo formateado (MM:SS)
     */
    updateTimer(timeFormatted) {
        this._els.statTimer.textContent = timeFormatted;
    }


    /**
     * Actualiza el reloj en tiempo real
     * @param {string} timeFormatted - Hora formateada (HH:MM:SS)
     */
    updateClock(timeFormatted) {
        this._els.clockTime.textContent = timeFormatted;
    }


    /* ==================== HISTORIAL ==================== */

    /**
     * Añade una entrada al historial
     * @param {Object} entry - Datos de la extracción
     * @param {number} entry.number - Número
     * @param {string} entry.letter - Letra BINGO
     * @param {number} entry.order - Orden de extracción
     * @param {string} entry.time - Hora de extracción (HH:MM:SS)
     */
    addHistoryEntry(entry) {
        const list = this._els.historyList;

        // Ocultar mensaje vacío
        if (this._els.historyEmpty) {
            this._els.historyEmpty.classList.add('hidden');
        }

        // Quitar clase --latest del item anterior
        const prevLatest = $('.history-item--latest', list);
        if (prevLatest) {
            prevLatest.classList.remove('history-item--latest');
        }

        // Crear nuevo item
        const item = createElement('div', {
            className: 'history-item history-item--latest',
            dataset: { order: String(entry.order) }
        });

        const orderSpan = createElement('span', {
            className: 'history-order'
        }, `#${entry.order}`);

        const ballSpan = createElement('span', {
            className: `history-ball history-ball--${entry.letter}`
        });

        const ballLetter = createElement('span', {
            className: 'history-ball-letter'
        }, entry.letter);

        const ballNumber = createElement('span', {
            className: 'history-ball-number'
        }, String(entry.number));

        ballSpan.appendChild(ballLetter);
        ballSpan.appendChild(ballNumber);

        const timeSpan = createElement('span', {
            className: 'history-time'
        }, entry.time);

        item.appendChild(orderSpan);
        item.appendChild(ballSpan);
        item.appendChild(timeSpan);

        // Insertar al principio (último arriba)
        list.insertBefore(item, list.firstChild);

        // Animar entrada
        this._animation.animateHistoryItem(item);

        // Actualizar contador
        this._els.historyCount.textContent = entry.order;
    }


    /**
     * Limpia el historial
     */
    clearHistory() {
        const list = this._els.historyList;
        // Remover todos los items del historial pero mantener el empty state
        const items = $$('.history-item', list);
        items.forEach(item => item.remove());

        // Mostrar mensaje vacío
        if (this._els.historyEmpty) {
            this._els.historyEmpty.classList.remove('hidden');
        }

        this._els.historyCount.textContent = '0';
    }


    /* ==================== ESTADO DEL JUEGO ==================== */

    /**
     * Actualiza el badge de estado del juego
     * @param {'idle'|'playing'|'paused'|'extracting'|'finished'} state
     */
    setGameState(state) {
        const badge = this._els.statusBadge;
        const text = this._els.statusText;

        // Remover todas las clases de estado
        badge.className = 'status-badge';

        const stateMap = {
            'idle':       { class: 'status-badge--idle',       text: 'Sin iniciar' },
            'playing':    { class: 'status-badge--playing',    text: 'En juego' },
            'paused':     { class: 'status-badge--paused',     text: 'Pausado' },
            'extracting': { class: 'status-badge--extracting', text: 'Extrayendo' },
            'finished':   { class: 'status-badge--finished',   text: 'Finalizado' }
        };

        const config = stateMap[state] || stateMap['idle'];
        badge.classList.add(config.class);
        text.textContent = config.text;
    }


    /* ==================== BOTONES ==================== */

    /**
     * Actualiza la visibilidad de los botones según el estado del juego
     * @param {'idle'|'playing'|'paused'|'finished'} state
     */
    updateButtonVisibility(state) {
        const { btnNextNumber, btnNewGame, btnPause, btnResume, btnShuffle, btnReset } = this._els;

        switch (state) {
            case 'idle':
                btnNextNumber.disabled = true;
                btnNewGame.classList.remove('hidden');
                btnPause.classList.add('hidden');
                btnResume.classList.add('hidden');
                btnShuffle.classList.add('hidden');
                btnReset.classList.add('hidden');
                break;

            case 'playing':
                btnNextNumber.disabled = false;
                btnNewGame.classList.add('hidden');
                btnPause.classList.remove('hidden');
                btnResume.classList.add('hidden');
                btnShuffle.classList.remove('hidden');
                btnReset.classList.remove('hidden');
                break;

            case 'paused':
                btnNextNumber.disabled = true;
                btnNewGame.classList.add('hidden');
                btnPause.classList.add('hidden');
                btnResume.classList.remove('hidden');
                btnShuffle.classList.remove('hidden');
                btnReset.classList.remove('hidden');
                break;

            case 'finished':
                btnNextNumber.disabled = true;
                btnNewGame.classList.remove('hidden');
                btnPause.classList.add('hidden');
                btnResume.classList.add('hidden');
                btnShuffle.classList.add('hidden');
                btnReset.classList.add('hidden');
                break;
        }
    }


    /**
     * Deshabilita temporalmente el botón de siguiente número
     * (durante la animación de extracción)
     * @param {boolean} disabled
     */
    setNextButtonDisabled(disabled) {
        this._els.btnNextNumber.disabled = disabled;
    }


    /* ==================== TEMAS ==================== */

    /**
     * Establece el tema
     * @param {'light'|'dark'} theme
     */
    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);

        // Sincronizar iconos
        const isDark = theme === 'dark';
        this._els.iconThemeDark.classList.toggle('hidden', !isDark);
        this._els.iconThemeLight.classList.toggle('hidden', isDark);

        // Actualizar meta theme-color
        const metaTheme = $('meta[name="theme-color"]');
        if (metaTheme) {
            metaTheme.content = isDark ? '#0f1117' : '#f8fafc';
        }
    }


    /**
     * Obtiene el tema actual
     * @returns {'light'|'dark'}
     */
    getTheme() {
        return document.documentElement.getAttribute('data-theme') || 'dark';
    }


    /**
     * Toggle entre temas
     * @returns {'light'|'dark'} Nuevo tema
     */
    toggleTheme() {
        const current = this.getTheme();
        const next = current === 'dark' ? 'light' : 'dark';
        this.setTheme(next);
        return next;
    }


    /* ==================== SONIDO ==================== */

    /**
     * Actualiza el icono de sonido
     * @param {boolean} muted
     */
    updateSoundIcon(muted) {
        this._els.iconSoundOn.classList.toggle('hidden', muted);
        this._els.iconSoundOff.classList.toggle('hidden', !muted);
    }


    /* ==================== MODALES ==================== */

    /**
     * Muestra un modal
     * @param {'help'|'confirm'} modalId
     */
    showModal(modalId) {
        const modal = modalId === 'help' ? this._els.modalHelp : this._els.modalConfirm;
        if (modal) {
            modal.classList.remove('hidden');
            this._animation.animateModalIn(modal);
        }
    }


    /**
     * Oculta un modal
     * @param {'help'|'confirm'} modalId
     */
    hideModal(modalId) {
        const modal = modalId === 'help' ? this._els.modalHelp : this._els.modalConfirm;
        if (modal) {
            modal.classList.add('hidden');
        }
    }


    /**
     * Muestra el modal de confirmación con un mensaje personalizado
     * @param {string} message - Mensaje a mostrar
     * @returns {Promise<boolean>} Resuelve con true si confirma, false si cancela
     */
    showConfirm(message) {
        return new Promise(resolve => {
            this._els.modalConfirmMessage.textContent = message;
            this.showModal('confirm');

            const btnOk = $('#btn-confirm-ok');
            const btnCancel = $('#btn-confirm-cancel');

            const cleanup = () => {
                btnOk.removeEventListener('click', onConfirm);
                btnCancel.removeEventListener('click', onCancel);
                this.hideModal('confirm');
            };

            const onConfirm = () => {
                cleanup();
                resolve(true);
            };

            const onCancel = () => {
                cleanup();
                resolve(false);
            };

            btnOk.addEventListener('click', onConfirm);
            btnCancel.addEventListener('click', onCancel);
        });
    }


    /**
     * Verifica si algún modal está abierto
     * @returns {boolean}
     */
    isAnyModalOpen() {
        return !this._els.modalHelp.classList.contains('hidden') ||
               !this._els.modalConfirm.classList.contains('hidden');
    }


    /* ==================== TOASTS ==================== */

    /**
     * Muestra una notificación toast
     * @param {string} message - Mensaje a mostrar
     * @param {'info'|'success'|'warning'|'danger'} [type='info'] - Tipo de toast
     * @param {number} [duration=3000] - Duración en ms
     */
    showToast(message, type = 'info', duration = 3000) {
        const container = this._els.toastContainer;

        const toast = createElement('div', {
            className: `toast toast--${type}`
        });

        const msg = createElement('span', {
            className: 'toast-message'
        }, message);

        toast.appendChild(msg);
        container.appendChild(toast);

        // Animar entrada
        this._animation.animateToast(toast);

        // Auto-remover después de la duración
        setTimeout(async () => {
            await this._animation.animateToastOut(toast);
            toast.remove();
        }, duration);
    }


    /* ==================== GAME OVER ==================== */

    /**
     * Muestra la pantalla de fin de juego
     * @param {string} totalTime - Tiempo total formateado
     */
    async showGameOver(totalTime) {
        this._els.gameOverTime.textContent = totalTime;
        await this._animation.animateGameOver(this._els.gameOverOverlay);
    }


    /**
     * Oculta la pantalla de fin de juego
     */
    hideGameOver() {
        this._els.gameOverOverlay.classList.add('hidden');
    }


    /* ==================== RESET GENERAL ==================== */

    /**
     * Resetea toda la UI al estado inicial
     */
    resetAll() {
        this.resetLastNumber();
        this.resetGrid();
        this.clearHistory();
        this.updateStats(0, 75);
        this.updateTimer('00:00');
        this.setGameState('idle');
        this.updateButtonVisibility('idle');
        this.hideGameOver();
    }
}
