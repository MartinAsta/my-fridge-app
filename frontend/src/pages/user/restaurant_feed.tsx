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
                const restaurantsResponse = await fetch(
                    `${API_URL}/restaurant/get/all`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                const data = await restaurantsResponse.json();

                if (!restaurantsResponse.ok) {
                    localStorage.removeItem("access_token");
                    navigate("/login");
                    return;
                }

                setRestaurants(data);
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
                                                console.log(restaurant.id);
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