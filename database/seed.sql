-- Administradores de prueba (uno por hogar)
INSERT INTO usuarios (nombre, email)
VALUES
    ('admin1', 'admin1@domus.local'),
    ('admin2', 'admin2@domus.local')
ON CONFLICT (email) DO NOTHING;

-- hogares.nombre no tiene UNIQUE, así que evitamos duplicar en cada corrida
INSERT INTO hogares (nombre)
SELECT 'Hogar de prueba'
WHERE NOT EXISTS (
    SELECT 1 FROM hogares WHERE nombre = 'Hogar de prueba'
);

INSERT INTO hogares (nombre)
SELECT 'Casa Belgrano'
WHERE NOT EXISTS (
    SELECT 1 FROM hogares WHERE nombre = 'Casa Belgrano'
);

-- Integrantes del "Hogar de prueba"
INSERT INTO usuarios (nombre, email)
VALUES
    ('tomas',     'tomas@domus.local'),
    ('facu',      'facu@domus.local'),
    ('mariajose', 'mariajose@domus.local'),
    ('lucia',     'lucia@domus.local')
ON CONFLICT (email) DO NOTHING;

-- Integrantes de "Casa Belgrano"
INSERT INTO usuarios (nombre, email)
VALUES
    ('julian', 'julian@domus.local'),
    ('sofia',  'sofia@domus.local'),
    ('bruno',  'bruno@domus.local')
ON CONFLICT (email) DO NOTHING;

-- Admin 1 + sus integrantes -> "Hogar de prueba"
INSERT INTO miembros_hogar (hogar_id, usuario_id)
SELECT
    (SELECT id FROM hogares WHERE nombre = 'Hogar de prueba' ORDER BY id LIMIT 1),
    u.id
FROM usuarios u
WHERE u.email IN (
    'admin1@domus.local',
    'tomas@domus.local',
    'facu@domus.local',
    'mariajose@domus.local',
    'lucia@domus.local'
)
ON CONFLICT (usuario_id) DO NOTHING;

-- Admin 2 + sus integrantes -> "Casa Belgrano"
INSERT INTO miembros_hogar (hogar_id, usuario_id)
SELECT
    (SELECT id FROM hogares WHERE nombre = 'Casa Belgrano' ORDER BY id LIMIT 1),
    u.id
FROM usuarios u
WHERE u.email IN (
    'admin2@domus.local',
    'julian@domus.local',
    'sofia@domus.local',
    'bruno@domus.local'
)
ON CONFLICT (usuario_id) DO NOTHING;

-- Admin 1 y Admin 2 administran su propio hogar
UPDATE miembros_hogar mh
SET rol = 'admin'
FROM usuarios u
WHERE u.id = mh.usuario_id
  AND u.email IN ('admin1@domus.local', 'admin2@domus.local');

-- Credenciales de prueba: se ingresa con el email (admin1@domus.local,
-- tomas@domus.local, ...) y la contraseña de todos es "1234".
-- El nombre de usuario es la parte del email antes del "@"
UPDATE usuarios
SET
    nombre = split_part(email, '@', 1),
    contrasena = '1234'
WHERE email LIKE '%@domus.local';
