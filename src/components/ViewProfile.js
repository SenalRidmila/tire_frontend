import React, { useState, useEffect } from 'react';
import './ViewProfile.css';
import { Link } from 'react-router-dom';

function ViewProfile() {
  const [employeeData, setEmployeeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Get current user data from localStorage (set during login)
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  const employeeId = currentUser.id;

  useEffect(() => {
    const fetchEmployeeData = async () => {
      if (!employeeId) {
        setError('Employee ID not found. Please login first.');
        setLoading(false);
        return;
      }

      try {
        console.log('🔍 Fetching employee data from MongoDB for ID:', employeeId);
        
        // Try MongoDB employee collection via Railway backend
        const response = await fetch(`https://tirebackend-production.up.railway.app/api/employees/${employeeId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const mongoData = await response.json();
          console.log('✅ MongoDB employee data loaded:', mongoData);
          
          setEmployeeData({
            employeeId: mongoData.employeeId || employeeId,
            name: mongoData.name || currentUser.name,
            email: mongoData.email || generateEmail(employeeId, mongoData.name || currentUser.name),
            position: getPositionByRole(mongoData.role || currentUser.role),
            department: mongoData.department || currentUser.department,
            phone: mongoData.phone || `+94 77 ${Math.floor(Math.random() * 9000000) + 1000000}`,
            address: mongoData.address || 'SLT Office, Colombo',
            age: mongoData.age || '28',
            joinDate: mongoData.joinDate || '2023-01-15',
            status: mongoData.status || 'Active',
            skills: mongoData.skills || ['JavaScript', 'React', 'Node.js'],
            projects: mongoData.projects || ['Tire Management System']
          });
          
          setError('');
        } else {
          throw new Error(`MongoDB API error: ${response.status}`);
        }
      } catch (mongoError) {
        console.warn('MongoDB connection failed, using fallback data:', mongoError);
        
        // Fallback demo data based on current user
        const fallbackData = {
          employeeId: employeeId,
          name: currentUser.name || 'Employee Name',
          email: generateEmail(employeeId, currentUser.name),
          position: getPositionByRole(currentUser.role),
          department: currentUser.department || 'IT Solutions',
          phone: `+94 77 ${Math.floor(Math.random() * 9000000) + 1000000}`,
          address: 'SLT Office, Colombo',
          age: '28',
          joinDate: '2023-01-15',
          status: 'Active',
          skills: ['JavaScript', 'React', 'MongoDB'],
          projects: ['Tire Management System']
        };
        
        setEmployeeData(fallbackData);
        setError('⚠️ Using demo data (MongoDB connection unavailable)');
      } finally {
        setLoading(false);
      }
    };

    fetchEmployeeData();
  }, [employeeId, currentUser.name, currentUser.role, currentUser.department]);

  // Generate email based on employee ID and name
  const generateEmail = (empId, name) => {
    if (!empId || !name) return 'employee@slt.lk';
    const firstName = name.split(' ')[0].toLowerCase();
    return `${firstName}.${empId.toLowerCase()}@slt.lk`;
  };

  // Get position based on role
  const getPositionByRole = (role) => {
    const roleMap = {
      'employee': 'Software Engineer',
      'engineer': 'Senior Engineer', 
      'manager': 'Manager',
      'tto': 'Technical Operations Officer',
      'user': 'System User'
    };
    return roleMap[role?.toLowerCase()] || 'Staff Member';
  };

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    // Clear all authentication data
    localStorage.removeItem('currentUser');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('user');
    localStorage.removeItem('userEmail');
    setShowLogoutModal(false);
    
    // Redirect to login page
    window.location.href = '/login';
  };

  const cancelLogout = () => {
    setShowLogoutModal(false);
  };

  return (
    <div className="profile-page">
      <header className="profile-header">
        <Link to="/home" className="back-link">← Back to Home</Link>
        <img src="/images/logo.png" alt="SLT Logo" className="slt-logo" />
        <h1>Employee Profile</h1>
        <button className="logout-button-header" onClick={handleLogoutClick}>🚪 Logout</button>
      </header>

      <div className="profile-container">
        {loading && (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <p>🔄 Loading employee data from MongoDB...</p>
          </div>
        )}
        
        {error && (
          <div style={{ 
            background: '#fff3cd', 
            border: '1px solid #ffeaa7', 
            borderRadius: '4px', 
            padding: '12px', 
            margin: '20px', 
            color: '#856404' 
          }}>
            <strong>⚠️ Notice:</strong> {error}
          </div>
        )}
        
        {!loading && employeeData && (
          <div className="profile-content">
            <img src="/images/default-profile.png" alt="Employee" className="profile-photo" />
            <div className="employee-details">
              <h2>{employeeData.name}</h2>
              <p><strong>Employee ID:</strong> {employeeData.employeeId}</p>
              <p><strong>Email:</strong> {employeeData.email}</p>
              <p><strong>Position:</strong> {employeeData.position}</p>
              <p><strong>Department:</strong> {employeeData.department}</p>
              <p><strong>Phone Number:</strong> {employeeData.phone}</p>
              <p><strong>Address:</strong> {employeeData.address}</p>
              <p><strong>Age:</strong> {employeeData.age} years</p>
              <p><strong>Join Date:</strong> {employeeData.joinDate}</p>
              <p><strong>Status:</strong> <span style={{ color: 'green', fontWeight: 'bold' }}>{employeeData.status}</span></p>
              
              {employeeData.skills && (
                <p><strong>Skills:</strong> {employeeData.skills.join(', ')}</p>
              )}
              
              {employeeData.projects && employeeData.projects.length > 0 && (
                <div>
                  <strong>Current Projects:</strong>
                  <ul style={{ marginTop: '5px' }}>
                    {employeeData.projects.map((project, index) => (
                      <li key={index}>{project}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
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