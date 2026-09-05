const API_URL = "http://localhost:3000/api";

export async function obtenerAdmin(id) {
    const respuesta = await fetch(`${API_URL}/admins/${id}`);

    if (!respuesta.ok) {
        throw new Error("No se pudo obtener el administrador");
    }

    return respuesta.json();
}

// Obtener todas las tareas
export async function obtenerTareas() {
    const respuesta = await fetch(`${API_URL}/tasks`);

    if (!respuesta.ok) {
        throw new Error("No se pudieron obtener las tareas");
    }

    return respuesta.json();
}

// Crear una nueva tarea
export async function crearTarea(tarea) {
    const respuesta = await fetch(`${API_URL}/tasks`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(tarea),
    });

    const datos = await respuesta.json();

    if (!respuesta.ok) {
        throw new Error(datos.error || "No se pudo crear la tarea");
    }

    return datos;
}