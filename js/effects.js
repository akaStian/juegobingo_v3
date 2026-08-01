/* ============================================================
   EFFECTS.JS — Sistema de Partículas y Efectos Visuales
   ============================================================
   Gestiona:
   - Sistema de partículas en canvas overlay
   - Explosiones de partículas (burst)
   - Confetti / celebración
   - Sparkle / brillos
   - Pool de objetos para rendimiento
   ============================================================ */

import { randomInRange, randomIntInRange, getColorForLetter } from './helpers.js';


/**
 * Clase Particle
 * Representa una partícula individual en el sistema
 */
class Particle {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.vx = 0;
        this.vy = 0;
        this.size = 0;
        this.life = 0;
        this.maxLife = 0;
        this.color = '#ffffff';
        this.alpha = 1;
        this.rotation = 0;
        this.rotationSpeed = 0;
        this.gravity = 0;
        this.friction = 1;
        this.shape = 'circle'; // 'circle', 'square', 'star'
        this.active = false;
    }

    /**
     * Resetea la partícula con nuevos valores
     */
    init(options) {
        this.x = options.x || 0;
        this.y = options.y || 0;
        this.vx = options.vx || 0;
        this.vy = options.vy || 0;
        this.size = options.size || 4;
        this.life = 0;
        this.maxLife = options.maxLife || 60;
        this.color = options.color || '#ffffff';
        this.alpha = 1;
        this.rotation = options.rotation || 0;
        this.rotationSpeed = options.rotationSpeed || 0;
        this.gravity = options.gravity || 0;
        this.friction = options.friction || 0.98;
        this.shape = options.shape || 'circle';
        this.active = true;
    }

    /**
     * Actualiza la posición y estado de la partícula
     * @returns {boolean} false si la partícula debe desactivarse
     */
    update() {
        if (!this.active) return false;

        this.life++;
        if (this.life >= this.maxLife) {
            this.active = false;
            return false;
        }

        // Física
        this.vy += this.gravity;
        this.vx *= this.friction;
        this.vy *= this.friction;
        this.x += this.vx;
        this.y += this.vy;
        this.rotation += this.rotationSpeed;

        // Fade out en el último 40% de vida
        const lifeRatio = this.life / this.maxLife;
        this.alpha = lifeRatio > 0.6 ? 1 - ((lifeRatio - 0.6) / 0.4) : 1;

        return true;
    }

    /**
     * Dibuja la partícula en el canvas
     * @param {CanvasRenderingContext2D} ctx
     */
    draw(ctx) {
        if (!this.active || this.alpha <= 0) return;

        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.fillStyle = this.color;

        switch (this.shape) {
            case 'circle':
                ctx.beginPath();
                ctx.arc(0, 0, this.size, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 'square':
                ctx.fillRect(-this.size, -this.size, this.size * 2, this.size * 2);
                break;

            case 'star':
                this._drawStar(ctx, this.size);
                break;

            default:
                ctx.beginPath();
                ctx.arc(0, 0, this.size, 0, Math.PI * 2);
                ctx.fill();
        }

        ctx.restore();
    }

    /**
     * Dibuja una estrella de 5 puntas
     * @private
     */
    _drawStar(ctx, radius) {
        const spikes = 5;
        const outerRadius = radius;
        const innerRadius = radius * 0.4;

        ctx.beginPath();
        for (let i = 0; i < spikes * 2; i++) {
            const r = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (i * Math.PI) / spikes - Math.PI / 2;
            const x = Math.cos(angle) * r;
            const y = Math.sin(angle) * r;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
    }
}


/**
 * Clase ParticleSystem
 * Gestiona el pool de partículas y el renderizado en canvas
 */
export class ParticleSystem {

    /**
     * @param {HTMLCanvasElement} canvas - Canvas overlay para partículas
     */
    constructor(canvas) {
        /** @type {HTMLCanvasElement} */
        this._canvas = canvas;

        /** @type {CanvasRenderingContext2D} */
        this._ctx = canvas.getContext('2d');

        /** @type {Particle[]} Pool de partículas reutilizables */
        this._pool = [];

        /** @type {number} Tamaño máximo del pool */
        this._maxPoolSize = 500;

        /** @type {boolean} Si el loop de render está activo */
        this._running = false;

        /** @type {number|null} RAF ID */
        this._rafId = null;

        // Pre-crear el pool
        this._initPool();

        // Ajustar tamaño del canvas
        this._resize();

        // Escuchar resize
        window.addEventListener('resize', () => this._resize());
    }


    /* ==================== MÉTODOS PRIVADOS ==================== */

    /**
     * Inicializa el pool de partículas
     * @private
     */
    _initPool() {
        for (let i = 0; i < this._maxPoolSize; i++) {
            this._pool.push(new Particle());
        }
    }


    /**
     * Obtiene una partícula inactiva del pool
     * @private
     * @returns {Particle|null}
     */
    _getParticle() {
        for (const p of this._pool) {
            if (!p.active) return p;
        }
        return null; // Pool agotado
    }


    /**
     * Ajusta el canvas al tamaño de la ventana
     * @private
     */
    _resize() {
        const dpr = window.devicePixelRatio || 1;
        this._canvas.width = window.innerWidth * dpr;
        this._canvas.height = window.innerHeight * dpr;
        this._canvas.style.width = window.innerWidth + 'px';
        this._canvas.style.height = window.innerHeight + 'px';
        this._ctx.scale(dpr, dpr);
    }


    /**
     * Loop de renderizado
     * @private
     */
    _renderLoop() {
        // Limpiar canvas
        this._ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);

        // Actualizar y dibujar partículas
        let hasActive = false;
        for (const particle of this._pool) {
            if (particle.active) {
                particle.update();
                particle.draw(this._ctx);
                if (particle.active) hasActive = true;
            }
        }

        // Detener el loop si no hay partículas activas
        if (hasActive) {
            this._rafId = requestAnimationFrame(() => this._renderLoop());
        } else {
            this._running = false;
            this._rafId = null;
            // Limpiar canvas final
            this._ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
        }
    }


    /**
     * Inicia el loop de render si no está corriendo
     * @private
     */
    _ensureRunning() {
        if (!this._running) {
            this._running = true;
            this._rafId = requestAnimationFrame(() => this._renderLoop());
        }
    }


    /* ==================== EFECTOS PÚBLICOS ==================== */

    /**
     * Explosión de partículas desde un punto
     * @param {number} x - Coordenada X (en pixels de la ventana)
     * @param {number} y - Coordenada Y
     * @param {Object} [options] - Opciones
     * @param {number} [options.count=30] - Cantidad de partículas
     * @param {string[]} [options.colors] - Colores de las partículas
     * @param {number} [options.speed=5] - Velocidad máxima
     * @param {number} [options.size=4] - Tamaño de partículas
     * @param {number} [options.life=50] - Duración de vida (frames)
     * @param {number} [options.gravity=0.1] - Gravedad
     * @param {string} [options.shape='circle'] - Forma
     */
    burst(x, y, options = {}) {
        const {
            count = 30,
            colors = ['#6366f1', '#22d3ee', '#f59e0b', '#10b981', '#ef4444', '#a855f7'],
            speed = 5,
            size = 4,
            life = 50,
            gravity = 0.1,
            shape = 'circle'
        } = options;

        for (let i = 0; i < count; i++) {
            const particle = this._getParticle();
            if (!particle) break;

            const angle = randomInRange(0, Math.PI * 2);
            const velocity = randomInRange(1, speed);

            particle.init({
                x,
                y,
                vx: Math.cos(angle) * velocity,
                vy: Math.sin(angle) * velocity,
                size: randomInRange(size * 0.5, size * 1.5),
                maxLife: randomIntInRange(life * 0.5, life),
                color: colors[randomIntInRange(0, colors.length - 1)],
                rotation: randomInRange(0, Math.PI * 2),
                rotationSpeed: randomInRange(-0.1, 0.1),
                gravity,
                friction: 0.97,
                shape
            });
        }

        this._ensureRunning();
    }


    /**
     * Efecto confetti (partículas cayendo desde arriba)
     * @param {Object} [options] - Opciones
     */
    confetti(options = {}) {
        const {
            count = 80,
            colors = ['#6366f1', '#22d3ee', '#f59e0b', '#10b981', '#ef4444', '#a855f7', '#f97316', '#3b82f6'],
            duration = 2000
        } = options;

        const width = window.innerWidth;
        const batchSize = Math.ceil(count / 4);

        // Lanzar confetti en oleadas
        for (let batch = 0; batch < 4; batch++) {
            setTimeout(() => {
                for (let i = 0; i < batchSize; i++) {
                    const particle = this._getParticle();
                    if (!particle) break;

                    const shapes = ['circle', 'square', 'star'];

                    particle.init({
                        x: randomInRange(0, width),
                        y: randomInRange(-50, -10),
                        vx: randomInRange(-2, 2),
                        vy: randomInRange(2, 6),
                        size: randomInRange(3, 8),
                        maxLife: randomIntInRange(80, 150),
                        color: colors[randomIntInRange(0, colors.length - 1)],
                        rotation: randomInRange(0, Math.PI * 2),
                        rotationSpeed: randomInRange(-0.15, 0.15),
                        gravity: 0.05,
                        friction: 0.99,
                        shape: shapes[randomIntInRange(0, shapes.length - 1)]
                    });
                }

                this._ensureRunning();
            }, batch * (duration / 4));
        }
    }


    /**
     * Efecto sparkle / brillos alrededor de un elemento
     * @param {Element} element - Elemento DOM para obtener posición
     * @param {Object} [options] - Opciones
     */
    sparkle(element, options = {}) {
        const rect = element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const radius = Math.max(rect.width, rect.height) / 2;

        const {
            count = 15,
            colors = ['#f59e0b', '#fbbf24', '#fde68a', '#ffffff'],
            life = 40
        } = options;

        for (let i = 0; i < count; i++) {
            const particle = this._getParticle();
            if (!particle) break;

            const angle = randomInRange(0, Math.PI * 2);
            const dist = randomInRange(radius * 0.8, radius * 1.5);

            particle.init({
                x: centerX + Math.cos(angle) * dist,
                y: centerY + Math.sin(angle) * dist,
                vx: Math.cos(angle) * randomInRange(0.2, 1),
                vy: Math.sin(angle) * randomInRange(0.2, 1),
                size: randomInRange(2, 5),
                maxLife: randomIntInRange(life * 0.5, life),
                color: colors[randomIntInRange(0, colors.length - 1)],
                rotation: 0,
                rotationSpeed: randomInRange(-0.2, 0.2),
                gravity: -0.02,
                friction: 0.96,
                shape: 'star'
            });
        }

        this._ensureRunning();
    }


    /**
     * Efecto de explosión para la bola extraída
     * @param {number} x - Centro X
     * @param {number} y - Centro Y
     * @param {string} letter - Letra BINGO para obtener color
     */
    ballBurst(x, y, letter) {
        const baseColor = getColorForLetter(letter);
        const colors = [baseColor, '#ffffff', '#fbbf24', baseColor];

        this.burst(x, y, {
            count: 40,
            colors,
            speed: 7,
            size: 5,
            life: 60,
            gravity: 0.08,
            shape: 'circle'
        });

        // Segunda ola de sparkles
        setTimeout(() => {
            this.burst(x, y, {
                count: 20,
                colors: ['#ffffff', '#fde68a', baseColor],
                speed: 4,
                size: 3,
                life: 40,
                gravity: -0.02,
                shape: 'star'
            });
        }, 200);
    }


    /**
     * Limpia todas las partículas activas
     */
    clear() {
        for (const particle of this._pool) {
            particle.active = false;
        }
        if (this._ctx) {
            this._ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
        }
        this._running = false;
        if (this._rafId !== null) {
            cancelAnimationFrame(this._rafId);
            this._rafId = null;
        }
    }


    /**
     * Destruye el sistema de partículas
     */
    destroy() {
        this.clear();
        window.removeEventListener('resize', this._resize);
    }
}
