/* ============================================================
   HELPERS.JS — Utilidades Puras
   ============================================================
   Funciones utilitarias sin side effects:
   - Selectores DOM
   - Formateo de tiempo y números
   - Matemáticas (clamp, lerp, random)
   - Debounce / Throttle
   - Mapeo B-I-N-G-O
   - Colores por letra
   ============================================================ */


/**
 * Selector de un único elemento del DOM (shorthand para querySelector)
 * @param {string} selector - Selector CSS
 * @param {Element} [parent=document] - Elemento padre donde buscar
 * @returns {Element|null}
 */
export function $(selector, parent = document) {
    return parent.querySelector(selector);
}


/**
 * Selector de múltiples elementos del DOM (shorthand para querySelectorAll)
 * @param {string} selector - Selector CSS
 * @param {Element} [parent=document] - Elemento padre donde buscar
 * @returns {NodeList}
 */
export function $$(selector, parent = document) {
    return parent.querySelectorAll(selector);
}


/**
 * Crea un elemento DOM con atributos y contenido
 * @param {string} tag - Nombre del tag HTML
 * @param {Object} [attrs={}] - Atributos a aplicar
 * @param {string|Element|Array} [children] - Contenido hijo
 * @returns {Element}
 */
export function createElement(tag, attrs = {}, children = null) {
    const el = document.createElement(tag);

    for (const [key, value] of Object.entries(attrs)) {
        if (key === 'className') {
            el.className = value;
        } else if (key === 'dataset') {
            for (const [dataKey, dataValue] of Object.entries(value)) {
                el.dataset[dataKey] = dataValue;
            }
        } else if (key.startsWith('on') && typeof value === 'function') {
            el.addEventListener(key.slice(2).toLowerCase(), value);
        } else {
            el.setAttribute(key, value);
        }
    }

    if (children !== null) {
        if (typeof children === 'string') {
            el.textContent = children;
        } else if (children instanceof Element) {
            el.appendChild(children);
        } else if (Array.isArray(children)) {
            children.forEach(child => {
                if (typeof child === 'string') {
                    el.appendChild(document.createTextNode(child));
                } else if (child instanceof Element) {
                    el.appendChild(child);
                }
            });
        }
    }

    return el;
}


/**
 * Formatea milisegundos como MM:SS
 * @param {number} ms - Milisegundos
 * @returns {string} Formato "MM:SS"
 */
export function formatTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}


/**
 * Formatea milisegundos como HH:MM:SS
 * @param {number} ms - Milisegundos
 * @returns {string} Formato "HH:MM:SS"
 */
export function formatTimeLong(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}


/**
 * Obtiene la hora actual formateada como HH:MM:SS
 * @returns {string}
 */
export function getCurrentTimeFormatted() {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
}


/**
 * Restringe un valor entre un mínimo y un máximo
 * @param {number} value - Valor a restringir
 * @param {number} min - Valor mínimo
 * @param {number} max - Valor máximo
 * @returns {number}
 */
export function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}


/**
 * Interpolación lineal entre dos valores
 * @param {number} start - Valor inicial
 * @param {number} end - Valor final
 * @param {number} t - Factor de interpolación (0–1)
 * @returns {number}
 */
export function lerp(start, end, t) {
    return start + (end - start) * t;
}


/**
 * Genera un número aleatorio en un rango (inclusive)
 * @param {number} min - Mínimo
 * @param {number} max - Máximo
 * @returns {number}
 */
export function randomInRange(min, max) {
    return Math.random() * (max - min) + min;
}


/**
 * Genera un entero aleatorio en un rango (inclusive)
 * @param {number} min - Mínimo
 * @param {number} max - Máximo
 * @returns {number}
 */
export function randomIntInRange(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}


/**
 * Debounce: retrasa la ejecución de una función hasta que
 * deje de ser invocada por un período de tiempo
 * @param {Function} fn - Función a debounce
 * @param {number} delay - Milisegundos de espera
 * @returns {Function}
 */
export function debounce(fn, delay) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn.apply(this, args), delay);
    };
}


/**
 * Throttle: limita la frecuencia de ejecución de una función
 * @param {Function} fn - Función a throttle
 * @param {number} limit - Milisegundos entre ejecuciones
 * @returns {Function}
 */
export function throttle(fn, limit) {
    let inThrottle = false;
    return function (...args) {
        if (!inThrottle) {
            fn.apply(this, args);
            inThrottle = true;
            setTimeout(() => { inThrottle = false; }, limit);
        }
    };
}


/**
 * Retorna la letra BINGO correspondiente a un número
 * B: 1-15, I: 16-30, N: 31-45, G: 46-60, O: 61-75
 * @param {number} number - Número (1–75)
 * @returns {string} Letra ("B", "I", "N", "G" u "O")
 */
export function getLetterForNumber(number) {
    if (number >= 1 && number <= 15) return 'B';
    if (number >= 16 && number <= 30) return 'I';
    if (number >= 31 && number <= 45) return 'N';
    if (number >= 46 && number <= 60) return 'G';
    if (number >= 61 && number <= 75) return 'O';
    return '?';
}


/**
 * Retorna la información completa de un número BINGO
 * @param {number} number - Número (1–75)
 * @returns {Object} { number, letter, columnIndex }
 */
export function getNumberInfo(number) {
    const letter = getLetterForNumber(number);
    const columns = { 'B': 0, 'I': 1, 'N': 2, 'G': 3, 'O': 4 };
    return {
        number,
        letter,
        columnIndex: columns[letter] ?? -1
    };
}


/**
 * Retorna el color CSS asociado a una letra BINGO
 * (usa las custom properties definidas en variables.css)
 * @param {string} letter - Letra ("B", "I", "N", "G" u "O")
 * @returns {string} Nombre de la variable CSS
 */
export function getColorVarForLetter(letter) {
    const map = {
        'B': '--color-bingo-B',
        'I': '--color-bingo-I',
        'N': '--color-bingo-N',
        'G': '--color-bingo-G',
        'O': '--color-bingo-O'
    };
    return map[letter] || '--color-text-primary';
}


/**
 * Retorna el color hex para una letra BINGO (para Canvas)
 * @param {string} letter - Letra ("B", "I", "N", "G" u "O")
 * @returns {string} Color hex
 */
export function getColorForLetter(letter) {
    const map = {
        'B': '#3b82f6',
        'I': '#ef4444',
        'N': '#a855f7',
        'G': '#22c55e',
        'O': '#f97316'
    };
    return map[letter] || '#94a3b8';
}


/**
 * Retorna el color RGB como array para una letra BINGO (para Canvas)
 * @param {string} letter - Letra ("B", "I", "N", "G" u "O")
 * @returns {number[]} [r, g, b]
 */
export function getColorRGBForLetter(letter) {
    const map = {
        'B': [59, 130, 246],
        'I': [239, 68, 68],
        'N': [168, 85, 247],
        'G': [34, 197, 94],
        'O': [249, 115, 22]
    };
    return map[letter] || [148, 163, 184];
}


/**
 * Convierte grados a radianes
 * @param {number} degrees - Grados
 * @returns {number} Radianes
 */
export function degreesToRadians(degrees) {
    return degrees * (Math.PI / 180);
}


/**
 * Crea una promesa que se resuelve después de un delay
 * @param {number} ms - Milisegundos
 * @returns {Promise<void>}
 */
export function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


/**
 * Genera un ID único simple
 * @returns {string}
 */
export function uniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}


/**
 * Verifica si el navegador soporta una API
 * @param {string} api - Nombre de la API (e.g., 'AudioContext', 'fullscreenEnabled')
 * @returns {boolean}
 */
export function supportsAPI(api) {
    try {
        if (api === 'AudioContext') {
            return !!(window.AudioContext || window.webkitAudioContext);
        }
        if (api === 'fullscreen') {
            return !!(document.fullscreenEnabled || document.webkitFullscreenEnabled || document.mozFullScreenEnabled || document.msFullscreenEnabled);
        }
        if (api === 'crypto') {
            return !!(window.crypto && window.crypto.getRandomValues);
        }
        return api in window;
    } catch (e) {
        return false;
    }
}
