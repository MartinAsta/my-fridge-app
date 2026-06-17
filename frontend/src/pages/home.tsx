import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export function Home() {
    const navigate = useNavigate();
    const [username, setUsername] = useState("");
    const [error, setError] = useState("");
    const [isAuthed, setIsAuthed] = useState(() => !!localStorage.getItem("access_token"));

    const API_URL = import.meta.env.VITE_API_URL;

    useEffect(() => {
        const token = localStorage.getItem("access_token");
        if (!token) {
            setIsAuthed(false);
            return;
        }
        const loadUser = async () => {
            const response = await fetch(`${API_URL}/users/me`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await response.json();
            if (!response.ok) {
                localStorage.removeItem("access_token");
                setIsAuthed(false);
                return;
            }

            setUsername(data.username)
            setIsAuthed(true);
        };
        loadUser().catch(() => {
            setError("Could not load homepage");
        });
    }, [navigate]);

    return (
        <div className="app">
            <header className="header">
                <div className="logo">MyRestaurant</div>
                <AuthButton isAuthed={isAuthed} setIsAuthed={setIsAuthed} />
            </header>

            <main className="content">
                <h1>{username ? `Welcome back ${username}` : "Welcome"}</h1>
                {error && <p>{error}</p>}
            </main>
        </div>
    );
}

function AuthButton({
    isAuthed,
    setIsAuthed,
}: {
    isAuthed: boolean;
    setIsAuthed: React.Dispatch<React.SetStateAction<boolean>>;
}) {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem("access_token");
        setIsAuthed(false);
        window.location.reload()
    };

    return (
        <div className="auth-actions">
            {isAuthed ? (
                <>
                    <button
                        className="login-button"
                        onClick={() => navigate("/restaurants")}
                    >   
                        View restaurants
                    </button>
                    <button
                        className="login-button"
                        onClick={() => navigate("/dashboard")}
                    >
                        Dashboard
                    </button>

                    <button
                        className="logout-button"
                        onClick={handleLogout}
                    >
                        Log out
                    </button>
                </>
            ) : (
                <button
                    className="login-button"
                    onClick={() => navigate("/login")}
                >
                    Log in
                </button>
            )}
        </div>
    );
}