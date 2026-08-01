/* ============================================================
   TIMER.JS — Cronómetro del Juego y Reloj en Tiempo Real
   ============================================================
   Gestiona:
   - Cronómetro (start, pause, resume, reset)
   - Reloj en tiempo real (hora actual)
   - Callbacks de actualización cada segundo
   - Usa requestAnimationFrame para precisión
   ============================================================ */

import { formatTime, formatTimeLong, getCurrentTimeFormatted } from './helpers.js';


/**
 * Clase GameTimer
 * Implementa un cronómetro preciso usando performance.now()
 * y un reloj en tiempo real, con callbacks de actualización.
 */
export class GameTimer {

    constructor() {
        /** @type {number} Tiempo acumulado en ms antes de la última pausa */
        this._accumulated = 0;

        /** @type {number|null} Timestamp de inicio del tramo actual (performance.now) */
        this._startTimestamp = null;

        /** @type {boolean} Si el cronómetro está activo */
        this._isRunning = false;

        /** @type {boolean} Si el cronómetro está pausado */
        this._isPaused = false;

        /** @type {number|null} ID del requestAnimationFrame */
        this._rafId = null;

        /** @type {Function|null} Callback de actualización del cronómetro */
        this._onTimerUpdate = null;

        /** @type {Function|null} Callback de actualización del reloj */
        this._onClockUpdate = null;

        /** @type {number} Último segundo renderizado (para evitar updates innecesarios) */
        this._lastRenderedSecond = -1;

        /** @type {string} Última hora renderizada */
        this._lastRenderedClock = '';

        // Iniciar el loop del reloj (siempre activo)
        this._startClockLoop();
    }


    /* ==================== RELOJ EN TIEMPO REAL ==================== */

    /**
     * Inicia el loop del reloj que se ejecuta constantemente
     * @private
     */
    _startClockLoop() {
        const tick = () => {
            // Actualizar reloj
            const currentTime = getCurrentTimeFormatted();
            if (currentTime !== this._lastRenderedClock) {
                this._lastRenderedClock = currentTime;
                if (this._onClockUpdate) {
                    this._onClockUpdate(currentTime);
                }
            }

            // Actualizar cronómetro si está activo
            if (this._isRunning && !this._isPaused) {
                const elapsed = this.getElapsedMs();
                const currentSecond = Math.floor(elapsed / 1000);

                if (currentSecond !== this._lastRenderedSecond) {
                    this._lastRenderedSecond = currentSecond;
                    if (this._onTimerUpdate) {
                        this._onTimerUpdate(formatTime(elapsed), formatTimeLong(elapsed), elapsed);
                    }
                }
            }

            this._rafId = requestAnimationFrame(tick);
        };

        this._rafId = requestAnimationFrame(tick);
    }


    /* ==================== CRONÓMETRO ==================== */

    /**
     * Inicia el cronómetro desde cero
     */
    start() {
        this._accumulated = 0;
        this._startTimestamp = performance.now();
        this._isRunning = true;
        this._isPaused = false;
        this._lastRenderedSecond = -1;

        // Trigger update inmediato
        if (this._onTimerUpdate) {
            this._onTimerUpdate('00:00', '00:00:00', 0);
        }
    }


    /**
     * Pausa el cronómetro
     */
    pause() {
        if (this._isRunning && !this._isPaused) {
            this._accumulated += performance.now() - this._startTimestamp;
            this._startTimestamp = null;
            this._isPaused = true;
        }
    }


    /**
     * Reanuda el cronómetro después de una pausa
     */
    resume() {
        if (this._isRunning && this._isPaused) {
            this._startTimestamp = performance.now();
            this._isPaused = false;
        }
    }


    /**
     * Reinicia el cronómetro a cero (sin detenerlo)
     */
    reset() {
        this._accumulated = 0;
        this._startTimestamp = this._isRunning && !this._isPaused ? performance.now() : null;
        this._lastRenderedSecond = -1;
        this._isRunning = false;
        this._isPaused = false;

        if (this._onTimerUpdate) {
            this._onTimerUpdate('00:00', '00:00:00', 0);
        }
    }


    /**
     * Detiene completamente el cronómetro
     */
    stop() {
        if (this._isRunning) {
            if (!this._isPaused && this._startTimestamp !== null) {
                this._accumulated += performance.now() - this._startTimestamp;
            }
            this._isRunning = false;
            this._isPaused = false;
            this._startTimestamp = null;
        }
    }


    /**
     * Obtiene el tiempo transcurrido en milisegundos
     * @returns {number}
     */
    getElapsedMs() {
        let elapsed = this._accumulated;
        if (this._isRunning && !this._isPaused && this._startTimestamp !== null) {
            elapsed += performance.now() - this._startTimestamp;
        }
        return elapsed;
    }


    /**
     * Obtiene el tiempo transcurrido formateado como MM:SS
     * @returns {string}
     */
    getElapsedFormatted() {
        return formatTime(this.getElapsedMs());
    }


    /**
     * Obtiene el tiempo transcurrido formateado como HH:MM:SS
     * @returns {string}
     */
    getElapsedFormattedLong() {
        return formatTimeLong(this.getElapsedMs());
    }


    /**
     * Verifica si el cronómetro está activo
     * @returns {boolean}
     */
    isRunning() {
        return this._isRunning;
    }


    /**
     * Verifica si el cronómetro está pausado
     * @returns {boolean}
     */
    isPaused() {
        return this._isPaused;
    }


    /* ==================== CALLBACKS ==================== */

    /**
     * Registra un callback que se ejecuta cada segundo mientras
     * el cronómetro está activo
     * @param {Function} callback - (formattedShort, formattedLong, elapsedMs) => void
     */
    onTimerUpdate(callback) {
        this._onTimerUpdate = callback;
    }


    /**
     * Registra un callback que se ejecuta cada segundo para el reloj
     * @param {Function} callback - (formattedTime) => void
     */
    onClockUpdate(callback) {
        this._onClockUpdate = callback;
    }


    /* ==================== CLEANUP ==================== */

    /**
     * Limpia todos los recursos (cancelar RAF)
     */
    destroy() {
        if (this._rafId !== null) {
            cancelAnimationFrame(this._rafId);
            this._rafId = null;
        }
        this._onTimerUpdate = null;
        this._onClockUpdate = null;
    }
}
