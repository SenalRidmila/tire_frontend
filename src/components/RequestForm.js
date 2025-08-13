import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './RequestForm.css';

const API_URL = '/api/tire-requests'; // Using Vercel proxy to avoid CORS
const BASE_URL = ''; // Using relative paths through Vercel proxy

function RequestForm() {
  const [formData, setFormData] = useState({
    vehicleNo: '', vehicleType: '', vehicleBrand: '', vehicleModel: '',
    userSection: '', replacementDate: '', existingMake: '', tireSize: '',
    noOfTires: '', noOfTubes: '', costCenter: '', presentKm: '',
    previousKm: '', wearIndicator: 'No', wearPattern: 'One Edge',
    officerServiceNo: '', comments: '', email: ''
  });

  const [errors, setErrors] = useState({});
  const [requests, setRequests] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [photoModal, setPhotoModal] = useState({ show: false, photos: [], currentIndex: 0 });
  const [photoZoom, setPhotoZoom] = useState(1);
  const [imageLoading, setImageLoading] = useState(false);
  const [usingMockData, setUsingMockData] = useState(false);

  // Mock data for development/testing when backend is unavailable
  const mockRequests = [
    {
      id: 'mock-1',
      vehicleNo: 'WP-1234',
      vehicleType: 'Car',
      vehicleBrand: 'Toyota',
      vehicleModel: 'Prius',
      userSection: 'Transport',
      replacementDate: '2024-01-15',
      existingMake: 'Bridgestone',
      tireSize: '195/65R15',
      noOfTires: 4,
      noOfTubes: 0,
      costCenter: 1001,
      presentKm: 85000,
      previousKm: 75000,
      wearIndicator: 'Yes',
      wearPattern: 'One Edge',
      officerServiceNo: 'EMP001',
      comments: 'Front tires showing wear',
      email: 'transport@company.com',
      status: 'PENDING',
      tirePhotoUrls: ['/images/tire1.jpeg', '/images/tire2.jpeg']
    },
    {
      id: 'mock-2',
      vehicleNo: 'WP-5678',
      vehicleType: 'Van',
      vehicleBrand: 'Nissan',
      vehicleModel: 'Caravan',
      userSection: 'Logistics',
      replacementDate: '2024-02-20',
      existingMake: 'Michelin',
      tireSize: '215/60R16',
      noOfTires: 2,
      noOfTubes: 2,
      costCenter: 1002,
      presentKm: 120000,
      previousKm: 110000,
      wearIndicator: 'No',
      wearPattern: 'Center',
      officerServiceNo: 'EMP002',
      comments: 'Rear tires need replacement',
      email: 'logistics@company.com',
      status: 'APPROVED',
      tirePhotoUrls: ['/images/tire3.jpeg']
    },
    {
      id: 'mock-3',
      vehicleNo: 'WP-9999',
      vehicleType: 'Truck',
      vehicleBrand: 'Isuzu',
      vehicleModel: 'NPR',
      userSection: 'Delivery',
      replacementDate: '2024-03-10',
      existingMake: 'Yokohama',
      tireSize: '7.50R16',
      noOfTires: 6,
      noOfTubes: 6,
      costCenter: 1003,
      presentKm: 200000,
      previousKm: 180000,
      wearIndicator: 'Yes',
      wearPattern: 'Both Edges',
      officerServiceNo: 'EMP003',
      comments: 'Heavy usage requires new tires',
      email: 'delivery@company.com',
      status: 'REJECTED',
      tirePhotoUrls: ['/images/tire1.jpeg', '/images/tire2.jpeg', '/images/tire3.jpeg']
    }
  ];

  useEffect(() => { fetchRequests(); }, []);
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!photoModal.show) return;
      if (e.key === 'Escape') closePhotoModal();
      if (e.key === 'ArrowRight') nextPhoto();
      if (e.key === 'ArrowLeft') prevPhoto();
      if (e.key === '+' || e.key === '=') { e.preventDefault(); zoomIn(); }
      if (e.key === '-') { e.preventDefault(); zoomOut(); }
      if (e.key === '0') resetZoom();
    };
    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [photoModal.show]);

  const fetchRequests = async () => {
    try {
      // Try proxy endpoints (no CORS issues)
      const possibleEndpoints = [
        API_URL, // /api/tire-requests (proxied to Railway)
        '/api/requests', // Alternative endpoint
      ];
      
      let response = null;
      let apiSuccess = false;
      
      for (const endpoint of possibleEndpoints) {
        try {
          console.log(`🔍 Trying proxied endpoint: ${endpoint}`);
          response = await axios.get(endpoint);
          
          // Check if response is actually JSON data and not HTML
          if (response.data && typeof response.data === 'string' && (
            response.data.includes('<!doctype html>') || 
            response.data.includes('<html') ||
            response.data.includes('<HTML')
          )) {
            console.log(`❌ Endpoint returned HTML instead of JSON: ${endpoint}`);
            continue;
          } else if (response.data && Array.isArray(response.data)) {
            console.log(`✅ Success with proxied endpoint: ${endpoint}`, response.data);
            apiSuccess = true;
            setUsingMockData(false);
            break;
          } else if (response.data && typeof response.data === 'object' && response.data.length !== undefined) {
            // Handle case where data might be array-like object
            console.log(`✅ Success with proxied endpoint: ${endpoint}`, response.data);
            apiSuccess = true;
            setUsingMockData(false);
            break;
          } else {
            console.log(`⚠️ Unexpected response format from: ${endpoint}`, typeof response.data, response.data);
            continue;
          }
        } catch (endpointError) {
          console.log(`❌ Failed proxied endpoint: ${endpoint}`, endpointError.response?.status || endpointError.message);
          continue;
        }
      }
      
      if (apiSuccess && response && response.data) {
        // Ensure we have array data before processing
        let requestsData = [];
        if (Array.isArray(response.data)) {
          requestsData = response.data;
        } else if (response.data && typeof response.data === 'object' && response.data.length !== undefined) {
          // Convert array-like object to actual array
          requestsData = Array.from(response.data);
        } else {
          console.warn('🔄 Response data is not an array, using empty array');
          requestsData = [];
        }
        
        const data = requestsData.map(req => ({ ...req, id: req._id || req.id }));
        setRequests(data);
        console.log('📡 Proxied API data loaded successfully:', data.length, 'requests');
      } else {
        // Fallback to mock data when all API endpoints fail
        console.warn('🔄 All proxied API endpoints failed, using mock data for development');
        setRequests(mockRequests);
        setUsingMockData(true);
        console.log('🎭 Mock data loaded:', mockRequests.length, 'sample requests');
      }
    } catch (error) {
      console.error('💥 Critical error in fetchRequests, falling back to mock data:', error);
      setRequests(mockRequests);
      setUsingMockData(true);
    }
  };

  const isValidEmail = (email) => {
    // Simple regex for email validation
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validateField = (name, value, allData = formData) => {
    switch(name) {
      case 'vehicleNo':
      case 'vehicleType':
      case 'vehicleBrand':
      case 'vehicleModel':
      case 'userSection':
      case 'existingMake':
      case 'tireSize':
      case 'officerServiceNo':
      case 'wearIndicator':
      case 'wearPattern':
      case 'comments':
      case 'replacementDate':
        if (!value.trim()) return 'This field is required';
        if (name === 'replacementDate' && isNaN(Date.parse(value))) return 'Invalid date';
        break;

      case 'email':
        if (!value.trim()) return 'Email is required';
        if (!isValidEmail(value)) return 'Invalid email address';
        break;

      case 'noOfTires':
      case 'noOfTubes':
      case 'costCenter':
      case 'presentKm':
      case 'previousKm':
        if (!value.trim()) return 'This field is required';
        if (!/^\d+$/.test(value)) return 'Only numbers are allowed';
        break;

      default:
        return null;
    }
    // Additional cross-field validation:
    if (name === 'previousKm' || name === 'presentKm') {
      const prevKm = Number(allData.previousKm);
      const presKm = Number(allData.presentKm);
      if (!isNaN(prevKm) && !isNaN(presKm)) {
        if (prevKm >= presKm) {
          return 'Previous Km must be less than Present Km';
        }
      }
    }
    return null;
  };

  const validateForm = () => {
    const newErrors = {};
    for (const field in formData) {
      const error = validateField(field, formData[field], formData);
      if (error) newErrors[field] = error;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // For number fields, block non-digit characters on input
    const numberFields = ['noOfTires', 'noOfTubes', 'costCenter', 'presentKm', 'previousKm'];
    if (numberFields.includes(name)) {
      if (value && !/^\d*$/.test(value)) {
        // Do not update state if invalid character
        return;
      }
    }

    const updatedFormData = { ...formData, [name]: value };
    setFormData(updatedFormData);

    // Re-validate the field and cross-field dependencies (presentKm, previousKm)
    setErrors(prevErrors => {
      const newErrors = { ...prevErrors };
      const error = validateField(name, value, updatedFormData);
      if (error) {
        newErrors[name] = error;
      } else {
        delete newErrors[name];
        // Clear cross-field error if any
        if (name === 'presentKm' || name === 'previousKm') {
          delete newErrors['presentKm'];
          delete newErrors['previousKm'];
        }
      }

      // Also check cross-field error between presentKm and previousKm on changes to those fields
      if (name === 'presentKm' || name === 'previousKm') {
        const crossError = validateField('presentKm', updatedFormData.presentKm, updatedFormData) || validateField('previousKm', updatedFormData.previousKm, updatedFormData);
        if (crossError) {
          newErrors['presentKm'] = crossError;
          newErrors['previousKm'] = crossError;
        }
      }

      return newErrors;
    });
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 5) return alert('Only up to 5 photos allowed');
    setSelectedFiles(files);
    setPreviewUrls(files.map(file => URL.createObjectURL(file)));
  };

  const removePhoto = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const openPhotoModal = (photos, startIndex = 0) => {
    console.log('Opening photo modal with photos:', photos, 'startIndex:', startIndex);
    setPhotoModal({ show: true, photos, currentIndex: startIndex });
    setImageLoading(true);
    setPhotoZoom(1);
  };

  const closePhotoModal = () => {
    setPhotoModal({ show: false, photos: [], currentIndex: 0 });
    setPhotoZoom(1);
    setImageLoading(false);
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
  const handleImageError = () => { setImageLoading(false); alert('Failed to load image'); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      alert('Please fix validation errors before submitting.');
      return;
    }

    if (usingMockData) {
      // Mock submission for demo purposes
      const newRequest = {
        ...formData,
        id: `mock-${Date.now()}`,
        status: 'PENDING',
        tirePhotoUrls: []
      };
      
      if (editingId) {
        // Update existing mock request
        setRequests(prev => prev.map(req => req.id === editingId ? { ...newRequest, id: editingId } : req));
        alert('🎭 Mock: Request updated successfully! (Demo mode - backend unavailable)');
      } else {
        // Add new mock request
        setRequests(prev => [...prev, newRequest]);
        alert('🎭 Mock: Request submitted successfully! (Demo mode - backend unavailable)');
      }
      resetForm();
      return;
    }

    try {
      const formDataToSend = new FormData();
      Object.keys(formData).forEach(key => formDataToSend.append(key, formData[key]));
      selectedFiles.forEach(file => formDataToSend.append('tirePhotos', file));
      if (editingId) {
        // For update, assume PUT endpoint
        await axios.put(`${API_URL}/${editingId}`, formDataToSend, { headers: { 'Content-Type': 'multipart/form-data' } });
        alert('Request updated successfully!');
      } else {
        await axios.post(API_URL, formDataToSend, { headers: { 'Content-Type': 'multipart/form-data' } });
        alert('Request submitted successfully!');
      }
      fetchRequests();
      resetForm();
    } catch (error) {
      console.error('Submit error:', error);
      alert('Failed to submit request. Please try again.');
    }
  };

  const resetForm = () => {
    setFormData({
      vehicleNo: '', vehicleType: '', vehicleBrand: '', vehicleModel: '',
      userSection: '', replacementDate: '', existingMake: '', tireSize: '',
      noOfTires: '', noOfTubes: '', costCenter: '', presentKm: '',
      previousKm: '', wearIndicator: 'No', wearPattern: 'One Edge',
      officerServiceNo: '', comments: '', email: ''
    });
    setSelectedFiles([]);
    setPreviewUrls([]);
    setEditingId(null);
    setErrors({});
  };

  const handleEdit = (req) => {
    setFormData({
      vehicleNo: req.vehicleNo || '',
      vehicleType: req.vehicleType || '',
      vehicleBrand: req.vehicleBrand || '',
      vehicleModel: req.vehicleModel || '',
      userSection: req.userSection || '',
      replacementDate: req.replacementDate ? req.replacementDate.substring(0, 10) : '', // date format YYYY-MM-DD
      existingMake: req.existingMake || '',
      tireSize: req.tireSize || '',
      noOfTires: req.noOfTires ? String(req.noOfTires) : '',
      noOfTubes: req.noOfTubes ? String(req.noOfTubes) : '',
      costCenter: req.costCenter ? String(req.costCenter) : '',
      presentKm: req.presentKm ? String(req.presentKm) : '',
      previousKm: req.previousKm ? String(req.previousKm) : '',
      wearIndicator: req.wearIndicator || 'No',
      wearPattern: req.wearPattern || 'One Edge',
      officerServiceNo: req.officerServiceNo || '',
      comments: req.comments || '',
      email: req.email || ''
    });
    setEditingId(req.id);
    if (req.tirePhotoUrls?.length > 0) {
      setPreviewUrls(req.tirePhotoUrls.map(url => url.startsWith('http') ? url : `${BASE_URL}${url}`));
    } else {
      setPreviewUrls([]);
    }
    setSelectedFiles([]); // Clear selectedFiles since photos come from server URL
    setErrors({});
    window.scrollTo(0, 0);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure to delete this request?')) return;
    
    if (usingMockData) {
      // Mock deletion for demo purposes
      setRequests(prev => prev.filter(req => req.id !== id));
      alert('🎭 Mock: Request deleted successfully! (Demo mode - backend unavailable)');
      return;
    }
    
    try {
      await axios.delete(`${API_URL}/${id}`);
      fetchRequests();
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete request.');
    }
  };

  const pendingRequests = requests.filter(r => !r.status || r.status.toUpperCase() === 'PENDING');
  const processedRequests = requests.filter(r => r.status && r.status.toUpperCase() !== 'PENDING');

  const renderTable = (title, data) => (
    <>
      <h3>{title}</h3>
      {data.length === 0 ? (
        <p>No requests</p>
      ) : (
        <table className="request-table">
          <thead>
            <tr>
              <th>Vehicle No.</th><th>Type</th><th>Brand</th><th>Model</th>
              <th>Section</th><th>Tire Size</th><th>Tires</th><th>Tubes</th>
              <th>Present Km</th><th>Previous Km</th><th>Wear</th><th>Pattern</th>
              <th>Officer</th><th>Email</th><th>Status</th><th>Photos</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map(req => (
              <tr key={req.id}>
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
                <td>{req.email}</td>
                <td>{req.status || 'Pending'}</td>
                <td>
                  <div className="photos-container">
                    {req.tirePhotoUrls?.length > 0 ? req.tirePhotoUrls.map((url, idx) => {
                      // Enhanced URL handling with multiple fallbacks
                      const getImageUrl = (originalUrl) => {
                        if (!originalUrl) return null;
                        
                        // If already a full HTTP URL, use as is
                        if (originalUrl.startsWith('http')) return originalUrl;
                        
                        // Use relative path to leverage Vercel proxy
                        return originalUrl.startsWith('/uploads/') ? originalUrl : `/uploads/${originalUrl}`;
                      };
                      
                      const imageUrl = getImageUrl(url);
                      if (!imageUrl) return null;
                      
                      return (
                        <img
                          key={idx}
                          src={imageUrl}
                          alt={`Tire ${idx + 1}`}
                          className="table-photo"
                          onClick={() => {
                            // Create enhanced photo URLs for modal
                            const modalUrls = req.tirePhotoUrls.map(photoUrl => {
                              if (photoUrl.startsWith('http')) return photoUrl;
                              // Use relative path to leverage Vercel proxy
                              return photoUrl.startsWith('/uploads/') ? photoUrl : `/uploads/${photoUrl}`;
                            });
                            openPhotoModal(modalUrls, idx);
                          }}
                          title="Click to view full size"
                          onError={(e) => {
                            console.warn(`Failed to load image: ${e.target.src}`);
                            // Try direct Railway backend URL as fallback
                            if (!e.target.dataset.fallbackTried) {
                              e.target.dataset.fallbackTried = 'true';
                              const filename = url.split('/').pop();
                              e.target.src = `https://tirebackend-production.up.railway.app/uploads/${filename}`;
                            } else {
                              e.target.style.display = 'none';
                              e.target.insertAdjacentHTML('afterend', '<span style="color: red; font-size: 12px;">Image not found</span>');
                            }
                          }}
                        />
                      );
                    }) : <span>No photos</span>}
                  </div>
                </td>
                <td>
                  <button onClick={() => handleEdit(req)}>Edit</button>
                  <button onClick={() => handleDelete(req.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );

  return (
    <>
      {usingMockData && (
        <div style={{
          backgroundColor: '#fff3cd',
          border: '1px solid #ffeaa7',
          color: '#856404',
          padding: '10px',
          margin: '10px 0',
          borderRadius: '5px',
          textAlign: 'center'
        }}>
          🎭 <strong>Demo Mode:</strong> Backend unavailable - Using sample data for demonstration
        </div>
      )}

      <form className="request-form" onSubmit={handleSubmit} noValidate>
        <h2>TIRE REQUEST FORM</h2>

        {[
          { name: 'vehicleNo', label: 'Vehicle No.' },
          { name: 'vehicleType', label: 'Vehicle Type' },
          { name: 'vehicleBrand', label: 'Vehicle Brand' },
          { name: 'vehicleModel', label: 'Vehicle Model' },
          { name: 'userSection', label: 'User Section' },
          { name: 'replacementDate', label: 'Last Replacement Date', type: 'date' },
          { name: 'existingMake', label: 'Make of Existing Tire' },
          { name: 'tireSize', label: 'Tire Size Required' },
          { name: 'noOfTires', label: 'No of Tires Required' },
          { name: 'noOfTubes', label: 'No of Tubes Required' },
          { name: 'costCenter', label: 'Cost Center' },
          { name: 'presentKm', label: 'Present Km Reading' },
          { name: 'previousKm', label: 'Previous Km Reading' },
          { name: 'officerServiceNo', label: 'Officer Service No.' },
          { name: 'email', label: 'Email' }
        ].map(field => (
          <div className="form-group" key={field.name}>
            <label htmlFor={field.name}>{field.label}</label>
            <input
              id={field.name}
              name={field.name}
              type={field.type || (['noOfTires','noOfTubes','costCenter','presentKm','previousKm'].includes(field.name) ? 'number' : 'text')}
              value={formData[field.name]}
              onChange={handleChange}
              min={['noOfTires','noOfTubes','costCenter','presentKm','previousKm'].includes(field.name) ? 0 : undefined}
              required
            />
            {errors[field.name] && <div className="error-message">{errors[field.name]}</div>}
          </div>
        ))}

        <div className="form-group">
          <label htmlFor="wearIndicator">Wear Indicator</label>
          <select
            id="wearIndicator"
            name="wearIndicator"
            value={formData.wearIndicator}
            onChange={handleChange}
            required
          >
            <option value="No">No</option>
            <option value="Yes">Yes</option>
          </select>
          {errors.wearIndicator && <div className="error-message">{errors.wearIndicator}</div>}
        </div>

        <div className="form-group">
          <label htmlFor="wearPattern">Wear Pattern</label>
          <select
            id="wearPattern"
            name="wearPattern"
            value={formData.wearPattern}
            onChange={handleChange}
            required
          >
            <option value="One Edge">One Edge</option>
            <option value="Center">Center</option>
            <option value="Both Edges">Both Edges</option>
          </select>
          {errors.wearPattern && <div className="error-message">{errors.wearPattern}</div>}
        </div>

        <div className="form-group">
          <label htmlFor="tirePhotos">Tire Photos (Max 5)</label>
          <input
            id="tirePhotos"
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            className="file-input"
          />
          <div className="photo-preview-container">
            {previewUrls.map((url, index) => (
              <div key={index} className="photo-preview-item">
                <img src={url} alt={`Tire preview ${index + 1}`} />
                <button
                  type="button"
                  className="remove-photo-btn"
                  onClick={() => removePhoto(index)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="comments">Comments</label>
          <textarea
            id="comments"
            name="comments"
            rows={3}
            value={formData.comments}
            onChange={handleChange}
            required
          />
          {errors.comments && <div className="error-message">{errors.comments}</div>}
        </div>

        <button type="submit" disabled={Object.keys(errors).length > 0}>
          {editingId ? 'Update Request' : 'Submit Request'}
        </button>
      </form>

      {renderTable('Pending Requests', pendingRequests)}
      {renderTable('Approved / Rejected Requests', processedRequests)}

      {photoModal.show && (
        <div className="photo-modal" onClick={closePhotoModal}>
          <div className="photo-modal-content" onClick={e => e.stopPropagation()}>
            <span className="close" onClick={closePhotoModal} title="Close (Esc)">&times;</span>
            <div className="photo-counter">
              {photoModal.currentIndex + 1} / {photoModal.photos.length}
            </div>
            <div className="zoom-indicator" title="Use +/- keys or buttons to zoom">
              Zoom: {Math.round(photoZoom * 100)}%
            </div>
            
            {/* Navigation arrows for touch/click */}
            {photoModal.photos.length > 1 && (
              <>
                <button 
                  onClick={prevPhoto} 
                  style={{
                    position: 'absolute',
                    left: '20px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'rgba(0, 0, 0, 0.7)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: '40px',
                    height: '40px',
                    fontSize: '18px',
                    cursor: 'pointer',
                    zIndex: 1003
                  }}
                  title="Previous photo (← key)"
                >
                  ‹
                </button>
                <button 
                  onClick={nextPhoto} 
                  style={{
                    position: 'absolute',
                    right: '20px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'rgba(0, 0, 0, 0.7)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: '40px',
                    height: '40px',
                    fontSize: '18px',
                    cursor: 'pointer',
                    zIndex: 1003
                  }}
                  title="Next photo (→ key)"
                >
                  ›
                </button>
              </>
            )}
            
            <img
              src={photoModal.photos[photoModal.currentIndex]}
              alt="Full size"
              style={{ transform: `scale(${photoZoom})` }}
              onLoad={handleImageLoad}
              onError={(e) => {
                console.warn(`Failed to load modal image: ${e.target.src}`);
                setImageLoading(false);
                
                // Try fallback URLs for modal images
                const currentUrl = e.target.src;
                const originalUrl = photoModal.photos[photoModal.currentIndex];
                
                if (!e.target.dataset.modalFallbackTried) {
                  e.target.dataset.modalFallbackTried = 'true';
                  
                  // Try different URL patterns
                  const fallbackUrls = [
                    originalUrl.includes('/uploads/') ? originalUrl : originalUrl.replace(BASE_URL, `${BASE_URL}/uploads`),
                    originalUrl.startsWith('http') ? originalUrl : `${BASE_URL}/uploads/${originalUrl}`,
                    `/uploads/${originalUrl.split('/').pop()}`,
                    originalUrl
                  ].filter(url => url !== currentUrl);
                  
                  if (fallbackUrls.length > 0) {
                    console.log(`Trying fallback URL: ${fallbackUrls[0]}`);
                    e.target.src = fallbackUrls[0];
                    return;
                  }
                }
                
                alert('Image could not be loaded. The file may be missing or corrupted.');
              }}
            />
            {imageLoading && <div className="image-loading">Loading...</div>}
            
            <div className="photo-controls">
              <button onClick={zoomOut} type="button" title="Zoom out (- key)">Zoom Out</button>
              <button onClick={resetZoom} type="button" title="Reset zoom (0 key)">Reset</button>
              <button onClick={zoomIn} type="button" title="Zoom in (+ key)">Zoom In</button>
            </div>
            
            <div className="photo-navigation">
              {photoModal.photos.length > 1 && (
                <button onClick={prevPhoto} type="button">Previous</button>
              )}
              <button onClick={downloadPhoto} type="button" title="Download image">Download</button>
              {photoModal.photos.length > 1 && (
                <button onClick={nextPhoto} type="button">Next</button>
              )}
            </div>
            
            <div className="keyboard-shortcuts">
              <small>
                <strong>Keyboard shortcuts:</strong> ← → Navigate | +/- Zoom | 0 Reset | Esc Close
              </small>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default RequestForm;
