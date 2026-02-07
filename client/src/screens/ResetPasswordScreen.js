import React, { useMemo, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import BottomNav from '../components/BottomNav';
import { useToast } from '../context/ToastContext';

const ResetPasswordScreen = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const hasToken = useMemo(() => Boolean(token), [token]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!hasToken) {
            setError('Invalid or missing reset token. Please request a new link.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setIsSubmitting(true);
        try {
            const { data } = await api.post(`/auth/reset-password/${token}`, { 
                password, 
                confirmPassword 
            });
            const responseMessage = data?.message || 'Password reset successful. You can now log in.';
            showToast(responseMessage, 'success');
        } catch (err) {
            const errorMessage = err.response?.data?.error || 'Failed to reset password.';
            setError(errorMessage);
            showToast(errorMessage, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleGoToLogin = () => {
        navigate('/login');
    };

    return (
        <div className="flex flex-col min-h-screen">
            <div className="flex-grow flex flex-col justify-center px-4 py-12 sm:px-6 lg:px-8">
                <div className="sm:mx-auto sm:w-full sm:max-w-sm">
                    <h2 className="mt-6 sm:mt-10 text-center text-xl sm:text-2xl font-bold leading-9 tracking-tight text-white">
                        Set a new password
                    </h2>
                    <p className="mt-3 text-center text-xs sm:text-sm text-gray-400">
                        Choose a strong password you have not used before.
                    </p>
                </div>

                <div className="mt-8 sm:mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <label htmlFor="password" className="block text-xs sm:text-sm font-medium leading-6 text-gray-300">
                                New password
                            </label>
                            <div className="mt-2">
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="new-password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full rounded-lg sm:rounded-md border-0 bg-white/5 py-2.5 sm:py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-primary text-sm sm:leading-6 px-3 sm:pl-3"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="block text-xs sm:text-sm font-medium leading-6 text-gray-300">
                                Confirm new password
                            </label>
                            <div className="mt-2">
                                <input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type="password"
                                    autoComplete="new-password"
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="block w-full rounded-lg sm:rounded-md border-0 bg-white/5 py-2.5 sm:py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-primary text-sm sm:leading-6 px-3 sm:pl-3"
                                />
                            </div>
                        </div>

                        {error && <p className="text-red-500 text-xs sm:text-sm text-center">{error}</p>}

                        <div className="space-y-3">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex w-full justify-center rounded-lg sm:rounded-md bg-primary px-3 py-2.5 sm:py-1.5 text-xs sm:text-sm font-semibold leading-6 text-white shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50 active:scale-95 transition-all min-h-[44px] sm:min-h-auto"
                            >
                                {isSubmitting ? 'Updating...' : 'Update password'}
                            </button>
                            <button
                                type="button"
                                onClick={handleGoToLogin}
                                className="flex w-full justify-center rounded-lg sm:rounded-md border border-white/10 px-3 py-2.5 sm:py-1.5 text-xs sm:text-sm font-semibold leading-6 text-white/80 hover:text-white hover:border-white/20 transition-all min-h-[44px] sm:min-h-auto"
                            >
                                Back to login
                            </button>
                        </div>
                    </form>

                    <p className="mt-8 text-center text-xs sm:text-sm text-gray-400">
                        Need a new link?{' '}
                        <Link to="/forgot-password" className="font-semibold leading-6 text-primary hover:text-primary/80 transition-colors">
                            Request reset email
                        </Link>
                    </p>
                </div>
            </div>
            <BottomNav active="me" />
        </div>
    );
};

export default ResetPasswordScreen;
