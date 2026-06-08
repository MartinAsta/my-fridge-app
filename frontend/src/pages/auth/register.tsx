export function Register() {
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
    };

    return (
        <div className="login-page">
            <main className="login-card">
                <h1>Register</h1>

                <form onSubmit={handleSubmit} className="login-form">
                    <label>
                        Email address
                        <input type="email" name="email" placeholder="mail@address.com" />
                    </label>

                    <label>
                        Username
                        <input type="text" name="username" placeholder="Your username" />
                    </label>

                    <label>
                        Password
                        <input type="password" name="password" placeholder="••••••••" />
                    </label>
                    <label>
                        Confirm password
                        <input type="password" name="confirmPassword" placeholder="••••••••" />
                    </label>

                    <div className="login-actions">
                        <button type="submit" className="login-submit">
                            Register
                        </button>
                    </div>
                </form>
            </main>
        </div>
    );
}