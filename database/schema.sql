CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS hogares (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    icono VARCHAR(50) NOT NULL DEFAULT '🏠',
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE hogares
ADD COLUMN IF NOT EXISTS icono VARCHAR(50) NOT NULL DEFAULT '🏠';

CREATE TABLE IF NOT EXISTS miembros_hogar (
    id SERIAL PRIMARY KEY,
    hogar_id INTEGER NOT NULL REFERENCES hogares(id) ON DELETE CASCADE,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    rol VARCHAR(30) NOT NULL DEFAULT 'integrante' CHECK (rol IN ('admin', 'integrante')),
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
    nombre VARCHAR(50) NOT NULL,
    descripcion VARCHAR(200),
    costo_puntos INTEGER NOT NULL CHECK (costo_puntos >= 1),
    estado VARCHAR(30) NOT NULL DEFAULT 'Por reclamar' CHECK (estado IN ('Por reclamar', 'Reclamada')),
    asignado_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Compatibilidad con bases creadas antes de DOM-49/50/54.
ALTER TABLE recompensas ADD COLUMN IF NOT EXISTS estado VARCHAR(30) NOT NULL DEFAULT 'Por reclamar';
ALTER TABLE recompensas ADD COLUMN IF NOT EXISTS asignado_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL;
ALTER TABLE recompensas ADD COLUMN IF NOT EXISTS creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Quién reclamó la recompensa y cuándo (DOM-53). Al reclamarla se gastan
-- sus puntos: el saldo es lo ganado en tareas menos lo gastado en recompensas.
ALTER TABLE recompensas ADD COLUMN IF NOT EXISTS reclamada_por INTEGER REFERENCES usuarios(id) ON DELETE SET NULL;
ALTER TABLE recompensas ADD COLUMN IF NOT EXISTS reclamada_en TIMESTAMP;

-- Credenciales: el login es por email + contraseña.
-- usuarios.nombre es el nombre de usuario elegido al registrarse y es el
-- que se muestra en la app. Se puede repetir; el email no.
ALTER TABLE usuarios
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

-- El rol pasa a ser por hogar: vive en miembros_hogar en lugar de usuarios.
-- Para bases existentes copiamos el rol que tenía cada usuario a su membresía.
ALTER TABLE miembros_hogar
ADD COLUMN IF NOT EXISTS rol VARCHAR(30) NOT NULL DEFAULT 'integrante'
;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'usuarios' AND column_name = 'rol'
    ) THEN
        UPDATE miembros_hogar mh
        SET rol = u.rol
        FROM usuarios u
        WHERE u.id = mh.usuario_id
          AND u.rol IN ('admin', 'integrante');

        ALTER TABLE usuarios DROP COLUMN rol;
    END IF;
END $$;

ALTER TABLE miembros_hogar
DROP CONSTRAINT IF EXISTS miembros_hogar_rol_check
;

ALTER TABLE miembros_hogar
ADD CONSTRAINT miembros_hogar_rol_check CHECK (rol IN ('admin', 'integrante'))
;

-- Un usuario pertenece a un único hogar. Si quedaron membresías duplicadas
-- de antes de esta regla, se conserva la más antigua.
DELETE FROM miembros_hogar mh
USING miembros_hogar anterior
WHERE anterior.usuario_id = mh.usuario_id
  AND anterior.id < mh.id
;

CREATE UNIQUE INDEX IF NOT EXISTS miembros_hogar_usuario_idx
ON miembros_hogar (usuario_id)
;

-- Las tareas se asignan por id de usuario (antes se guardaba el nombre en
-- asignado_a). Para bases existentes se busca a ese nombre dentro del hogar.
ALTER TABLE tareas
ADD COLUMN IF NOT EXISTS asignado_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL
;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'tareas' AND column_name = 'asignado_a'
    ) THEN
        UPDATE tareas t
        SET asignado_id = (
            SELECT MIN(u.id)
            FROM usuarios u
            JOIN miembros_hogar mh ON mh.usuario_id = u.id
            WHERE mh.hogar_id = t.hogar_id
              AND u.nombre = t.asignado_a
        )
        WHERE t.asignado_a IS NOT NULL
          AND t.asignado_id IS NULL;

        ALTER TABLE tareas DROP COLUMN asignado_a;
    END IF;
END $$;

-- Antes había una columna nombre_usuario aparte de nombre. Ahora el nombre
-- de usuario es el nombre que se muestra: se copia a nombre y se elimina.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'usuarios' AND column_name = 'nombre_usuario'
    ) THEN
        UPDATE usuarios
        SET nombre = nombre_usuario
        WHERE nombre_usuario IS NOT NULL
          AND TRIM(nombre_usuario) <> '';

        ALTER TABLE usuarios DROP COLUMN nombre_usuario;
    END IF;
END $$;

-- Usuarios sin email (anteriores a que fuera obligatorio): se les genera uno
-- a partir del nombre de usuario y el id, por ejemplo "juan.12@generado.domus.local"
-- (otro dominio que el del seed, para que el seed no les cambie la contraseña)
UPDATE usuarios
SET email = COALESCE(
        NULLIF(LOWER(REGEXP_REPLACE(nombre, '[^a-zA-Z0-9]', '', 'g')), ''),
        'usuario'
    ) || '.' || id || '@generado.domus.local'
WHERE email IS NULL OR TRIM(email) = ''
;

ALTER TABLE usuarios
ALTER COLUMN email SET NOT NULL
;

-- El email no se repite sin importar mayúsculas
CREATE UNIQUE INDEX IF NOT EXISTS usuarios_email_lower_idx
ON usuarios (LOWER(email))
;
