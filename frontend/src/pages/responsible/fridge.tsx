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

type IngredientRow = {
    ingredientId: string;
    quantity: string;
};

export function Fridge() {
    const { restaurantId } = useParams();
    const navigate = useNavigate();

    const [fridgeItems, setFridgeItems] = useState<FridgeItem[]>([]);
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [rows, setRows] = useState<IngredientRow[]>([
        { ingredientId: "", quantity: "" },
    ]);
    const [spentAmount, setSpentAmount] = useState("");
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

    const updateRow = (index: number, field: keyof IngredientRow, value: string) => {
        setRows((current) =>
            current.map((row, i) => (i === index ? { ...row, [field]: value } : row))
        );
    };

    const addRow = () => {
        setRows((current) => [...current, { ingredientId: "", quantity: "" }]);
    };

    const removeRow = (index: number) => {
        setRows((current) => (current.length === 1 ? current : current.filter((_, i) => i !== index)));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const token = localStorage.getItem("access_token");

        if (!token || !restaurantId) {
            setError("Missing restaurant or authentication");
            return;
        }

        const parsedRows = rows.map((row, index) => {
            if (!row.ingredientId) {
                throw new Error(`Please select an ingredient in row ${index + 1}`);
            }

            const ingredientId = Number(row.ingredientId);
            const quantity = Number(row.quantity);

            if (!Number.isInteger(ingredientId) || ingredientId <= 0) {
                throw new Error(`Invalid ingredient in row ${index + 1}`);
            }

            if (!Number.isInteger(quantity) || quantity <= 0) {
                throw new Error(`Quantity must be a positive integer in row ${index + 1}`);
            }

            return {
                ingredient_id: ingredientId,
                quantity,
            };
        });

        const parsedSpentAmount = Number(spentAmount);
        if (!Number.isFinite(parsedSpentAmount) || parsedSpentAmount < 0) {
            throw new Error("Spent amount must be a valid positive number");
        }

        setSubmitting(true);
        setError("");

        try {
            const fridgeResponse = await fetch(`${API_URL}/add/fridge/${restaurantId}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(parsedRows),
            });

            const fridgeData = await fridgeResponse.json();

            if (!fridgeResponse.ok) {
                throw new Error(fridgeData.detail || "Could not add ingredients to fridge");
            }

            if (parsedSpentAmount > 0) {
                const cashResponse = await fetch(`${API_URL}/cash/add/${restaurantId}`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        amount: -parsedSpentAmount,
                    }),
                });

                const cashData = await cashResponse.json();

                if (!cashResponse.ok) {
                    throw new Error(cashData.detail || "Could not update cash register");
                }
            }

            setRows([{ ingredientId: "", quantity: "" }]);
            setSpentAmount("");
            setFridgeItems(fridgeData);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not complete the operation");
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

                <form onSubmit={handleSubmit} style={{ marginBottom: "1.5rem" }}>
                    {rows.map((row, index) => (
                        <div
                            key={index}
                            style={{
                                display: "flex",
                                gap: "1rem",
                                alignItems: "end",
                                marginBottom: "0.75rem",
                            }}
                        >
                            <label>
                                Ingredient
                                <select
                                    value={row.ingredientId}
                                    onChange={(e) => updateRow(index, "ingredientId", e.target.value)}
                                >
                                    <option value="">Select an ingredient</option>
                                    {ingredients.map((ingredient) => (
                                        <option key={ingredient.id} value={ingredient.id}>
                                            {ingredient.name}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label>
                                Quantity
                                <input
                                    type="number"
                                    min="1"
                                    value={row.quantity}
                                    onChange={(e) => updateRow(index, "quantity", e.target.value)}
                                />
                            </label>

                            <button
                                type="button"
                                onClick={() => removeRow(index)}
                                disabled={rows.length === 1}
                            >
                                Remove
                            </button>
                        </div>
                    ))}

                    <div style={{ marginBottom: "1rem" }}>
                        <button type="button" onClick={addRow}>
                            + Add another ingredient
                        </button>
                    </div>

                    <label style={{ display: "block", marginBottom: "1rem" }}>
                        Total spent
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={spentAmount}
                            onChange={(e) => setSpentAmount(e.target.value)}
                        />
                    </label>

                    <button type="submit" disabled={submitting}>
                        {submitting ? "Saving..." : "Add all"}
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