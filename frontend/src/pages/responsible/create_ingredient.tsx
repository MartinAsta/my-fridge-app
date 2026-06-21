import { useState } from "react";
import { useNavigate } from "react-router-dom";

export function CreateIngredient() {
    const navigate = useNavigate();
    const API_URL = import.meta.env.VITE_API_URL;

    const [name, setName] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const response = await fetch(`${API_URL}/add/ingredient`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ name }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || "Could not create ingredient");
            }

            navigate("/dashboard");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <main className="content">
                <h1>Add an ingredient</h1>

                <form onSubmit={handleSubmit}>
                    <label>
                        Ingredient name
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Tomato"
                        />
                    </label>

                    {error && <p>{error}</p>}

                    <button type="submit" disabled={loading}>
                        {loading ? "Creating..." : "Create ingredient"}
                    </button>
                </form>
            </main>
        </div>
    );
}