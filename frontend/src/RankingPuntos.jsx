import { useEffect, useState } from "react";
import { obtenerRanking } from "./api";
import "./RankingPuntos.css";

function RankingPuntos({ hogarId }) {
    const [miembros, setMiembros] = useState([]);
    const [error, setError] = useState("");

    useEffect(() => {
        if (hogarId == null) return;

        let cancelado = false;

        async function cargarRanking() {
            try {
                const datos = await obtenerRanking(hogarId);
                if (!cancelado) {
                    setMiembros(datos);
                    setError("");
                }
            } catch (fallo) {
                if (!cancelado) setError(fallo.message);
            }
        }

        cargarRanking();
        const intervalo = window.setInterval(cargarRanking, 5000);

        return () => {
            cancelado = true;
            window.clearInterval(intervalo);
        };
    }, [hogarId]);

    const maximo = Math.max(0, ...miembros.map((miembro) => miembro.puntos));

    return (
        <section className="ranking-puntos" aria-labelledby="ranking-titulo">
            <h2 id="ranking-titulo">Ranking de puntos del hogar</h2>
            {error ? (
                <p className="ranking-error" role="alert">{error}</p>
            ) : miembros.length === 0 ? (
                <p className="ranking-vacio">No hay miembros en este hogar.</p>
            ) : (
                <div className="ranking-grafico" role="img" aria-label="Gráfico de barras de puntos por miembro">
                    {miembros.map((miembro) => {
                        const alto = maximo === 0 ? 0 : (miembro.puntos / maximo) * 100;
                        return (
                            <div className="ranking-columna" key={miembro.id}>
                                <span className="ranking-valor">{miembro.puntos}</span>
                                <div className="ranking-barra-contenedor">
                                    <div className="ranking-barra" style={{ height: `${alto}%` }} />
                                </div>
                                <span className="ranking-nombre" title={miembro.nombre}>
                                    {miembro.nombre}
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}
        </section>
    );
}

export default RankingPuntos;