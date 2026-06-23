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

export function Menu() {
    const { restaurantId } = useParams();
    const navigate = useNavigate();

    const [menu, setMenu] = useState<Dish[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const API_URL = import.meta.env.VITE_API_URL;

    useEffect(() => {
        const token = localStorage.getItem("access_token");

        if (!token || !restaurantId) {
            setError("Missing restaurant or authentication");
            setLoading(false);
            return;
        }

        const loadMenu = async () => {
            try {
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
            } catch (err) {
                setError(err instanceof Error ? err.message : "Could not load menu");
            } finally {
                setLoading(false);
            }
        };

        loadMenu();
    }, [API_URL, restaurantId]);

    if (loading) return <p>Loading...</p>;
    if (error) return <p>{error}</p>;

    return (
        <main className="content">
            <button onClick={() => navigate(-1)}>Back</button>

            <h1>Menu</h1>
            <button onClick={() => navigate(`/dashboard/restaurants/${restaurantId}/dishes/create`)}>
                Add dish
            </button>

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
                            <h2 style={{ marginTop: 0 }}>
                                {dish.name} — {dish.price.toFixed(2)} €
                            </h2>

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
    );
}