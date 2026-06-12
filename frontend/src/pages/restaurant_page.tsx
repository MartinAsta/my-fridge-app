import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

type Restaurant = {
    id: number;
    restaurant_name: string;
    owner_id: number;
    created_at: string;
};

export function RestaurantPage() {
    const { restaurantId } = useParams();
    const navigate = useNavigate();

    const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(false);

    const API_URL = import.meta.env.VITE_API_URL;

    useEffect(() => {
        const token = localStorage.getItem("access_token");

        if (!token || !restaurantId) {
            setError("Missing restaurant or authentication");
            setLoading(false);
            return;
        }

        const loadRestaurant = async () => {
            try {
                const response = await fetch(
                    `${API_URL}/restaurant/get/${restaurantId}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
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

    const handleDelete = async () => {
        const token = localStorage.getItem("access_token");

        if (!token || !restaurantId) {
            setError("Missing restaurant or authentication");
            return;
        }

        const confirmed = window.confirm(
            "Are you sure you want to delete this restaurant?"
        );

        if (!confirmed) {
            return;
        }

        setDeleting(true);
        setError("");

        try {
            const response = await fetch(
                `${API_URL}/restaurant/delete/${restaurantId}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.detail || "Could not delete restaurant");
            }

            navigate("/dashboard");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not delete restaurant");
        } finally {
            setDeleting(false);
        }
    };

    if (loading) return <p>Loading...</p>;
    if (error) return <p>{error}</p>;

    return (
        <div>
            <h1>{restaurant?.restaurant_name}</h1>

            <button type="button" onClick={handleDelete} disabled={deleting}>
                {deleting ? "Deleting..." : "Delete restaurant"}
            </button>
        </div>
    );
}