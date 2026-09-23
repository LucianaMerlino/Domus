CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE,
    rol VARCHAR(30) NOT NULL DEFAULT 'integrante',
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS hogares (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS miembros_hogar (
    id SERIAL PRIMARY KEY,
    hogar_id INTEGER NOT NULL REFERENCES hogares(id) ON DELETE CASCADE,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    UNIQUE(hogar_id, usuario_id)
);

CREATE TABLE IF NOT EXISTS tareas (
    id SERIAL PRIMARY KEY,
    hogar_id INTEGER NOT NULL REFERENCES hogares(id) ON DELETE CASCADE,
    nombre VARCHAR(100) NOT NULL,
    descripcion VARCHAR(500),
    puntos INTEGER NOT NULL DEFAULT 0,
    estado VARCHAR(30) NOT NULL DEFAULT 'Pendiente',
    completada BOOLEAN NOT NULL DEFAULT FALSE,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS asignaciones_tarea (
    id SERIAL PRIMARY KEY,
    tarea_id INTEGER NOT NULL REFERENCES tareas(id) ON DELETE CASCADE,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    UNIQUE(tarea_id, usuario_id)
);

CREATE TABLE IF NOT EXISTS recompensas (
    id SERIAL PRIMARY KEY,
    hogar_id INTEGER NOT NULL REFERENCES hogares(id) ON DELETE CASCADE,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    costo_puntos INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE tareas
ADD COLUMN IF NOT EXISTS asignado_a VARCHAR(100)
;

-- Login: nombre de usuario + contraseña
ALTER TABLE usuarios
ADD COLUMN IF NOT EXISTS nombre_usuario VARCHAR(50) UNIQUE,
ADD COLUMN IF NOT EXISTS contrasena VARCHAR(100)
;

-- Pool de tareas: plantillas ("tareas base") con puntaje estándar por hogar.
-- Las filas de "tareas" pasan a ser instancias de una plantilla.
CREATE TABLE IF NOT EXISTS plantillas_tarea (
    id SERIAL PRIMARY KEY,
    hogar_id INTEGER NOT NULL REFERENCES hogares(id) ON DELETE CASCADE,
    nombre VARCHAR(100) NOT NULL,
    descripcion VARCHAR(500),
    puntos INTEGER NOT NULL CHECK (puntos > 0),
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- No se repite el nombre de una plantilla dentro del hogar (sin importar mayúsculas)
CREATE UNIQUE INDEX IF NOT EXISTS plantillas_tarea_hogar_nombre_idx
ON plantillas_tarea (hogar_id, LOWER(nombre));

-- Cada instancia puede venir de una plantilla. Si la plantilla se borra,
-- la instancia se conserva con sus propios datos.
ALTER TABLE tareas
ADD COLUMN IF NOT EXISTS plantilla_id INTEGER REFERENCES plantillas_tarea(id) ON DELETE SET NULL
;

-- El nombre único ahora vive en las plantillas: una misma plantilla
-- puede instanciarse varias veces en el hogar
ALTER TABLE tareas
DROP CONSTRAINT IF EXISTS tareas_hogar_id_nombre_key
;
