import { useEffect, useState } from "react";
import DomusHeader from "./DomusHeader";
import RankingPuntos from "./RankingPuntos";
import { obtenerHome } from "./api";
import "./App.css";
import "./DomusVisual.css";
import "./Ranking.css";

function Ranking({ id }) {
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    obtenerHome(id).then(setDatos).catch((fallo) => setError(fallo.message));
  }, [id]);

  return <div className="admin-container ranking-pagina">
    <DomusHeader active="ranking" />
    {datos?.hogar && <div className="home-cabecera-completa has-house">
      <div className="home-identidad">
        <span className="boton-hogar" aria-hidden="true">{datos.hogar.icono?.startsWith("/wireframes/domus/") ? <img src={datos.hogar.icono} alt="" /> : (datos.hogar.icono || "🏠")}</span>
        <span className="home-nombre-hogar">{datos.hogar.nombre}</span>
      </div>
      <span className="home-miembros-count">{datos.hogar.rol === "admin" ? "Administrador/a" : "Miembro"}</span>
    </div>}
    <main className="ranking-pagina-contenido">
      <header className="ranking-pagina-cabecera">
        <div><span className="domus-eyebrow">Tu hogar</span><h1>Ranking</h1><p>Puntos acumulados por integrante.</p></div>
      </header>
      {error ? <p className="mensaje-error" role="alert">{error}</p> : datos && !datos.hogar ? <section className="ranking-pagina-sin-hogar"><h2>Todavía no tenés un hogar</h2><p>Creá o unite a uno para ver su ranking.</p></section> : datos?.hogar && <RankingPuntos hogarId={datos.hogar.id} />}
    </main>
  </div>;
}

export default Ranking;
