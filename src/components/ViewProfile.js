import React, { useState, useEffect } from 'react';
import './ViewProfile.css';
import { Link, useNavigate } from 'react-router-dom';

function ViewProfile() {
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Get current user from localStorage
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    setCurrentUser(user);
  }, []);

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    setShowLogoutModal(false);
    localStorage.removeItem('currentUser');
    localStorage.removeItem('isAuthenticated');
    navigate('/login'); // 👈 Redirect to login page
  };

  const cancelLogout = () => {
    setShowLogoutModal(false);
  };

  // Generate email based on employee ID and name
  const generateEmail = (empId, name) => {
    if (!empId || !name) return 'employee@slt.lk';
    
    const firstName = name.split(' ')[0].toLowerCase();
    const empNumber = empId.replace('EMP', '');
    return `${firstName}.emp${empNumber}@slt.lk`;
  };

  return (
    <div className="profile-page">
      <header className="profile-header">
  <Link to="/home" className="back-link">← Back to Home</Link>
  <img src="/images/logo.png" alt="SLT Logo" className="slt-logo" />
  <h1>Employee Profile</h1>

  {/* Logout button in top-right */}
  <button className="logout-button-header" onClick={handleLogoutClick}>🚪 Logout</button>
</header>


      <div className="profile-container">
        <div className="profile-content">
          <img src="/images/default-profile.png" alt="Employee" className="profile-photo" />
          <div className="employee-details">
            <h2>{currentUser?.name || 'Employee Name'}</h2>
            <p><strong>Employee ID:</strong> {currentUser?.id || 'N/A'}</p>
            <p><strong>Email:</strong> {generateEmail(currentUser?.id, currentUser?.name)}</p>
            <p><strong>Position:</strong> {currentUser?.role ? currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1) : 'N/A'}</p>
            <p><strong>Department:</strong> {currentUser?.department || 'IT Solutions'}</p>
            <p><strong>Phone Number:</strong> +94 71 {Math.floor(Math.random() * 9000000) + 1000000}</p>
            <p><strong>Address:</strong> SLT Office, Colombo</p>
            <p><strong>Job Starting Date:</strong> {new Date().getFullYear() - 2}-01-15</p>
          </div>
        </div>
      </div>

      <footer className="footer">
        <div className="contact-info">
          <p>📞 +94 112 021 000</p>
          <p>📧 pr@slt.lk</p>
          <p>🏢 Sri Lanka Telecom PLC<br />Lotus Road, P.O.Box 503, Colombo 01</p>
        </div>
      </footer>
      
      <div className="copyright">
        © 2025 Sri Lanka Telecom. All Rights Reserved.
      </div>

      {/* Logout Modal */}
      {showLogoutModal && (
        <div className="logout-modal">
          <div className="logout-box">
            <p>Are you sure you want to log out?</p>
            <div className="logout-buttons">
              <button className="yes-btn" onClick={confirmLogout}>Yes</button>
              <button className="no-btn" onClick={cancelLogout}>No</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ViewProfile;
