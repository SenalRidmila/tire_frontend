import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './TTODashboard.css';
import { useNavigate } from 'react-router-dom';

const API_URL = 'https://tirebackend-production.up.railway.app/api/tire-requests';

function TTODashboard() {
  const [requests, setRequests] = useState([]);
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

  // Fetch all requests without filtering
 const fetchAllRequests = async () => {
  try {
    const response = await axios.get(API_URL);
    const data = response.data.map(req => ({
      ...req,
      id: req._id || req.id
    }));

   const approvedRequests = data.filter(req => req.status === 'APPROVED');
setRequests(approvedRequests);


  } catch (error) {
    console.error('Error fetching requests:', error);
  }
};

  useEffect(() => {
    fetchAllRequests();
  }, []);

  // Approve request: update status locally after backend success
  const handleApprove = async (id) => {
    try {
      await axios.post(`${API_URL}/${id}/tto-approve`);

      setRequests(prevRequests =>
        prevRequests.map(req =>
          req.id === id
            ? { ...req, status: 'TTO_APPROVED', ttoApprovalDate: new Date().toISOString() }
            : req
        )
      );

      alert(`Request #${id.substring(0, 8)} approved successfully by TTO`);
    } catch (error) {
      console.error('Approval Process Error:', error);
      alert('Failed to approve request');
    }
  };

  // Reject request: update status locally after backend success
  const handleReject = async (id) => {
    if (!rejectionReason) {
      alert('Please provide a reason for rejection');
      return;
    }

    try {
      await axios.put(`${API_URL}/${id}`, {
        status: 'TTO_REJECTED',
        ttoRejectionReason: rejectionReason,
        ttoRejectionDate: new Date().toISOString()
      });

      setRequests(prevRequests =>
        prevRequests.map(req =>
          req.id === id
            ? { ...req, status: 'TTO_REJECTED', ttoRejectionReason: rejectionReason }
            : req
        )
      );

      setRejectionReason('');
      setShowRejectModal(false);
      setSelectedRequestId(null);
      alert('Request rejected successfully by TTO');
    } catch (error) {
      console.error('Failed to reject request:', error);
      alert('Failed to reject request');
    }
  };

  // Modal handlers
  const openDetailsModal = (request) => {
    setSelectedRequest(request);
    setShowDetailsModal(true);
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

  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedRequest(null);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return 'status-approved';
      case 'tto_approved':
        return 'status-tto-approved';
      case 'tto_rejected':
        return 'status-rejected';
      case 'pending':
        return 'status-pending';
      default:
        return '';
    }
  };

  // Photo modal handlers
  const openPhotoModal = (photos, startIndex = 0) => {
    setPhotoModal({
      show: true,
      photos: photos.map(url => `https://tirebackend-production.up.railway.app${url}`),
      currentIndex: startIndex
    });
  };

  const closePhotoModal = () => {
    setPhotoModal({ show: false, photos: [], currentIndex: 0 });
  };

  const nextPhoto = () => {
    setPhotoModal(prev => ({
      ...prev,
      currentIndex: (prev.currentIndex + 1) % prev.photos.length
    }));
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

  // ...zoom, image loading, touch handlers unchanged (not shown here for brevity)...

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (photoModal.show) {
        if (e.key === 'Escape') {
          closePhotoModal();
        } else if (e.key === 'ArrowRight') {
          nextPhoto();
        } else if (e.key === 'ArrowLeft') {
          prevPhoto();
        } else if (e.key === '+' || e.key === '=') {
          e.preventDefault();
          setPhotoZoom(prev => Math.min(prev + 0.5, 3));
        } else if (e.key === '-') {
          e.preventDefault();
          setPhotoZoom(prev => Math.max(prev - 0.5, 0.5));
        } else if (e.key === '0') {
          setPhotoZoom(1);
        }
      }
    };
    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [photoModal.show]);

  return (
    <div className="tto-dashboard">
      <div className="tto-hero" style={{ backgroundImage: `url('/images/tire3.jpeg')` }}>
        <div className="overlay"></div>
        <div className="hero-text">
          <h1>🔧 TTO Dashboard - Tire Requests</h1>
          <button 
            className="tto-button" 
            onClick={() => navigate('/tto/approved-requests')}
          >
            View Approved Requests
          </button>
          <p>Process manager-approved tire requests for replacement.</p>
        </div>
      </div>

      <div className="tto-content">
        <div className="requests-table-container">
          <h2>All Tire Requests - TTO Processing</h2>

          {requests.length === 0 ? (
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
                  <th>Photos</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map(req => (
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
                        {req.status === 'APPROVED' ? 'Pending TTO' : req.status}
                      </span>
                    </td>
                    <td>
                      <div className="photos-container">
                        {req.tirePhotoUrls && req.tirePhotoUrls.length > 0 ? (
                          req.tirePhotoUrls.map((photoUrl, index) => (
                            <img 
                              key={index}
                              src={`https://tirebackend-production.up.railway.app${photoUrl}`} 
                              alt={`Tire ${index + 1}`} 
                              className="table-photo"
                              onClick={() => openPhotoModal(req.tirePhotoUrls, index)}
                              title="Click to view full size"
                            />
                          ))
                        ) : (
                          <span>No photos</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="action-buttons">
                        {req.status === 'APPROVED' && (
                          <>
                            <button 
                              className="approve-btn"
                              onClick={() => handleApprove(req.id)}
                              title="Approve Request"
                            >
                              ✓
                            </button>
                            <button 
                              className="reject-btn"
                              onClick={() => openRejectModal(req.id)}
                              title="Reject Request"
                            >
                              ✗
                            </button>
                          </>
                        )}
                        <button 
                          className="view-details-btn"
                          onClick={() => openDetailsModal(req)}
                          title="View Request Details"
                        >
                          👁
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="modal-overlay">
          <div className="modal">
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

      {/* Request Details Modal */}
      {showDetailsModal && selectedRequest && (
        <div className="modal-overlay">
          <div className="modal wide-modal">
            <h2>Request Details</h2>
            <div className="request-details-grid">
              <div>
                <strong>Request ID:</strong> {selectedRequest.id}
              </div>
              <div>
                <strong>Vehicle No:</strong> {selectedRequest.vehicleNo}
              </div>
              <div>
                <strong>Vehicle Type:</strong> {selectedRequest.vehicleType}
              </div>
              <div>
                <strong>Vehicle Brand:</strong> {selectedRequest.vehicleBrand}
              </div>
              <div>
                <strong>Vehicle Model:</strong> {selectedRequest.vehicleModel}
              </div>
              <div>
                <strong>Tire Size:</strong> {selectedRequest.tireSize}
              </div>
              <div>
                <strong>Number of Tires:</strong> {selectedRequest.noOfTires}
              </div>
              <div>
                <strong>Number of Tubes:</strong> {selectedRequest.noOfTubes}
              </div>
              <div>
                <strong>Present KM:</strong> {selectedRequest.presentKm}
              </div>
              <div>
                <strong>Previous KM:</strong> {selectedRequest.previousKm}
              </div>
              <div>
                <strong>Wear Indicator:</strong> {selectedRequest.wearIndicator}
              </div>
              <div>
                <strong>Wear Pattern:</strong> {selectedRequest.wearPattern}
              </div>
              <div>
                <strong>Officer Service No:</strong> {selectedRequest.officerServiceNo}
              </div>
              {selectedRequest.comments && (
                <div className="full-width">
                  <strong>Comments:</strong> {selectedRequest.comments}
                </div>
              )}
            </div>
            <div className="photos-section">
              <strong>Tire Photos:</strong>
              <div className="request-photos">
                {selectedRequest.tirePhotoUrls && selectedRequest.tirePhotoUrls.length > 0 ? (
                  selectedRequest.tirePhotoUrls.map((photoUrl, index) => (
                    <img 
                      key={index}
                      src={`https://tirebackend-production.up.railway.app${photoUrl}`} 
                      alt={`Tire ${index + 1}`} 
                      className="detail-photo"
                      onClick={() => openPhotoModal(selectedRequest.tirePhotoUrls, index)}
                    />
                  ))
                ) : (
                  <p>No photos uploaded</p>
                )}
              </div>
            </div>
            <div className="modal-buttons">
              <button onClick={closeDetailsModal}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Photo Modal */}
      {photoModal.show && (
        <div className="photo-modal" onClick={closePhotoModal}>
          <span className="close" onClick={closePhotoModal}>&times;</span>
          <img
            src={photoModal.photos[photoModal.currentIndex]}
            alt="Full size"
            className="modal-photo"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="photo-navigation">
            <button onClick={(e) => {
              e.stopPropagation();
              setPhotoModal(prev => ({
                ...prev,
                currentIndex: prev.currentIndex > 0 ? prev.currentIndex - 1 : prev.photos.length - 1
              }));
            }}>Previous</button>
            <button onClick={(e) => {
              e.stopPropagation();
              setPhotoModal(prev => ({
                ...prev,
                currentIndex: (prev.currentIndex + 1) % prev.photos.length
              }));
            }}>Next</button>
          </div>
        </div>
      )}

      <div className="tto-footer">&copy; 2025 Tire Management System | TTO Panel</div>
    </div>
  );
}

export default TTODashboard;