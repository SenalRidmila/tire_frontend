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
  const [authMode, setAuthMode] = useState(authModes.MONGODB);
  const [showAuthModeSelector, setShowAuthModeSelector] = useState(true);

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
      // Use AuthService for unified authentication
      AuthService.setAuthMode(authMode);
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

  // Handle authentication mode change
  const handleAuthModeChange = (mode) => {
    setAuthMode(mode);
    setMessage('');
    setFormData({ userId: '', password: '' });
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
          
          {/* Authentication Mode Selector */}
          <div className="auth-mode-selector" style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '15px' }}>
              <button 
                type="button"
                onClick={() => handleAuthModeChange(authModes.AZURE_AD)}
                style={{
                  padding: '8px 12px',
                  border: authMode === authModes.AZURE_AD ? '2px solid #0078d4' : '1px solid #ccc',
                  background: authMode === authModes.AZURE_AD ? '#0078d4' : 'white',
                  color: authMode === authModes.AZURE_AD ? 'white' : '#333',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                🔐 Azure AD
              </button>
              <button 
                type="button"
                onClick={() => handleAuthModeChange(authModes.MONGODB)}
                style={{
                  padding: '8px 12px',
                  border: authMode === authModes.MONGODB ? '2px solid #00a86b' : '1px solid #ccc',
                  background: authMode === authModes.MONGODB ? '#00a86b' : 'white',
                  color: authMode === authModes.MONGODB ? 'white' : '#333',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                🗄️ Database
              </button>
            </div>
          </div>

          {/* Azure AD Login Button */}
          {authMode === authModes.AZURE_AD ? (
            <div style={{ textAlign: 'center' }}>
              <button 
                type="button"
                onClick={handleAzureLogin}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: '#0078d4',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1,
                  fontSize: '16px',
                  marginBottom: '20px'
                }}
              >
                {loading ? 'Redirecting...' : '🔐 Sign in with Azure AD'}
              </button>
              <p style={{ fontSize: '14px', color: '#666', textAlign: 'center' }}>
                Use your organizational Microsoft account to login
              </p>
            </div>
          ) : (
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
          )}
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
