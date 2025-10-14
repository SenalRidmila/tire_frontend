import React from 'react';
import './BackendStatus.css';

const BackendStatus = ({ isLoading, error, onRetry }) => {
  if (!isLoading && !error) return null;

  const is502Error = error && error.includes('502');

  return (
    <div className={`backend-status ${error ? 'error' : 'loading'}`}>
      {isLoading && (
        <div className="status-content">
          <div className="spinner"></div>
          <div>
            <h4>🔍 Loading Data...</h4>
            <p>Connecting to backend server...</p>
          </div>
        </div>
      )}
      
      {is502Error && (
        <div className="status-content">
          <div className="status-icon">🔄</div>
          <div>
            <h4>Backend Starting Up</h4>
            <p>
              The backend server is waking up (this is normal for free hosting).
              <br />
              <small>Usually takes 30-60 seconds on first request.</small>
            </p>
            <button onClick={onRetry} className="retry-btn">
              Try Again
            </button>
          </div>
        </div>
      )}
      
      {error && !is502Error && (
        <div className="status-content">
          <div className="status-icon">❌</div>
          <div>
            <h4>Connection Error</h4>
            <p>Unable to connect to the backend server.</p>
            <small>{error}</small>
            <br />
            <button onClick={onRetry} className="retry-btn">
              Retry Connection
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BackendStatus;