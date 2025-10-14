import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';
import AuthService from '../services/AuthService';
import { authModes } from '../config/authConfig';
import './Login.css';

function Login() {
  const navigate = useNavigate();
  const { instance, accounts } = useMsal();
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

  // Handle Azure AD login
  const handleAzureLogin = async () => {
    setLoading(true);
    setMessage('Redirecting to Azure AD login...');
    
    try {
      AuthService.setAuthMode(authModes.AZURE_AD);
      const result = await AuthService.login();
      
      if (result.success) {
        setMessage('✅ Azure AD login successful! Welcome to the Tire Management System.');
        setTimeout(() => {
          navigate('/home');
        }, 1000);
      } else {
        setMessage(`❌ Azure AD login failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Azure AD login error:', error);
      setMessage(`❌ Azure AD login error: ${error.message}`);
    }
    
    setLoading(false);
  };

  // Handle traditional form login (MongoDB/Demo)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    
    const { userId, password } = formData;
    
    console.log('Login attempt:', { userId, password }); // Debug log
    
    // Validate input for form-based login
    if (!userId.trim() || !password.trim()) {
      setMessage('Please enter both User ID and Password.');
      setLoading(false);
      return;
    }

    try {
      // Use AuthService for unified authentication - always use MongoDB for form login
      AuthService.setAuthMode(authModes.MONGODB);
      const result = await AuthService.login(userId, password);
      
      if (result.success) {
        let authModeDisplay = result.authMode === authModes.MONGODB ? 'MongoDB' : 'Demo';
        setMessage(`✅ Login successful! Employee authenticated from ${authModeDisplay}. Welcome to the Tire Management System.`);
        setTimeout(() => {
          navigate('/home');
        }, 1000);
      } else {
        setMessage(`❌ Login failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Login error:', error);
      setMessage(`❌ Login error: ${error.message}`);
    }
    
    setLoading(false);
  };



  // Check if user is already logged in
  useEffect(() => {
    if (AuthService.isAuthenticated()) {
      navigate('/home');
    }
  }, [navigate]);

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
          
          {/* Microsoft Organizational Login Button */}
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <button 
              type="button"
              onClick={handleAzureLogin}
              disabled={loading}
              style={{
                width: '100%',
                padding: '15px 20px',
                background: '#0078d4',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
                fontSize: '16px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                boxShadow: '0 2px 4px rgba(0,120,212,0.3)',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => {
                if (!loading) {
                  e.target.style.background = '#106ebe';
                  e.target.style.transform = 'translateY(-1px)';
                }
              }}
              onMouseOut={(e) => {
                if (!loading) {
                  e.target.style.background = '#0078d4';
                  e.target.style.transform = 'translateY(0px)';
                }
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zM24 11.4H12.6V0H24v11.4z"/>
              </svg>
              {loading ? 'Signing in...' : 'Use your organizational Microsoft account'}
            </button>
          </div>
          
          {/* OR Divider */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            margin: '20px 0',
            color: '#666'
          }}>
            <hr style={{ flex: 1, border: 'none', borderTop: '1px solid #ddd' }} />
            <span style={{ padding: '0 15px', fontSize: '14px', fontWeight: '500' }}>OR</span>
            <hr style={{ flex: 1, border: 'none', borderTop: '1px solid #ddd' }} />
          </div>

          {/* Regular Login Form */}
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
