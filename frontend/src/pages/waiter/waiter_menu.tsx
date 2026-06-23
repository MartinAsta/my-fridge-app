import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

type Ingredient = {
    id: number;
    name: string;
};

type DishIngredient = {
    ingredient_id: number;
    quantity_needed: number;
    ingredient: Ingredient;
};

type Dish = {
    id: number;
    restaurant_id: number;
    name: string;
    price: number;
    dish_ingredients: DishIngredient[];
};

export function WaiterMenu() {
    const { restaurantId } = useParams();
    const navigate = useNavigate();

    const [menu, setMenu] = useState<Dish[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [orderingDishId, setOrderingDishId] = useState<number | null>(null);
    const [success, setSuccess] = useState("");

    const API_URL = import.meta.env.VITE_API_URL;

    const loadMenu = async (token: string) => {
        const response = await fetch(`${API_URL}/get/menu/${restaurantId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || "Could not load menu");
        }

        setMenu(data);
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
                await loadMenu(token);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Could not load menu");
            } finally {
                setLoading(false);
            }
        };

        loadPage();
    }, [API_URL, restaurantId]);

    const handleOrder = async (dishId: number) => {
        const token = localStorage.getItem("access_token");

        if (!token || !restaurantId) {
            setError("Missing restaurant or authentication");
            return;
        }

        setOrderingDishId(dishId);
        setError("");
        setSuccess("");

        try {
            const response = await fetch(`${API_URL}/create/order/${restaurantId}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    dish_id: dishId,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || "Could not create order");
            }

            setSuccess(`Order created for ${menu.find((dish) => dish.id === dishId)?.name ?? "dish"}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not create order");
        } finally {
            setOrderingDishId(null);
        }
    };

    if (loading) return <p>Loading...</p>;

    return (
        <div>
            <main className="content">
                <button onClick={() => navigate(-1)}>Back</button>

                <h1>Menu</h1>

                {error && <p>{error}</p>}
                {success && <p>{success}</p>}

                {menu.length === 0 ? (
                    <p>This restaurant has no dishes yet.</p>
                ) : (
                    <div style={{ display: "grid", gap: "1rem" }}>
                        {menu.map((dish) => (
                            <section
                                key={dish.id}
                                style={{
                                    border: "1px solid #ccc",
                                    borderRadius: "8px",
                                    padding: "1rem",
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        gap: "1rem",
                                    }}
                                >
                                    <h2 style={{ margin: 0 }}>
                                        {dish.name} — {dish.price.toFixed(2)} €
                                    </h2>

                                    <button
                                        type="button"
                                        onClick={() => handleOrder(dish.id)}
                                        disabled={orderingDishId === dish.id}
                                    >
                                        {orderingDishId === dish.id ? "Ordering..." : "Order"}
                                    </button>
                                </div>

                                <h3 style={{ marginBottom: "0.5rem" }}>Ingredients</h3>

                                {dish.dish_ingredients.length === 0 ? (
                                    <p>No ingredients listed.</p>
                                ) : (
                                    <ul style={{ margin: 0, paddingLeft: "1.25rem" }}>
                                        {dish.dish_ingredients.map((item) => (
                                            <li key={`${dish.id}-${item.ingredient_id}`}>
                                                {item.ingredient.name} — {item.quantity_needed}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </section>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}