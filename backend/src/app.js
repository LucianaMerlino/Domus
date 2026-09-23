require("dotenv").config();

const express = require("express");
const cors = require("cors");

const pool = require("./config/database");

const app = express();

const PORT = process.env.PORT || 3000;

const adminRoutes = require("./routes/adminRoutes");

const taskRoutes = require("./routes/taskRoutes");

const hogarRoutes = require("./routes/hogarRoutes");

const usuarioRoutes = require("./routes/usuarioRoutes");

const authRoutes = require("./routes/authRoutes");

const plantillaRoutes = require("./routes/plantillaRoutes");

app.use(cors());
app.use(express.json());
app.use("/api/admins", adminRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/hogares", hogarRoutes);
app.use("/api/usuarios", usuarioRoutes);
app.use("/api/auth", authRoutes);
app.use("/api", plantillaRoutes);

app.get("/", (req, res) => {
    res.json({
        mensaje: "Backend de Domus funcionando"
    });
});

app.get("/api/health", (req, res) => {
    res.json({
        estado: "ok"
    });
});

app.get("/api/db-test", async (req, res) => {
    try {
        const result = await pool.query("SELECT NOW()");

        res.json({
            estado: "ok",
            baseDeDatos: "conectada",
            fecha: result.rows[0].now
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            estado: "error",
            mensaje: "No se pudo conectar con PostgreSQL"
        });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor Domus ejecutándose en http://localhost:${PORT}`);
});

