
import React, { useState } from 'react';
import axios from 'axios';
import { Shield, User, Lock, LogIn, UserPlus } from 'lucide-react';
import './components.css'; // Reuse existing styles

const API_BASE = '';

const LoginScreen = ({ onLoginSuccess }) => {
    const [isRegistering, setIsRegistering] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const endpoint = isRegistering ? '/auth/register' : '/auth/login';

        try {
            const res = await axios.post(`${API_BASE}${endpoint}`, {
                username,
                password
            });

            if (isRegistering) {
                // After register, auto login or ask to login?
                // For simplicity, just tell them to login
                setIsRegistering(false);
                setError('Registration successful! Please login.');
                setLoading(false);
            } else {
                // Login Success
                const { token, username } = res.data;
                onLoginSuccess(token, username);
            }

        } catch (err) {
            console.error("Auth error", err);
            setError(err.response?.data?.error || "Authentication failed");
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card glass">
                <div className="text-center mb-6">
                    <Shield size={48} color="white" className="mx-auto mb-2" />
                    <h1 className="text-2xl font-bold">StegoChat</h1>
                    <p className="text-sm text-gray-400">Secure AI Steganography</p>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="input-with-icon">
                        <User size={18} className="icon" />
                        <input
                            type="text"
                            placeholder="Username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>

                    <div className="input-with-icon">
                        <Lock size={18} className="icon" />
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    {error && <div className="text-red-400 text-xs text-center">{error}</div>}

                    <button
                        type="submit"
                        className="auth-btn"
                        disabled={loading}
                    >
                        {loading ? 'Processing...' : (isRegistering ? 'Create Account' : 'Login')}
                    </button>
                </form>

                <div className="mt-4 text-center">
                    <button
                        className="text-xs text-gray-400 hover:text-white"
                        onClick={() => {
                            setIsRegistering(!isRegistering);
                            setError('');
                        }}
                    >
                        {isRegistering ? "Already have an account? Login" : "Don't have an account? Register"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LoginScreen;
