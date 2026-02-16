import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MainLayout } from './components/layout';
import { ClinicProvider } from './context/ClinicContext';
import {
  Dashboard,
  Patients,
  PatientDetail,
  Appointments,
  Inventory,
  Billing,
} from './pages';

function App() {
  return (
    <ClinicProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/patients" element={<Patients />} />
            <Route path="/patients/:id" element={<PatientDetail />} />
            <Route path="/appointments" element={<Appointments />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/billing" element={<Billing />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ClinicProvider>
  );
}

export default App;
