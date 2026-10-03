import { useEffect, useState } from "react";
import DomusHeader from "./DomusHeader";
import RankingPuntos from "./RankingPuntos";
import { obtenerHome } from "./api";
import "./App.css";
import "./DomusVisual.css";
import "./Estadisticas.css";

function Estadisticas({ id }) {
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    obtenerHome(id).then(setDatos).catch((fallo) => setError(fallo.message));
  }, [id]);

  return <div className="admin-container estadisticas-page">
    <DomusHeader active="stats" />
    {datos?.hogar && <div className="home-cabecera-completa has-house">
      <div className="home-identidad">
        <span className="boton-hogar" aria-hidden="true">{datos.hogar.icono?.startsWith("/wireframes/domus/") ? <img src={datos.hogar.icono} alt="" /> : (datos.hogar.icono || "🏠")}</span>
        <span className="home-nombre-hogar">{datos.hogar.nombre}</span>
      </div>
      <span className="home-miembros-count">{datos.hogar.rol === "admin" ? "Administrador/a" : "Miembro"}</span>
    </div>}
    <main className="estadisticas-contenido">
      <header className="estadisticas-cabecera">
        <div><span className="domus-eyebrow">Tu hogar</span><h1>Estadísticas</h1><p>Ranking de puntos acumulados por integrante.</p></div>
      </header>
      {error ? <p className="mensaje-error" role="alert">{error}</p> : datos && !datos.hogar ? <section className="estadisticas-sin-hogar"><h2>Todavía no tenés un hogar</h2><p>Creá o unite a uno para ver sus estadísticas.</p></section> : datos?.hogar && <RankingPuntos hogarId={datos.hogar.id} />}
    </main>
  </div>;
}

export default Estadisticas;
