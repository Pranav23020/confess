import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { AuthContext } from '../context/AuthContext';
import BottomNav from '../components/BottomNav';

const LoginScreen = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login, error } = useContext(AuthContext);
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [oauthError, setOauthError] = useState(null);

    // Check for OAuth errors on mount
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const errorParam = params.get('error');
        if (errorParam) {
            const errorMessages = {
                'authentication_failed': 'Google authentication failed. Please try again.',
                'server_error': 'Server error during authentication. Please try again.'
            };
            setOauthError(errorMessages[errorParam] || 'Authentication failed');
            // Clean up URL
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        const success = await login(email, password);
        if (success) {
            navigate('/');
        }
        setIsSubmitting(false);
    };

    const handleGoogleLogin = () => {
        const API_URL = process.env.REACT_APP_API_URL || '/api';
        const baseURL = API_URL.replace(/\/api$/, '');
        window.location.href = `${baseURL}/api/auth/google`;
    };

    return (
        <div className="flex flex-col min-h-screen">
            <Helmet>
                <title>Login | AnonConfess</title>
                <meta name="robots" content="noindex,nofollow" />
                <link rel="canonical" href="https://www.anonconfess.in/login" />
            </Helmet>

            <div className="flex-grow flex flex-col justify-center px-4 py-12 sm:px-6 lg:px-8">
                <div className="sm:mx-auto sm:w-full sm:max-w-sm">
                    <h2 className="mt-6 sm:mt-10 text-center text-xl sm:text-2xl font-bold leading-9 tracking-tight text-white">
                        Sign in to your account
                    </h2>
                </div>

                <div className="mt-8 sm:mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <label htmlFor="email" className="block text-xs sm:text-sm font-medium leading-6 text-gray-300">
                                Email address
                            </label>
                            <div className="mt-2">
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="block w-full rounded-lg sm:rounded-md border-0 bg-white/5 py-2.5 sm:py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-primary text-sm sm:leading-6 px-3 sm:pl-3"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-xs sm:text-sm font-medium leading-6 text-gray-300">
                                Password
                            </label>
                            <div className="mt-2">
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full rounded-lg sm:rounded-md border-0 bg-white/5 py-2.5 sm:py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-primary text-sm sm:leading-6 px-3 sm:pl-3"
                                />
                            </div>
                            <div className="mt-2 text-right">
                                <Link
                                    to="/forgot-password"
                                    className="text-xs sm:text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
                                >
                                    Forgot password?
                                </Link>
                            </div>
                        </div>

                        {(error || oauthError) && <p className="text-red-500 text-xs sm:text-sm text-center">{error || oauthError}</p>}

                        <div>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex w-full justify-center rounded-lg sm:rounded-md bg-primary px-3 py-2.5 sm:py-1.5 text-xs sm:text-sm font-semibold leading-6 text-white shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50 active:scale-95 transition-all min-h-[44px] sm:min-h-auto"
                            >
                                {isSubmitting ? 'Signing in...' : 'Sign in'}
                            </button>
                        </div>
                    </form>

                    <div className="mt-6">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-700" />
                            </div>
                            <div className="relative flex justify-center text-xs sm:text-sm">
                                <span className="bg-background-dark px-2 text-gray-400">Or continue with</span>
                            </div>
                        </div>

                        <div className="mt-6">
                            <button
                                onClick={handleGoogleLogin}
                                className="flex w-full items-center justify-center gap-3 rounded-lg sm:rounded-md bg-white px-3 py-2.5 sm:py-1.5 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#DB4437] min-h-[44px] sm:min-h-auto transition-all active:scale-95"
                                style={{ backgroundColor: '#DB4437' }}
                            >
                                <svg className="h-5 w-5 fill-white" viewBox="0 0 24 24">
                                    <path d="M7 11v2.4h3.97c-.16 1.029-1.2 3.02-3.97 3.02-2.39 0-4.34-1.979-4.34-4.42 0-2.44 1.95-4.42 4.34-4.42 1.36 0 2.27.58 2.79 1.08l1.9-1.83c-1.22-1.14-2.8-1.83-4.69-1.83-3.87 0-7 3.13-7 7s3.13 7 7 7c4.04 0 6.721-2.84 6.721-6.84 0-.46-.051-.81-.111-1.16h-6.61zm0 0 17 2h-3v3h-2v-3h-3v-2h3v-3h2v3h3v2z" fillRule="evenodd" clipRule="evenodd" />
                                </svg>
                                <span className="text-xs sm:text-sm font-semibold leading-6">Google</span>
                            </button>
                        </div>
                    </div>

                    <p className="mt-10 text-center text-xs sm:text-sm text-gray-400">
                        Not a member?{' '}
                        <Link to="/register" className="font-semibold leading-6 text-primary hover:text-primary/80 transition-colors">
                            Register now
                        </Link>
                    </p>
                </div>
            </div>
            <BottomNav active="me" />
        </div>
    );
};

export default LoginScreen;
