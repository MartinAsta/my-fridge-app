import { useState } from "react";
import { useNavigate } from "react-router-dom";


export function Register() {
    const navigate = useNavigate();
    const API_URL = import.meta.env.VITE_API_URL;

    const [email, setEmail] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const response = await fetch(`${API_URL}/auth/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email,
                    username,
                    password,
                    confirm_password: confirmPassword,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                const errors = Array.isArray(data.detail) ? data.detail : [];

                const message =
                    errors
                        .map((err: { loc?: string[]; msg?: string; type?: string }) => {
                            const field = err.loc?.[1];

                            if (field === "password" && err.type === "string_too_short") {
                                return "Password should have at least 8 characters";
                            }

                            if (field === "username" && err.type === "string_too_short") {
                                return "Username should have at least 3 characters";
                            }

                            if (field === "confirm_password" && err.type === "string_too_short") {
                                return "";
                            }

                            return err.msg;
                        })
                        .filter(Boolean)
                        .join(", ") || "Registration failed";

                throw new Error(message);
            }

            console.log("Registered user:", data);
            navigate("/login");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <main className="login-card">
                <h1>Register</h1>

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
                        Username
                        <input
                            type="text"
                            name="username"
                            placeholder="Your username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
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

                    <label>
                        Confirm password
                        <input
                            type="password"
                            name="confirmPassword"
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                    </label>

                    {error && <p className="error-message">{error}</p>}

                    <div className="login-actions">
                        <button type="submit" className="login-submit" disabled={loading}>
                            {loading ? "Registering..." : "Register"}
                        </button>
                    </div>
                </form>
            </main>
        </div>
    );
}