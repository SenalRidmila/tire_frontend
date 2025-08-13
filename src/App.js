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
        
        {/* Role-based protected routes */}
        <Route path="/manager" element={
          <PrivateRoute allowedRoles={['manager']}>
            <ManagerDashboard />
          </PrivateRoute>
        } />
        
        <Route path="/tto-dashboard" element={
          <PrivateRoute allowedRoles={['tto', 'transport officer']}>
            <TTODashboard />
          </PrivateRoute>
        } />
        
        <Route path="/tto" element={
          <PrivateRoute allowedRoles={['tto', 'transport officer']}>
            <TTODashboard />
          </PrivateRoute>
        } />
        
        <Route path="/engineer-dashboard" element={
          <PrivateRoute allowedRoles={['engineer']}>
            <EngineerDashboard />
          </PrivateRoute>
        } />

        <Route path="/request" element={
          <PrivateRoute>
            <RequestForm />
          </PrivateRoute>
        } />

        <Route path="/tto/approved-requests" element={
          <PrivateRoute allowedRoles={['tto', 'transport officer']}>
            <TTOApprovedRequests />
          </PrivateRoute>
        } />
        
        <Route path="/order-tires" element={
          <PrivateRoute allowedRoles={['tto', 'transport officer', 'manager']}>
            <TireOrder />
          </PrivateRoute>
        } />
        
        <Route path="/order-tires/:requestId" element={
          <PrivateRoute allowedRoles={['tto', 'transport officer', 'manager']}>
            <TireOrder />
          </PrivateRoute>
        } />
        
        <Route path="/seller-dashboard" element={
          <PrivateRoute allowedRoles={['seller']}>
            <SellerDashboard vendorEmail="seller.email=slttransportofficer@gmail.com" />
          </PrivateRoute>
        } />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
