import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

type Restaurant = {
    id: number;
    restaurant_name: string;
    owner_id: number;
    created_at: string;
};

export function Dashboard() {
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

        const loadDashboard = async () => {
            try {
                const restaurantsResponse = await fetch(
                    `${API_URL}/users/me/restaurants`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                const restaurantsData = await restaurantsResponse.json();

                if (!restaurantsResponse.ok) {
                    localStorage.removeItem("access_token");
                    navigate("/login");
                    return;
                }

                setRestaurants(restaurantsData);
            } catch {
                setError("Could not load dashboard");
            } finally {
                setLoading(false);
            }
        };

        loadDashboard();
    }, [API_URL, navigate]);

    return (
        <div>
            <main className="content">
                <button
                    type="button"
                    onClick={() => navigate("/")}
                >
                    Homepage
                </button>
                <button
                    type="button"
                    onClick={() => navigate("/dashboard/create_restaurant")}
                >
                    Create a restaurant
                </button>

                {error && <p>{error}</p>}

                {loading ? (
                    <p>Loading...</p>
                ) : (
                    <>
                        <h2>Your restaurants</h2>

                        {restaurants.length === 0 ? (
                            <p>You do not own any restaurant yet.</p>
                        ) : (
                            <ul style={{ listStyle: "none", paddingLeft: 0, margin: 0 }}>
                                {restaurants.map((restaurant) => (
                                    <li key={restaurant.id} style={{ marginBottom: "0.75rem" }}>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                navigate(`/dashboard/owner/restaurants/${restaurant.id}`)
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