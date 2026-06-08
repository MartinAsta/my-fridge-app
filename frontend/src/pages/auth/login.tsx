import { useNavigate } from "react-router-dom";

export function Login() {
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
    };
    const navigate = useNavigate()

    return (
        <div className="login-page">
            <main className="login-card">
                <h1>Log in</h1>

                <form onSubmit={handleSubmit} className="login-form">
                    <label>
                        Email address
                        <input type="email" name="email" placeholder="mail@address.com" />
                    </label>

                    <label>
                        Password
                        <input type="password" name="password" placeholder="••••••••" />
                    </label>

                    <div className="login-actions">
                        <button type="submit" className="login-submit">
                            Log in
                        </button>

                        <button type="button" className="register-button" onClick={() => navigate('/register')}>
                            Register
                        </button>
                    </div>
                </form>
            </main>
        </div>
    );
}