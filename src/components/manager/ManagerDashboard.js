// Keep all existing imports as-is
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './ManagerDashboard.css';
import '../RequestForm.css';

const BASE_URL = process.env.NODE_ENV === 'development' 
  ? process.env.REACT_APP_API_URL 
  : '';

function ManagerDashboard() {
  const [requests, setRequests] = useState([]);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null); // For viewing details
  const [photoModal, setPhotoModal] = useState({ show: false, photos: [], currentIndex: 0 });
  const [photoZoom, setPhotoZoom] = useState(1);
  const [imageLoading, setImageLoading] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Get current user info
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    setCurrentUser(user);
    
    fetchRequests();
    const params = new URLSearchParams(location.search);
    const requestId = params.get('requestId');
    if (requestId) fetchRequestDetails(requestId);
  }, [location]);

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('currentUser');
      localStorage.removeItem('isAuthenticated');
      navigate('/login');
    }
  };

  const goToHome = () => {
    // Use Vercel production URL for external navigation
    window.open('https://tire-frontend.vercel.app/home', '_blank');
  };
  
  const fetchRequests = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/tire-requests`);
      const data = response.data.map(req => ({ ...req, id: req._id || req.id }));
      setRequests(data);
    } catch (error) {
      console.error('Error fetching requests:', error);
    }
  };
  const deleteRequest = async (id) => {
  try {
    await axios.delete(`${BASE_URL}/api/tire-requests/${id}`);
    setRequests(prev => prev.filter(request => request._id !== id));
  } catch (error) {
    console.error('Error deleting request:', error);
    alert('Failed to delete request.');
  }
};


  const fetchRequestDetails = async (id) => {
    try {
      const response = await axios.get(`${BASE_URL}/api/tire-requests/${id}`);
      console.log(response.data);
    } catch (error) {
      console.error('Error fetching request details:', error);
    }
  };

  const handleApprove = async (id) => {
    try {
      await axios.post(`${BASE_URL}/api/tire-requests/${id}/approve`);
      fetchRequests();
      alert('Request approved successfully');
    } catch (error) {
      console.error('Error approving request:', error);
      alert('Failed to approve request');
    }
  };

  const handleReject = async (id) => {
    if (!rejectionReason) return alert('Please provide a reason for rejection');
    try {
      await axios.post(`${BASE_URL}/api/tire-requests/${id}/reject`, { reason: rejectionReason });
      fetchRequests();
      setRejectionReason('');
      setShowRejectModal(false);
      setSelectedRequestId(null);
      alert('Request rejected successfully');
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('Failed to reject request');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this request?')) return;
    try {
      await axios.delete(`${BASE_URL}/api/tire-requests/${id}`);
      fetchRequests();
      alert('Request deleted successfully');
    } catch (error) {
      console.error('Error deleting request:', error);
      alert('Failed to delete request');
    }
  };

  const openRejectModal = (id) => {
    setSelectedRequestId(id);
    setShowRejectModal(true);
    setRejectionReason('');
  };

  const closeRejectModal = () => {
    setShowRejectModal(false);
    setSelectedRequestId(null);
    setRejectionReason('');
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved': return 'status-approved';
      case 'rejected': return 'status-rejected';
      case 'pending':
      default: return 'status-pending';
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
    setPhotoModal(prev => ({ ...prev, currentIndex: prev.currentIndex === 0 ? prev.photos.length - 1 : prev.currentIndex - 1 }));
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

  useEffect(() => {
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

  // NEW: Handle view details click
  const handleView = (req) => {
    setSelectedRequest(req);
  };

  // NEW: Close details panel
  const closeDetails = () => {
    setSelectedRequest(null);
  };

  // Modified renderTable to add View button and conditionally show approve/reject/delete buttons
  const renderTable = (title, data, showActions = false) => (
    <div className="requests-table-container">
      <h2>{title}</h2>
      {data.length === 0 ? <p className="no-requests">No requests.</p> : (
        <table className="requests-table">
          <thead>
            <tr>
              <th>ID</th><th>Vehicle No.</th><th>Type</th><th>Brand</th><th>Model</th><th>Section</th>
              <th>Tire Size</th><th>Tires</th><th>Tubes</th><th>Present Km</th><th>Previous Km</th>
              <th>Wear</th><th>Pattern</th><th>Officer</th><th>Status</th><th>Photos</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map(req => (
              <tr key={req.id}>
                <td>{req.id?.substring(0, 8)}...</td>
                <td>{req.vehicleNo}</td>
                <td>{req.vehicleType}</td>
                <td>{req.vehicleBrand}</td>
                <td>{req.vehicleModel}</td>
                <td>{req.userSection}</td>
                <td>{req.tireSize}</td>
                <td>{req.noOfTires}</td>
                <td>{req.noOfTubes}</td>
                <td>{req.presentKm}</td>
                <td>{req.previousKm}</td>
                <td>{req.wearIndicator}</td>
                <td>{req.wearPattern}</td>
                <td>{req.officerServiceNo}</td>
                <td><span className={`status-badge ${getStatusColor(req.status)}`}>{req.status || 'Pending'}</span></td>
                <td>
                  <div className="photos-container">
                    {req.tirePhotoUrls?.length > 0 ? req.tirePhotoUrls.map((url, i) => (
                      <img key={i}
                        src={`${BASE_URL}${url}`}
                        className="table-photo"
                        onClick={() => openPhotoModal(req.tirePhotoUrls.map(p => `${BASE_URL}${p}`), i)}
                        alt={`Tire ${i + 1}`}
                      />
                    )) : <span>No photos</span>}
                  </div>
                </td>
                <td>
                  <div className="action-buttons">
                    <button className="view-btn" title="View Details" onClick={() => handleView(req)}>👁️</button>
                        <button className="delete-btn" title="Delete" onClick={() => handleDelete(req.id)}>🗑️</button>

                    {showActions && (
                      <>
                        <button className="approve-btn" title="Approve" onClick={() => handleApprove(req.id)}>✓</button>
                        <button className="reject-btn" title="Reject" onClick={() => openRejectModal(req.id)}>✗</button>
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

  const pendingRequests = requests.filter(r => !r.status || r.status.toLowerCase() === 'pending');
  const processedRequests = requests.filter(r => r.status && r.status.toLowerCase() !== 'pending');

  return (
    <div className="manager-dashboard">
      <div className="manager-hero" style={{ backgroundImage: `url('/images/tire2.jpeg')` }}>
        <div className="overlay"></div>
        <div className="hero-text">
          <h1>🧑‍💼 Manager Dashboard - Tire Requests</h1>
          <p>View and manage tire requests submitted by users.</p>
        </div>
      </div>

      <div className="manager-content">
        {renderTable('Pending Requests', pendingRequests, true)}
        {renderTable('Approved / Rejected Requests', processedRequests, false)}
      </div>

      {/* Details panel */}
      {selectedRequest && (
        <div className="request-details-panel">
          <button className="close-details" onClick={closeDetails}>✖ Close</button>
          <h3>Request Details (ID: {selectedRequest.id?.substring(0, 8)}...)</h3>
          <p><b>Vehicle No:</b> {selectedRequest.vehicleNo}</p>
          <p><b>Type:</b> {selectedRequest.vehicleType}</p>
          <p><b>Brand:</b> {selectedRequest.vehicleBrand}</p>
          <p><b>Model:</b> {selectedRequest.vehicleModel}</p>
          <p><b>User Section:</b> {selectedRequest.userSection}</p>
          <p><b>Tire Size:</b> {selectedRequest.tireSize}</p>
          <p><b>No of Tires:</b> {selectedRequest.noOfTires}</p>
          <p><b>No of Tubes:</b> {selectedRequest.noOfTubes}</p>
          <p><b>Present KM:</b> {selectedRequest.presentKm}</p>
          <p><b>Previous KM:</b> {selectedRequest.previousKm}</p>
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
                {selectedRequest.tirePhotoUrls.map((u, i) => (
                  <img
                    key={i}
                    src={`${BASE_URL}${u}`}
                    alt={`Tire ${i + 1}`}
                    className="photo-thumbnail"
                    onClick={() => openPhotoModal(selectedRequest.tirePhotoUrls.map(p => `${BASE_URL}${p}`), i)}
                  />
                ))}
              </div>
            ) : (
              <p>—</p>
            )}
          </div>
        </div>
      )}

      {showRejectModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Reject Request</h3>
            <textarea value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} rows={4} placeholder="Enter rejection reason..." />
            <div className="modal-buttons">
              <button onClick={closeRejectModal}>Cancel</button>
              <button onClick={() => handleReject(selectedRequestId)}>Reject</button>
            </div>
          </div>
        </div>
      )}

      {photoModal.show && (
        <div className="photo-modal" onClick={closePhotoModal}>
          <div className="photo-modal-content" onClick={(e) => e.stopPropagation()}>
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

      <div className="manager-footer">&copy; 2025 Tire Management System | Manager Panel</div>
    </div>
  );
}

export default ManagerDashboard;
