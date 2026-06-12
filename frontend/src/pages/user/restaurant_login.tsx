import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

type Restaurant = {
    id: number;
    restaurant_name: string;
    owner_id: number;
    created_at: string;
};

export function RestaurantLogin() {
    const { restaurantId } = useParams();
    const navigate = useNavigate();
    const [restaurant, setRestaurant] = useState<Restaurant | null>(null);

    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const API_URL = import.meta.env.VITE_API_URL;

    useEffect(() => {
        if (!restaurantId) {
            setError("Missing restaurant id");
            setLoading(false);
            return;
        }

        const loadRestaurant = async () => {
            try {
                const response = await fetch(
                    `${API_URL}/restaurant/user/get/${restaurantId}`
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.detail || "Could not load restaurant");
                }

                setRestaurant(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Could not load restaurant");
            } finally {
                setLoading(false);
            }
        };

        loadRestaurant();
    }, [API_URL, restaurantId]);
    const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const token = localStorage.getItem("access_token");

            if (!token) {
                navigate("/login");
                return;
            }

            if (!restaurantId) {
                throw new Error("Missing restaurant id");
            }

            const response = await fetch(
                `${API_URL}/restaurant/login/${restaurantId}`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        password,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || "Could not join restaurant");
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
                <h1>Join restaurant {restaurant?.restaurant_name}</h1>

                <form onSubmit={handleSubmit}>
                    <label>
                        Restaurant password
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </label>

                    {error && <p>{error}</p>}

                    <button type="submit" disabled={loading}>
                        {loading ? "Joining..." : "Join"}
                    </button>
                </form>
            </main>
        </div>
    );
}