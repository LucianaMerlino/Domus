import {
    BrowserRouter,
    Routes,
    Route,
    Navigate
} from "react-router-dom";

import Home from "./Home";
import Perfil from "./Perfil";
import Login from "./Login";
import { obtenerSesion } from "./sesion";

function HomeRuta() {
    const sesion = obtenerSesion();

    if (!sesion) {
        return <Navigate to="/login" replace />;
    }

    return <Home id={sesion.id} />;
}

function PerfilRuta() {
    const sesion = obtenerSesion();

    if (!sesion) {
        return <Navigate to="/login" replace />;
    }

    return <Perfil />;
}

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route
                    path="/login"
                    element={<Login />}
                />

                <Route
                    path="/"
                    element={<HomeRuta />}
                />

                <Route
                    path="/perfil"
                    element={<PerfilRuta />}
                />

                <Route
                    path="*"
                    element={<Navigate to="/" replace />}
                />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
