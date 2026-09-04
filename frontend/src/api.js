const API_URL = "http://localhost:3000/api";

export async function obtenerAdmin(id) {
    const respuesta = await fetch(`${API_URL}/admins/${id}`);

    if (!respuesta.ok) {
        throw new Error("No se pudo obtener el administrador");
    }

    return respuesta.json();
}