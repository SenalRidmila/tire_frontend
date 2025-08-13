import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './TTODashboard.css';
import { useNavigate } from 'react-router-dom';

const API_URL = process.env.NODE_ENV === 'development' 
  ? `${process.env.REACT_APP_API_URL}/api/tire-requests`
  : '/api/tire-requests';
const BASE_URL = process.env.NODE_ENV === 'development' 
  ? process.env.REACT_APP_API_URL 
  : '';

function TTODashboard() {
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

  const navigate = useNavigate();

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/tto/requests`);
      const data = response.data || [];
      setRequests(data);
    } catch (error) {
      console.error('Error fetching requests:', error);
      alert('Failed to load requests. Please try again later.');
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
              <th>Status</th>
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
                <td>{req.tireSize}</td>
                <td>{req.noOfTires}</td>
                <td>{req.noOfTubes}</td>
                <td>{req.presentKm}</td>
                <td>{req.wearIndicator}</td>
                <td>{req.wearPattern}</td>
                <td>{req.officerServiceNo}</td>
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
                  {selectedRequest.tirePhotoUrls.map((url, i) => (
                    <img
                      key={i}
                      src={`${url}`}
                      alt={`Tire ${i + 1}`}
                      className="photo-thumbnail"
                      onClick={() => openPhotoModal(selectedRequest.tirePhotoUrls.map(p => `${p}`), i)}
                    />
                  ))}
                </div>
              ) : (
                <p>—</p>
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
