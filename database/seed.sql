-- Administradores de prueba (uno por hogar)
INSERT INTO usuarios (nombre, email, rol)
VALUES
    ('Admin 1', 'admin1@domus.local', 'admin'),
    ('Admin 2', 'admin2@domus.local', 'admin')
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
INSERT INTO usuarios (nombre, email, rol)
VALUES
    ('Tomás Álvarez',     'tomas@domus.local',     'integrante'),
    ('Facundo Ríos',      'facu@domus.local',      'integrante'),
    ('María José Pérez',  'mariajose@domus.local', 'integrante'),
    ('Lucía Gómez',       'lucia@domus.local',     'integrante')
ON CONFLICT (email) DO NOTHING;

-- Integrantes de "Casa Belgrano"
INSERT INTO usuarios (nombre, email, rol)
VALUES
    ('Julián Costa',   'julian@domus.local', 'integrante'),
    ('Sofía Medina',   'sofia@domus.local',  'integrante'),
    ('Bruno Ferrari',  'bruno@domus.local',  'integrante')
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
ON CONFLICT (hogar_id, usuario_id) DO NOTHING;

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
ON CONFLICT (hogar_id, usuario_id) DO NOTHING;
