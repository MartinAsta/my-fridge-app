import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

type Ingredient = {
    id: number;
    name: string;
};

type IngredientRow = {
    ingredientId: string;
    quantityNeeded: string;
};

export function CreateDish() {
    const { restaurantId } = useParams();
    const navigate = useNavigate();

    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [rows, setRows] = useState<IngredientRow[]>([
        { ingredientId: "", quantityNeeded: "" },
    ]);
    const [name, setName] = useState("");
    const [price, setPrice] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const API_URL = import.meta.env.VITE_API_URL;

    const loadIngredients = async () => {
        const token = localStorage.getItem("access_token");

        const response = await fetch(`${API_URL}/ingredients`, {
            headers: token
                ? {
                      Authorization: `Bearer ${token}`,
                  }
                : undefined,
        });

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
                await loadIngredients();
            } catch (err) {
                setError(err instanceof Error ? err.message : "Could not load page");
            } finally {
                setLoading(false);
            }
        };

        loadPage();
    }, [API_URL, restaurantId]);

    const updateRow = (
        index: number,
        field: keyof IngredientRow,
        value: string
    ) => {
        setRows((current) =>
            current.map((row, i) => (i === index ? { ...row, [field]: value } : row))
        );
    };

    const addRow = () => {
        setRows((current) => [...current, { ingredientId: "", quantityNeeded: "" }]);
    };

    const removeRow = (index: number) => {
        setRows((current) =>
            current.length === 1 ? current : current.filter((_, i) => i !== index)
        );
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const token = localStorage.getItem("access_token");

        if (!token || !restaurantId) {
            setError("Missing restaurant or authentication");
            return;
        }

        const trimmedName = name.trim();
        if (!trimmedName) {
            setError("Please enter a dish name");
            return;
        }

        const parsedPrice = Number(price);
        if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
            setError("Price must be a valid positive number");
            return;
        }

        const parsedRows = rows.map((row, index) => {
            if (!row.ingredientId) {
                throw new Error(`Please select an ingredient in row ${index + 1}`);
            }

            const ingredientId = Number(row.ingredientId);
            const quantityNeeded = Number(row.quantityNeeded);

            if (!Number.isInteger(ingredientId) || ingredientId <= 0) {
                throw new Error(`Invalid ingredient in row ${index + 1}`);
            }

            if (!Number.isInteger(quantityNeeded) || quantityNeeded <= 0) {
                throw new Error(
                    `Quantity needed must be a positive integer in row ${index + 1}`
                );
            }

            return {
                ingredient_id: ingredientId,
                quantity_needed: quantityNeeded,
            };
        });

        setSubmitting(true);
        setError("");

        try {
            const response = await fetch(`${API_URL}/add/dish/${restaurantId}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    name: trimmedName,
                    price: parsedPrice,
                    ingredients: parsedRows,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || "Could not create dish");
            }

            navigate(`/dashboard/restaurants/${restaurantId}/dishes`);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not create dish");
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

                <h1>Create dish</h1>

                <form onSubmit={handleSubmit} style={{ marginBottom: "1.5rem" }}>
                    <label style={{ display: "block", marginBottom: "1rem" }}>
                        Name
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            maxLength={50}
                        />
                    </label>

                    <label style={{ display: "block", marginBottom: "1rem" }}>
                        Price
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                        />
                    </label>

                    <h3>Ingredients</h3>

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
                                    onChange={(e) =>
                                        updateRow(index, "ingredientId", e.target.value)
                                    }
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
                                Quantity needed
                                <input
                                    type="number"
                                    min="1"
                                    value={row.quantityNeeded}
                                    onChange={(e) =>
                                        updateRow(index, "quantityNeeded", e.target.value)
                                    }
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

                    <button type="submit" disabled={submitting}>
                        {submitting ? "Creating..." : "Create dish"}
                    </button>
                </form>
            </main>
        </div>
    );
}