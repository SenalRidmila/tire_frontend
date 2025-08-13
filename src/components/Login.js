import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Login.css';

function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    userId: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Try authentication with backend
      const response = await axios.post('/api/auth/login', {
        userId: formData.userId,
        password: formData.password
      });

      if (response.data && response.data.user) {
        const user = response.data.user;
        
        // Store user data in localStorage
        localStorage.setItem('currentUser', JSON.stringify(user));
        localStorage.setItem('isAuthenticated', 'true');

        // Navigate based on user role
        switch (user.role?.toLowerCase()) {
          case 'manager':
            navigate('/manager');
            break;
          case 'tto':
          case 'transport officer':
            navigate('/tto-dashboard');
            break;
          case 'engineer':
            navigate('/engineer-dashboard');
            break;
          case 'seller':
            navigate('/seller-dashboard');
            break;
          default:
            navigate('/home');
        }
      } else {
        setError('Invalid credentials');
      }
    } catch (error) {
      console.error('Login error:', error);
      
      // Fallback for development - mock authentication
      if (formData.userId && formData.password) {
        const mockUser = getMockUser(formData.userId, formData.password);
        if (mockUser) {
          localStorage.setItem('currentUser', JSON.stringify(mockUser));
          localStorage.setItem('isAuthenticated', 'true');
          
          switch (mockUser.role?.toLowerCase()) {
            case 'manager':
              navigate('/manager');
              break;
            case 'tto':
              navigate('/tto-dashboard');
              break;
            case 'engineer':
              navigate('/engineer-dashboard');
              break;
            default:
              navigate('/home');
          }
        } else {
          setError('Invalid credentials');
        }
      } else {
        setError('Please enter both User ID and Password');
      }
    } finally {
      setLoading(false);
    }
  };

  // Mock user data for development
  const getMockUser = (userId, password) => {
    const mockUsers = {
      'manager': { id: '1', userId: 'manager', name: 'John Manager', role: 'manager', email: 'manager@slt.lk' },
      'tto': { id: '2', userId: 'tto', name: 'Jane TTO', role: 'tto', email: 'tto@slt.lk' },
      'engineer': { id: '3', userId: 'engineer', name: 'Bob Engineer', role: 'engineer', email: 'engineer@slt.lk' },
      'admin': { id: '4', userId: 'admin', name: 'Admin User', role: 'manager', email: 'admin@slt.lk' }
    };

    return mockUsers[userId.toLowerCase()] || null;
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
          <form onSubmit={handleLogin}>
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
            
            {error && (
              <div className="error-message" style={{
                color: 'red', 
                fontSize: '14px', 
                marginBottom: '10px',
                textAlign: 'center'
              }}>
                {error}
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
          
          <div className="demo-credentials" style={{
            marginTop: '20px',
            fontSize: '12px',
            color: '#666',
            backgroundColor: '#f8f9fa',
            padding: '10px',
            borderRadius: '5px'
          }}>
            <strong>Demo Credentials:</strong><br/>
            Manager: manager / any password<br/>
            TTO: tto / any password<br/>
            Engineer: engineer / any password
          </div>
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
