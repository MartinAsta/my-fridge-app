import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export function Dashboard() {
    const navigate = useNavigate();
    const [username, setUsername] = useState("");
    const [error, setError] = useState("");
    const API_URL = import.meta.env.VITE_API_URL;

    useEffect(() => {
        const token = localStorage.getItem("access_token");
        if (!token) {
            navigate("/login");
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
                navigate("/login");
                return;
            }

            setUsername(data.username)
        };
        loadUser().catch(() => {
            setError("Could not load dashboard");
        });
    }, [navigate]);

    return (
        <div>
            <main className="content">
                <h1>{username ? `Welcome ${username}` : "Welcome"}</h1>
                {error && <p>{error}</p>}
            </main>
        </div>
    );
}