import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import Login from './components/Login';
import Home from './components/Home';
import RequestForm from './components/RequestForm';
import About from './components/About';
import Contact from './components/Contact';
import ViewProfile from './components/ViewProfile';
import TTODashboard from './components/tto/TTODashboard';
import ManagerDashboard from './components/manager/ManagerDashboard';
import TTOApprovedRequests from './components/tto/TTOApprovedRequests';
import EngineerDashboard from './components/engineer/EngineerDashboard';
import TireOrder from './components/TireOrder'; 
import SellerDashboard from './components/SellerDashboard';
import PrivateRoute from './components/PrivateRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />

        <Route path="/login" element={<Login />} />
        
        {/* Protected routes */}
        <Route path="/home" element={
          <PrivateRoute>
            <Home />
          </PrivateRoute>
        } />
        
        <Route path="/about" element={
          <PrivateRoute>
            <About />
          </PrivateRoute>
        } />
        
        <Route path="/contact" element={
          <PrivateRoute>
            <Contact />
          </PrivateRoute>
        } />
        
        <Route path="/view-profile" element={
          <PrivateRoute>
            <ViewProfile />
          </PrivateRoute>
        } />
        
        {/* Direct access routes - no authentication required */}
        <Route path="/manager" element={<ManagerDashboard />} />
        <Route path="/tto-dashboard" element={<TTODashboard />} />
        <Route path="/tto" element={<TTODashboard />} />
        <Route path="/engineer-dashboard" element={<EngineerDashboard />} />
        <Route path="/engineer" element={<EngineerDashboard />} />
        <Route path="/seller-dashboard" element={<SellerDashboard vendorEmail="seller.email=slttransportofficer@gmail.com" />} />

        <Route path="/request" element={
          <PrivateRoute>
            <RequestForm />
          </PrivateRoute>
        } />

        {/* TTO specific routes - direct access */}
        <Route path="/tto/approved-requests" element={<TTOApprovedRequests />} />
        <Route path="/tto/view-request" element={<TTODashboard />} />
        <Route path="/order-tires" element={<TireOrder />} />
        <Route path="/order-tires/:requestId" element={<TireOrder />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
