/* ============================================================
   FULLSCREEN.JS — Wrapper para Fullscreen API
   ============================================================
   Gestiona:
   - Entrar / salir de pantalla completa
   - Toggle
   - Detección de estado
   - Cross-browser (webkit, moz, ms)
   - Sincronización con CSS (clase body)
   - Sincronización con iconos de botón
   ============================================================ */

import { $ } from './helpers.js';


/**
 * Clase FullscreenManager
 * Wrapper cross-browser para la Fullscreen API.
 */
export class FullscreenManager {

    constructor() {
        /** @type {Function|null} Callback cuando cambia el estado fullscreen */
        this._onChangeCallback = null;

        // Escuchar cambios en fullscreen (cualquier vendor prefix)
        this._bindEvents();
    }


    /* ==================== MÉTODOS PRIVADOS ==================== */

    /**
     * Bind de eventos fullscreenchange con vendor prefixes
     * @private
     */
    _bindEvents() {
        const handler = () => this._handleChange();

        document.addEventListener('fullscreenchange', handler);
        document.addEventListener('webkitfullscreenchange', handler);
        document.addEventListener('mozfullscreenchange', handler);
        document.addEventListener('MSFullscreenChange', handler);
    }


    /**
     * Handler cuando el estado fullscreen cambia
     * @private
     */
    _handleChange() {
        const isFs = this.isFullscreen();

        // Sincronizar clase CSS en el body
        document.body.classList.toggle('is-fullscreen', isFs);

        // Sincronizar iconos del botón
        const iconEnter = $('#icon-fullscreen-enter');
        const iconExit = $('#icon-fullscreen-exit');

        if (iconEnter && iconExit) {
            iconEnter.classList.toggle('hidden', isFs);
            iconExit.classList.toggle('hidden', !isFs);
        }

        // Ejecutar callback
        if (this._onChangeCallback) {
            this._onChangeCallback(isFs);
        }
    }


    /* ==================== MÉTODOS PÚBLICOS ==================== */

    /**
     * Entra en pantalla completa
     * @param {Element} [element=document.documentElement] - Elemento a maximizar
     * @returns {Promise<void>}
     */
    async enter(element = document.documentElement) {
        try {
            if (element.requestFullscreen) {
                await element.requestFullscreen();
            } else if (element.webkitRequestFullscreen) {
                await element.webkitRequestFullscreen();
            } else if (element.mozRequestFullScreen) {
                await element.mozRequestFullScreen();
            } else if (element.msRequestFullscreen) {
                await element.msRequestFullscreen();
            }
        } catch (error) {
            // Silenciar errores (e.g., usuario rechaza el prompt)
            console.warn('Fullscreen request failed:', error.message);
        }
    }


    /**
     * Sale de pantalla completa
     * @returns {Promise<void>}
     */
    async exit() {
        try {
            if (document.exitFullscreen) {
                await document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                await document.webkitExitFullscreen();
            } else if (document.mozCancelFullScreen) {
                await document.mozCancelFullScreen();
            } else if (document.msExitFullscreen) {
                await document.msExitFullscreen();
            }
        } catch (error) {
            console.warn('Exit fullscreen failed:', error.message);
        }
    }


    /**
     * Toggle entre pantalla completa y normal
     * @returns {Promise<void>}
     */
    async toggle() {
        if (this.isFullscreen()) {
            await this.exit();
        } else {
            await this.enter();
        }
    }


    /**
     * Verifica si está en pantalla completa
     * @returns {boolean}
     */
    isFullscreen() {
        return !!(
            document.fullscreenElement ||
            document.webkitFullscreenElement ||
            document.mozFullScreenElement ||
            document.msFullscreenElement
        );
    }


    /**
     * Verifica si el navegador soporta Fullscreen API
     * @returns {boolean}
     */
    isSupported() {
        return !!(
            document.fullscreenEnabled ||
            document.webkitFullscreenEnabled ||
            document.mozFullScreenEnabled ||
            document.msFullscreenEnabled
        );
    }


    /**
     * Registra un callback cuando cambia el estado fullscreen
     * @param {Function} callback - (isFullscreen: boolean) => void
     */
    onChange(callback) {
        this._onChangeCallback = callback;
    }
}
