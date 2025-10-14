import React from 'react';
import { Navigate } from 'react-router-dom';

const PrivateRoute = ({ children, allowedRoles = [] }) => {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

  // Check if user is authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check if user has required role (if specified)
  if (allowedRoles.length > 0 && !allowedRoles.includes(currentUser.role?.toLowerCase())) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        textAlign: 'center',
        backgroundColor: '#f8f9fa'
      }}>
        <h2 style={{ color: '#dc3545' }}>Access Denied</h2>
        <p>You don't have permission to access this page.</p>
        <p>Required role: {allowedRoles.join(' or ')}</p>
        <p>Your role: {currentUser.role || 'Unknown'}</p>
        <button 
          onClick={() => window.history.back()}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            marginTop: '20px'
          }}
        >
          Go Back
        </button>
      </div>
    );
  }

  return children;
};

export default PrivateRoute;
