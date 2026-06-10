import { useNavigate } from "react-router-dom";

export function Home() {
    return (
        <div className="app">
            <header className="header">
                <div className="logo">MyRestaurant</div>
                <LogInButton />
            </header>

            <main className="content">
                <h1>Welcome</h1>
            </main>
        </div>
    );
}

function LogInButton() {
    const navigate = useNavigate()
    return (
        <button className="login-button" onClick={() => navigate('/login')}>
            Log in
        </button>
    );
}