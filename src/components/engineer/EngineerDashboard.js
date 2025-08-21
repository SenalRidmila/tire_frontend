import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import './EngineerDashboard.css';
import { useLocation } from 'react-router-dom';

const API_URL = process.env.NODE_ENV === 'development' 
  ? `${process.env.REACT_APP_API_URL}/api/tire-requests`
  : '/api/tire-requests';
const BASE_URL = process.env.NODE_ENV === 'development' 
  ? process.env.REACT_APP_API_URL 
  : '';

// "Engineer can act on" statuses (adjust if your API returns different)
const ENGINEER_PENDING_STATUSES = ['TTO_APPROVED', 'ENGINEER_PENDING', 'MANAGER_APPROVED'];

// Helper function to check if status should be visible to engineer
const isEngineerPendingStatus = (status) => {
  if (!status) return false;
  const upperStatus = status.toUpperCase();
  return ENGINEER_PENDING_STATUSES.includes(upperStatus) || 
         upperStatus === 'TTO_APPROVED' || 
         upperStatus === 'MANAGER_APPROVED';
};

function EngineerDashboard() {
  const location = useLocation();

  const [requests, setRequests] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [processedRequests, setProcessedRequests] = useState([]);

  const [highlightedRequestId, setHighlightedRequestId] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectingId, setRejectingId] = useState(null);

  const [photoModal, setPhotoModal] = useState({ show: false, photos: [], currentIndex: 0 });
  const [usingMockData, setUsingMockData] = useState(false);

  const rowRefs = useRef({});

  // -------------------- Fetch --------------------
  const fetchRequests = async () => {
    try {
      console.log('🔍 Engineer Dashboard: Fetching tire requests from MongoDB...');
      
      // Try MongoDB tire_requests collection via Railway backend (same as TTO Dashboard)
      const response = await fetch('https://tirebackend-production.up.railway.app/api/tire-requests', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const requestsData = await response.json();
        console.log('✅ Engineer Dashboard: MongoDB tire_requests loaded:', requestsData);
        
        // Process MongoDB data to ensure proper photo URLs for engineer dashboard
        const processedRequests = requestsData.map(req => ({
          ...req,
          id: req._id || req.id,
          // Handle tire photo URLs from MongoDB for engineer dashboard
          tirePhotoUrls: req.tirePhotoUrls ? req.tirePhotoUrls.map(photoUrl => {
            // If already a full URL, use as is
            if (photoUrl.startsWith('http')) return photoUrl;
            
            // If it's a relative path, construct full Railway URL
            if (photoUrl.startsWith('/uploads/') || photoUrl.startsWith('uploads/')) {
              const cleanPath = photoUrl.replace(/^\/uploads\/|^uploads\//, '');
              return `https://tirebackend-production.up.railway.app/uploads/${cleanPath}`;
            }
            
            // If it's just a filename, add the full path
            return `https://tirebackend-production.up.railway.app/uploads/${photoUrl}`;
          }) : [],
          // Map tirePhotoUrls to photos for table display compatibility
          photos: req.tirePhotoUrls ? req.tirePhotoUrls.map(photoUrl => {
            // If already a full URL, use as is
            if (photoUrl.startsWith('http')) return photoUrl;
            
            // If it's a relative path, construct full Railway URL
            if (photoUrl.startsWith('/uploads/') || photoUrl.startsWith('uploads/')) {
              const cleanPath = photoUrl.replace(/^\/uploads\/|^uploads\//, '');
              return `https://tirebackend-production.up.railway.app/uploads/${cleanPath}`;
            }
            
            // If it's just a filename, add the full path
            return `https://tirebackend-production.up.railway.app/uploads/${photoUrl}`;
          }) : []
        }));
        
        setRequests(processedRequests);
        setUsingMockData(false);
        console.log('📊 Engineer Dashboard: Successfully loaded', processedRequests.length, 'tire requests with photos');
        
        // Debug – see all unique statuses coming from MongoDB
        const unique = [...new Set(processedRequests.map(r => r.status))];
        console.log('🔍 Engineer unique statuses from MongoDB =>', unique);
        
      } else {
        console.log('❌ Engineer Dashboard: MongoDB API error:', response.status, response.statusText);
        throw new Error(`API error: ${response.status}`);
      }
    } catch (error) {
      console.error('💥 Engineer Dashboard: MongoDB connection failed, using fallback mock data:', error);
      
      // Fallback to mock data for development
      const mockData = [
        {
          id: 'mock-tto-1',
          vehicleNo: 'CAR-2024-001',
          vehicleType: 'Car',
          vehicleBrand: 'Toyota',
          vehicleModel: 'Prius',
          userSection: 'Transport Department',
          tireSize: '215/60R16',
          noOfTires: '4',
          noOfTubes: '0',
          presentKm: '60000',
          previousKm: '55000',
          wearIndicator: 'Yes',
          wearPattern: 'Even',
          officerServiceNo: 'ENG001',
          status: 'TTO_APPROVED',
          comments: 'TTO approved request awaiting engineer review',
          tirePhotoUrls: []
        },
        {
          id: 'mock-mgr-1', 
          vehicleNo: 'VAN-2024-002',
          vehicleType: 'Van',
          vehicleBrand: 'Nissan',
          vehicleModel: 'NV200',
          userSection: 'Admin Department',
          tireSize: '185/65R15',
          noOfTires: '4',
          noOfTubes: '0',
          presentKm: '45000',
          previousKm: '40000',
          wearIndicator: 'Yes',
          wearPattern: 'Uneven',
          officerServiceNo: 'MGR001',
          status: 'MANAGER_APPROVED',
          comments: 'Manager approved request awaiting engineer review',
          tirePhotoUrls: []
        }
      ];
      setRequests(mockData);
      setUsingMockData(true);
      console.log('🎭 Engineer Dashboard: Using fallback mock data:', mockData.length, 'requests');
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // -------------------- Split into pending / processed --------------------
  useEffect(() => {
    const pend = requests.filter(r => isEngineerPendingStatus(r.status));
    const proc = requests.filter(r => !isEngineerPendingStatus(r.status));
    setPendingRequests(pend);
    setProcessedRequests(proc);
  }, [requests]);

  // -------------------- Handle URL param highlight --------------------
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const requestId = params.get('requestId');
    if (requestId) setHighlightedRequestId(requestId);
  }, [location.search]);

  // -------------------- Scroll to highlighted row --------------------
  useEffect(() => {
    if (highlightedRequestId && rowRefs.current[highlightedRequestId]) {
      rowRefs.current[highlightedRequestId].scrollIntoView({ behavior: 'smooth' });
    }
  }, [highlightedRequestId, pendingRequests]);

  // -------------------- Actions --------------------
  const handleApprove = async (id) => {
    if (!window.confirm('Approve this request for tire replacement?')) return;
    try {
      await axios.post(`${API_URL}/${id}/engineer-approve`);
      alert('Request approved successfully.');
      await fetchRequests();
    } catch (error) {
      console.error('Approve error:', error);
      alert('Failed to approve request.');
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      alert('Please provide a reason for rejection.');
      return;
    }
    if (!window.confirm('Reject this request?')) return;

    try {
      await axios.post(`${API_URL}/${rejectingId}/engineer-reject`, { reason: rejectReason.trim() });
      alert('Request rejected successfully.');
      setShowRejectModal(false);
      setRejectReason('');
      setRejectingId(null);
      await fetchRequests();
    } catch (error) {
      console.error('Reject error:', error);
      alert('Failed to reject request.');
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

  const openReject = (id) => {
    setRejectingId(id);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const closeReject = () => {
    setShowRejectModal(false);
    setRejectReason('');
    setRejectingId(null);
  };

  const openPhotoModal = (photos, index = 0) => {
    setPhotoModal({ show: true, photos, currentIndex: index });
  };

  const closePhotoModal = () => {
    setPhotoModal({ show: false, photos: [], currentIndex: 0 });
  };

  const nextPhoto = () => {
    setPhotoModal(prev => ({ ...prev, currentIndex: (prev.currentIndex + 1) % prev.photos.length }));
  };

  const prevPhoto = () => {
    setPhotoModal(prev => ({
      ...prev,
      currentIndex: prev.currentIndex === 0 ? prev.photos.length - 1 : prev.currentIndex - 1
    }));
  };

  // -------------------- Components --------------------
  const ViewButton = ({ onClick }) => (
    <button title="View" onClick={onClick} style={{ marginRight: 6 }}>👁️</button>
  );
  const ApproveButton = ({ onClick }) => (
    <button title="Approve" onClick={onClick} style={{ marginRight: 6 }}>✅</button>
  );
  const RejectButton = ({ onClick }) => (
    <button title="Reject" onClick={onClick}>❌</button>
  );

  return (
    <div className="engineer-dashboard">
      {/* Hero Section */}
      <div className="dashboard-banner" style={{ backgroundImage: `url('/images/tire2.jpeg')` }}>
        <div className="overlay"></div>
        <div className="banner-text">
          <h2>🔧 Engineer Dashboard - Tire Request Review</h2>
          <p>Review and approve TTO-processed tire replacement requests</p>
        </div>
      </div>

      <div className="dashboard-content" style={{ padding: '20px' }}>
        {usingMockData && (
          <div style={{
            backgroundColor: '#fff3cd',
            border: '1px solid #ffeaa7',
            borderRadius: '4px',
            padding: '12px',
            marginBottom: '20px',
            color: '#856404'
          }}>
            <strong>⚠️ Demo Mode:</strong> Backend unavailable. Showing sample data for testing. 
            Please check your Railway deployment.
          </div>
        )}

        {/* ================== Pending table ================== */}
        <section className="table-section">
          <h3>Pending Requests for Engineer Review</h3>
          {pendingRequests.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '40px',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              margin: '20px 0'
            }}>
              <h4 style={{ color: '#6c757d', marginBottom: '10px' }}>📋 No Pending Requests</h4>
              <p style={{ color: '#6c757d' }}>All tire requests have been processed or there are no requests awaiting engineer approval.</p>
            </div>
          ) : (
          <table className="request-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Vehicle No.</th>
                <th>Type</th>
                <th>Brand</th>
                <th>Model</th>
                <th>Section</th>
                <th>Tire Size</th>
                <th>Tires</th>
                <th>Tubes</th>
                <th>Present Km</th>
                <th>Wear Indicator</th>
                <th>Wear Pattern</th>
                <th>Officer</th>
                <th>Status</th>
                <th>Photos</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingRequests.map(req => (
                <tr 
                  key={req.id}
                  ref={el => rowRefs.current[req.id] = el}
                  style={{
                    backgroundColor: highlightedRequestId === req.id ? '#ffffcc' : 'transparent'
                  }}
                >
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
                  <td>{req.wearIndicator}</td>
                  <td>{req.wearPattern}</td>
                  <td>{req.officerServiceNo}</td>
                  <td>
                    <span style={{ 
                      padding: '4px 8px', 
                      borderRadius: '4px', 
                      fontSize: '12px',
                      backgroundColor: req.status === 'TTO_APPROVED' ? '#e7f3ff' : '#f0f0f0',
                      color: req.status === 'TTO_APPROVED' ? '#0066cc' : '#666'
                    }}>
                      {req.status?.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td>
                    {req.photos && req.photos.length > 0 ? (
                      <span style={{ cursor: 'pointer', color: 'blue' }} onClick={() => openPhotoModal(req.photos)}>
                        📷 {req.photos.length}
                      </span>
                    ) : req.tirePhotoUrls && req.tirePhotoUrls.length > 0 ? (
                      <span style={{ cursor: 'pointer', color: 'blue' }} onClick={() => openPhotoModal(req.tirePhotoUrls)}>
                        📷 {req.tirePhotoUrls.length}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td>
                   <ViewButton onClick={() => setSelectedRequest(req)} />
<ApproveButton onClick={() => handleApprove(req.id)} />
<RejectButton onClick={() => openReject(req.id)} />
<button title="Delete" onClick={() => deleteRequest(req.id)}>🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* ================== Processed table ================== */}
      <section className="table-section">
        <h3>Processed Requests</h3>
        {processedRequests.length === 0 ? (
          <p>No processed requests.</p>
        ) : (
          <table className="request-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Vehicle No.</th>
                <th>Type</th>
                <th>Brand</th>
                <th>Model</th>
                <th>Section</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {processedRequests.map(req => (
                <tr key={req.id}>
                  <td>{req.id?.substring(0, 8)}...</td>
                  <td>{req.vehicleNo}</td>
                  <td>{req.vehicleType}</td>
                  <td>{req.vehicleBrand}</td>
                  <td>{req.vehicleModel}</td>
                  <td>{req.userSection}</td>
                  <td>
                    <span style={{ 
                      padding: '4px 8px', 
                      borderRadius: '4px', 
                      fontSize: '12px',
                      backgroundColor: req.status?.includes('APPROVED') ? '#e7f5e7' : '#ffe7e7',
                      color: req.status?.includes('APPROVED') ? '#006600' : '#cc0000'
                    }}>
                      {req.status?.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td>
                    <ViewButton onClick={() => setSelectedRequest(req)} />
                    <button title="Delete" onClick={() => deleteRequest(req.id)}>🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* ================== Request details modal ================== */}
      {selectedRequest && (
        <div className="modal-overlay" onClick={() => setSelectedRequest(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Request Details</h3>
            <p><b>ID:</b> {selectedRequest.id}</p>
            <p><b>Vehicle No:</b> {selectedRequest.vehicleNo}</p>
            <p><b>Type:</b> {selectedRequest.vehicleType}</p>
            <p><b>Brand:</b> {selectedRequest.vehicleBrand}</p>
            <p><b>Model:</b> {selectedRequest.vehicleModel}</p>
            <p><b>Section:</b> {selectedRequest.userSection}</p>
            <p><b>Tire Size:</b> {selectedRequest.tireSize}</p>
            <p><b>No of Tires:</b> {selectedRequest.noOfTires}</p>
            <p><b>No of Tubes:</b> {selectedRequest.noOfTubes}</p>
            <p><b>Present KM:</b> {selectedRequest.presentKm}</p>
            <p><b>Previous KM:</b> {selectedRequest.previousKm}</p>
            <p><b>Wear Indicator:</b> {selectedRequest.wearIndicator}</p>
            <p><b>Wear Pattern:</b> {selectedRequest.wearPattern}</p>
            <p><b>Officer Service No:</b> {selectedRequest.officerServiceNo}</p>
            <p><b>Status:</b> {selectedRequest.status}</p>
            <p><b>Comments:</b> {selectedRequest.comments || '—'}</p>
            
            {selectedRequest.photos && selectedRequest.photos.length > 0 && (
              <div>
                <p><b>Photos:</b></p>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {selectedRequest.photos.map((photo, i) => (
                    <img
                      key={i}
                      src={photo.url || photo}
                      alt={`Tire ${i + 1}`}
                      style={{ width: '100px', height: '100px', objectFit: 'cover', cursor: 'pointer' }}
                      onClick={() => openPhotoModal(selectedRequest.photos, i)}
                    />
                  ))}
                </div>
              </div>
            )}

            {selectedRequest.tirePhotoUrls && selectedRequest.tirePhotoUrls.length > 0 && (
              <div>
                <p><b>Tire Photos:</b></p>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {selectedRequest.tirePhotoUrls.map((photoUrl, i) => (
                    <img
                      key={i}
                      src={photoUrl}
                      alt={`Tire ${i + 1}`}
                      style={{ width: '100px', height: '100px', objectFit: 'cover', cursor: 'pointer' }}
                      onClick={() => openPhotoModal(selectedRequest.tirePhotoUrls, i)}
                    />
                  ))}
                </div>
              </div>
            )}
            
            <div className="modal-buttons">
              <button onClick={() => setSelectedRequest(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ================== Reject modal ================== */}
      {showRejectModal && (
        <div className="modal-overlay" onClick={closeReject}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Reject Request</h3>
            <p>Please provide a reason for rejecting this request:</p>
            <textarea
              placeholder="Enter rejection reason..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
            />
            <div className="modal-buttons">
              <button onClick={closeReject}>Cancel</button>
              <button onClick={handleReject}>Reject</button>
            </div>
          </div>
        </div>
      )}

      {/* ================== Photo modal ================== */}
      {photoModal.show && (
        <div className="photo-modal" onClick={closePhotoModal}>
          <div className="photo-modal-content" onClick={e => e.stopPropagation()}>
            <span className="close" onClick={closePhotoModal}>&times;</span>
            <div className="photo-counter">{photoModal.currentIndex + 1} / {photoModal.photos.length}</div>
            <img
              src={photoModal.photos[photoModal.currentIndex]?.url || photoModal.photos[photoModal.currentIndex]}
              alt="Full size"
            />
            <div className="photo-navigation">
              <button onClick={prevPhoto}>Previous</button>
              <button onClick={nextPhoto}>Next</button>
            </div>
          </div>
        </div>
      )}
      </div> {/* Close dashboard-content */}
    </div>
  );
}

export default EngineerDashboard;
