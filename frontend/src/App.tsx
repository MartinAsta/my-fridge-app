import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Login } from './pages/auth/login';
import { Home } from './pages/home';
import { Register } from './pages/auth/register';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App
