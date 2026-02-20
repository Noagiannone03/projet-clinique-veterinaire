import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './components/layout';
import { RoleGuard } from './components/layout/RoleGuard';
import { ClinicProvider } from './context/ClinicContext';
import { AuthProvider } from './context/AuthContext';
import { SidebarProvider } from './context/SidebarContext';
import { ToastProvider } from './components/ui/Toast';
import { Login } from './pages/Login';
import {
    DirectorDashboard,
    ClinicDashboard,
    Patients,
    PatientDetail,
    Appointments,
    Inventory,
    Billing,
    Prescriptions,
} from './pages';

function App() {
    return (
        <AuthProvider>
            <ClinicProvider>
                <ToastProvider>
                    <SidebarProvider>
                        <BrowserRouter>
                            <Routes>
                                <Route path="/login" element={<Login />} />
                                <Route element={<MainLayout />}>
                                    {/* Director only */}
                                    <Route
                                        path="/"
                                        element={
                                            <RoleGuard allowedRoles={['director']}>
                                                <DirectorDashboard />
                                            </RoleGuard>
                                        }
                                    />

                                    {/* Vet + Assistant clinical pages */}
                                    <Route
                                        path="/clinic"
                                        element={
                                            <RoleGuard allowedRoles={['veterinarian', 'assistant']}>
                                                <ClinicDashboard />
                                            </RoleGuard>
                                        }
                                    />
                                    <Route
                                        path="/patients"
                                        element={
                                            <RoleGuard allowedRoles={['veterinarian', 'assistant']}>
                                                <Patients />
                                            </RoleGuard>
                                        }
                                    />
                                    <Route
                                        path="/patients/:id"
                                        element={
                                            <RoleGuard allowedRoles={['veterinarian', 'assistant']}>
                                                <PatientDetail />
                                            </RoleGuard>
                                        }
                                    />
                                    <Route
                                        path="/appointments"
                                        element={
                                            <RoleGuard allowedRoles={['veterinarian', 'assistant']}>
                                                <Appointments />
                                            </RoleGuard>
                                        }
                                    />

                                    {/* Vet + Assistant only */}
                                    <Route
                                        path="/inventory"
                                        element={
                                            <RoleGuard allowedRoles={['veterinarian', 'assistant']}>
                                                <Inventory />
                                            </RoleGuard>
                                        }
                                    />

                                    {/* Director + Assistant only */}
                                    <Route
                                        path="/billing"
                                        element={
                                            <RoleGuard allowedRoles={['director', 'assistant']}>
                                                <Billing />
                                            </RoleGuard>
                                        }
                                    />
                                    <Route
                                        path="/prescriptions"
                                        element={
                                            <RoleGuard allowedRoles={['director', 'veterinarian', 'assistant']}>
                                                <Prescriptions />
                                            </RoleGuard>
                                        }
                                    />

                                    <Route path="*" element={<Navigate to="/" replace />} />
                                </Route>
                            </Routes>
                        </BrowserRouter>
                    </SidebarProvider>
                </ToastProvider>
            </ClinicProvider>
        </AuthProvider>
    );
}

export default App;
