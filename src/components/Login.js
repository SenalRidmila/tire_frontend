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

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const { userId, password } = formData;
    
    // Simple login - any credentials allow access to home page
    if (userId.trim() && password.trim()) {
      // Store user info for session
      localStorage.setItem('user', JSON.stringify({
        id: userId,
        username: userId,
        role: 'user', // Default role for regular users
        timestamp: new Date().toISOString()
      }));
      
      setMessage('Login successful! Welcome to the Tire Management System.');
      setTimeout(() => {
        navigate('/home'); // Always redirect to home page
      }, 1000);
    } else {
      setMessage('Please enter both User ID and Password.');
    }
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
