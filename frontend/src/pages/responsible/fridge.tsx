import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

type Ingredient = {
    id: number;
    name: string;
};

type FridgeItem = {
    id: number;
    restaurant_id: number;
    ingredient_id: number;
    quantity: number;
    ingredient: Ingredient;
};

export function Fridge() {
    const { restaurantId } = useParams();
    const navigate = useNavigate();

    const [fridgeItems, setFridgeItems] = useState<FridgeItem[]>([]);
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [selectedIngredientId, setSelectedIngredientId] = useState("");
    const [quantity, setQuantity] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const API_URL = import.meta.env.VITE_API_URL;

    const loadFridge = async (token: string) => {
        const response = await fetch(`${API_URL}/get/fridge/${restaurantId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || "Could not load fridge");
        }

        setFridgeItems(data);
    };

    const loadIngredients = async () => {
        const response = await fetch(`${API_URL}/ingredients`);

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || "Could not load ingredients");
        }

        setIngredients(data);
    };

    useEffect(() => {
        const token = localStorage.getItem("access_token");

        if (!token || !restaurantId) {
            setError("Missing restaurant or authentication");
            setLoading(false);
            return;
        }

        const loadPage = async () => {
            try {
                await Promise.all([loadFridge(token), loadIngredients()]);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Could not load fridge");
            } finally {
                setLoading(false);
            }
        };

        loadPage();
    }, [API_URL, restaurantId]);

    const handleAddIngredient = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const token = localStorage.getItem("access_token");

        if (!token || !restaurantId) {
            setError("Missing restaurant or authentication");
            return;
        }

        if (!selectedIngredientId) {
            setError("Please select an ingredient");
            return;
        }

        const parsedQuantity = Number(quantity);

        if (!Number.isInteger(parsedQuantity) || parsedQuantity <= 0) {
            setError("Quantity must be a positive integer");
            return;
        }

        setSubmitting(true);
        setError("");

        try {
            const response = await fetch(`${API_URL}/add/fridge/${restaurantId}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    ingredient_id: Number(selectedIngredientId),
                    quantity: parsedQuantity,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || "Could not add ingredient to fridge");
            }

            setSelectedIngredientId("");
            setQuantity("");

            await loadFridge(token);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not add ingredient");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <p>Loading...</p>;
    if (error) return <p>{error}</p>;

    return (
        <div>
            <main className="content">
                <button onClick={() => navigate(-1)}>Back</button>

                <h1>Fridge</h1>

                <form onSubmit={handleAddIngredient} style={{ marginBottom: "1.5rem" }}>
                    <label>
                        Ingredient
                        <select
                            value={selectedIngredientId}
                            onChange={(e) => setSelectedIngredientId(e.target.value)}
                        >
                            <option value="">Select an ingredient</option>
                            {ingredients.map((ingredient) => (
                                <option key={ingredient.id} value={ingredient.id}>
                                    {ingredient.name}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label style={{ marginLeft: "1rem" }}>
                        Quantity
                        <input
                            type="number"
                            min="1"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                        />
                    </label>

                    <button type="submit" disabled={submitting} style={{ marginLeft: "1rem" }}>
                        {submitting ? "Adding..." : "Add"}
                    </button>
                </form>

                {fridgeItems.length === 0 ? (
                    <p>This restaurant has no ingredients in its fridge.</p>
                ) : (
                    <ul style={{ listStyle: "none", paddingLeft: 0, margin: 0 }}>
                        {fridgeItems.map((item) => (
                            <li key={item.id} style={{ marginBottom: "0.75rem" }}>
                                <span>
                                    {item.ingredient.name} — {item.quantity}
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
            </main>
        </div>
    );
}