INSERT INTO usuarios (nombre, email, rol)
VALUES
    ('Admin 1', 'admin1@domus.local', 'admin'),
    ('Admin 2', 'admin2@domus.local', 'admin')
ON CONFLICT (email) DO NOTHING;

INSERT INTO hogares (nombre)
VALUES ('Hogar de prueba')
ON CONFLICT DO NOTHING;