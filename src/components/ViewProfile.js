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
        const response = await fetch(`https://tire-backend-58a9.onrender.com/api/employees/${employeeId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const mongoData = await response.json();
          console.log('✅ MongoDB employee data loaded:', mongoData);
          
          // Use actual MongoDB employee data with proper field mapping
          setEmployeeData({
            employeeId: mongoData.employeeId || mongoData._id || employeeId,
            name: mongoData.name || mongoData.fullName || currentUser.name || 'Employee Name',
            email: mongoData.email || generateEmail(mongoData.employeeId || employeeId, mongoData.name || currentUser.name),
            position: mongoData.position || mongoData.jobTitle || getPositionByRole(mongoData.role || currentUser.role),
            department: mongoData.department || mongoData.dept || currentUser.department || 'IT Solutions',
            phone: mongoData.phone || mongoData.phoneNumber || mongoData.contact || '+94 77 123 4567',
            address: mongoData.address || mongoData.location || 'SLT Office, Colombo',
            age: mongoData.age || mongoData.ageYears || '28',
            joinDate: mongoData.joinDate || mongoData.startDate || mongoData.dateJoined || '2023-01-15',
            status: mongoData.status || mongoData.employeeStatus || 'Active',
            skills: mongoData.skills || mongoData.technicalSkills || mongoData.expertise || ['JavaScript', 'React', 'Node.js'],
            projects: mongoData.projects || mongoData.currentProjects || mongoData.assignedProjects || ['Tire Management System'],
            // Additional MongoDB fields
            salary: mongoData.salary || mongoData.basicSalary,
            manager: mongoData.manager || mongoData.reportingManager,
            workLocation: mongoData.workLocation || mongoData.office,
            experience: mongoData.experience || mongoData.yearsOfExperience,
            qualification: mongoData.qualification || mongoData.education,
            emergencyContact: mongoData.emergencyContact,
            employeeType: mongoData.employeeType || mongoData.contractType || 'Full-time'
          });
          
          setError(''); // Clear error since we got MongoDB data successfully
          console.log('📊 ViewProfile: Successfully loaded employee data from MongoDB Atlas');
        } else {
          console.log('❌ MongoDB employee API error:', response.status, response.statusText);
          throw new Error(`MongoDB API error: ${response.status}`);
        }
      } catch (mongoError) {
        console.error('MongoDB connection failed:', mongoError);
        
        // Instead of fallback demo data, show error and ask user to contact admin
        setEmployeeData(null);
        setError('❌ Failed to load employee data from database. Please contact system administrator or try again later.');
        
        // Optional: Provide basic info from localStorage if available
        if (currentUser.name) {
          setEmployeeData({
            employeeId: employeeId,
            name: currentUser.name,
            email: generateEmail(employeeId, currentUser.name),
            position: getPositionByRole(currentUser.role),
            department: currentUser.department || 'Unknown Department',
            phone: 'Contact Admin for Details',
            address: 'Contact Admin for Details',
            age: 'Contact Admin for Details',
            joinDate: 'Contact Admin for Details',
            status: 'Unknown',
            skills: [],
            projects: [],
            // Set other fields as unavailable
            salary: null,
            manager: null,
            workLocation: null,
            experience: null,
            qualification: null,
            emergencyContact: null,
            employeeType: 'Unknown'
          });
          setError('⚠️ Limited employee data available. Full details require database connection. Please contact IT support.');
        }
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
        
        {!loading && !employeeData && error && (
          <div className="no-data-container" style={{
            textAlign: 'center',
            padding: '50px',
            background: '#fff',
            borderRadius: '10px',
            border: '1px solid #e74c3c',
            margin: '20px'
          }}>
            <h2 style={{ color: '#e74c3c', marginBottom: '20px' }}>⚠️ Unable to Load Employee Data</h2>
            <p style={{ fontSize: '16px', color: '#555', marginBottom: '20px' }}>
              We couldn't retrieve your employee information from the database.
            </p>
            <div style={{
              background: '#f8d7da',
              border: '1px solid #f5c6cb',
              borderRadius: '5px',
              padding: '15px',
              margin: '20px 0',
              color: '#721c24'
            }}>
              <strong>Error Details:</strong> {error}
            </div>
            <div style={{ marginTop: '30px' }}>
              <button 
                onClick={() => window.location.reload()} 
                style={{
                  background: '#3498db',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '5px',
                  marginRight: '10px',
                  cursor: 'pointer'
                }}
              >
                🔄 Try Again
              </button>
              <Link 
                to="/contact" 
                style={{
                  background: '#e74c3c',
                  color: 'white',
                  textDecoration: 'none',
                  padding: '10px 20px',
                  borderRadius: '5px',
                  display: 'inline-block'
                }}
              >
                📞 Contact IT Support
              </Link>
            </div>
          </div>
        )}
        
        {!loading && employeeData && (
          <div className="profile-content">
            <img src="/images/default-profile.png" alt="Employee" className="profile-photo" />
            <div className="employee-details">
              <h2>{employeeData.name}</h2>
              
              {/* Basic Information */}
              <div className="info-section">
                <h3 style={{ color: '#2c3e50', borderBottom: '2px solid #3498db', paddingBottom: '5px', marginBottom: '15px' }}>📋 Basic Information</h3>
                <p><strong>Employee ID:</strong> {employeeData.employeeId}</p>
                <p><strong>Email:</strong> {employeeData.email}</p>
                <p><strong>Position:</strong> {employeeData.position}</p>
                <p><strong>Department:</strong> {employeeData.department}</p>
                {employeeData.employeeType && employeeData.employeeType !== 'Unknown' && (
                  <p><strong>Employee Type:</strong> {employeeData.employeeType}</p>
                )}
                {employeeData.phone && employeeData.phone !== 'Contact Admin for Details' && (
                  <p><strong>Phone Number:</strong> {employeeData.phone}</p>
                )}
                {employeeData.address && employeeData.address !== 'Contact Admin for Details' && (
                  <p><strong>Address:</strong> {employeeData.address}</p>
                )}
                {employeeData.workLocation && (
                  <p><strong>Work Location:</strong> {employeeData.workLocation}</p>
                )}
              </div>

              {/* Personal Information */}
              <div className="info-section" style={{ marginTop: '20px' }}>
                <h3 style={{ color: '#2c3e50', borderBottom: '2px solid #e74c3c', paddingBottom: '5px', marginBottom: '15px' }}>👤 Personal Information</h3>
                {employeeData.age && employeeData.age !== 'Contact Admin for Details' && (
                  <p><strong>Age:</strong> {employeeData.age} years</p>
                )}
                {employeeData.joinDate && employeeData.joinDate !== 'Contact Admin for Details' && (
                  <p><strong>Join Date:</strong> {employeeData.joinDate}</p>
                )}
                {employeeData.status && employeeData.status !== 'Unknown' && (
                  <p><strong>Status:</strong> <span style={{ color: employeeData.status === 'Active' ? 'green' : 'orange', fontWeight: 'bold' }}>{employeeData.status}</span></p>
                )}
                {employeeData.experience && (
                  <p><strong>Experience:</strong> {employeeData.experience} years</p>
                )}
                {employeeData.qualification && (
                  <p><strong>Qualification:</strong> {employeeData.qualification}</p>
                )}
                {employeeData.emergencyContact && (
                  <p><strong>Emergency Contact:</strong> {employeeData.emergencyContact}</p>
                )}
              </div>

              {/* Professional Information */}
              <div className="info-section" style={{ marginTop: '20px' }}>
                <h3 style={{ color: '#2c3e50', borderBottom: '2px solid #f39c12', paddingBottom: '5px', marginBottom: '15px' }}>💼 Professional Information</h3>
                {employeeData.manager && (
                  <p><strong>Reporting Manager:</strong> {employeeData.manager}</p>
                )}
                {employeeData.salary && (
                  <p><strong>Salary:</strong> Rs. {typeof employeeData.salary === 'number' ? employeeData.salary.toLocaleString() : employeeData.salary}</p>
                )}
                
                {employeeData.skills && employeeData.skills.length > 0 && (
                  <div>
                    <strong>Technical Skills:</strong>
                    <div style={{ marginTop: '8px' }}>
                      {employeeData.skills.map((skill, index) => (
                        <span 
                          key={index}
                          style={{
                            display: 'inline-block',
                            background: '#3498db',
                            color: 'white',
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            margin: '2px 4px 2px 0'
                          }}
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {employeeData.projects && employeeData.projects.length > 0 && (
                  <div style={{ marginTop: '15px' }}>
                    <strong>Current Projects:</strong>
                    <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                      {employeeData.projects.map((project, index) => (
                        <li key={index} style={{ marginBottom: '5px', color: '#2c3e50' }}>{project}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {/* Show message if no professional data available */}
                {!employeeData.manager && !employeeData.salary && (!employeeData.skills || employeeData.skills.length === 0) && (!employeeData.projects || employeeData.projects.length === 0) && (
                  <p style={{ fontStyle: 'italic', color: '#7f8c8d' }}>
                    Professional details not available in database. Contact HR for complete information.
                  </p>
                )}
              </div>

              {/* MongoDB Data Source Indicator */}
              <div style={{ 
                marginTop: '20px', 
                padding: '10px', 
                background: error && error.includes('Limited') ? '#fff3cd' : '#d5edda', 
                border: `1px solid ${error && error.includes('Limited') ? '#ffeaa7' : '#c3e6cb'}`, 
                borderRadius: '5px',
                fontSize: '12px',
                color: error && error.includes('Limited') ? '#856404' : '#155724'
              }}>
                <strong>🗄️ Data Source:</strong> {
                  error && error.includes('Failed') ? 'Database Connection Failed' :
                  error && error.includes('Limited') ? 'Limited Data Available (Database Connection Issues)' : 
                  'MongoDB Atlas Employee Collection - Real Employee Data'
                }
              </div>
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