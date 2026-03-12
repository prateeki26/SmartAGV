import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import Telemetry from './pages/Telemetry';
import ControlPanel from './pages/ControlPanel';
import PathPlanning from './pages/PathPlanning';
import Profile from './pages/Profile';
import Layout from './components/Layout';
import './App.css';

function App() {
  return (
    <BrowserRouter basename="/SmartAGV">
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/telemetry" element={<Telemetry />} />
          <Route path="/control-panel" element={<ControlPanel />} />
          <Route path="/path-planning" element={<PathPlanning />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
