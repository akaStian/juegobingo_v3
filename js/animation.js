/* ============================================================
   ANIMATION.JS — Motor de Animaciones Secuenciales
   ============================================================
   Gestiona:
   - Secuencia de extracción de 12 pasos
   - Animaciones de entrada/salida de elementos
   - Web Animations API + CSS transitions
   - Sistema de promesas para encadenar animaciones
   ============================================================ */

import { $, delay } from './helpers.js';


/**
 * Clase AnimationEngine
 * Ejecuta secuencias de animación coordinadas para la extracción
 * de bolas y otras transiciones de la UI.
 */
export class AnimationEngine {

    /**
     * @param {Object} dependencies - Dependencias inyectadas
     * @param {import('./effects.js').ParticleSystem} dependencies.particles - Sistema de partículas
     * @param {import('./sound.js').SoundManager} dependencies.sound - Motor de audio
     */
    constructor({ particles, sound }) {
        /** @type {import('./effects.js').ParticleSystem} */
        this._particles = particles;

        /** @type {import('./sound.js').SoundManager} */
        this._sound = sound;

        /** @type {boolean} Si hay una animación en curso */
        this._isAnimating = false;

        /** @type {boolean} Si las animaciones están reducidas (prefers-reduced-motion) */
        this._reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }


    /* ==================== ESTADO ==================== */

    /**
     * Verifica si hay una animación en curso
     * @returns {boolean}
     */
    isAnimating() {
        return this._isAnimating;
    }


    /* ==================== SECUENCIA DE EXTRACCIÓN ==================== */

    /**
     * Ejecuta la secuencia completa de extracción (12 pasos)
     * @param {Object} drawnNumber - Datos del número extraído
     * @param {number} drawnNumber.number - Número
     * @param {string} drawnNumber.letter - Letra BINGO
     * @param {string} drawnNumber.color - Color hex
     * @param {Object} tombola - Referencia al renderer de la tómbola
     * @returns {Promise<void>}
     */
    async playExtractionSequence(drawnNumber, tombola) {
        if (this._isAnimating) return;
        this._isAnimating = true;

        const { number, letter, color } = drawnNumber;

        const ballEl = $('#extracted-ball');
        const ballLetterEl = $('#extracted-ball-letter');
        const ballNumberEl = $('#extracted-ball-number');

        try {
            // Si el usuario prefiere movimiento reducido, versión simplificada
            if (this._reducedMotion) {
                await this._playReducedSequence(drawnNumber);
                return;
            }

            // === PASO 1: Tómbola acelera ===
            if (tombola) {
                tombola.accelerate();
            }
            await delay(400);

            // === PASO 2: Bolas giran más rápido ===
            await delay(400);

            // === PASO 3: Sonido de giro ===
            this._sound.playDrum();
            await delay(600);

            // === PASO 4: Sale una bola ===
            if (tombola) {
                tombola.decelerate();
            }

            // Preparar la bola extraída
            ballLetterEl.textContent = letter;
            ballNumberEl.textContent = number;
            ballEl.style.background = `radial-gradient(ellipse at 30% 30%, 
                rgba(255,255,255,0.95), 
                ${color}40 50%, 
                ${color}90)`;

            // Mostrar y animar
            ballEl.classList.remove('hidden');
            this._sound.playPop();

            // === PASO 5: Bola gira ===
            ballEl.style.animation = 'none';
            // Force reflow
            void ballEl.offsetHeight;

            // Animación de eyección con giro
            const ejectAnimation = ballEl.animate([
                { 
                    transform: 'translate(-50%, -50%) scale(0) rotate(0deg)', 
                    opacity: 0 
                },
                { 
                    transform: 'translate(-50%, -50%) scale(0.5) rotate(180deg)', 
                    opacity: 0.7,
                    offset: 0.3 
                },
                { 
                    transform: 'translate(-50%, -50%) scale(1.3) rotate(360deg)', 
                    opacity: 1,
                    offset: 0.6 
                },
                { 
                    transform: 'translate(-50%, -50%) scale(0.95) rotate(380deg)',
                    offset: 0.8 
                },
                { 
                    transform: 'translate(-50%, -50%) scale(1) rotate(360deg)', 
                    opacity: 1 
                }
            ], {
                duration: 800,
                easing: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                fill: 'forwards'
            });

            await ejectAnimation.finished;

            // === PASO 6: Zoom ===
            await delay(200);

            // === PASO 7: Se detiene ===
            // (la bola ya está estática tras la animación)

            // === PASO 8: Se ilumina ===
            const glowAnimation = ballEl.animate([
                {
                    boxShadow: '0 0 10px rgba(255,255,255,0.2), 0 8px 32px rgba(0,0,0,0.3)'
                },
                {
                    boxShadow: `0 0 40px rgba(255,255,255,0.5), 0 0 80px ${color}60, 0 8px 32px rgba(0,0,0,0.3)`
                },
                {
                    boxShadow: `0 0 25px rgba(255,255,255,0.3), 0 0 50px ${color}40, 0 8px 32px rgba(0,0,0,0.3)`
                }
            ], {
                duration: 600,
                easing: 'ease-in-out',
                fill: 'forwards'
            });

            // === PASO 9: Número aparece grande (en el panel) ===
            this._sound.playChime();
            await this._animateLastNumberPanel(number, letter);
            await delay(200);

            // === PASO 10: Partículas ===
            const ballRect = ballEl.getBoundingClientRect();
            const centerX = ballRect.left + ballRect.width / 2;
            const centerY = ballRect.top + ballRect.height / 2;

            this._particles.ballBurst(centerX, centerY, letter);
            await delay(400);

            // === PASO 11: Resplandor ===
            this._particles.sparkle(ballEl, {
                count: 12,
                colors: [color, '#ffffff', '#fbbf24']
            });
            await delay(400);

            // === PASO 12: Celebración ===
            await delay(300);

            // Fade out la bola
            const fadeOut = ballEl.animate([
                { opacity: 1, transform: 'translate(-50%, -50%) scale(1)' },
                { opacity: 0, transform: 'translate(-50%, -50%) scale(0.5)' }
            ], {
                duration: 300,
                easing: 'ease-in',
                fill: 'forwards'
            });

            await fadeOut.finished;
            ballEl.classList.add('hidden');

        } finally {
            this._isAnimating = false;
        }
    }


    /**
     * Secuencia reducida para prefers-reduced-motion
     * @private
     */
    async _playReducedSequence(drawnNumber) {
        const { number, letter, color } = drawnNumber;

        const ballEl = $('#extracted-ball');
        const ballLetterEl = $('#extracted-ball-letter');
        const ballNumberEl = $('#extracted-ball-number');

        // Mostrar bola directamente
        ballLetterEl.textContent = letter;
        ballNumberEl.textContent = number;
        ballEl.style.background = `radial-gradient(ellipse at 30% 30%, 
            rgba(255,255,255,0.95), ${color}40 50%, ${color}90)`;

        ballEl.classList.remove('hidden');
        ballEl.style.transform = 'translate(-50%, -50%) scale(1)';
        ballEl.style.opacity = '1';

        this._sound.playPop();
        this._sound.playChime();

        await this._animateLastNumberPanel(number, letter);
        await delay(1500);

        ballEl.classList.add('hidden');
        this._isAnimating = false;
    }


    /* ==================== ANIMACIONES DE UI ==================== */

    /**
     * Anima la aparición del número en el panel principal
     * @private
     */
    async _animateLastNumberPanel(number, letter) {
        const lastNumberValue = $('#last-number-value');
        const lastNumberLetter = $('#last-number-letter');
        const lastNumberDisplay = $('.last-number-display');

        if (!lastNumberValue || !lastNumberLetter || !lastNumberDisplay) return;

        // Actualizar data-letter para colores CSS
        lastNumberDisplay.dataset.letter = letter;

        // Animar letra
        lastNumberLetter.textContent = letter;
        lastNumberLetter.animate([
            { opacity: 0, transform: 'translateY(-10px)' },
            { opacity: 1, transform: 'translateY(0)' }
        ], {
            duration: 200,
            easing: 'ease-out',
            fill: 'forwards'
        });

        // Animar número con efecto de revelación
        lastNumberValue.textContent = number;
        const revealAnim = lastNumberValue.animate([
            { opacity: 0, transform: 'scale(0.5)', filter: 'blur(10px)' },
            { opacity: 1, transform: 'scale(1.1)', filter: 'blur(0)', offset: 0.6 },
            { opacity: 1, transform: 'scale(1)', filter: 'blur(0)' }
        ], {
            duration: 400,
            easing: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            fill: 'forwards'
        });

        await revealAnim.finished;
    }


    /**
     * Anima una celda de la cuadrícula al ser marcada
     * @param {Element} cell - Celda del grid
     */
    animateGridCell(cell) {
        if (this._reducedMotion) return;

        cell.animate([
            { transform: 'scale(1)', backgroundColor: 'transparent' },
            { transform: 'scale(1.2)', offset: 0.5 },
            { transform: 'scale(1)' }
        ], {
            duration: 400,
            easing: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)'
        });
    }


    /**
     * Anima la entrada de un item del historial
     * @param {Element} item - Elemento del historial
     */
    animateHistoryItem(item) {
        if (this._reducedMotion) return;

        item.animate([
            { opacity: 0, transform: 'translateX(20px)' },
            { opacity: 1, transform: 'translateX(0)' }
        ], {
            duration: 300,
            easing: 'ease-out',
            fill: 'forwards'
        });
    }


    /**
     * Anima la actualización de un valor estadístico
     * @param {Element} element - Elemento del stat
     */
    animateStatUpdate(element) {
        if (this._reducedMotion) return;

        element.animate([
            { transform: 'scale(1)' },
            { transform: 'scale(1.15)', offset: 0.3 },
            { transform: 'scale(1)' }
        ], {
            duration: 300,
            easing: 'ease-out'
        });
    }


    /**
     * Anima la aparición de un modal
     * @param {Element} overlay - Overlay del modal
     */
    animateModalIn(overlay) {
        if (this._reducedMotion) return;

        overlay.animate([
            { opacity: 0 },
            { opacity: 1 }
        ], {
            duration: 200,
            easing: 'ease-out',
            fill: 'forwards'
        });

        const content = overlay.querySelector('.modal-content');
        if (content) {
            content.animate([
                { opacity: 0, transform: 'scale(0.95) translateY(10px)' },
                { opacity: 1, transform: 'scale(1) translateY(0)' }
            ], {
                duration: 300,
                easing: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                fill: 'forwards'
            });
        }
    }


    /**
     * Anima la aparición del game over overlay
     * @param {Element} overlay - Overlay de game over
     */
    async animateGameOver(overlay) {
        overlay.classList.remove('hidden');

        if (this._reducedMotion) return;

        // Fade in overlay
        overlay.animate([
            { opacity: 0 },
            { opacity: 1 }
        ], {
            duration: 500,
            easing: 'ease-out',
            fill: 'forwards'
        });

        // Scale in contenido
        const content = overlay.querySelector('.game-over-content');
        if (content) {
            content.animate([
                { opacity: 0, transform: 'scale(0.8)' },
                { opacity: 1, transform: 'scale(1)' }
            ], {
                duration: 600,
                delay: 200,
                easing: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                fill: 'forwards'
            });
        }

        // Confetti
        await delay(400);
        this._particles.confetti({ count: 100 });

        // Fanfare
        this._sound.playFanfare();
    }


    /**
     * Anima un toast de notificación
     * @param {Element} toast - Elemento toast
     */
    animateToast(toast) {
        if (this._reducedMotion) return;

        toast.animate([
            { opacity: 0, transform: 'translateX(100%)' },
            { opacity: 1, transform: 'translateX(0)' }
        ], {
            duration: 300,
            easing: 'ease-out',
            fill: 'forwards'
        });
    }


    /**
     * Anima la salida de un toast
     * @param {Element} toast - Elemento toast
     * @returns {Promise<void>}
     */
    async animateToastOut(toast) {
        const anim = toast.animate([
            { opacity: 1, transform: 'translateX(0)' },
            { opacity: 0, transform: 'translateX(100%)' }
        ], {
            duration: 250,
            easing: 'ease-in',
            fill: 'forwards'
        });

        await anim.finished;
    }
}
