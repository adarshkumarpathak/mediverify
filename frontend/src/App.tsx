import React from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import { AnimatePresence, motion } from 'framer-motion'
import 'react-toastify/dist/ReactToastify.css'
import { Navbar } from './components/Navbar'
import { Sidebar } from './components/Sidebar'
import { ProtectedRoute } from './components/ProtectedRoute'

import DoctorDashboard from './pages/doctor/Dashboard'
import Upload from './pages/doctor/Upload'
import Result from './pages/doctor/Result'
import History from './pages/doctor/History'
import Profile from './pages/doctor/Profile'
import AdminDashboard from './pages/admin/Dashboard'
import Users from './pages/admin/Users'
import Logs from './pages/admin/Logs'
import Analytics from './pages/admin/Analytics'
import Login from './pages/public/Login'

// Wraps a page with a fade+slide transition
const PageTransition = ({ children }: { children: React.ReactNode }) => (
    <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.28, ease: 'easeOut' }}
        className="h-full"
    >
        {children}
    </motion.div>
);

// Layout wrapper for authenticated routes
const AuthenticatedLayout = ({ children }: { children: React.ReactNode }) => (
    <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-background h-[calc(100vh-4rem)]">
            {children}
        </main>
    </div>
);

// Inner app reads location for AnimatePresence key
const AppRoutes = () => {
    const location = useLocation();
    return (
        <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="/login" element={<PageTransition><Login /></PageTransition>} />

                {/* Doctor Routes */}
                <Route path="/doctor/*" element={
                    <ProtectedRoute allowedRoles={['doctor']}>
                        <AuthenticatedLayout>
                            <Routes>
                                <Route path="dashboard" element={<PageTransition><DoctorDashboard /></PageTransition>} />
                                <Route path="upload" element={<PageTransition><Upload /></PageTransition>} />
                                <Route path="result/:id" element={<PageTransition><Result /></PageTransition>} />
                                <Route path="history" element={<PageTransition><History /></PageTransition>} />
                                <Route path="profile" element={<PageTransition><Profile /></PageTransition>} />
                                <Route path="*" element={<Navigate to="dashboard" replace />} />
                            </Routes>
                        </AuthenticatedLayout>
                    </ProtectedRoute>
                } />

                {/* Admin Routes */}
                <Route path="/admin/*" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                        <AuthenticatedLayout>
                            <Routes>
                                <Route path="dashboard" element={<PageTransition><AdminDashboard /></PageTransition>} />
                                <Route path="users" element={<PageTransition><Users /></PageTransition>} />
                                <Route path="analytics" element={<PageTransition><Analytics /></PageTransition>} />
                                <Route path="logs" element={<PageTransition><Logs /></PageTransition>} />
                                <Route path="*" element={<Navigate to="dashboard" replace />} />
                            </Routes>
                        </AuthenticatedLayout>
                    </ProtectedRoute>
                } />

                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        </AnimatePresence>
    );
};

function App() {
    return (
        <BrowserRouter>
            <div className="min-h-screen bg-background flex flex-col font-sans">
                <Navbar />
                <AppRoutes />
            </div>
            <ToastContainer
                position="bottom-right"
                toastClassName="!bg-card !border !border-border !text-foreground !rounded-2xl !shadow-xl"
            />
        </BrowserRouter>
    )
}

export default App
