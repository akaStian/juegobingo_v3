/* ============================================================
   TOMBOLA.JS — Renderizado de la Tómbola en Canvas
   ============================================================
   Gestiona:
   - Esfera semitransparente con gradientes (efecto vidrio)
   - Bolas con colores BINGO que giran y rebotan
   - Física simplificada (gravedad, rebote, fricción)
   - Acelerar / desacelerar rotación
   - Efecto 3D con sombras y highlights
   ============================================================ */

import { getLetterForNumber, getColorForLetter, getColorRGBForLetter, randomInRange, lerp, clamp } from './helpers.js';


/**
 * Clase Ball
 * Representa una bola individual dentro de la tómbola
 */
class Ball {
    constructor(number) {
        this.number = number;
        this.letter = getLetterForNumber(number);
        this.color = getColorForLetter(this.letter);
        this.colorRGB = getColorRGBForLetter(this.letter);
        this.x = 0;
        this.y = 0;
        this.vx = 0;
        this.vy = 0;
        this.radius = 10;
        this.angle = randomInRange(0, Math.PI * 2);
        this.active = true; // false cuando fue extraída
    }
}


/**
 * Clase TombolaRenderer
 * Renderiza la tómbola animada en un canvas usando Canvas 2D.
 */
export class TombolaRenderer {

    /**
     * @param {HTMLCanvasElement} canvas - Canvas donde renderizar
     */
    constructor(canvas) {
        /** @type {HTMLCanvasElement} */
        this._canvas = canvas;

        /** @type {CanvasRenderingContext2D} */
        this._ctx = canvas.getContext('2d');

        /** @type {Ball[]} Bolas dentro de la tómbola */
        this._balls = [];

        /** @type {number} Velocidad de rotación global (rad/frame) */
        this._rotationSpeed = 0.005;

        /** @type {number} Velocidad objetivo (para interpolación suave) */
        this._targetSpeed = 0.005;

        /** @type {number} Ángulo de rotación acumulado */
        this._globalAngle = 0;

        /** @type {number} Radio de la esfera */
        this._sphereRadius = 0;

        /** @type {number} Centro X */
        this._centerX = 0;

        /** @type {number} Centro Y */
        this._centerY = 0;

        /** @type {number} Radio de cada bola */
        this._ballRadius = 10;

        /** @type {number|null} RAF ID */
        this._rafId = null;

        /** @type {boolean} Si el renderer está activo */
        this._running = false;

        /** @type {boolean} Si es el tema oscuro */
        this._isDarkTheme = true;

        // Inicializar
        this._resize();
        this._initBalls();

        // Escuchar resize
        this._resizeHandler = () => this._resize();
        window.addEventListener('resize', this._resizeHandler);
    }


    /* ==================== INICIALIZACIÓN ==================== */

    /**
     * Ajusta el canvas al tamaño del contenedor
     * @private
     */
    _resize() {
        const container = this._canvas.parentElement;
        if (!container) return;

        const rect = container.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;

        this._canvas.width = rect.width * dpr;
        this._canvas.height = rect.height * dpr;
        this._canvas.style.width = rect.width + 'px';
        this._canvas.style.height = rect.height + 'px';

        this._ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        // Calcular dimensiones
        this._centerX = rect.width / 2;
        this._centerY = rect.height / 2;
        this._sphereRadius = Math.min(rect.width, rect.height) * 0.4;
        this._ballRadius = clamp(this._sphereRadius * 0.08, 6, 16);

        // Reposicionar bolas dentro de la esfera
        this._repositionBalls();
    }


    /**
     * Inicializa las 75 bolas
     * @private
     */
    _initBalls() {
        this._balls = [];
        for (let i = 1; i <= 75; i++) {
            const ball = new Ball(i);
            ball.radius = this._ballRadius;

            // Posición aleatoria dentro de la esfera
            const angle = randomInRange(0, Math.PI * 2);
            const maxDist = this._sphereRadius - ball.radius - 5;
            const dist = randomInRange(0, maxDist > 0 ? maxDist : 10);

            ball.x = this._centerX + Math.cos(angle) * dist;
            ball.y = this._centerY + Math.sin(angle) * dist;

            // Velocidad inicial
            ball.vx = randomInRange(-1, 1);
            ball.vy = randomInRange(-1, 1);

            this._balls.push(ball);
        }
    }


    /**
     * Reposiciona las bolas dentro de los límites cuando el canvas cambia
     * @private
     */
    _repositionBalls() {
        for (const ball of this._balls) {
            if (!ball.active) continue;

            ball.radius = this._ballRadius;

            // Asegurar que está dentro de la esfera
            const dx = ball.x - this._centerX;
            const dy = ball.y - this._centerY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const maxDist = this._sphereRadius - ball.radius - 5;

            if (maxDist > 0 && dist > maxDist) {
                const angle = Math.atan2(dy, dx);
                ball.x = this._centerX + Math.cos(angle) * maxDist;
                ball.y = this._centerY + Math.sin(angle) * maxDist;
            }
        }
    }


    /* ==================== FÍSICA ==================== */

    /**
     * Actualiza la física de todas las bolas
     * @private
     */
    _updatePhysics() {
        const gravity = 0.15;
        const friction = 0.995;
        const bounce = 0.6;
        const maxR = this._sphereRadius - this._ballRadius - 3;

        // Interpolar velocidad de rotación
        this._rotationSpeed = lerp(this._rotationSpeed, this._targetSpeed, 0.05);
        this._globalAngle += this._rotationSpeed;

        // Fuerza centrípeta del giro
        const spinForceX = Math.cos(this._globalAngle) * this._rotationSpeed * 30;
        const spinForceY = Math.sin(this._globalAngle) * this._rotationSpeed * 30;

        for (const ball of this._balls) {
            if (!ball.active) continue;

            // Gravedad
            ball.vy += gravity;

            // Fuerza de rotación (simula el giro de la tómbola)
            ball.vx += spinForceX;
            ball.vy += spinForceY * 0.5;

            // Fricción
            ball.vx *= friction;
            ball.vy *= friction;

            // Limitar velocidad máxima
            const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
            const maxSpeed = 8;
            if (speed > maxSpeed) {
                ball.vx = (ball.vx / speed) * maxSpeed;
                ball.vy = (ball.vy / speed) * maxSpeed;
            }

            // Mover
            ball.x += ball.vx;
            ball.y += ball.vy;

            // Contener dentro de la esfera
            const dx = ball.x - this._centerX;
            const dy = ball.y - this._centerY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (maxR > 0 && dist > maxR) {
                // Rebotar contra la pared de la esfera
                const nx = dx / dist;
                const ny = dy / dist;

                // Posicionar en el borde
                ball.x = this._centerX + nx * maxR;
                ball.y = this._centerY + ny * maxR;

                // Reflejar velocidad
                const dot = ball.vx * nx + ball.vy * ny;
                ball.vx -= 2 * dot * nx;
                ball.vy -= 2 * dot * ny;

                // Pérdida de energía
                ball.vx *= bounce;
                ball.vy *= bounce;
            }

            // Colisiones simplificadas entre bolas (solo las más cercanas)
            this._ballCollisions(ball);

            // Actualizar ángulo visual
            ball.angle += ball.vx * 0.02;
        }
    }


    /**
     * Colisiones simplificadas entre bolas
     * @private
     */
    _ballCollisions(ballA) {
        const minDist = this._ballRadius * 2;

        for (const ballB of this._balls) {
            if (ballB === ballA || !ballB.active) continue;

            const dx = ballB.x - ballA.x;
            const dy = ballB.y - ballA.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < minDist && dist > 0) {
                // Separar
                const overlap = minDist - dist;
                const nx = dx / dist;
                const ny = dy / dist;

                ballA.x -= nx * overlap * 0.5;
                ballA.y -= ny * overlap * 0.5;
                ballB.x += nx * overlap * 0.5;
                ballB.y += ny * overlap * 0.5;

                // Intercambiar velocidades (parcial)
                const dvx = ballA.vx - ballB.vx;
                const dvy = ballA.vy - ballB.vy;
                const dot = dvx * nx + dvy * ny;

                if (dot > 0) {
                    ballA.vx -= dot * nx * 0.5;
                    ballA.vy -= dot * ny * 0.5;
                    ballB.vx += dot * nx * 0.5;
                    ballB.vy += dot * ny * 0.5;
                }
            }
        }
    }


    /* ==================== RENDERIZADO ==================== */

    /**
     * Renderiza un frame completo
     * @private
     */
    _render() {
        const ctx = this._ctx;
        const w = this._canvas.width / (window.devicePixelRatio || 1);
        const h = this._canvas.height / (window.devicePixelRatio || 1);

        // Limpiar
        ctx.clearRect(0, 0, w, h);

        // Dibujar esfera trasera (mitad de atrás)
        this._drawSphereBack(ctx);

        // Dibujar bolas
        this._drawBalls(ctx);

        // Dibujar esfera frontal (cristal, reflejo)
        this._drawSphereFront(ctx);
    }


    /**
     * Dibuja la parte trasera de la esfera
     * @private
     */
    _drawSphereBack(ctx) {
        const cx = this._centerX;
        const cy = this._centerY;
        const r = this._sphereRadius;

        // Sombra exterior
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy + 5, r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
        ctx.fill();
        ctx.restore();

        // Esfera trasera (oscura)
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);

        const bgGrad = ctx.createRadialGradient(cx, cy - r * 0.3, 0, cx, cy, r);
        if (this._isDarkTheme) {
            bgGrad.addColorStop(0, 'rgba(40, 45, 65, 0.6)');
            bgGrad.addColorStop(0.7, 'rgba(25, 28, 40, 0.7)');
            bgGrad.addColorStop(1, 'rgba(15, 17, 25, 0.8)');
        } else {
            bgGrad.addColorStop(0, 'rgba(200, 210, 230, 0.5)');
            bgGrad.addColorStop(0.7, 'rgba(170, 180, 200, 0.6)');
            bgGrad.addColorStop(1, 'rgba(140, 150, 170, 0.7)');
        }
        ctx.fillStyle = bgGrad;
        ctx.fill();
        ctx.restore();
    }


    /**
     * Dibuja todas las bolas activas
     * @private
     */
    _drawBalls(ctx) {
        for (const ball of this._balls) {
            if (!ball.active) continue;
            this._drawBall(ctx, ball);
        }
    }


    /**
     * Dibuja una bola individual
     * @private
     */
    _drawBall(ctx, ball) {
        const r = ball.radius;
        const [cr, cg, cb] = ball.colorRGB;

        ctx.save();
        ctx.translate(ball.x, ball.y);

        // Sombra de la bola
        ctx.beginPath();
        ctx.arc(1, 2, r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fill();

        // Cuerpo de la bola con gradiente
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);

        const grad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, 0, 0, 0, r);
        grad.addColorStop(0, `rgba(${cr + 80}, ${cg + 80}, ${cb + 80}, 1)`);
        grad.addColorStop(0.5, `rgba(${cr}, ${cg}, ${cb}, 1)`);
        grad.addColorStop(1, `rgba(${Math.max(0, cr - 40)}, ${Math.max(0, cg - 40)}, ${Math.max(0, cb - 40)}, 1)`);

        ctx.fillStyle = grad;
        ctx.fill();

        // Borde sutil
        ctx.strokeStyle = `rgba(${Math.max(0, cr - 30)}, ${Math.max(0, cg - 30)}, ${Math.max(0, cb - 30)}, 0.5)`;
        ctx.lineWidth = 0.5;
        ctx.stroke();

        // Reflejo superior (highlight)
        ctx.beginPath();
        ctx.ellipse(-r * 0.2, -r * 0.3, r * 0.45, r * 0.25, -0.3, 0, Math.PI * 2);
        const highlightGrad = ctx.createRadialGradient(-r * 0.2, -r * 0.3, 0, -r * 0.2, -r * 0.3, r * 0.4);
        highlightGrad.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
        highlightGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = highlightGrad;
        ctx.fill();

        // Número en la bola (solo si el radio es suficiente)
        if (r >= 8) {
            // Círculo blanco central para el número
            const numCircleR = r * 0.55;
            ctx.beginPath();
            ctx.arc(0, 0, numCircleR, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.fill();

            // Número
            ctx.fillStyle = `rgb(${Math.max(0, cr - 30)}, ${Math.max(0, cg - 30)}, ${Math.max(0, cb - 30)})`;
            ctx.font = `bold ${Math.round(r * 0.65)}px 'Outfit', sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(ball.number, 0, 0.5);
        }

        ctx.restore();
    }


    /**
     * Dibuja la parte frontal de la esfera (cristal, reflejo)
     * @private
     */
    _drawSphereFront(ctx) {
        const cx = this._centerX;
        const cy = this._centerY;
        const r = this._sphereRadius;

        // Borde de la esfera
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = this._isDarkTheme
            ? 'rgba(255, 255, 255, 0.15)'
            : 'rgba(0, 0, 0, 0.1)';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();

        // Reflejo principal (arco superior)
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.clip();

        // Gradiente de reflejo
        const reflectGrad = ctx.createLinearGradient(cx - r, cy - r, cx + r * 0.3, cy + r * 0.3);
        reflectGrad.addColorStop(0, 'rgba(255, 255, 255, 0.12)');
        reflectGrad.addColorStop(0.3, 'rgba(255, 255, 255, 0.05)');
        reflectGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0)');
        reflectGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = reflectGrad;
        ctx.fillRect(cx - r, cy - r, r * 2, r * 2);

        // Arco de brillo
        ctx.beginPath();
        ctx.ellipse(cx - r * 0.15, cy - r * 0.5, r * 0.6, r * 0.2, -0.4, 0, Math.PI * 2);
        const arcGrad = ctx.createRadialGradient(
            cx - r * 0.15, cy - r * 0.5, 0,
            cx - r * 0.15, cy - r * 0.5, r * 0.5
        );
        arcGrad.addColorStop(0, 'rgba(255, 255, 255, 0.25)');
        arcGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = arcGrad;
        ctx.fill();

        ctx.restore();

        // Abertura de la tómbola (donde salen las bolas) - arco inferior
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(cx, cy + r * 0.85, r * 0.2, r * 0.08, 0, 0, Math.PI * 2);
        ctx.fillStyle = this._isDarkTheme
            ? 'rgba(0, 0, 0, 0.4)'
            : 'rgba(0, 0, 0, 0.2)';
        ctx.fill();
        ctx.strokeStyle = this._isDarkTheme
            ? 'rgba(255, 255, 255, 0.1)'
            : 'rgba(0, 0, 0, 0.15)';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
    }


    /* ==================== LOOP PRINCIPAL ==================== */

    /**
     * Loop de actualización y renderizado
     * @private
     */
    _loop() {
        this._updatePhysics();
        this._render();

        if (this._running) {
            this._rafId = requestAnimationFrame(() => this._loop());
        }
    }


    /* ==================== CONTROL PÚBLICO ==================== */

    /**
     * Inicia el renderizado
     */
    start() {
        if (!this._running) {
            this._running = true;
            this._rafId = requestAnimationFrame(() => this._loop());
        }
    }


    /**
     * Detiene el renderizado
     */
    stop() {
        this._running = false;
        if (this._rafId !== null) {
            cancelAnimationFrame(this._rafId);
            this._rafId = null;
        }
    }


    /**
     * Acelera la rotación (para la secuencia de extracción)
     */
    accelerate() {
        this._targetSpeed = 0.08;
    }


    /**
     * Desacelera la rotación a velocidad normal
     */
    decelerate() {
        this._targetSpeed = 0.005;
    }


    /**
     * Marca una bola como extraída (la oculta)
     * @param {number} number - Número de la bola a eliminar
     */
    removeBall(number) {
        const ball = this._balls.find(b => b.number === number);
        if (ball) {
            ball.active = false;
        }
    }


    /**
     * Reinicia todas las bolas (nuevo juego)
     */
    reset() {
        this._initBalls();
        this._targetSpeed = 0.005;
        this._rotationSpeed = 0.005;
    }


    /**
     * Actualiza el tema (para colores de la esfera)
     * @param {boolean} isDark - true para tema oscuro
     */
    setTheme(isDark) {
        this._isDarkTheme = isDark;
    }


    /**
     * Destruye el renderer
     */
    destroy() {
        this.stop();
        window.removeEventListener('resize', this._resizeHandler);
    }
}
