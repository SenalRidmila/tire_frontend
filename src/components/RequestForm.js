import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './RequestForm.css';

const API_URL = `${process.env.REACT_APP_API_URL}/api/tire-requests`;

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
      const response = await axios.get(API_URL);
      const data = response.data.map(req => ({ ...req, id: req._id || req.id }));
      setRequests(data);
    } catch (error) {
      console.error('Error fetching requests:', error);
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
      setPreviewUrls(req.tirePhotoUrls.map(url => `${url}`));
    } else {
      setPreviewUrls([]);
    }
    setSelectedFiles([]); // Clear selectedFiles since photos come from server URL
    setErrors({});
    window.scrollTo(0, 0);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure to delete this request?')) return;
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
                    {req.tirePhotoUrls?.length > 0 ? req.tirePhotoUrls.map((url, idx) => (
                      <img
                        key={idx}
                        src={`${url}`}
                        alt={`Tire ${idx + 1}`}
                        className="table-photo"
                        onClick={() => openPhotoModal(req.tirePhotoUrls.map(url => `${url}`), idx)}
                        title="Click to view full size"
                      />
                    )) : <span>No photos</span>}
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
            <span className="close" onClick={closePhotoModal}>&times;</span>
            <div className="photo-counter">{photoModal.currentIndex + 1} / {photoModal.photos.length}</div>
            <div className="zoom-indicator">Zoom: {Math.round(photoZoom * 100)}%</div>
            <img
              src={photoModal.photos[photoModal.currentIndex]}
              alt="Full size"
              style={{ transform: `scale(${photoZoom})` }}
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
            {imageLoading && <div className="image-loading">Loading...</div>}
            <div className="photo-controls">
              <button onClick={zoomOut} type="button">Zoom Out</button>
              <button onClick={resetZoom} type="button">Reset</button>
              <button onClick={zoomIn} type="button">Zoom In</button>
            </div>
            <div className="photo-navigation">
              <button onClick={prevPhoto} type="button">Previous</button>
              <button onClick={downloadPhoto} type="button">Download</button>
              <button onClick={nextPhoto} type="button">Next</button>
            </div>
            <div className="keyboard-shortcuts">
              <small>Keyboard: ← → Navigate | +/- Zoom | 0 Reset | Esc Close</small>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default RequestForm;
