import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import BottomNav from '../components/BottomNav';
import { useToast } from '../context/ToastContext';

const ForgotPasswordScreen = () => {
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const { showToast } = useToast();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setMessage('');
        setError('');

        try {
            const { data } = await api.post('/auth/forgot-password', { email });
            const responseMessage = data?.message || 'If an account exists, a reset link has been sent.';
            setMessage(responseMessage);
            showToast(responseMessage, 'success');
        } catch (err) {
            const errorMessage = err.response?.data?.error || 'Failed to request password reset.';
            setError(errorMessage);
            showToast(errorMessage, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen">
            <div className="flex-grow flex flex-col justify-center px-4 py-12 sm:px-6 lg:px-8">
                <div className="sm:mx-auto sm:w-full sm:max-w-sm">
                    <h2 className="mt-6 sm:mt-10 text-center text-xl sm:text-2xl font-bold leading-9 tracking-tight text-white">
                        Forgot your password?
                    </h2>
                    <p className="mt-3 text-center text-xs sm:text-sm text-gray-400">
                        Enter your email and we will send a reset link.
                    </p>
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
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex w-full justify-center rounded-lg sm:rounded-md bg-primary px-3 py-2.5 sm:py-1.5 text-xs sm:text-sm font-semibold leading-6 text-white shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50 active:scale-95 transition-all min-h-[44px] sm:min-h-auto"
                            >
                                {isSubmitting ? 'Sending...' : 'Send reset link'}
                            </button>
                        </div>
                    </form>

                    <p className="mt-8 text-center text-xs sm:text-sm text-gray-400">
                        Remembered your password?{' '}
                        <Link to="/login" className="font-semibold leading-6 text-primary hover:text-primary/80 transition-colors">
                            Back to login
                        </Link>
                    </p>
                </div>
            </div>
            <BottomNav active="me" />
        </div>
    );
};

export default ForgotPasswordScreen;
