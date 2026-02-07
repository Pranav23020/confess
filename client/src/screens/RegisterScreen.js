import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import BottomNav from '../components/BottomNav';

const RegisterScreen = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [localError, setLocalError] = useState(null);

    const { register, error } = useContext(AuthContext);
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setLocalError('Passwords do not match');
            return;
        }

        setLocalError(null);
        setIsSubmitting(true);
        const success = await register(username, email, password);
        if (success) {
            navigate('/');
        }
        setIsSubmitting(false);
    };

    return (
        <div className="flex flex-col min-h-screen">
            <div className="flex-grow flex flex-col justify-center px-4 py-12 sm:px-6 lg:px-8">
                <div className="sm:mx-auto sm:w-full sm:max-w-sm">
                    <h2 className="mt-6 sm:mt-10 text-center text-xl sm:text-2xl font-bold leading-9 tracking-tight text-white">
                        Create an account
                    </h2>
                </div>

                <div className="mt-8 sm:mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <label htmlFor="username" className="block text-xs sm:text-sm font-medium leading-6 text-gray-300">
                                Username
                            </label>
                            <div className="mt-2">
                                <input
                                    id="username"
                                    name="username"
                                    type="text"
                                    required
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="block w-full rounded-lg sm:rounded-md border-0 bg-white/5 py-2.5 sm:py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-primary text-sm sm:leading-6 px-3 sm:pl-3"
                                />
                            </div>
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

                        {(error || localError) && <p className="text-red-500 text-xs sm:text-sm text-center">{localError || error}</p>}

                        <div>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex w-full justify-center rounded-lg sm:rounded-md bg-primary px-3 py-2.5 sm:py-1.5 text-xs sm:text-sm font-semibold leading-6 text-white shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50 active:scale-95 transition-all min-h-[44px] sm:min-h-auto"
                            >
                                {isSubmitting ? 'Creating account...' : 'Sign up'}
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
            <BottomNav active="me" />
        </div>
    );
};

export default RegisterScreen;
