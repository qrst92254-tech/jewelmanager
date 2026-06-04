import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';
import { LogIn } from 'lucide-react';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const login = useStore(state => state.login);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);
        try {
            await login(email, password);
            navigate('/dashboard');
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh', width: '100%', overflow: 'hidden' }} className="fade-in">
            {/* Left Branding Side (60%) */}
            <div 
                style={{ 
                    flex: '0 0 60%', 
                    background: '#FDF8F0', 
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '4rem'
                }}
            >
                {/* Diagonal divider element */}
                <div 
                    style={{
                        position: 'absolute',
                        right: 0,
                        top: 0,
                        bottom: 0,
                        width: '100px',
                        background: 'linear-gradient(to right bottom, transparent 49%, white 50%)',
                        zIndex: 10
                    }}
                />
                
                <div style={{ maxWidth: '600px', zIndex: 5 }}>
                    {/* Diamond Icon SVG */}
                    <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginBottom: '2rem' }}>
                        <path d="M12 2L2 9L12 22L22 9L12 2Z" stroke="var(--gold)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M2 9H22" stroke="var(--gold)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M12 22V9" stroke="var(--gold)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M12 2L7 9L12 22" stroke="var(--gold)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M12 2L17 9L12 22" stroke="var(--gold)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>

                    <h1 style={{ fontSize: '48px', color: 'var(--gold-dark)', margin: '0 0 1rem 0' }}>
                        JewelManager Pro
                    </h1>
                    <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '3rem' }}>
                        Complete jewellery shop management
                    </p>

                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        <li style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem', fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                            <span style={{ color: 'var(--gold)', marginRight: '1rem', fontSize: '1.5rem' }}>✦</span>
                            Live Gold & Silver Prices
                        </li>
                        <li style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem', fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                            <span style={{ color: 'var(--gold)', marginRight: '1rem', fontSize: '1.5rem' }}>✦</span>
                            GST-Ready Billing
                        </li>
                        <li style={{ display: 'flex', alignItems: 'center', fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                            <span style={{ color: 'var(--gold)', marginRight: '1rem', fontSize: '1.5rem' }}>✦</span>
                            Complete Inventory Control
                        </li>
                    </ul>
                </div>
            </div>

            {/* Right Form Side (40%) */}
            <div 
                style={{ 
                    flex: '0 0 40%', 
                    background: 'white', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    padding: '3rem'
                }}
            >
                <div style={{ width: '100%', maxWidth: '400px' }}>
                    <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                        <h2 style={{ fontSize: '36px', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Welcome Back</h2>
                        <p style={{ color: 'var(--text-muted)' }}>Sign in to your account</p>
                        <div style={{ height: '1px', background: 'var(--border-gold)', margin: '1.5rem auto 0', width: '60px' }} />
                    </div>

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div>
                            <label>Email</label>
                            <input 
                                type="email"
                                id="email"
                                name="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your email address"
                                required 
                            />
                        </div>
                        <div>
                            <label>Password</label>
                            <input 
                                type="password" 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                required 
                            />
                        </div>
                        
                        {error && (
                            <div style={{ padding: '0.75rem', background: '#FFF4F4', borderLeft: '4px solid #FF5252', color: '#D32F2F', fontSize: '0.9rem' }}>
                                {error}
                            </div>
                        )}

                        <button 
                            type="submit" 
                            className="btn-primary" 
                            style={{ width: '100%', marginTop: '0.5rem', opacity: isLoading ? 0.7 : 1 }}
                            disabled={isLoading}
                        >
                            <LogIn size={18} style={{ marginRight: '8px' }} />
                            {isLoading ? 'Signing In...' : 'Sign In'}
                        </button>
                    </form>

                    {/* Default credentials hint removed */}
                </div>
            </div>
        </div>
    );
};

export default Login;