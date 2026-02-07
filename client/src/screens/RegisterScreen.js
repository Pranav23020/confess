import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../api';
import BottomNav from '../components/BottomNav';

const RegisterScreen = () => {
    const [searchParams] = useSearchParams();
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [localError, setLocalError] = useState(null);
    const [usernameError, setUsernameError] = useState('');
    const [usernameAvailable, setUsernameAvailable] = useState(null);
    const [isCheckingUsername, setIsCheckingUsername] = useState(false);

    // Google OAuth data
    const [isGoogleRegistration, setIsGoogleRegistration] = useState(false);
    const [googleData, setGoogleData] = useState({});

    const { register, error } = useContext(AuthContext);
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        // Check if this is a Google registration (redirected from Google OAuth)
        const googleId = searchParams.get('googleId');
        if (googleId) {
            setIsGoogleRegistration(true);
            setGoogleData({
                email: searchParams.get('email'),
                displayName: searchParams.get('displayName'),
                googleId: googleId,
                avatar: searchParams.get('avatar')
            });
            setEmail(searchParams.get('email'));
        }
    }, [searchParams]);

    // Check username availability with debounce
    useEffect(() => {
        if (!username || username.length < 3) {
            setUsernameAvailable(null);
            setUsernameError('');
            return;
        }

        const checkUsername = async () => {
            setIsCheckingUsername(true);
            try {
                const response = await api.post('/auth/check-username', { username });
                setUsernameAvailable(response.data.available);
                if (!response.data.available) {
                    setUsernameError('Username already taken');
                } else {
                    setUsernameError('');
                }
            } catch (err) {
                setUsernameError('Error checking username');
            } finally {
                setIsCheckingUsername(false);
            }
        };

        const timer = setTimeout(checkUsername, 500);
        return () => clearTimeout(timer);
    }, [username]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!usernameAvailable) {
            setLocalError('Username is not available');
            return;
        }

        if (!isGoogleRegistration && password !== confirmPassword) {
            setLocalError('Passwords do not match');
            return;
        }

        setLocalError(null);
        setIsSubmitting(true);

        try {
            if (isGoogleRegistration) {
                // Register with Google
                const response = await api.post('/auth/register', {
                    username,
                    email,
                    googleId: googleData.googleId,
                    avatar: googleData.avatar
                });
                
                if (response.data.token) {
                    localStorage.setItem('token', response.data.token);
                    navigate('/');
                }
            } else {
                // Register with email/password
                const success = await register(username, email, password);
                if (success) {
                    navigate('/');
                }
            }
        } catch (err) {
            setLocalError(err.response?.data?.error || 'Registration failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen">
            <div className="flex-grow flex flex-col justify-center px-4 py-12 sm:px-6 lg:px-8">
                <div className="sm:mx-auto sm:w-full sm:max-w-sm">
                    <h2 className="mt-6 sm:mt-10 text-center text-xl sm:text-2xl font-bold leading-9 tracking-tight text-white">
                        {isGoogleRegistration ? 'Complete Your Profile' : 'Create an account'}
                    </h2>
                </div>

                <div className="mt-8 sm:mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <label htmlFor="username" className="block text-xs sm:text-sm font-medium leading-6 text-gray-300">
                                Username <span className="text-red-400">*</span>
                            </label>
                            <div className="mt-2 relative">
                                <input
                                    id="username"
                                    name="username"
                                    type="text"
                                    required
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    minLength="3"
                                    className={`block w-full rounded-lg sm:rounded-md border-0 bg-white/5 py-2.5 sm:py-1.5 text-white shadow-sm ring-1 ring-inset ${
                                        usernameAvailable === true ? 'ring-green-500' 
                                        : usernameAvailable === false ? 'ring-red-500' 
                                        : 'ring-white/10'
                                    } focus:ring-2 focus:ring-inset focus:ring-primary text-sm sm:leading-6 px-3 sm:pl-3`}
                                />
                                {isCheckingUsername && (
                                    <span className="text-xs text-gray-400 absolute right-3 top-3">Checking...</span>
                                )}
                            </div>
                            {usernameError && <p className="text-red-400 text-xs sm:text-sm mt-1">{usernameError}</p>}
                            {usernameAvailable === true && (
                                <p className="text-green-400 text-xs sm:text-sm mt-1">Username available</p>
                            )}
                        </div>

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
                                    disabled={isGoogleRegistration}
                                    className="block w-full rounded-lg sm:rounded-md border-0 bg-white/5 py-2.5 sm:py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-primary text-sm sm:leading-6 px-3 sm:pl-3 disabled:opacity-50"
                                />
                            </div>
                        </div>

                        {!isGoogleRegistration && (
                            <>
                                <div>
                                    <label htmlFor="password" className="block text-xs sm:text-sm font-medium leading-6 text-gray-300">
                                        Password
                                    </label>
                                    <div className="mt-2">
                                        <input
                                            id="password"
                                            name="password"
                                            type="password"
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="block w-full rounded-lg sm:rounded-md border-0 bg-white/5 py-2.5 sm:py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-primary text-sm sm:leading-6 px-3 sm:pl-3"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="confirmPassword" className="block text-xs sm:text-sm font-medium leading-6 text-gray-300">
                                        Confirm Password
                                    </label>
                                    <div className="mt-2">
                                        <input
                                            id="confirmPassword"
                                            name="confirmPassword"
                                            type="password"
                                            required
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="block w-full rounded-lg sm:rounded-md border-0 bg-white/5 py-2.5 sm:py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-primary text-sm sm:leading-6 px-3 sm:pl-3"
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        {(localError || error) && (
                            <p className="text-red-500 text-xs sm:text-sm text-center">{localError || error}</p>
                        )}

                        <div>
                            <button
                                type="submit"
                                disabled={isSubmitting || !usernameAvailable || isCheckingUsername}
                                className="flex w-full justify-center rounded-lg sm:rounded-md bg-primary px-3 py-2.5 sm:py-1.5 text-xs sm:text-sm font-semibold leading-6 text-white shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50 active:scale-95 transition-all min-h-[44px] sm:min-h-auto"
                            >
                                {isSubmitting ? 'Registering...' : isGoogleRegistration ? 'Complete Registration' : 'Sign up'}
                            </button>
                        </div>
                    </form>

                    <p className="mt-10 text-center text-xs sm:text-sm text-gray-400">
                        Already have an account?{' '}
                        <Link to="/login" className="font-semibold leading-6 text-primary hover:text-primary/80 transition-colors">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
            <BottomNav active="login" />
        </div>
    );
};

export default RegisterScreen;
