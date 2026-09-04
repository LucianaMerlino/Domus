# Domus

Aplicación web para la gestión de tareas y responsabilidades dentro del hogar con sistema de puntos.

## Tecnologías

- JavaScript
- React
- Vite (Usado para crear la estructura del proyecto)
- Node.js
- Express.js
- PostgreSQL
- Git
- GitHub

## Estructura

- `frontend/`: aplicación React
- `backend/`: API REST con Node.js y Express
- `database/`: scripts para crear y poblar la base de datos

## Requisitos

- Node.js
- npm
- PostgreSQL

## Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/LucianaMerlino/Domus.git
cd Domus

## Backend
cd backend
npm install
Crear .env a partir de .env.example y configurar las credenciales de PostgreSQL.

## DB: Crear una base llamada domus.
## Ejecutar desde la raiz del proyecto:
psql -U postgres -d domus -f database/schema.sql
psql -U postgres -d domus -f database/seed.sql

## Ejecutar desde Backend
npm run dev

## Frontend
## Ejecutar desde Frontend
npm install
npm run dev

