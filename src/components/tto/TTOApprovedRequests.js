import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './TTODashboard.css';

const API_URL = process.env.NODE_ENV === 'development' 
  ? `${process.env.REACT_APP_API_URL}/api/tire-requests`
  : '/api/tire-requests';
const BASE_URL = process.env.NODE_ENV === 'development' 
  ? process.env.REACT_APP_API_URL 
  : '';

function TTOApprovedRequests() {
  const [requests, setRequests] = useState([]);
  const [photoModal, setPhotoModal] = useState({ show: false, photos: [], currentIndex: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTTOApprovedRequests();
  }, []);

  const fetchTTOApprovedRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(API_URL);
      const data = response.data.map(req => ({
        ...req,
        id: req._id || req.id
      }));

      // Filter for requests approved by TTO
      const ttoApprovedRequests = data.filter(req => req.status === 'TTO_APPROVED');
      setRequests(ttoApprovedRequests);
    } catch (error) {
      console.error('Error fetching TTO approved requests:', error);
      setError('Failed to fetch requests. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const openPhotoModal = (photos, startIndex = 0) => {
    setPhotoModal({
      show: true,
      photos: photos.map(url => `${url}`),
      currentIndex: startIndex
    });
  };

  const closePhotoModal = () => {
    setPhotoModal({ show: false, photos: [], currentIndex: 0 });
  };

  const navigatePhoto = (direction) => {
    const newIndex = photoModal.currentIndex + direction;
    if (newIndex >= 0 && newIndex < photoModal.photos.length) {
      setPhotoModal(prev => ({
        ...prev,
        currentIndex: newIndex
      }));
    }
  };

  return (
    <div className="manager-dashboard">
      <h2>TTO Approved Tire Requests</h2>

      {loading && <p>Loading requests...</p>}
      {error && <p className="error">{error}</p>}

      {!loading && !error && (
        <>
          {requests.length === 0 ? (
            <p>No TTO approved requests available.</p>
          ) : (
            <table className="requests-table">
              <thead>
                <tr>
                  <th>Request ID</th>
                  <th>Vehicle No.</th>
                  <th>Vehicle Type</th>
                  <th>Vehicle Brand</th>
                  <th>Vehicle Model</th>
                  <th>Tire Size</th>
                  <th>No. of Tires</th>
                  <th>No. of Tubes</th>
                  <th>Present KM</th>
                  <th>Wear Indicator</th>
                  <th>Wear Pattern</th>
                  <th>Officer Service No</th>
                  <th>TTO Approval Date</th>
                  <th>Photos</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <tr key={req.id}>
                    <td>{req.id?.substring(0, 8)}...</td>
                    <td>{req.vehicleNo || '-'}</td>
                    <td>{req.vehicleType || '-'}</td>
                    <td>{req.vehicleBrand || '-'}</td>
                    <td>{req.vehicleModel || '-'}</td>
                    <td>{req.tireSize || '-'}</td>
                    <td>{req.noOfTires ?? '-'}</td>
                    <td>{req.noOfTubes ?? '-'}</td>
                    <td>{req.presentKm ?? '-'}</td>
                    <td>{req.wearIndicator || '-'}</td>
                    <td>{req.wearPattern || '-'}</td>
                    <td>{req.officerServiceNo || '-'}</td>
                    <td>
                      {req.ttoApprovalDate
                        ? new Date(req.ttoApprovalDate).toLocaleString()
                        : '-'}
                    </td>
                    <td>
                      <div className="photos-container">
                        {req.tirePhotoUrls && req.tirePhotoUrls.length > 0 ? (
                          req.tirePhotoUrls.map((photoUrl, index) => (
                            <img
                              key={index}
                              src={`${photoUrl}`}
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
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}

      {/* Photo Modal */}
      {photoModal.show && (
        <div className="photo-modal" onClick={closePhotoModal}>
          <div
            className="photo-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="close" onClick={closePhotoModal}>&times;</span>

            <div className="photo-counter">
              {photoModal.currentIndex + 1} / {photoModal.photos.length}
            </div>

            <img
              src={photoModal.photos[photoModal.currentIndex]}
              alt={`Tire ${photoModal.currentIndex + 1}`}
            />

            <div className="photo-navigation">
              <button
                onClick={() => navigatePhoto(-1)}
                disabled={photoModal.currentIndex === 0}
              >
                Previous
              </button>
              <button
                onClick={() => navigatePhoto(1)}
                disabled={photoModal.currentIndex === photoModal.photos.length - 1}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TTOApprovedRequests;
