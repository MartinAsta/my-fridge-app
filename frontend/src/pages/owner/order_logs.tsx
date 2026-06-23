import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

type User = {
    id: number;
    username: string;
};

type Dish = {
    id: number;
    name: string;
    price: number;
};

type Order = {
    id: number;
    restaurant_id: number;
    waiter_id: number;
    dish_id: number;
    created_at: string;
    waiter: User;
    dish: Dish;
};

export function OrderLogs() {
    const { restaurantId } = useParams();
    const navigate = useNavigate();

    const [orders, setOrders] = useState<Order[]>([]);
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

        const loadOrders = async () => {
            try {
                const response = await fetch(`${API_URL}/get/orders/${restaurantId}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.detail || "Could not load orders");
                }

                setOrders(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Could not load orders");
            } finally {
                setLoading(false);
            }
        };

        loadOrders();
    }, [API_URL, restaurantId]);

    if (loading) return <p>Loading...</p>;
    if (error) return <p>{error}</p>;

    return (
        <main className="content">
            <button onClick={() => navigate(-1)}>Back</button>

            <h1>Order logs</h1>

            {orders.length === 0 ? (
                <p>No orders yet.</p>
            ) : (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                        <tr>
                            <th style={{ textAlign: "left", padding: "0.5rem" }}>Waiter</th>
                            <th style={{ textAlign: "left", padding: "0.5rem" }}>Dish</th>
                            <th style={{ textAlign: "left", padding: "0.5rem" }}>Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map((order) => (
                            <tr key={order.id}>
                                <td style={{ padding: "0.5rem" }}>
                                    {order.waiter.username}
                                </td>
                                <td style={{ padding: "0.5rem" }}>
                                    {order.dish.name}
                                </td>
                                <td style={{ padding: "0.5rem" }}>
                                    {new Date(order.created_at).toLocaleString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </main>
    );
}