import { useParams } from "react-router-dom";

export function RestaurantLogin(){
    const { restaurantId } = useParams();
    return (
        <p>{restaurantId}</p>
    )
}