import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

type Restaurant = {
    id: number;
    restaurant_name: string;
    owner_id: number;
    created_at: string;
};

export function RestaurantFeed() {
    const navigate = useNavigate();
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const API_URL = import.meta.env.VITE_API_URL;

    useEffect(() => {
        const token = localStorage.getItem("access_token");

        if (!token) {
            navigate("/login");
            return;
        }

        const loadRestaurantFeed = async () => {
            try {
                const [restaurantsResponse, waiterResponse, responsibleResponse] =
                    await Promise.all([
                        fetch(`${API_URL}/restaurant/get/all`, {
                            headers: {
                                Authorization: `Bearer ${token}`
                            },
                        }),
                        fetch(`${API_URL}/waiter/restaurant/get/all`, {
                            headers: {
                                Authorization: `Bearer ${token}`
                            },
                        }),
                        fetch(`${API_URL}/responsible/restaurant/get/all`, {
                            headers: {
                                Authorization: `Bearer ${token}`
                            },
                        }),
                    ]);

                const restaurantsData = await restaurantsResponse.json();
                const waiterData = await waiterResponse.json();
                const responsibleData = await responsibleResponse.json();

                if (!restaurantsResponse.ok) {
                    localStorage.removeItem("access_token");
                    navigate("/login");
                    return;
                }

                if (!waiterResponse.ok) {
                    throw new Error(waiterData.detail || "Could not load waiter restaurants");
                }

                if (!responsibleResponse.ok) {
                    throw new Error(responsibleData.detail || "Could not load responsible restaurants");
                }

                const excludedIds = new Set<number>([
                    ...waiterData.map((restaurant: Restaurant) => restaurant.id),
                    ...responsibleData.map((restaurant: Restaurant) => restaurant.id),
                ]);

                setRestaurants(
                    restaurantsData.filter(
                        (restaurant: Restaurant) => !excludedIds.has(restaurant.id)
                    )
                );
            } catch {
                setError("Could not load restaurants feed");
            } finally {
                setLoading(false);
            }
        };

        loadRestaurantFeed();
    }, [API_URL, navigate]);

    return (
        <div>
            <main className="content">
                {error && <p>{error}</p>}

                {loading ? (
                    <p>Loading...</p>
                ) : (
                    <>
                        <h2>Restaurants</h2>

                        {restaurants.length === 0 ? (
                            <p>There is no restaurant you can apply to.</p>
                        ) : (
                            <ul style={{ listStyle: "none", paddingLeft: 0, margin: 0 }}>
                                {restaurants.map((restaurant) => (
                                    <li key={restaurant.id} style={{ marginBottom: "0.75rem" }}>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                navigate(`/restaurants/login/${restaurant.id}`);
                                            }}
                                        >
                                            {restaurant.restaurant_name}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </>
                )}
            </main>
        </div>
    );
}