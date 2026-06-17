import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

type Restaurant = {
    id: number;
    restaurant_name: string;
    owner_id: number;
    created_at: string;
};

type User = {
    id: number;
    email: string;
    username: string;
    created_at: string;
};

export function RestaurantPage() {
    const { restaurantId } = useParams();
    const navigate = useNavigate();

    const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
    const [pendingList, setPendingList] = useState<User[]>([]);
    const [waiterList, setWaiterList] = useState<User[]>([]);
    const [responsibleList, setResponsibleList] = useState<User[]>([])
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(false);
    const [addingWaiter, setAddingWaiter] = useState(false);
    const [addingResponsible, setAddingResponsible] = useState(false);
    const [deletingUser, setDeletingUser] = useState(false);

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
                const [restaurantResponse, pendingResponse, waiterResponse, responsibleResponse] = await Promise.all([
                    fetch(`${API_URL}/restaurant/get/${restaurantId}`, {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }),
                    fetch(`${API_URL}/restaurant/pending/${restaurantId}`, {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }),
                    fetch(`${API_URL}/get/waiters/${restaurantId}`, {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }),
                    fetch(`${API_URL}/get/responsibles/${restaurantId}`, {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    })
                ]);

                const restaurantData = await restaurantResponse.json();
                const pendingData = await pendingResponse.json();
                const waiterData = await waiterResponse.json();
                const responsibleData = await responsibleResponse.json();

                if (!restaurantResponse.ok) {
                    throw new Error(restaurantData.detail || "Could not load restaurant");
                }

                if (!pendingResponse.ok) {
                    throw new Error(pendingData.detail || "Could not load pending list");
                }

                if (!waiterResponse.ok) {
                    throw new Error(waiterData.detail || "Could not load waiters list");
                }

                if (!responsibleResponse.ok) {
                    throw new Error(responsibleData.detail || "Could not load responsibles list");
                }

                setRestaurant(restaurantData);
                setPendingList(pendingData);
                setWaiterList(waiterData);
                setResponsibleList(responsibleData);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Could not load restaurant");
            } finally {
                setLoading(false);
            }
        };

        loadRestaurant();
    }, [API_URL, restaurantId]);

    const handleAddWaiter = async (user_id: number) => {
        const token = localStorage.getItem("access_token");

        if (!token || !restaurantId) {
            setError("Missing restaurant or authentication");
            return;
        }
        const confirmed = window.confirm("Are you sure you want to add this user as a waiter ?")
        if (!confirmed) {
            return;
        }
        setAddingWaiter(true);
        setError("");

        try {
            const response = await fetch(
                `${API_URL}/waiter/add/${restaurantId}/${user_id}`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    }
                }
            );
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.detail || "Could not add to waiters");
            }
            navigate("/dashboard");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not add to waiters");
        } finally {
            setDeleting(false);
        }
    };

    const handleAddResponsible = async (user_id: number) => {
        const token = localStorage.getItem("access_token");
        if (!token || !restaurantId) {
            setError("Missing restaurant or authentication");
            return;
        }
        const confirmed = window.confirm("Are you sure you want to add this user as a responsible ?")
        if (!confirmed) {
            return;
        }
        setAddingResponsible(true);
        setError("");
        try {
            const response = await fetch(
                `${API_URL}/responsible/add/${restaurantId}/${user_id}`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.detail || "Could not add to responsibles");
            }
            navigate("/dashboard");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not add to responsibles");
        } finally {
            setDeleting(false);
        }
    }

    const handleDeleteUser = async (user_id: number) => {
        const token = localStorage.getItem("access_token");
        if (!token || !restaurantId) {
            setError("Missing restaurant or authentication");
            return;
        }
        const confirmed = window.confirm("Are you sure you want to deny entrance to this user ?");
        if (!confirmed) {
            return;
        }
        setDeletingUser(true);
        setError("");
        try {
            const response = await fetch(
                `${API_URL}/deny/restaurantaccess/${restaurantId}/${user_id}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.detail || "Could not delete this user");
            }
            navigate("/dashboard");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not delete this user");
        } finally {
            setDeletingUser(false);
        }
    }

    const handleDelete = async () => {
        const token = localStorage.getItem("access_token");

        if (!token || !restaurantId) {
            setError("Missing restaurant or authentication");
            return;
        }

        const confirmed = window.confirm("Are you sure you want to delete this restaurant ?");
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
                    }
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
    if (!restaurant) return <p>Restaurant not found</p>;

    return (
        <div>
            <h1>{restaurant.restaurant_name}</h1>

            <button type="button" onClick={handleDelete} disabled={deleting}>
                {deleting ? "Deleting..." : "Delete restaurant"}
            </button>

            {pendingList.length === 0 ? null :
                (
                    <ul style={{ listStyle: "none", paddingLeft: 0, margin: 0 }}>
                        {pendingList.map((user) => (
                            <>
                                <h2>Pending requests</h2>
                                <li key={user.id} style={{ marginBottom: "0.75rem" }}>
                                    <span>{user.username}</span>
                                    <button type="button" onClick={() => handleAddWaiter(user.id)} disabled={addingWaiter}>
                                        {addingWaiter ? "Adding waiter..." : "Waiter"}
                                    </button>
                                    <button type="button" onClick={() => handleAddResponsible(user.id)} disabled={addingResponsible}>
                                        {addingResponsible ? "Adding responsible..." : "Responsible"}
                                    </button>
                                    <button type="button" onClick={() => handleDeleteUser(user.id)} disabled={deletingUser}>
                                        {deletingUser ? "Deleting user..." : "Deny"}
                                    </button>
                                </li>
                            </>
                        ))}
                    </ul>
                )}
            {waiterList.length === 0 ? null :
                (
                    <ul style={{ listStyle: "none", paddingLeft: 0, margin: 0 }}>
                        <h2>Waiters</h2>
                        {waiterList.map((user) => (
                            <>
                                <li key={user.id} style={{ marginBottom: "0.75rem" }}>
                                    <span>{user.username}</span>
                                </li>
                            </>
                        ))}
                    </ul>
                )}
            {responsibleList.length === 0 ? null :
                (
                    <ul style={{ listStyle: "none", paddingLeft: 0, margin: 0 }}>
                        <h2>Responsibles</h2>
                        {responsibleList.map((user) => (
                            <>
                                <li key={user.id} style={{ marginBottom: "0.75rem" }}>
                                    <span>{user.username}</span>
                                </li>
                            </>
                        ))}
                    </ul>
                )}
        </div>
    );
}