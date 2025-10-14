import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    userId: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    
    const { userId, password } = formData;
    
    console.log('Login attempt:', { userId, password }); // Debug log
    
    // Validate input
    if (!userId.trim() || !password.trim()) {
      setMessage('Please enter both User ID and Password.');
      setLoading(false);
      return;
    }

    try {
      // Try to authenticate with MongoDB employee collection via Railway backend
      console.log('🔍 Attempting MongoDB employee authentication...'); // Debug log
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employeeId: userId,
          password: password
        }),
      });

      if (response.ok) {
        const userData = await response.json();
        
        // Store user info and authentication status for session
        localStorage.setItem('user', JSON.stringify({
          id: userData.employeeId,
          username: userData.name || userId,
          role: userData.role || 'user',
          department: userData.department,
          timestamp: new Date().toISOString()
        }));
        
        // Set authentication status
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('currentUser', JSON.stringify({
          id: userData.employeeId,
          name: userData.name || userId,
          role: userData.role || 'user',
          department: userData.department
        }));
        
        setMessage('✅ Login successful! Employee authenticated from MongoDB. Welcome to the Tire Management System.');
        setTimeout(() => {
          navigate('/home');
        }, 1000);
      } else {
        // Backend returned error (400, 401, etc.) - fallback to demo mode
        console.log('Backend error, activating fallback mode'); // Debug log
        throw new Error(`Backend error: ${response.status}`);
      }
    } catch (error) {
      console.error('Login error:', error);
      
      // No demo data - show database connection error
      setMessage('❌ Database connection failed. Please contact administrator or try again later.');
    }
    
    setLoading(false);
  };

  return (
    <div
      className="login-page"
      style={{
        backgroundImage: "url('/images/background.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
        height: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}
    >
      <div className="login-card">
        <div className="login-left">
          <h2>LOGIN</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label><i className="fa fa-user"></i> User ID</label>
              <input 
                type="text" 
                name="userId"
                placeholder="Enter User ID" 
                value={formData.userId}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label><i className="fa fa-lock"></i> Password</label>
              <input 
                type="password" 
                name="password"
                placeholder="Enter Password" 
                value={formData.password}
                onChange={handleInputChange}
                required
              />
            </div>
            
            {message && (
              <div className="message" style={{
                color: message.includes('successful') ? 'green' : 'red', 
                fontSize: '14px', 
                marginBottom: '10px',
                textAlign: 'center'
              }}>
                {message}
              </div>
            )}
            
            <button 
              type="submit" 
              className="login-btn" 
              disabled={loading}
              style={{
                opacity: loading ? 0.6 : 1,
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Logging in...' : 'Login Now'}
            </button>
          </form>
        </div>

        <div className="login-right">
          <img src="/images/logo.png" alt="SLTMobitel Logo" className="logo" />
          <h3>TIRE MANAGEMENT SYSTEM</h3>
          <img src="/images/tiress.png" alt="Tires" className="tires-image" />
        </div>
      </div>
    </div>
  );
}

export default Login;
