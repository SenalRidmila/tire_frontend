import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import './TTODashboard.css';
import { useNavigate, useLocation } from 'react-router-dom';

const API_URL = process.env.NODE_ENV === 'development' 
  ? `${process.env.REACT_APP_API_URL}/api/tire-requests`
  : '/api/tire-requests';
const BASE_URL = process.env.NODE_ENV === 'development' 
  ? process.env.REACT_APP_API_URL 
  : '';

function TTODashboard() {
  const location = useLocation();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [photoModal, setPhotoModal] = useState({ show: false, photos: [], currentIndex: 0 });
  const [imageLoading, setImageLoading] = useState(false);
  const [photoZoom, setPhotoZoom] = useState(1);
  const [touchStart, setTouchStart] = useState(null);
  const [highlightedRequestId, setHighlightedRequestId] = useState(null);

  const rowRefs = useRef({});
  const navigate = useNavigate();

  useEffect(() => {
    fetchRequests();
  }, []);

  // -------------------- Handle URL param highlight --------------------
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const requestId = params.get('id') || params.get('requestId');
    if (requestId) {
      setHighlightedRequestId(requestId);
      console.log('🎯 TTO Dashboard: Highlighting request from URL:', requestId);
    }
  }, [location.search]);

  // -------------------- Scroll to highlighted row --------------------
  useEffect(() => {
    if (highlightedRequestId && rowRefs.current[highlightedRequestId]) {
      setTimeout(() => {
        rowRefs.current[highlightedRequestId].scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }, 500); // Delay to ensure data is loaded
    }
  }, [highlightedRequestId, requests]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      console.log('🔍 TTO Dashboard: Fetching tire requests from MongoDB...');
      
      // Try MongoDB tire_requests collection via Railway backend
      const response = await fetch('https://tire-backend-58a9.onrender.com/api/tire-requests', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const requestsData = await response.json();
        console.log('✅ TTO Dashboard: MongoDB tire_requests loaded:', requestsData);
        
        // Process MongoDB data to ensure proper photo URLs for TTO dashboard
        const processedRequests = requestsData.map(req => ({
          ...req,
          id: req._id || req.id,
          // Handle tire photo URLs from MongoDB for TTO dashboard
          tirePhotoUrls: req.tirePhotoUrls ? req.tirePhotoUrls.map(photoUrl => {
            // If already a full URL, use as is
            if (photoUrl.startsWith('http')) return photoUrl;
            
            // If it's a relative path, construct full Railway URL
            if (photoUrl.startsWith('/uploads/') || photoUrl.startsWith('uploads/')) {
              const cleanPath = photoUrl.replace(/^\/uploads\/|^uploads\//, '');
              return `https://tire-backend-58a9.onrender.com/uploads/${cleanPath}`;
            }
            
            // If it's just a filename, add the full path
            return `https://tire-backend-58a9.onrender.com/uploads/${photoUrl}`;
          }) : [],
          // Map tirePhotoUrls to photos for table display compatibility
          photos: req.tirePhotoUrls ? req.tirePhotoUrls.map(photoUrl => {
            // If already a full URL, use as is
            if (photoUrl.startsWith('http')) return photoUrl;
            
            // If it's a relative path, construct full Railway URL
            if (photoUrl.startsWith('/uploads/') || photoUrl.startsWith('uploads/')) {
              const cleanPath = photoUrl.replace(/^\/uploads\/|^uploads\//, '');
              return `https://tire-backend-58a9.onrender.com/uploads/${cleanPath}`;
            }
            
            // If it's just a filename, add the full path
            return `https://tire-backend-58a9.onrender.com/uploads/${photoUrl}`;
          }) : []
        }));
        
        setRequests(processedRequests);
        console.log('📊 TTO Dashboard: Successfully loaded', processedRequests.length, 'tire requests with photos');
        console.log('🖼️ TTO Dashboard: Sample photo data:', processedRequests.length > 0 ? {
          firstRequest: {
            id: processedRequests[0].id,
            tirePhotoUrls: processedRequests[0].tirePhotoUrls?.length || 0,
            photos: processedRequests[0].photos?.length || 0,
            samplePhoto: processedRequests[0].photos?.[0] || 'No photos'
          }
        } : 'No requests found');
      } else {
        console.log('❌ TTO Dashboard: MongoDB API error:', response.status, response.statusText);
        throw new Error(`API error: ${response.status}`);
      }
    } catch (error) {
      console.error('💥 TTO Dashboard: MongoDB connection failed, using fallback:', error);
      
      // Fallback to existing logic for demo/development
      try {
        const response = await axios.get(`${API_URL}/tto/requests`);
        const data = response.data || [];
        setRequests(data);
        console.log('🎭 TTO Dashboard: Using fallback data:', data.length, 'requests');
      } catch (fallbackError) {
        console.error('TTO Dashboard: All data sources failed:', fallbackError);
        alert('Failed to load requests. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Filters
  const pendingRequests = requests.filter(r => r.status && r.status.toUpperCase() === 'MANAGER_APPROVED');
  const processedRequests = requests.filter(r => r.status && r.status.toUpperCase() !== 'MANAGER_APPROVED');

  const handleApprove = async (id) => {
    if (!window.confirm('Approve this request?')) return;
    try {
      await axios.post(`${API_URL}/${id}/tto-approve`);
      alert('Request approved by TTO.');
      await fetchRequests(); // Reload to update tables
    } catch (error) {
      alert('Failed to approve request.');
    }
  };

  const handleReject = async (id) => {
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection.');
      return;
    }
    if (!window.confirm('Reject this request?')) return;

    try {
      await axios.post(`${API_URL}/${id}/tto-reject`, { reason: rejectionReason.trim() });
      alert('Request rejected successfully by TTO.');
      setRejectionReason('');
      setShowRejectModal(false);
      setSelectedRequestId(null);
      await fetchRequests();
    } catch (error) {
      console.error('Rejection error:', error);
      alert('Failed to reject request. Please try again.');
    }
  };
  const deleteRequest = async (id) => {
  if (!window.confirm('Are you sure you want to delete this request?')) return;
  try {
    await axios.delete(`${API_URL}/${id}`);
    setRequests(prev => prev.filter(r => r.id !== id));
    alert('Request deleted successfully.');
  } catch (error) {
    console.error('Error deleting request:', error);
    alert('Failed to delete request.');
  }
};


  const openRejectModal = (id) => {
    setSelectedRequestId(id);
    setRejectionReason('');
    setShowRejectModal(true);
  };
  const closeRejectModal = () => {
    setShowRejectModal(false);
    setSelectedRequestId(null);
    setRejectionReason('');
  };

  // NEW: Open details modal with request info
  const openDetailsModal = (request) => {
    setSelectedRequest(request);
    setShowDetailsModal(true);
  };

  // NEW: Close details modal
  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedRequest(null);
  };

  const getStatusColor = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'approved':
        return 'status-approved';
      case 'tto_approved':
        return 'status-tto-approved';
      case 'tto_rejected':
        return 'status-rejected';
      case 'pending':
      default:
        return 'status-pending';
    }
  };

  const openPhotoModal = (photos, index = 0) => {
    setPhotoModal({ show: true, photos, currentIndex: index });
    setPhotoZoom(1);
    setImageLoading(true);
  };

  const closePhotoModal = () => {
    setPhotoModal({ show: false, photos: [], currentIndex: 0 });
    setPhotoZoom(1);
    setImageLoading(false);
  };

  const nextPhoto = () => {
    setPhotoModal(prev => ({ ...prev, currentIndex: (prev.currentIndex + 1) % prev.photos.length }));
    setPhotoZoom(1);
    setImageLoading(true);
  };

  const prevPhoto = () => {
    setPhotoModal(prev => ({
      ...prev,
      currentIndex: prev.currentIndex === 0 ? prev.photos.length - 1 : prev.currentIndex - 1
    }));
    setPhotoZoom(1);
    setImageLoading(true);
  };

  const downloadPhoto = () => {
    const link = document.createElement('a');
    link.href = photoModal.photos[photoModal.currentIndex];
    link.download = `tire_photo_${photoModal.currentIndex + 1}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const zoomIn = () => setPhotoZoom(prev => Math.min(prev + 0.5, 3));
  const zoomOut = () => setPhotoZoom(prev => Math.max(prev - 0.5, 0.5));
  const resetZoom = () => setPhotoZoom(1);
  const handleImageLoad = () => setImageLoading(false);
  const handleImageError = () => setImageLoading(false);
  const handleTouchStart = (e) => setTouchStart(e.touches[0].clientX);
  const handleTouchEnd = (e) => {
    if (!touchStart) return;
    const diff = touchStart - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) diff > 0 ? nextPhoto() : prevPhoto();
    setTouchStart(null);
  };

  // Keyboard shortcuts for photo modal
  React.useEffect(() => {
    const handleKeyPress = (e) => {
      if (!photoModal.show) return;
      if (e.key === 'Escape') closePhotoModal();
      else if (e.key === 'ArrowRight') nextPhoto();
      else if (e.key === 'ArrowLeft') prevPhoto();
      else if (e.key === '+' || e.key === '=') { e.preventDefault(); zoomIn(); }
      else if (e.key === '-') { e.preventDefault(); zoomOut(); }
      else if (e.key === '0') resetZoom();
    };
    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [photoModal.show]);

  const renderTable = (title, data, actionsEnabled) => (
    <div className="requests-table-container">
      <h2>{title}</h2>
      {loading ? (
        <p>Loading requests...</p>
      ) : data.length === 0 ? (
        <p className="no-requests">No requests found.</p>
      ) : (
        <table className="requests-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Vehicle No.</th>
              <th>Type</th>
              <th>Brand</th>
              <th>Model</th>
              <th>Tire Size</th>
              <th>Tires</th>
              <th>Tubes</th>
              <th>Present Km</th>
              <th>Wear</th>
              <th>Pattern</th>
              <th>Officer</th>
              <th>Photos</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map(req => (
              <tr 
                key={req.id}
                ref={el => rowRefs.current[req.id] = el}
                style={{
                  backgroundColor: highlightedRequestId === req.id ? '#fff3cd' : 'transparent',
                  border: highlightedRequestId === req.id ? '2px solid #ffc107' : 'none',
                  transition: 'background-color 0.3s ease'
                }}
              >
                <td>{req.id?.substring(0, 8)}...</td>
                <td>{req.vehicleNo}</td>
                <td>{req.vehicleType}</td>
                <td>{req.vehicleBrand}</td>
                <td>{req.vehicleModel}</td>
                <td>{req.tireSize}</td>
                <td>{req.noOfTires}</td>
                <td>{req.noOfTubes}</td>
                <td>{req.presentKm}</td>
                <td>{req.wearIndicator}</td>
                <td>{req.wearPattern}</td>
                <td>{req.officerServiceNo}</td>
                <td>
                  {req.photos && req.photos.length > 0 ? (
                    <div className="photo-thumbnail-container">
                      <img 
                        src={req.photos[0].url || req.photos[0]} 
                        alt="Tire Photo"
                        className="photo-thumbnail"
                        onClick={() => openPhotoModal(req.photos)}
                        onError={(e) => {
                          console.warn('❌ TTO Dashboard: Photo failed to load:', req.photos[0]);
                          // Try fallback with demo images
                          if (!e.target.src.includes('tire') && req.photos[0]) {
                            e.target.src = '/images/tire.jpeg';
                          } else {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'inline-block';
                          }
                        }}
                      />
                      <span 
                        style={{ 
                          display: 'none', 
                          fontSize: '12px', 
                          color: '#666',
                          cursor: 'pointer',
                          textDecoration: 'underline',
                          padding: '4px 8px',
                          background: '#f8f9fa',
                          border: '1px solid #ddd',
                          borderRadius: '4px'
                        }}
                        onClick={() => openPhotoModal(req.photos)}
                      >
                        📷 View ({req.photos.length})
                      </span>
                      {req.photos.length > 1 && (
                        <span style={{ fontSize: '10px', color: '#999', display: 'block', marginTop: '2px' }}>
                          +{req.photos.length - 1} more
                        </span>
                      )}
                    </div>
                  ) : req.tirePhotoUrls && req.tirePhotoUrls.length > 0 ? (
                    <div className="photo-thumbnail-container">
                      <img 
                        src={req.tirePhotoUrls[0]} 
                        alt="Tire Photo"
                        className="photo-thumbnail"
                        onClick={() => openPhotoModal(req.tirePhotoUrls)}
                        onError={(e) => {
                          console.warn('❌ TTO Dashboard: Tire photo URL failed to load:', req.tirePhotoUrls[0]);
                          e.target.src = '/images/tire.jpeg';
                        }}
                      />
                      {req.tirePhotoUrls.length > 1 && (
                        <span style={{ fontSize: '10px', color: '#999', display: 'block', marginTop: '2px' }}>
                          +{req.tirePhotoUrls.length - 1} more
                        </span>
                      )}
                    </div>
                  ) : (
                    <span style={{ fontSize: '12px', color: '#999', fontStyle: 'italic' }}>
                      📷 No photos
                    </span>
                  )}
                </td>
                <td>
                  <span className={`status-badge ${getStatusColor(req.status)}`}>
                    {(req.status || '').replace(/_/g, ' ').toUpperCase()}
                  </span>
                </td>
               <td>
  <div className="action-buttons">
    <button
      className="view-btn"
      title="View Details"
      onClick={() => openDetailsModal(req)}
    >
      👁️
    </button>

    {actionsEnabled ? (
      <>
        <button className="approve-btn" onClick={() => handleApprove(req.id)}>✓</button>
        <button className="reject-btn" onClick={() => openRejectModal(req.id)}>✗</button>
        <button className="delete-btn" onClick={() => deleteRequest(req.id)}>🗑️</button>
      </>
    ) : (
      <>
        <button className="delete-btn" onClick={() => deleteRequest(req.id)}>🗑️</button>
      </>
    )}
  </div>
</td>

              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );

  return (
    <div className="tto-dashboard">
      <div className="tto-hero" style={{ backgroundImage: `url('/images/tire3.jpeg')` }}>
        <div className="overlay"></div>
        <div className="hero-text">
          <h1>🔧 TTO Dashboard - Tire Requests</h1>
          <button className="tto-button" onClick={() => navigate('/tto/approved-requests')}>
            View Approved Requests
          </button>
          <p>Process manager-approved tire requests for replacement.</p>
        </div>
      </div>

      {/* Notification banner for highlighted request */}
      {highlightedRequestId && (
        <div style={{
          backgroundColor: '#d1ecf1',
          border: '1px solid #bee5eb',
          borderRadius: '4px',
          padding: '12px',
          margin: '20px',
          color: '#0c5460',
          textAlign: 'center'
        }}>
          <strong>📧 Email Notification:</strong> Request ID {highlightedRequestId.substring(0, 8)}... 
          has been highlighted for your review. Please scroll down to see the request details.
          <button 
            onClick={() => setHighlightedRequestId(null)}
            style={{
              marginLeft: '10px',
              background: 'none',
              border: 'none',
              color: '#0c5460',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="tto-content">
        {renderTable('Manager Approved Requests - TTO Processing', pendingRequests, true)}
        {renderTable('TTO Processed Requests (Approved/Rejected)', processedRequests, false)}
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="modal-overlay" onClick={closeRejectModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Reject Request</h3>
            <p>Please provide a reason for rejecting this request:</p>
            <textarea
              placeholder="Enter rejection reason..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
            />
            <div className="modal-buttons">
              <button onClick={closeRejectModal}>Cancel</button>
              <button onClick={() => handleReject(selectedRequestId)}>Reject</button>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedRequest && (
        <div className="modal-overlay" onClick={closeDetailsModal}>
          <div className="modal details-modal" onClick={e => e.stopPropagation()}>
            <button className="close-details" onClick={closeDetailsModal}>✖ Close</button>
            <h3>Request Details (ID: {selectedRequest.id?.substring(0, 8)}...)</h3>
            <p><b>Vehicle No:</b> {selectedRequest.vehicleNo}</p>
            <p><b>Type:</b> {selectedRequest.vehicleType}</p>
            <p><b>Brand:</b> {selectedRequest.vehicleBrand}</p>
            <p><b>Model:</b> {selectedRequest.vehicleModel}</p>
            <p><b>Tire Size:</b> {selectedRequest.tireSize}</p>
            <p><b>No of Tires:</b> {selectedRequest.noOfTires}</p>
            <p><b>No of Tubes:</b> {selectedRequest.noOfTubes}</p>
            <p><b>Present KM:</b> {selectedRequest.presentKm}</p>
            <p><b>Wear Indicator:</b> {selectedRequest.wearIndicator}</p>
            <p><b>Wear Pattern:</b> {selectedRequest.wearPattern}</p>
            <p><b>Officer Service No:</b> {selectedRequest.officerServiceNo}</p>
            <p><b>Status:</b> {selectedRequest.status}</p>
            {selectedRequest.rejectReason && <p><b>Reject Reason:</b> {selectedRequest.rejectReason}</p>}
            <p><b>Comments:</b> {selectedRequest.comments || '—'}</p>
            <div>
              <b>Photos:</b>
              {selectedRequest.tirePhotoUrls?.length ? (
                <div className="photo-thumbnails">
                  {selectedRequest.tirePhotoUrls.map((url, i) => {
                    // Enhanced MongoDB photo URL handling for TTO Dashboard
                    const getTTOPhotoUrl = (originalUrl) => {
                      if (!originalUrl) return null;
                      
                      // If already a full HTTP URL from MongoDB, use as is
                      if (originalUrl.startsWith('http')) return originalUrl;
                      
                      // Handle relative paths from MongoDB
                      if (originalUrl.startsWith('/uploads/')) {
                        return `https://tire-backend-58a9.onrender.com${originalUrl}`;
                      }
                      
                      // Handle direct filenames from MongoDB
                      if (!originalUrl.startsWith('/')) {
                        return `https://tire-backend-58a9.onrender.com/uploads/${originalUrl}`;
                      }
                      
                      // Fallback for legacy data
                      return originalUrl;
                    };
                    
                    const photoUrl = getTTOPhotoUrl(url);
                    if (!photoUrl) return null;
                    
                    return (
                      <img
                        key={i}
                        src={photoUrl}
                        alt={`Tire ${i + 1} - ${selectedRequest.vehicleNo}`}
                        className="photo-thumbnail"
                        title={`Click to view tire photo ${i + 1} full size (${selectedRequest.vehicleNo})`}
                        onClick={() => {
                          // Create enhanced photo URLs for modal from MongoDB data
                          const modalUrls = selectedRequest.tirePhotoUrls.map(photoUrl => getTTOPhotoUrl(photoUrl));
                          openPhotoModal(modalUrls, i);
                        }}
                        onError={(e) => {
                          console.warn(`❌ TTO Dashboard: Failed to load tire photo: ${e.target.src}`);
                          
                          // Enhanced multi-level fallback system for TTO Dashboard
                          if (!e.target.dataset.ttoFallbackLevel) {
                            e.target.dataset.ttoFallbackLevel = '1';
                            
                            // Level 1: Try direct Railway backend URL
                            const filename = url.split('/').pop().split('?')[0];
                            const railwayUrl = `https://tire-backend-58a9.onrender.com/uploads/${filename}`;
                            
                            console.log(`🔄 TTO Dashboard Level 1 fallback: ${railwayUrl}`);
                            e.target.src = railwayUrl;
                            
                          } else if (e.target.dataset.ttoFallbackLevel === '1') {
                            e.target.dataset.ttoFallbackLevel = '2';
                            
                            // Level 2: Try demo images
                            const demoImages = ['/images/tire1.jpeg', '/images/tire2.jpeg', '/images/tire3.jpeg'];
                            const demoUrl = demoImages[i % demoImages.length];
                            
                            console.log(`🔄 TTO Dashboard Level 2 fallback: ${demoUrl}`);
                            e.target.src = demoUrl;
                            
                          } else {
                            // Final fallback: Show professional error message
                            console.error(`💥 TTO Dashboard: All image fallbacks failed for: ${url}`);
                            e.target.style.display = 'none';
                            
                            if (!e.target.nextElementSibling?.classList?.contains('tto-photo-error')) {
                              e.target.insertAdjacentHTML('afterend', 
                                `<div class="tto-photo-error" style="
                                  background: linear-gradient(135deg, #f8d7da, #f5c6cb);
                                  border: 1px solid #f5c6cb;
                                  border-radius: 4px;
                                  padding: 8px;
                                  margin: 2px;
                                  text-align: center;
                                  color: #721c24;
                                  font-size: 11px;
                                  min-width: 80px;
                                  min-height: 60px;
                                  display: flex;
                                  flex-direction: column;
                                  justify-content: center;
                                  align-items: center;
                                ">
                                  <div style="font-size: 16px; margin-bottom: 4px;">📷</div>
                                  <div style="font-weight: bold;">Photo Error</div>
                                  <div style="font-size: 9px; opacity: 0.8;">Not available</div>
                                </div>`
                              );
                            }
                          }
                        }}
                        onLoad={() => {
                          console.log(`✅ TTO Dashboard: Successfully loaded tire photo: ${photoUrl}`);
                        }}
                      />
                    );
                  })}
                </div>
              ) : (
                <p>📷 No tire photos uploaded</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Photo Modal */}
      {photoModal.show && (
        <div className="photo-modal" onClick={closePhotoModal}>
          <div className="photo-modal-content" onClick={e => e.stopPropagation()}>
            <span className="close" onClick={closePhotoModal}>&times;</span>
            <div className="photo-counter">{photoModal.currentIndex + 1} / {photoModal.photos.length}</div>
            <div className="zoom-indicator">Zoom: {Math.round(photoZoom * 100)}%</div>
            <img
              src={photoModal.photos[photoModal.currentIndex]}
              alt="Full size"
              style={{ transform: `scale(${photoZoom})` }}
              onLoad={handleImageLoad}
              onError={handleImageError}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            />
            {imageLoading && <div className="image-loading">Loading...</div>}
            <div className="photo-controls">
              <button onClick={zoomOut}>Zoom Out</button>
              <button onClick={resetZoom}>Reset</button>
              <button onClick={zoomIn}>Zoom In</button>
            </div>
            <div className="photo-navigation">
              <button onClick={prevPhoto}>Previous</button>
              <button onClick={downloadPhoto}>Download</button>
              <button onClick={nextPhoto}>Next</button>
            </div>
          </div>
        </div>
      )}

      <div className="tto-footer">&copy; 2025 Tire Management System | TTO Panel</div>
    </div>
  );
}

export default TTODashboard;

