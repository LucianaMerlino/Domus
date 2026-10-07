// Títulos de tareas y plantillas: letras, números, espacios, comillas, puntos y comas
const TITULO_VALIDO = /^[\p{L}\p{N}\s'".,]+$/u;

const MENSAJE_TITULO_INVALIDO =
    "El título solo puede contener letras, números, comillas, puntos y comas";

module.exports = { TITULO_VALIDO, MENSAJE_TITULO_INVALIDO };
