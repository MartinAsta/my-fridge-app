import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Login } from './pages/auth/login';
import { Home } from './pages/home';
import { Register } from './pages/auth/register';
import { Dashboard } from './pages/user/dashboard';
import { CreateRestaurant } from './pages/owner/create_restaurant';
import { RestaurantPage } from './pages/owner/restaurant_page';
import { RestaurantFeed } from './pages/user/restaurant_feed';
import { RestaurantLogin } from './pages/user/restaurant_login';
import { CreateIngredient } from './pages/responsible/create_ingredient';
import { Fridge } from './pages/owner/fridge';
import { CreateDish } from './pages/owner/create_dish';
import { Menu } from './pages/owner/menu';
import { WaiterMenu } from './pages/waiter/waiter_menu';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/" element={<Home />} />
        <Route
          path="/login" element={<Login />} />
        <Route
          path="/register" element={<Register />} />
        <Route
          path="/dashboard" element={<Dashboard />} />
        <Route
          path="/dashboard/create_restaurant" element={<CreateRestaurant />} />
        <Route
          path="/dashboard/owner/restaurants/:restaurantId" element={<RestaurantPage />} />
        <Route
          path="/restaurants" element={<RestaurantFeed />} />
        <Route
          path="/restaurants/login/:restaurantId" element={<RestaurantLogin />} />
        <Route
          path="/dashboard/add_ingredient" element={<CreateIngredient />} />
        <Route
          path="/dashboard/owner/restaurants/:restaurantId/fridge" element={<Fridge />} />
        <Route
          path="/dashboard/restaurants/:restaurantId/dishes" element={<Menu />} />
        <Route
          path="/dashboard/restaurants/:restaurantId/dishes/create" element={<CreateDish />} />
        <Route
          path="/dashboard/waiter/restaurants/:restaurantId/menu" element={<WaiterMenu />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App
