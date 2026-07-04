import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './layouts/Layout';

// Pages
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ExploreCreators from './pages/ExploreCreators';
import ExploreProjects from './pages/ExploreProjects';
import CreatorProfile from './pages/CreatorProfile';
import ProjectDetails from './pages/ProjectDetails';
import Applications from './pages/Applications';
import Settings from './pages/Settings';
import HomeFeed from './pages/HomeFeed';
import Discover from './pages/Discover';
import Messages from './pages/Messages';
import Notifications from './pages/Notifications';
import Communities from './pages/Communities';
import Events from './pages/Events';

// Protected Route Guard Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

function AppContent() {
  return (
    <Layout>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/explore-creators" element={<ExploreCreators />} />
        <Route path="/explore-projects" element={<ExploreProjects />} />
        <Route path="/creator/:id" element={<CreatorProfile />} />
        <Route path="/project/:id" element={<ProjectDetails />} />

        {/* Protected Routes */}
        <Route 
          path="/feed" 
          element={
            <ProtectedRoute>
              <HomeFeed />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/discover" 
          element={
            <ProtectedRoute>
              <Discover />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/messages" 
          element={
            <ProtectedRoute>
              <Messages />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/notifications" 
          element={
            <ProtectedRoute>
              <Notifications />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/communities" 
          element={
            <ProtectedRoute>
              <Communities />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/events" 
          element={
            <ProtectedRoute>
              <Events />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/applications" 
          element={
            <ProtectedRoute>
              <Applications />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/settings" 
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          } 
        />

        {/* Catch-all fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
