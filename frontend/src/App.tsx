import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Login } from './pages/auth/login';
import { Home } from './pages/home';
import { Register } from './pages/auth/register';
import { Dashboard } from './pages/user/dashboard';
import { CreateRestaurant } from './pages/owner/create_restaurant';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/dashboard/create_restaurant" element={<CreateRestaurant />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App
