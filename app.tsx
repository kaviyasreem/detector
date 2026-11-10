import React, { useState, useEffect } from 'react';
import { User, UserRole } from './types';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { LandingView } from './components/views/LandingView';
import { RoleSelectionView } from './components/views/RoleSelectionView';
import { LoginView } from './components/views/LoginView';
import { SubmitComplaintView } from './components/views/SubmitComplaintView';
import { TrackComplaintView } from './components/views/TrackComplaintView';
import { StudentDashboard } from './components/views/StudentDashboard';
import { DepartmentDashboard } from './components/views/DepartmentDashboard';
import { AdminDashboard } from './components/views/AdminDashboard';
import { AnalyticsView } from './components/views/AnalyticsView';
import { SuggestionsView } from './components/views/SuggestionsView';
import { setupRealtimeWebSocket, fetchNotifications } from './services/api';
import { Bell, Sparkles } from 'lucide-react';

export const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(() => {
    // Default demo session as student for immediate interactive demonstration!
    return {
      id: 1,
      email: 'student@kprcas.ac.in',
      name: 'Aravind Kumar (Student - B.Sc CS)',
      role: 'student'
    };
  });

  const [selectedRole, setSelectedRole] = useState<UserRole>('student');
  const [currentTab, setCurrentTab] = useState<string>('landing');
  const [selectedTrackingId, setSelectedTrackingId] = useState<string>('');
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync Notifications
  const refreshNotifications = () => {
    if (user?.email) {
      fetchNotifications(user.email).then(res => setUnreadCount(res.unreadCount)).catch(console.error);
    }
  };

  useEffect(() => {
    refreshNotifications();
  }, [user]);

  // Setup WebSocket Listener
  useEffect(() => {
    const cleanup = setupRealtimeWebSocket((event) => {
      console.log('[App WS Event]', event);
      if (event.type === 'COMPLAINT_CREATED') {
        setToastMessage(`🔔 New Complaint Submitted: ${event.data.tracking_id}`);
        refreshNotifications();
      } else if (event.type === 'STATUS_UPDATED') {
        setToastMessage(`📢 Status Update: ${event.data.tracking_id} → ${event.data.status}`);
        refreshNotifications();
      }
      setTimeout(() => setToastMessage(null), 5000);
    });

    return () => cleanup();
  }, [user]);

  const handleTabChange = (tab: string) => {
    if (tab.startsWith('track:')) {
      const id = tab.split('track:')[1];
      setSelectedTrackingId(id);
      setCurrentTab('track');
    } else {
      setCurrentTab(tab);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-kpr-bg text-kpr-navy">
      
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-kpr-blue text-white px-5 py-3 rounded-2xl shadow-2xl z-50 flex items-center gap-3 border border-blue-400 animate-bounce">
          <Sparkles className="w-5 h-5 text-kpr-green-light" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        user={user}
        currentTab={currentTab}
        setCurrentTab={handleTabChange}
        onLogout={() => {
          setUser(null);
          setCurrentTab('landing');
        }}
        onSelectRole={() => setCurrentTab('roles')}
        unreadCount={unreadCount}
        onNotificationRead={() => setUnreadCount(0)}
      />

      {/* Main App Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {currentTab === 'landing' && (
          <LandingView
            onGetStarted={() => setCurrentTab('roles')}
            onTrackComplaint={() => setCurrentTab('track')}
          />
        )}

        {currentTab === 'roles' && (
          <RoleSelectionView
            onSelectRole={(role) => {
              setSelectedRole(role);
              setCurrentTab('login');
            }}
            onBack={() => setCurrentTab('landing')}
          />
        )}

        {currentTab === 'login' && (
          <LoginView
            selectedRole={selectedRole}
            onLoginSuccess={(loggedInUser) => {
              setUser(loggedInUser);
              if (loggedInUser.role === 'admin') setCurrentTab('dashboard');
              else if (loggedInUser.role === 'department') setCurrentTab('dashboard');
              else setCurrentTab('dashboard');
            }}
            onBack={() => setCurrentTab('roles')}
          />
        )}

        {currentTab === 'submit' && user && (
          <SubmitComplaintView
            user={user}
            onSuccessSubmitted={(trackingId) => {
              setSelectedTrackingId(trackingId);
              setCurrentTab('track');
            }}
            onCancel={() => setCurrentTab('dashboard')}
          />
        )}

        {currentTab === 'track' && (
          <TrackComplaintView
            initialTrackingId={selectedTrackingId}
            user={user}
          />
        )}

        {currentTab === 'dashboard' && user && (
          user.role === 'admin' ? (
            <AdminDashboard
              user={user}
              onViewComplaint={(trackingId) => {
                setSelectedTrackingId(trackingId);
                setCurrentTab('track');
              }}
              onOpenAnalytics={() => setCurrentTab('analytics')}
            />
          ) : user.role === 'department' ? (
            <DepartmentDashboard
              user={user}
              onViewComplaint={(trackingId) => {
                setSelectedTrackingId(trackingId);
                setCurrentTab('track');
              }}
            />
          ) : (
            <StudentDashboard
              user={user}
              onNewComplaint={() => setCurrentTab('submit')}
              onViewComplaint={(trackingId) => {
                setSelectedTrackingId(trackingId);
                setCurrentTab('track');
              }}
            />
          )
        )}

        {currentTab === 'analytics' && (
          <AnalyticsView />
        )}

        {currentTab === 'suggestions' && (
          <SuggestionsView
            user={user}
            onNewSuggestion={() => setCurrentTab('submit')}
            onViewComplaint={(trackingId) => {
              setSelectedTrackingId(trackingId);
              setCurrentTab('track');
            }}
          />
        )}

      </main>

      {/* Footer */}
      <Footer />

    </div>
  );
};

export default App;
