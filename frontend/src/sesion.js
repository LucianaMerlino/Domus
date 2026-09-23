// La sesión se guarda en el navegador para no pedir login en cada pantalla
const CLAVE_SESION = "domus-sesion";

export function guardarSesion(usuario) {
    localStorage.setItem(CLAVE_SESION, JSON.stringify(usuario));
}

export function obtenerSesion() {
    try {
        return JSON.parse(localStorage.getItem(CLAVE_SESION));
    } catch {
        return null;
    }
}

export function cerrarSesion() {
    localStorage.removeItem(CLAVE_SESION);
}
