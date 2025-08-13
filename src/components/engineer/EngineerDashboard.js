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
      // Try multiple possible endpoints
      let response;
      let apiSuccess = false;
      const possibleEndpoints = [
        API_URL, // /api/tire-requests
        API_URL.replace('/tire-requests', '/requests'), // /api/requests
        API_URL.replace('/api/tire-requests', '/tire-requests'), // /tire-requests
        API_URL.replace('/api/tire-requests', '/requests'), // /requests
        `${process.env.NODE_ENV === 'development' ? process.env.REACT_APP_API_URL : ''}/api/requests`,
        `${process.env.NODE_ENV === 'development' ? process.env.REACT_APP_API_URL : ''}/requests`
      ];
      
      for (const endpoint of possibleEndpoints) {
        try {
          console.log(`Trying endpoint: ${endpoint}`);
          response = await axios.get(endpoint);
          console.log(`✅ Success with endpoint: ${endpoint}`, response.data);
          apiSuccess = true;
          break;
        } catch (endpointError) {
          console.log(`❌ Failed endpoint: ${endpoint}`, endpointError.response?.status || endpointError.message);
          continue;
        }
      }
      
      if (apiSuccess && response) {
        console.log('📡 API Response:', response.data);
        setRequests(Array.isArray(response.data) ? response.data : []);
        setUsingMockData(false);
        
        // Debug – see all unique statuses coming from API
        const unique = [...new Set((response.data || []).map(r => r.status))];
        console.log('Engineer unique statuses =>', unique);
      } else {
        // Always use mock data when API is unavailable
        console.warn('🔄 All API endpoints failed, loading mock data for testing...');
        setUsingMockData(true);
        const mockData = [
          {
            id: 'mock-1',
            vehicleNo: 'ABC-1234',
            vehicleType: 'Car',
            vehicleBrand: 'Toyota',
            vehicleModel: 'Corolla',
            userSection: 'IT Department',
            tireSize: '195/65R15',
            noOfTires: '4',
            noOfTubes: '0',
            presentKm: '50000',
            previousKm: '45000',
            wearIndicator: 'Yes',
            wearPattern: 'Even',
            officerServiceNo: 'OFF001',
            status: 'TTO_APPROVED',
            comments: 'Need urgent replacement',
            tirePhotoUrls: []
          },
          {
            id: 'mock-2',
            vehicleNo: 'XYZ-5678',
            vehicleType: 'Van',
            vehicleBrand: 'Nissan',
            vehicleModel: 'NV200',
            userSection: 'Transport',
            tireSize: '205/60R16',
            noOfTires: '2',
            noOfTubes: '2',
            presentKm: '75000',
            previousKm: '70000',
            wearIndicator: 'No',
            wearPattern: 'One Edge',
            officerServiceNo: 'OFF002',
            status: 'ENGINEER_PENDING',
            comments: 'Routine maintenance',
            tirePhotoUrls: []
          }
        ];
        setRequests(mockData);
        setUsingMockData(true);
        console.log('✅ Mock data loaded:', mockData);
      }
    } catch (err) {
      console.error('💥 Critical error in fetchRequests:', err);
      
      // Always provide fallback data in case of any error
      const fallbackData = [
        {
          id: 'fallback-1',
          vehicleNo: 'DEMO-001',
          vehicleType: 'Car',
          vehicleBrand: 'Toyota',
          vehicleModel: 'Prius',
          userSection: 'Demo Department',
          tireSize: '215/60R16',
          noOfTires: '4',
          noOfTubes: '0',
          presentKm: '60000',
          previousKm: '55000',
          wearIndicator: 'Yes',
          wearPattern: 'Even',
          officerServiceNo: 'DEMO001',
          status: 'TTO_APPROVED',
          comments: 'Demo request for testing',
          tirePhotoUrls: []
        }
      ];
      setRequests(fallbackData);
      setUsingMockData(true);
      console.log('🔧 Fallback data loaded due to error');
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // -------------------- Split into pending / processed --------------------
  useEffect(() => {
    const pend = requests.filter(
      r => r.status && ENGINEER_PENDING_STATUSES.includes(r.status.toUpperCase())
    );
    const proc = requests.filter(
      r => !r.status || !ENGINEER_PENDING_STATUSES.includes(r.status.toUpperCase())
    );
    setPendingRequests(pend);
    setProcessedRequests(proc);
  }, [requests]);

  // -------------------- Handle URL param highlight --------------------
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const requestId = params.get('requestId');
    if (requestId) setHighlightedRequestId(requestId);
  }, [location.search]);

  useEffect(() => {
    if (highlightedRequestId && rowRefs.current[highlightedRequestId]) {
      rowRefs.current[highlightedRequestId].scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => alert('Engineer Request Loaded from Email 🔧'), 400);
    }
  }, [highlightedRequestId, pendingRequests, processedRequests]);

  // -------------------- Actions --------------------
  const approveLocal = (id) => {
    setRequests(prev =>
      prev.map(r => (r.id === id ? { ...r, status: 'ENGINEER_APPROVED' } : r))
    );
  };

  const rejectLocal = (id, reason) => {
    setRequests(prev =>
      prev.map(r => (r.id === id ? { ...r, status: 'ENGINEER_REJECTED', rejectReason: reason } : r))
    );
  };

  const handleApprove = async (id) => {
    if (!window.confirm('Approve this request?')) return;
    try {
      // call backend if you want
      await axios.post(`${API_URL}/${id}/engineer-approve`);
      // optimistic local update
      approveLocal(id);
      // OR re-fetch (commented)
      // await fetchRequests();
    } catch (err) {
      console.error(err);
      alert('Failed to approve request.');
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      alert('Please enter a reason.');
      return;
    }
    if (!window.confirm('Reject this request?')) return;

    try {
      // call backend if you want
      await axios.post(`${API_URL}/${rejectingId}/engineer-reject`, { reason: rejectReason.trim() });
      // optimistic local update
      rejectLocal(rejectingId, rejectReason.trim());
      // OR re-fetch (commented)
      // await fetchRequests();

      // close & cleanup
      setShowRejectModal(false);
      setRejectReason('');
      setRejectingId(null);
    } catch (err) {
      console.error(err);
      alert('Failed to reject request.');
    }
  };
  const deleteRequest = async (id) => {
  if (!window.confirm('Are you sure you want to delete this request?')) return;

  try {
    await axios.delete(`${API_URL}/${id}`);
    setRequests(prev => prev.filter(r => r.id !== id));
    alert('Request deleted successfully.');
  } catch (err) {
    console.error('Error deleting request:', err);
    alert('Failed to delete request.');
  }
};


  const openReject = (id) => {
    setRejectingId(id);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const openPhoto = (photos = [], start = 0) => {
    const urls = photos.map(u => (u.startsWith('http') ? u : `${BASE_URL}${u}`));
    setPhotoModal({ show: true, photos: urls, currentIndex: start });
  };
  const closePhoto = () => setPhotoModal({ show: false, photos: [], currentIndex: 0 });
  const nextPhoto = () =>
    setPhotoModal(p => ({ ...p, currentIndex: (p.currentIndex + 1) % p.photos.length }));
  const prevPhoto = () =>
    setPhotoModal(p => ({
      ...p,
      currentIndex: p.currentIndex === 0 ? p.photos.length - 1 : p.currentIndex - 1,
    }));

  const getRowRef = (id) => (el) => {
    if (id) rowRefs.current[id] = el;
  };

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
      <h2>Engineer Dashboard</h2>
      
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
        <h3>Pending Requests</h3>
        {pendingRequests.length === 0 ? (
          <p>No pending requests.</p>
        ) : (
          <table className="request-table">
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
                <th>Present KM</th>
                <th>Prev KM</th>
                <th>Wear</th>
                <th>Pattern</th>
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
                  ref={getRowRef(req.id)}
                  className={req.id === highlightedRequestId ? 'highlighted-row' : ''}
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
                  <td>{req.previousKm}</td>
                  <td>{req.wearIndicator}</td>
                  <td>{req.wearPattern}</td>
                  <td>{req.officerServiceNo}</td>
                  <td>{req.status}</td>
                  <td>
                    {req.tirePhotoUrls?.length ? (
                      <div className="photo-thumbnails">
                        {req.tirePhotoUrls.map((u, i) => (
                          <img
                            key={i}
                            src={`${BASE_URL}${u}`}
                            alt={`Tire ${i + 1}`}
                            className="photo-thumbnail"
                            onClick={() => openPhoto(req.tirePhotoUrls, i)}
                          />
                        ))}
                      </div>
                    ) : (
                      <span>—</span>
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
                <th>Tire Size</th>
                <th>Tires</th>
                <th>Tubes</th>
                <th>Present KM</th>
                <th>Prev KM</th>
                <th>Wear</th>
                <th>Pattern</th>
                <th>Officer</th>
                <th>Status</th>
                <th>Photos</th>
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
                  <td>{req.tireSize}</td>
                  <td>{req.noOfTires}</td>
                  <td>{req.noOfTubes}</td>
                  <td>{req.presentKm}</td>
                  <td>{req.previousKm}</td>
                  <td>{req.wearIndicator}</td>
                  <td>{req.wearPattern}</td>
                  <td>{req.officerServiceNo}</td>
                  <td>{req.status}</td>
                  <td>
                    {req.tirePhotoUrls?.length ? (
                      <div className="photo-thumbnails">
                        {req.tirePhotoUrls.map((u, i) => (
                          <img
                            key={i}
                            src={`${BASE_URL}${u}`}
                            alt={`Tire ${i + 1}`}
                            className="photo-thumbnail"
                            onClick={() => openPhoto(req.tirePhotoUrls, i)}
                          />
                        ))}
                      </div>
                    ) : (
                      <span>—</span>
                    )}
                  </td>
                  <td>
        {/* ✅ View Button */}
        <button title="View" onClick={() => setSelectedRequest(req)}>👁️</button>
<button title="Delete" onClick={() => deleteRequest(req.id)}>🗑️</button>

      </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* ============== Right side details panel ============== */}
      <aside className="details-panel">
        {!selectedRequest ? (
          <p>Select a request (👁️) to view details here.</p>
        ) : (
          <div className="request-details">
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
            {selectedRequest.rejectReason && (
              <p><b>Reject Reason:</b> {selectedRequest.rejectReason}</p>
            )}
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
                      onClick={() => openPhoto(selectedRequest.tirePhotoUrls, i)}
                    />
                  ))}
                </div>
              ) : (
                <p>—</p>
              )}
            </div>

            {ENGINEER_PENDING_STATUSES.includes(
              (selectedRequest.status || '').toUpperCase()
            ) && (
              <div className="action-buttons">
                <button onClick={() => handleApprove(selectedRequest.id)}>Approve</button>
                <button onClick={() => openReject(selectedRequest.id)}>Reject</button>
              </div>
            )}
          </div>
        )}
      </aside>

      {/* ============== Reject modal ============== */}
      {showRejectModal && (
        <div className="modal-overlay" onClick={() => setShowRejectModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
          <h3>Reject Request</h3>
          <textarea
            rows={4}
            placeholder="Enter a reason..."
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
          />
          <div className="modal-buttons">
            <button onClick={() => setShowRejectModal(false)}>Cancel</button>
            <button onClick={handleReject}>Reject</button>
          </div>
        </div>
      </div>
      )}

      {/* ============== Photo modal ============== */}
      {photoModal.show && (
        <div className="photo-modal" onClick={closePhoto}>
          <div className="photo-modal-content" onClick={e => e.stopPropagation()}>
            <span className="close" onClick={closePhoto}>&times;</span>
            <img
              src={photoModal.photos[photoModal.currentIndex]}
              alt={`Tire ${photoModal.currentIndex + 1}`}
              style={{ maxWidth: '100%', maxHeight: '80vh' }}
            />
            <div className="photo-navigation">
              <button onClick={prevPhoto}>⬅</button>
              <button onClick={nextPhoto}>➡</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EngineerDashboard;
