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
    const [restaurantsWaiter, setRestaurantsWaiter] = useState<Restaurant[]>([]);
    const [restaurantsResponsible, setRestaurantsResponsible] = useState<Restaurant[]>([]);
    const [restaurantsPending, setRestaurantPending] = useState<Restaurant[]>([]);
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
                const [
                    ownedResponse,
                    waiterResponse,
                    responsibleResponse,
                    pendingResponse
                ] = await Promise.all([
                    fetch(`${API_URL}/users/me/restaurants`, {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }),
                    fetch(`${API_URL}/waiter/restaurant/get/all`, {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }),
                    fetch(`${API_URL}/responsible/restaurant/get/all`, {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }),
                    fetch(`${API_URL}/pending/restaurants/get`, {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    })
                ]);

                const ownedData = await ownedResponse.json();
                const waiterData = await waiterResponse.json();
                const responsibleData = await responsibleResponse.json();
                const pendingData = await pendingResponse.json();

                if (!ownedResponse.ok) {
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

                if (!pendingResponse.ok) {
                    throw new Error(pendingData.detail || "Could not load waiting list");
                }

                setRestaurants(ownedData);
                setRestaurantsWaiter(waiterData);
                setRestaurantsResponsible(responsibleData);
                setRestaurantPending(pendingData);
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
                        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                            <div>
                                {restaurants.length === 0 ? (null) : (
                                    <>
                                        <h2>Your restaurants</h2>
                                        <ul style={{ listStyle: "none", paddingLeft: 0, margin: 0 }}>
                                            {restaurants.map((restaurant) => (
                                                <li key={restaurant.id} style={{ marginBottom: "0.75rem" }}>
                                                    <button
                                                        type="button"
                                                        onClick={() => navigate(`/dashboard/owner/restaurants/${restaurant.id}`)}
                                                    >
                                                        {restaurant.restaurant_name}
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    </>
                                )}
                            </div>

                            <div>
                                {restaurantsWaiter.length === 0 ? (
                                    null
                                ) : (
                                    <>
                                        <h2>Restaurants where you are waiter</h2>
                                        <ul style={{ listStyle: "none", paddingLeft: 0, margin: 0 }}>
                                            {restaurantsWaiter.map((restaurant) => (
                                                <li key={restaurant.id} style={{ marginBottom: "0.75rem" }}>
                                                    <span>{restaurant.restaurant_name}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </>
                                )}
                            </div>

                            <div>
                                {restaurantsResponsible.length === 0 ? (
                                    null
                                ) : (
                                    <>
                                        <h2>Restaurants where you are responsible</h2>
                                        <ul style={{ listStyle: "none", paddingLeft: 0, margin: 0 }}>
                                            {restaurantsResponsible.map((restaurant) => (
                                                <li key={restaurant.id} style={{ marginBottom: "0.75rem" }}>
                                                    <span>{restaurant.restaurant_name}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </>
                                )}
                            </div>
                            <div>
                                {restaurantsPending.length === 0 ? (
                                    null
                                ) : (
                                    <>
                                        <h2>Waiting list</h2>
                                        <ul style={{ listStyle: "none", paddingLeft: 0, margin: 0 }}>
                                            {restaurantsPending.map((restaurant) => (
                                                <li key={restaurant.id} style={{ marginBottom: "0.75rem" }}>
                                                    <span>{restaurant.restaurant_name}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </>
                                )}
                            </div>
                            <div>
                                {restaurantsResponsible.length === 0 && restaurants.length === 0 ? (
                                    null
                                ) : (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => navigate("/dashboard/add_ingredient")}
                                        >
                                            Add an ingredient
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}