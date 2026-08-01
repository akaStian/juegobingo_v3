/* ============================================================
   NUMBERS.JS — Motor de Generación de Números
   ============================================================
   Gestiona la generación y extracción de números del Bingo:
   - Genera array 1-75
   - Fisher-Yates shuffle con crypto.getRandomValues()
   - Extrae sin repetición
   - Resetea y remezcla
   - Mapeo B-I-N-G-O por número
   ============================================================ */

import { getLetterForNumber, getColorForLetter, supportsAPI } from './helpers.js';


/**
 * Clase NumberGenerator
 * Gestiona el pool de 75 números del Bingo,
 * su aleatorización y extracción secuencial.
 */
export class NumberGenerator {

    constructor() {
        /** @type {number[]} Pool de números pendientes de extraer */
        this._pool = [];

        /** @type {number[]} Números ya extraídos, en orden de extracción */
        this._drawn = [];

        /** @type {number|null} Último número extraído */
        this._lastDrawn = null;

        // Inicializar el pool
        this._initPool();
    }


    /* ==================== MÉTODOS PRIVADOS ==================== */

    /**
     * Inicializa el pool con números del 1 al 75 y los mezcla
     * @private
     */
    _initPool() {
        this._pool = [];
        for (let i = 1; i <= 75; i++) {
            this._pool.push(i);
        }
        this._shuffle();
    }


    /**
     * Fisher-Yates shuffle usando crypto.getRandomValues() para
     * aleatoriedad criptográficamente segura cuando está disponible
     * @private
     */
    _shuffle() {
        const arr = this._pool;
        const len = arr.length;

        if (len <= 1) return;

        if (supportsAPI('crypto')) {
            // Usar crypto.getRandomValues para aleatorización real
            const randomValues = new Uint32Array(len);
            crypto.getRandomValues(randomValues);

            for (let i = len - 1; i > 0; i--) {
                // Generar un índice aleatorio uniforme en [0, i]
                const j = randomValues[i] % (i + 1);
                [arr[i], arr[j]] = [arr[j], arr[i]];
            }
        } else {
            // Fallback con Math.random()
            for (let i = len - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [arr[i], arr[j]] = [arr[j], arr[i]];
            }
        }
    }


    /* ==================== MÉTODOS PÚBLICOS ==================== */

    /**
     * Extrae el siguiente número del pool
     * @returns {Object|null} { number, letter, color, order } o null si no quedan
     */
    draw() {
        if (this._pool.length === 0) {
            return null;
        }

        const number = this._pool.pop();
        this._drawn.push(number);
        this._lastDrawn = number;

        const letter = getLetterForNumber(number);
        const color = getColorForLetter(letter);
        const order = this._drawn.length;

        return { number, letter, color, order };
    }


    /**
     * Retorna el número de bolas restantes en el pool
     * @returns {number}
     */
    remaining() {
        return this._pool.length;
    }


    /**
     * Retorna la cantidad de números ya extraídos
     * @returns {number}
     */
    drawnCount() {
        return this._drawn.length;
    }


    /**
     * Retorna la lista de números ya extraídos
     * @returns {number[]}
     */
    drawnNumbers() {
        return [...this._drawn];
    }


    /**
     * Retorna el último número extraído
     * @returns {number|null}
     */
    lastDrawn() {
        return this._lastDrawn;
    }


    /**
     * Verifica si un número específico ya fue extraído
     * @param {number} number - Número a verificar
     * @returns {boolean}
     */
    isDrawn(number) {
        return this._drawn.includes(number);
    }


    /**
     * Verifica si se han extraído todos los números
     * @returns {boolean}
     */
    isComplete() {
        return this._pool.length === 0;
    }


    /**
     * Reinicia completamente: regenera el pool y limpia el historial
     */
    reset() {
        this._drawn = [];
        this._lastDrawn = null;
        this._initPool();
    }


    /**
     * Remezcla los números restantes en el pool
     * sin afectar los ya extraídos
     */
    reshuffle() {
        if (this._pool.length > 1) {
            this._shuffle();
        }
    }


    /**
     * Retorna las categorías BINGO con sus números (para la cuadrícula)
     * @returns {Object} { B: [1..15], I: [16..30], N: [31..45], G: [46..60], O: [61..75] }
     */
    static getCategories() {
        return {
            'B': Array.from({ length: 15 }, (_, i) => i + 1),
            'I': Array.from({ length: 15 }, (_, i) => i + 16),
            'N': Array.from({ length: 15 }, (_, i) => i + 31),
            'G': Array.from({ length: 15 }, (_, i) => i + 46),
            'O': Array.from({ length: 15 }, (_, i) => i + 61)
        };
    }


    /**
     * Retorna información completa del estado actual
     * (útil para debugging o estadísticas)
     * @returns {Object}
     */
    getState() {
        return {
            remaining: this.remaining(),
            drawnCount: this.drawnCount(),
            drawnNumbers: this.drawnNumbers(),
            lastDrawn: this.lastDrawn(),
            isComplete: this.isComplete(),
            poolSize: this._pool.length
        };
    }
}
