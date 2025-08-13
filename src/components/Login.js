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
      // Check if this is manager login (EMP001)
      if (formData.userId === 'EMP001' && formData.password === 'Kaushalya417#') {
        // Manager authentication - store in localStorage and go to manager dashboard
        const managerUser = {
          id: 'EMP001',
          userId: 'EMP001',
          name: 'Kaushalya Senalratne',
          role: 'manager',
          email: 'kaushalya@slt.lk',
          department: 'Transport',
          serviceNo: 'EMP001'
        };
        
        localStorage.setItem('currentUser', JSON.stringify(managerUser));
        localStorage.setItem('isAuthenticated', 'true');
        navigate('/manager');
        return;
      }
      
      // For any other credentials, just go to home page (no authentication required)
      if (formData.userId && formData.password) {
        // Create a basic user object for home page access
        const basicUser = {
          id: formData.userId,
          userId: formData.userId,
          name: 'User',
          role: 'user',
          email: `${formData.userId}@slt.lk`
        };
        
        localStorage.setItem('currentUser', JSON.stringify(basicUser));
        localStorage.setItem('isAuthenticated', 'true');
        navigate('/home');
      } else {
        setError('Please enter both User ID and Password');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
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
            <strong>Access Information:</strong><br/>
            <span style={{color: '#007bff', fontWeight: 'bold'}}>EMP001 / Kaushalya417#</span> → Manager Dashboard<br/>
            <span style={{color: '#28a745', fontWeight: 'bold'}}>Any other credentials</span> → Home Page<br/>
            <hr style={{margin: '8px 0'}}/>
            <small style={{color: '#888'}}>
              Enter any User ID and Password to access the home page.<br/>
              Only Manager account requires specific credentials.
            </small>
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
