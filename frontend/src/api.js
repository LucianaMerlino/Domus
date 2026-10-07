const API_URL = "http://localhost:3000/api";

// Obtener los miembros de un hogar
export async function obtenerMiembros(hogarId) {
    const respuesta = await fetch(`${API_URL}/hogares/${hogarId}/miembros`);

    if (!respuesta.ok) {
        throw new Error("No se pudieron obtener los miembros del hogar");
    }

    return respuesta.json();
}

export async function obtenerRanking(hogarId) {
    const respuesta = await fetch(`${API_URL}/hogares/${hogarId}/ranking`);
    const datos = await respuesta.json();

    if (!respuesta.ok) {
        throw new Error(datos.error || "No se pudo obtener el ranking del hogar");
    }

    return datos;
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

// Crear una tarea o instancia a partir de una plantilla
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
export async function eliminarTarea(id, usuarioId) {
  const respuesta = await fetch(`${API_URL}/tasks/${id}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ usuarioId })
  });

  const datos = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(datos.error || "No se pudo eliminar la tarea");
  }

  return datos;
}

// Actualizar una tarea existente
export async function actualizarTarea(id, tarea, usuarioId) {
    const respuesta = await fetch(`${API_URL}/tasks/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            ...tarea,
            usuarioId
        }),
    });

    const datos = await respuesta.json();

    if (!respuesta.ok) {
        throw new Error(
            datos.error || "No se pudo actualizar la tarea"
        );
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
// Información general del Home
// ======================================================
export async function obtenerHome(id) {
    const respuesta = await fetch(
        `${API_URL}/usuarios/${id}/home`
    );

    const datos = await respuesta.json();

    if (!respuesta.ok) {
        throw new Error(
            datos.error || "No se pudo obtener la información del hogar"
        );
    }

    return datos;
}


// ======================================================
// Actualizar nombre del hogar
// ======================================================
export async function actualizarNombreHogar(hogarId, usuarioId, nombre) {
    const respuesta = await fetch(
        `${API_URL}/hogares/${hogarId}/nombre`,
        {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                usuarioId,
                nombre
            })
        }
    );

    const datos = await respuesta.json();

    if (!respuesta.ok) {
        throw new Error(
            datos.error || "No se pudo actualizar el nombre del hogar"
        );
    }

    return datos;
}


// ======================================================
// Actualizar ícono del hogar
// ======================================================
export async function actualizarIconoHogar(hogarId, usuarioId, icono) {
    const respuesta = await fetch(
        `${API_URL}/hogares/${hogarId}/icono`,
        {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                usuarioId,
                icono
            })
        }
    );

    const datos = await respuesta.json();

    if (!respuesta.ok) {
        throw new Error(
            datos.error || "No se pudo actualizar el ícono del hogar"
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
export async function marcarTareaRealizada(id, usuarioId) {
    const respuesta = await fetch(
        `${API_URL}/tasks/${id}/realizada`,
        {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ usuarioId })
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
// ======================================================
// Agregar un miembro a un hogar
// ======================================================
export async function agregarMiembro(hogarId, email, adminId) {
    const respuesta = await fetch(
        `${API_URL}/hogares/${hogarId}/miembros`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email,
                adminId
            })
        }
    );

    const datos = await respuesta.json();

    if (!respuesta.ok) {
        throw new Error(
            datos.error ||
            "No se pudo agregar el miembro"
        );
    }

    return datos;
} 

export async function crearHogar(usuarioId, nombre) {
    const respuesta = await fetch(`${API_URL}/hogares`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ usuarioId, nombre })
    });

    const datos = await respuesta.json();

    if (!respuesta.ok) {
        throw new Error(datos.error || "No se pudo crear el hogar");
    }

    return datos;
}

export async function actualizarRolMiembro(hogarId, usuarioId, adminId, rol) {
    const respuesta = await fetch(
        `${API_URL}/hogares/${hogarId}/miembros/${usuarioId}/rol`,
        {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ adminId, rol })
        }
    );

    const datos = await respuesta.json();

    if (!respuesta.ok) {
        throw new Error(datos.error || "No se pudo actualizar el rol del miembro");
    }

    return datos;
}

// Eliminar un miembro del hogar
export async function eliminarMiembro(hogarId, usuarioId, adminId) {
    const respuesta = await fetch(
        `${API_URL}/hogares/${hogarId}/miembros/${usuarioId}`,
        {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ adminId })
        }
    );

    const datos = await respuesta.json();

    if (!respuesta.ok) {
        throw new Error(
            datos.error || "No se pudo eliminar el miembro"
        );
    }

    return datos;
}
// ======================================================
// Iniciar sesión
// ======================================================
export async function login(email, contrasena) {
    const respuesta = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, contrasena })
    });

    const datos = await respuesta.json();

    if (!respuesta.ok) {
        throw new Error(datos.error || "No se pudo iniciar sesión");
    }

    return datos;
}

// ======================================================
// Registrar usuario: devuelve los datos de la sesión
// ======================================================
export async function registrarUsuario(usuario, email, contrasena) {
    const respuesta = await fetch(`${API_URL}/auth/registro`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ usuario, email, contrasena })
    });

    const datos = await respuesta.json();

    if (!respuesta.ok) {
        throw new Error(datos.error || "No se pudo registrar el usuario");
    }

    return datos;
}

// ======================================================
// Pool de tareas (plantillas) de un hogar
// ======================================================
async function pedirPlantillas(url, opciones, mensajeError) {
    const respuesta = await fetch(url, {
        headers: {
            "Content-Type": "application/json"
        },
        ...opciones
    });

    const datos = await respuesta.json();

    if (!respuesta.ok) {
        throw new Error(datos.error || mensajeError);
    }

    return datos;
}

export function obtenerPlantillas(hogarId) {
    return pedirPlantillas(
        `${API_URL}/hogares/${hogarId}/plantillas`,
        {},
        "No se pudo obtener el pool de tareas"
    );
}

export function crearPlantilla(hogarId, plantilla, usuarioId) {
    return pedirPlantillas(
        `${API_URL}/hogares/${hogarId}/plantillas`,
        { method: "POST", body: JSON.stringify({ ...plantilla, usuarioId }) },
        "No se pudo crear la tarea en el pool"
    );
}

export function actualizarPlantilla(id, plantilla, usuarioId) {
    return pedirPlantillas(
        `${API_URL}/plantillas/${id}`,
        { method: "PUT", body: JSON.stringify({ ...plantilla, usuarioId }) },
        "No se pudo editar la tarea del pool"
    );
}

export function eliminarPlantilla(id, usuarioId) {
    return pedirPlantillas(
        `${API_URL}/plantillas/${id}`,
        { method: "DELETE", body: JSON.stringify({ usuarioId }) },
        "No se pudo eliminar la tarea del pool"
    );
}
