import React, { useState, useEffect } from 'react';
import './ViewProfile.css';
import { Link, useNavigate } from 'react-router-dom';

function ViewProfile() {
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [employeeData, setEmployeeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Get current user from localStorage
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    setCurrentUser(user);
    
    // Fetch employee details from MongoDB
    fetchEmployeeData(user.id);
  }, []);

  const fetchEmployeeData = async (employeeId) => {
    if (!employeeId) {
      setLoading(false);
      return;
    }

    try {
      console.log('🔍 Fetching employee data from MongoDB...', employeeId);
      
      // Try to fetch employee data from Railway backend connected to MongoDB
      const response = await fetch(`https://tirebackend-production.up.railway.app/api/employees/${employeeId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Employee data fetched from MongoDB:', data);
        setEmployeeData(data);
        setError(null);
      } else {
        throw new Error(`Failed to fetch employee data: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Error fetching employee data:', error);
      console.log('📝 Using fallback demo data...');
      
      // Fallback: Use demo data if MongoDB is unavailable
      const demoEmployeeData = {
        employeeId: employeeId,
        name: currentUser?.name || 'Employee Name',
        email: generateEmail(employeeId, currentUser?.name),
        department: currentUser?.department || 'IT Solutions',
        position: getPositionByRole(currentUser?.role),
        phone: `+94 71 ${Math.floor(Math.random() * 9000000) + 1000000}`,
        address: 'SLT Office, Lotus Road, Colombo 01',
        joinDate: '2022-01-15',
        age: Math.floor(Math.random() * 15) + 25, // Random age between 25-40
        status: 'Active'
      };
      
      setEmployeeData(demoEmployeeData);
      setError('Using demo data - MongoDB connection unavailable');
    } finally {
      setLoading(false);
    }
  };

  const getPositionByRole = (role) => {
    const positions = {
      'employee': 'Software Engineer',
      'engineer': 'Senior Engineer', 
      'manager': 'Department Manager',
      'tto': 'Transport Officer',
      'seller': 'Sales Representative'
    };
    return positions[role] || 'Staff Member';
  };

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
