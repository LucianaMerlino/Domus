const API_URL = "http://localhost:3000/api";

export async function obtenerAdmin(id) {
    const respuesta = await fetch(`${API_URL}/admins/${id}`);

    if (!respuesta.ok) {
        throw new Error("No se pudo obtener el administrador");
    }

    return respuesta.json();
}

// Obtener los miembros de un hogar
export async function obtenerMiembros(hogarId) {
    const respuesta = await fetch(`${API_URL}/hogares/${hogarId}/miembros`);

    if (!respuesta.ok) {
        throw new Error("No se pudieron obtener los miembros del hogar");
    }

    return respuesta.json();
}

// Obtener todas las tareas
export async function obtenerTareas({ estado, asignado, orden, hogar } = {}) {
    const parametros = new URLSearchParams();

    if (hogar) parametros.append("hogar", hogar);
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

// Crear una nueva tarea dentro de un hogar
export async function crearTarea(hogarId, tarea) {
    const respuesta = await fetch(`${API_URL}/hogares/${hogarId}/tareas`, {
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

// Actualizar una tarea existente
export async function actualizarTarea(id, tarea) {
    const respuesta = await fetch(`${API_URL}/tasks/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(tarea),
    });

    const datos = await respuesta.json();

    if (!respuesta.ok) {
        throw new Error(datos.error || "No se pudo actualizar la tarea");
    }

    return datos;
}
// ======================================================
// Obtener perfil de usuario
// ======================================================
export async function obtenerPerfil(id) {
    const respuesta = await fetch(
        `${API_URL}/usuarios/${id}/perfil`
    );

    const datos = await respuesta.json();

    if (!respuesta.ok) {
        throw new Error(
            datos.error || "No se pudo obtener el perfil"
        );
    }

    return datos;
}


// ======================================================
// Obtener tareas de un usuario
// ======================================================
export async function obtenerTareasUsuario(id, estado = "pendiente") {
    const respuesta = await fetch(
        `${API_URL}/usuarios/${id}/tareas?estado=${estado}`
    );

    const datos = await respuesta.json();

    if (!respuesta.ok) {
        throw new Error(
            datos.error || "No se pudieron obtener las tareas"
        );
    }

    return datos;
}


// ======================================================
// Marcar tarea como realizada
// ======================================================
export async function marcarTareaRealizada(id) {
    const respuesta = await fetch(
        `${API_URL}/tasks/${id}/realizada`,
        {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            }
        }
    );

    const datos = await respuesta.json();

    if (!respuesta.ok) {
        throw new Error(
            datos.error ||
            "No se pudo marcar la tarea como realizada"
        );
    }

    return datos;
}