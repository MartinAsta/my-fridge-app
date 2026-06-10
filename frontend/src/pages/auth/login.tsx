import { useState } from "react";
import { useNavigate } from "react-router-dom";

export function Login() {
    const navigate = useNavigate();
    const API_URL = import.meta.env.VITE_API_URL;

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email,
                    password,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || "Login failed");
            }

            localStorage.setItem("access_token", data.access_token);
            navigate("/dashboard");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <main className="login-card">
                <h1>Log in</h1>

                <form onSubmit={handleSubmit} className="login-form">
                    <label>
                        Email address
                        <input
                            type="email"
                            name="email"
                            placeholder="mail@address.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </label>

                    <label>
                        Password
                        <input
                            type="password"
                            name="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </label>

                    {error && <p className="error-message">{error}</p>}

                    <div className="login-actions">
                        <button type="submit" className="login-submit" disabled={loading}>
                            {loading ? "Logging in..." : "Log in"}
                        </button>

                        <button
                            type="button"
                            className="register-button"
                            onClick={() => navigate("/register")}
                        >
                            Register
                        </button>
                    </div>
                </form>
            </main>
        </div>
    );
}