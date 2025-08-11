import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Login.css';

const Login = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [showRegister, setShowRegister] = useState(false);
    const [registerData, setRegisterData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        firstName: '',
        lastName: ''
    });
    
    const { login, register, error, clearError } = useAuth();
    const navigate = useNavigate();

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (showRegister) {
            setRegisterData(prev => ({ ...prev, [name]: value }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        clearError();
        
        const result = await login(formData.email, formData.password);
        if (result.success) {
            navigate('/dashboard');
        }
        setIsLoading(false);
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        if (registerData.password !== registerData.confirmPassword) {
            alert('Passwords do not match!');
            return;
        }
        
        setIsLoading(true);
        clearError();
        
        const userData = {
            username: registerData.username,
            email: registerData.email,
            password: registerData.password,
            first_name: registerData.firstName,
            last_name: registerData.lastName
        };
        
        const result = await register(userData);
        if (result.success) {
            navigate('/dashboard');
        }
        setIsLoading(false);
    };

    const toggleMode = () => {
        setShowRegister(!showRegister);
        clearError();
        setFormData({ email: '', password: '' });
        setRegisterData({
            username: '',
            email: '',
            password: '',
            confirmPassword: '',
            firstName: '',
            lastName: ''
        });
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <div className="logo">
                        <span className="logo-icon">🚨</span>
                        <h1>Beacon</h1>
                    </div>
                    <p className="tagline">Emergency Response System</p>
                </div>

                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

                {!showRegister ? (
                    // Login Form
                    <form onSubmit={handleLogin} className="login-form">
                        <h2>Welcome Back</h2>
                        <p className="form-subtitle">Sign in to your account</p>
                        
                        <div className="form-group">
                            <label htmlFor="email">Email</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                required
                                placeholder="Enter your email"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="password">Password</label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleInputChange}
                                required
                                placeholder="Enter your password"
                            />
                        </div>

                        <button 
                            type="submit" 
                            className="login-btn"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Signing In...' : 'Sign In'}
                        </button>

                        <div className="demo-credentials">
                            <h4>Demo Credentials:</h4>
                            <p><strong>Email:</strong> demo@beacon.com</p>
                            <p><strong>Password:</strong> demo123</p>
                        </div>

                        <div className="form-footer">
                            <p>
                                Don't have an account?{' '}
                                <button 
                                    type="button" 
                                    className="link-btn"
                                    onClick={toggleMode}
                                >
                                    Sign Up
                                </button>
                            </p>
                        </div>
                    </form>
                ) : (
                    // Register Form
                    <form onSubmit={handleRegister} className="login-form">
                        <h2>Create Account</h2>
                        <p className="form-subtitle">Join Beacon today</p>
                        
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="firstName">First Name</label>
                                <input
                                    type="text"
                                    id="firstName"
                                    name="firstName"
                                    value={registerData.firstName}
                                    onChange={handleInputChange}
                                    required
                                    placeholder="First name"
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="lastName">Last Name</label>
                                <input
                                    type="text"
                                    id="lastName"
                                    name="lastName"
                                    value={registerData.lastName}
                                    onChange={handleInputChange}
                                    required
                                    placeholder="Last name"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="username">Username</label>
                            <input
                                type="text"
                                id="username"
                                name="username"
                                value={registerData.username}
                                onChange={handleInputChange}
                                required
                                placeholder="Choose a username"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="regEmail">Email</label>
                            <input
                                type="email"
                                id="regEmail"
                                name="email"
                                value={registerData.email}
                                onChange={handleInputChange}
                                required
                                placeholder="Enter your email"
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="regPassword">Password</label>
                                <input
                                    type="password"
                                    id="regPassword"
                                    name="password"
                                    value={registerData.password}
                                    onChange={handleInputChange}
                                    required
                                    placeholder="Create password"
                                    minLength="8"
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="confirmPassword">Confirm Password</label>
                                <input
                                    type="password"
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    value={registerData.confirmPassword}
                                    onChange={handleInputChange}
                                    required
                                    placeholder="Confirm password"
                                    minLength="8"
                                />
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            className="login-btn"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Creating Account...' : 'Create Account'}
                        </button>

                        <div className="form-footer">
                            <p>
                                Already have an account?{' '}
                                <button 
                                    type="button" 
                                    className="link-btn"
                                    onClick={toggleMode}
                                >
                                    Sign In
                                </button>
                            </p>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default Login;
