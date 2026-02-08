import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomeScreen from './screens/HomeScreen';
import NewConfessionScreen from './screens/NewConfessionScreen';
import ConfessionDetailScreen from './screens/ConfessionDetailScreen';
import ExploreScreen from './screens/ExploreScreen';
import HashtagExploreScreen from './screens/HashtagExploreScreen';
import ProfileScreen from './screens/ProfileScreen';
import LimitReachedScreen from './screens/LimitReachedScreen';
import ReportScreen from './screens/ReportScreen';
import ReportsHistoryScreen from './screens/ReportsHistoryScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import ForgotPasswordScreen from './screens/ForgotPasswordScreen';
import ResetPasswordScreen from './screens/ResetPasswordScreen';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import DesktopNav from './components/DesktopNav';

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
          <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-white overflow-x-hidden min-h-screen relative">
            <DesktopNav />
            <Routes>
              <Route path="/" element={<HomeScreen />} />
              <Route path="/login" element={<LoginScreen />} />
              <Route path="/register" element={<RegisterScreen />} />
              <Route path="/forgot-password" element={<ForgotPasswordScreen />} />
              <Route path="/reset-password/:token" element={<ResetPasswordScreen />} />
              <Route path="/new" element={<NewConfessionScreen />} />
              <Route path="/confession/:id" element={<ConfessionDetailScreen />} />
              <Route path="/explore" element={<ExploreScreen />} />
              <Route path="/hashtags/:tag" element={<HashtagExploreScreen />} />
              <Route path="/profile" element={<ProfileScreen />} />
              <Route path="/limit-reached" element={<LimitReachedScreen />} />
              <Route path="/report/:id/:type" element={<ReportScreen />} />
              <Route path="/reports-history" element={<ReportsHistoryScreen />} />
            </Routes>
          </div>
        </Router>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
