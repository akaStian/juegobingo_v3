/* ============================================================
   SOUND.JS — Motor de Audio Procedural
   ============================================================
   Genera todos los sonidos con Web Audio API:
   - Sin archivos de audio externos
   - Osciladores + filtros + envelopes
   - Lazy-init del AudioContext
   - Toggle mute/unmute
   - Sonidos: drum, pop, chime, fanfare, click
   ============================================================ */


/**
 * Clase SoundManager
 * Motor de audio procedural usando Web Audio API.
 * Genera sonidos sintéticos para cada acción del juego.
 */
export class SoundManager {

    constructor() {
        /** @type {AudioContext|null} Contexto de audio (lazy init) */
        this._ctx = null;

        /** @type {boolean} Si el sonido está silenciado */
        this._muted = false;

        /** @type {number} Volumen global (0-1) */
        this._volume = 0.5;

        /** @type {boolean} Si el contexto fue inicializado */
        this._initialized = false;
    }


    /* ==================== INICIALIZACIÓN ==================== */

    /**
     * Inicializa el AudioContext (debe llamarse desde un evento de usuario)
     * @private
     */
    _ensureContext() {
        if (!this._initialized) {
            try {
                const AudioCtx = window.AudioContext || window.webkitAudioContext;
                if (AudioCtx) {
                    this._ctx = new AudioCtx();
                    this._initialized = true;
                }
            } catch (e) {
                console.warn('Web Audio API not supported:', e.message);
            }
        }

        // Resumir contexto si está suspendido (política de autoplay)
        if (this._ctx && this._ctx.state === 'suspended') {
            this._ctx.resume();
        }
    }


    /**
     * Crea un nodo de ganancia con el volumen global
     * @private
     * @returns {GainNode}
     */
    _createGain(volume = 1) {
        const gain = this._ctx.createGain();
        gain.gain.value = volume * this._volume;
        gain.connect(this._ctx.destination);
        return gain;
    }


    /* ==================== SONIDOS ==================== */

    /**
     * Sonido de giro de tómbola (tambor rodante)
     * Ruido filtrado con frecuencia baja
     */
    playDrum() {
        this._ensureContext();
        if (!this._ctx || this._muted) return;

        const now = this._ctx.currentTime;
        const duration = 0.8;

        // Crear ruido blanco
        const bufferSize = this._ctx.sampleRate * duration;
        const noiseBuffer = this._ctx.createBuffer(1, bufferSize, this._ctx.sampleRate);
        const data = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this._ctx.createBufferSource();
        noise.buffer = noiseBuffer;

        // Filtro pasa-bajos para sonido de tambor
        const filter = this._ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(300, now);
        filter.frequency.exponentialRampToValueAtTime(100, now + duration);
        filter.Q.value = 1;

        // Envelope
        const gain = this._ctx.createGain();
        gain.gain.setValueAtTime(0.3 * this._volume, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this._ctx.destination);

        noise.start(now);
        noise.stop(now + duration);
    }


    /**
     * Sonido de extracción (pop)
     * Oscilador con frecuencia descendente + click
     */
    playPop() {
        this._ensureContext();
        if (!this._ctx || this._muted) return;

        const now = this._ctx.currentTime;

        // Oscilador para el "pop"
        const osc = this._ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.15);

        const gain = this._ctx.createGain();
        gain.gain.setValueAtTime(0.4 * this._volume, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

        osc.connect(gain);
        gain.connect(this._ctx.destination);

        osc.start(now);
        osc.stop(now + 0.15);

        // Segundo oscilador de armónico
        const osc2 = this._ctx.createOscillator();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(900, now);
        osc2.frequency.exponentialRampToValueAtTime(200, now + 0.1);

        const gain2 = this._ctx.createGain();
        gain2.gain.setValueAtTime(0.15 * this._volume, now);
        gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

        osc2.connect(gain2);
        gain2.connect(this._ctx.destination);

        osc2.start(now);
        osc2.stop(now + 0.1);
    }


    /**
     * Sonido de número mostrado (chime)
     * Secuencia ascendente de tonos
     */
    playChime() {
        this._ensureContext();
        if (!this._ctx || this._muted) return;

        const now = this._ctx.currentTime;
        const notes = [523.25, 659.25, 783.99]; // C5, E5, G5

        notes.forEach((freq, i) => {
            const startTime = now + i * 0.08;

            const osc = this._ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.value = freq;

            const gain = this._ctx.createGain();
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(0.25 * this._volume, startTime + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);

            osc.connect(gain);
            gain.connect(this._ctx.destination);

            osc.start(startTime);
            osc.stop(startTime + 0.3);
        });
    }


    /**
     * Sonido de victoria / fin de juego (fanfare)
     * Secuencia de acordes ascendentes
     */
    playFanfare() {
        this._ensureContext();
        if (!this._ctx || this._muted) return;

        const now = this._ctx.currentTime;

        // Secuencia de notas para fanfare
        const sequence = [
            { freq: 392.00, time: 0,    dur: 0.2 },   // G4
            { freq: 440.00, time: 0.15, dur: 0.2 },   // A4
            { freq: 493.88, time: 0.3,  dur: 0.2 },   // B4
            { freq: 523.25, time: 0.45, dur: 0.15 },  // C5
            { freq: 587.33, time: 0.55, dur: 0.15 },  // D5
            { freq: 659.25, time: 0.65, dur: 0.15 },  // E5
            { freq: 783.99, time: 0.8,  dur: 0.5 },   // G5 (sostenido)
        ];

        sequence.forEach(note => {
            const startTime = now + note.time;

            // Fundamental
            const osc = this._ctx.createOscillator();
            osc.type = 'triangle';
            osc.frequency.value = note.freq;

            const gain = this._ctx.createGain();
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(0.2 * this._volume, startTime + 0.02);
            gain.gain.setValueAtTime(0.2 * this._volume, startTime + note.dur * 0.7);
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + note.dur);

            osc.connect(gain);
            gain.connect(this._ctx.destination);

            osc.start(startTime);
            osc.stop(startTime + note.dur);

            // Armónico (octava arriba, suave)
            const osc2 = this._ctx.createOscillator();
            osc2.type = 'sine';
            osc2.frequency.value = note.freq * 2;

            const gain2 = this._ctx.createGain();
            gain2.gain.setValueAtTime(0, startTime);
            gain2.gain.linearRampToValueAtTime(0.08 * this._volume, startTime + 0.02);
            gain2.gain.exponentialRampToValueAtTime(0.01, startTime + note.dur);

            osc2.connect(gain2);
            gain2.connect(this._ctx.destination);

            osc2.start(startTime);
            osc2.stop(startTime + note.dur);
        });
    }


    /**
     * Sonido de click (para botones)
     * Tick corto y limpio
     */
    playClick() {
        this._ensureContext();
        if (!this._ctx || this._muted) return;

        const now = this._ctx.currentTime;

        const osc = this._ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.03);

        const gain = this._ctx.createGain();
        gain.gain.setValueAtTime(0.15 * this._volume, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

        osc.connect(gain);
        gain.connect(this._ctx.destination);

        osc.start(now);
        osc.stop(now + 0.05);
    }


    /**
     * Sonido de error / acción no permitida
     * Buzz corto
     */
    playError() {
        this._ensureContext();
        if (!this._ctx || this._muted) return;

        const now = this._ctx.currentTime;

        const osc = this._ctx.createOscillator();
        osc.type = 'square';
        osc.frequency.setValueAtTime(200, now);

        const gain = this._ctx.createGain();
        gain.gain.setValueAtTime(0.12 * this._volume, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

        const filter = this._ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 400;

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this._ctx.destination);

        osc.start(now);
        osc.stop(now + 0.15);
    }


    /* ==================== CONTROL ==================== */

    /**
     * Silencia todos los sonidos
     */
    mute() {
        this._muted = true;
    }


    /**
     * Activa los sonidos
     */
    unmute() {
        this._muted = false;
    }


    /**
     * Toggle mute/unmute
     * @returns {boolean} Nuevo estado (true = muted)
     */
    toggleMute() {
        this._muted = !this._muted;
        return this._muted;
    }


    /**
     * Verifica si está silenciado
     * @returns {boolean}
     */
    isMuted() {
        return this._muted;
    }


    /**
     * Establece el volumen global
     * @param {number} volume - Volumen (0-1)
     */
    setVolume(volume) {
        this._volume = Math.max(0, Math.min(1, volume));
    }


    /**
     * Obtiene el volumen actual
     * @returns {number}
     */
    getVolume() {
        return this._volume;
    }
}
