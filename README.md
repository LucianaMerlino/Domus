# Domus – Guía para levantar el proyecto localmente

Este documento explica cómo dejar el proyecto **Domus** corriendo en tu máquina: backend (Node/Express + PostgreSQL) y frontend (React + Vite).

## Estructura del proyecto

```
Domus/
├── backend/
│   ├── src/
│   │   ├── app.js
│   │   ├── config/
│   │   │   └── database.js
│   │   └── routes/
│   │       ├── adminRoutes.js
│   │       └── taskRoutes.js
│   ├── package.json
│   └── .env            (no se sube al repo, se crea localmente)
├── database/
│   ├── schema.sql
│   └── seed.sql
└── frontend/
    ├── src/
    │   ├── App.jsx
    │   ├── Admin.jsx
    │   ├── api.js
    │   ├── App.css
    │   ├── index.css
    │   └── main.jsx
    └── package.json
```

---

## 1. Requisitos previos

Instalar antes de empezar:

| Herramienta | Versión recomendada | Verificar instalación |
|---|---|---|
| [Node.js](https://nodejs.org/) | 18 LTS o superior (npm incluido) | `node -v` / `npm -v` |
| [PostgreSQL](https://www.postgresql.org/download/) | 14 o superior | `psql --version` |
| Git | cualquier versión reciente | `git --version` |

> El backend usa el driver `pg`, por lo que **necesitás una instancia de PostgreSQL corriendo** (local o en Docker) antes de levantar el servidor.

---

## 2. Clonar el repositorio

```bash
git clone https://github.com/LucianaMerlino/Domus.git
cd Domus
```

---

## 3. Base de datos (PostgreSQL)

### 3.1 Crear la base de datos

Entrá a la consola de PostgreSQL con el usuario `postgres` (el mismo que se usa en el `.env`):

```bash
psql -U postgres
```

Dentro de la consola de `psql`, creá la base:

```sql
CREATE DATABASE domus;
```

Salí con `\q`.

> Si preferís hacerlo en un solo comando sin entrar a la consola interactiva:
> ```bash
> psql -U postgres -c "CREATE DATABASE domus;"
> ```

### 3.2 Correr el script de esquema (`schema.sql`)

Este script crea las tablas: `usuarios`, `hogares`, `miembros_hogar`, `tareas`, `asignaciones_tarea` y `recompensas`.

```bash
psql -U postgres -d domus -f database/schema.sql
```

### 3.3 Cargar los datos iniciales (`seed.sql`)

Este script inserta los administradores de prueba (`admin1@domus.local`, `admin2@domus.local`) y un hogar de prueba.

```bash
psql -U postgres -d domus -f database/seed.sql
```

### 3.4 Verificar que las tablas se crearon correctamente

```bash
psql -U postgres -d domus -c "\dt"
```

Deberías ver algo así:

```
              List of relations
 Schema |       Name        | Type  |  Owner
--------+--------------------+-------+----------
 public | asignaciones_tarea | table | postgres
 public | hogares            | table | postgres
 public | miembros_hogar     | table | postgres
 public | recompensas        | table | postgres
 public | tareas             | table | postgres
 public | usuarios           | table | postgres
```

Y para chequear los datos de prueba:

```bash
psql -U postgres -d domus -c "SELECT id, nombre, email, rol FROM usuarios;"
```

> **Tip:** si no querés que te pida la contraseña en cada comando, podés exportarla una sola vez en la terminal (Linux/macOS):
> ```bash
> export PGPASSWORD=root
> ```
> En Windows (PowerShell):
> ```powershell
> $env:PGPASSWORD="root"
> ```

---

## 4. Configurar el backend

### 4.1 Instalar dependencias

```bash
cd backend
npm install
```

Dependencias principales que se instalan: `express`, `pg`, `cors`, `dotenv` (y `nodemon` como dependencia de desarrollo).

### 4.2 Crear el archivo `.env`

En la raíz de `backend/`, creá un archivo `.env` con este contenido (ajustá usuario/contraseña si en tu Postgres local son distintos):

```env
PORT=3000

DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=root
DB_NAME=domus
```

> El `.env` está en `.gitignore`, así que no se sube al repositorio. Cada persona que clona el proyecto tiene que crear el suyo con estos valores (o los que correspondan a su Postgres local).

### 4.3 Levantar el servidor

En modo desarrollo (con recarga automática vía `nodemon`):

```bash
npm run dev
```

O en modo producción/simple:

```bash
npm start
```

Si todo salió bien, en la consola vas a ver:

```
Servidor Domus ejecutándose en http://localhost:3000
```

### 4.4 Probar que el backend y la base de datos están conectados

Abrí en el navegador o probá con `curl`:

```bash
curl http://localhost:3000/api/health
curl http://localhost:3000/api/db-test
curl http://localhost:3000/api/admins
curl http://localhost:3000/api/tasks
```

`db-test` debería devolver `"baseDeDatos": "conectada"` junto con la fecha/hora actual si la conexión a PostgreSQL funciona.

---

## 5. Configurar el frontend

### 5.1 Instalar dependencias

En otra terminal (dejando el backend corriendo):

```bash
cd frontend
npm install
```

### 5.2 Levantar el servidor de desarrollo

```bash
npm run dev
```

Por defecto Vite lo levanta en `http://localhost:5173`.

### 5.3 Probar la app

Abrí en el navegador:

```
http://localhost:5173/admin/1
```

o

```
http://localhost:5173/admin/2
```

(son los IDs de los dos administradores de prueba cargados por `seed.sql`). Deberías ver el panel de Domus con los datos del admin y el formulario para crear tareas.

> El frontend llama a `http://localhost:3000/api` (definido en `api.js`), así que el backend tiene que estar corriendo en el puerto 3000 para que la pantalla cargue los datos.

---

## 6. Resumen rápido (para quien ya tiene todo instalado)

```bash
# 1. Clonar
git clone https://github.com/LucianaMerlino/Domus.git
cd Domus

# 2. Base de datos
psql -U postgres -c "CREATE DATABASE domus;"
psql -U postgres -d domus -f database/schema.sql
psql -U postgres -d domus -f database/seed.sql

# 3. Backend
cd backend
npm install
# crear .env con las variables de la sección 4.2
npm run dev

# 4. Frontend (en otra terminal)
cd frontend
npm install
npm run dev
```

---

## 7. Problemas comunes

| Problema | Causa probable | Solución |
|---|---|---|
| `db-test` devuelve error / no conecta | El `.env` del backend no coincide con el usuario/contraseña real de tu Postgres | Revisar `DB_USER` / `DB_PASSWORD` / `DB_PORT` en `.env` |
| `role "postgres" does not exist` | Tu instalación de Postgres usa otro usuario por defecto | Cambiar `DB_USER` en `.env` por tu usuario, o crear el rol `postgres` |
| El frontend no muestra datos y da error de red | El backend no está corriendo en el puerto 3000 | Verificar que `npm run dev` del backend esté activo |
| Error `duplicate key value violates unique constraint` al crear tarea | Ya existe una tarea con ese título en el mismo hogar (`UNIQUE(hogar_id, nombre)` en `schema.sql`) | Es el comportamiento esperado (regla de negocio: el título no se repite) |
