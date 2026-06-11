import { useState } from "react";
import { useNavigate } from "react-router-dom";

export function CreateRestaurant() {
    const navigate = useNavigate();
    const API_URL = import.meta.env.VITE_API_URL;

    const [restaurant_name, setRestaurantName] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const token = localStorage.getItem("access_token");

            if (!token) {
                throw new Error("You must be logged in to create a restaurant");
            }

            const response = await fetch(`${API_URL}/restaurant/create`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    restaurant_name,
                    password,
                    confirm_password: confirmPassword,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                if (Array.isArray(data.detail)) {
                    const message = data.detail
                        .map((err: { loc?: string[]; msg?: string; type?: string }) => err.msg)
                        .join(", ");

                    throw new Error(message || "Restaurant creation failed");
                }

                throw new Error(data.detail || "Restaurant creation failed");
            }

            console.log("Created restaurant:", data);
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
                <h1>Register your new restaurant</h1>

                <form onSubmit={handleSubmit} className="login-form">
                    <label>
                        Restaurant name
                        <input
                            type="text"
                            name="restaurant_name"
                            placeholder="Restaurant name"
                            value={restaurant_name}
                            onChange={(e) => setRestaurantName(e.target.value)}
                        />
                    </label>

                    <label>
                        Password (this will allow employees to join)
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