const API_URL = "http://localhost:3000/api";

export async function obtenerAdmin(id) {
    const respuesta = await fetch(`${API_URL}/admins/${id}`);

    if (!respuesta.ok) {
        throw new Error("No se pudo obtener el administrador");
    }

    return respuesta.json();
}

// Obtener todas las tareas
export async function obtenerTareas({ estado, asignado, orden } = {}) {
    const parametros = new URLSearchParams();

    if (estado) parametros.append("estado", estado);
    if (asignado) parametros.append("asignado", asignado);
    if (orden) parametros.append("orden", orden);

    const query = parametros.toString();

    // Si no hay filtros queda IGUAL que antes como -> fetch(`${API_URL}/tasks`)
    const url = query ? `${API_URL}/tasks?${query}` : `${API_URL}/tasks`;

    const respuesta = await fetch(url);

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

//Eliminar una tarea
export async function eliminarTarea(id) {
  const respuesta = await fetch(`${API_URL}/tasks/${id}`, {
    method: "DELETE"
  });

  const datos = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(datos.error || "No se pudo eliminar la tarea");
  }

  return datos;
}