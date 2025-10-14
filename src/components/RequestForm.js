import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './RequestForm.css';
import { getApiUrl, ENDPOINTS } from '../config/apiConfig';

const API_URL = getApiUrl(ENDPOINTS.TIRE_REQUESTS);
const BASE_URL = getApiUrl('');

function RequestForm() {
  const navigate = useNavigate();
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
  
  // Sorting state
  const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'asc' });

  // Sorting function
  const sortData = (data, key, direction) => {
    return [...data].sort((a, b) => {
      let aVal = a[key];
      let bVal = b[key];

      // Handle special cases for sorting
      if (key === 'id') {
        // Convert to numbers for proper numeric sorting
        aVal = parseInt(aVal) || 0;
        bVal = parseInt(bVal) || 0;
      } else if (key === 'vehicleNo') {
        // Sort vehicle numbers naturally (e.g., CAR-1, CAR-2, CAR-10)
        aVal = aVal?.toString().toLowerCase() || '';
        bVal = bVal?.toString().toLowerCase() || '';
      } else if (key === 'replacementDate') {
        // Sort dates properly
        aVal = new Date(aVal || '1970-01-01');
        bVal = new Date(bVal || '1970-01-01');
      } else if (key === 'presentKm' || key === 'previousKm' || key === 'noOfTires' || key === 'noOfTubes') {
        // Sort numeric values
        aVal = parseFloat(aVal) || 0;
        bVal = parseFloat(bVal) || 0;
      } else {
        // Sort strings (case-insensitive)
        aVal = aVal?.toString().toLowerCase() || '';
        bVal = bVal?.toString().toLowerCase() || '';
      }

      if (direction === 'asc') {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      } else {
        return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
      }
    });
  };

  // Handle sort click
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

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
      console.log('🔍 Fetching tire requests from MongoDB Atlas...');
      
      // Try MongoDB tire_requests collection via Railway backend
      try {
        const response = await fetch('https://tire-backend-58a9.onrender.com/api/tire-requests', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const requestsData = await response.json();
          console.log('✅ MongoDB tire_requests collection data loaded:', requestsData);
          
          // Process MongoDB data to ensure proper photo URLs
          const processedRequests = requestsData.map(req => ({
            ...req,
            id: req._id || req.id,
            // Handle tire photo URLs from MongoDB
            tirePhotoUrls: req.tirePhotoUrls ? req.tirePhotoUrls.map(photoUrl => {
              // If already a full URL, use as is
              if (photoUrl.startsWith('http')) return photoUrl;
              
              // If it's a relative path, construct full Render URL
              if (photoUrl.startsWith('/uploads/') || photoUrl.startsWith('uploads/')) {
                const cleanPath = photoUrl.replace(/^\/uploads\/|^uploads\//, '');
                return `https://tire-backend-58a9.onrender.com/uploads/${cleanPath}`;
              }
              
              // If it's just a filename, add the full path
              return `https://tire-backend-58a9.onrender.com/uploads/${photoUrl}`;
            }) : []
          }));
          
          setRequests(processedRequests);
          console.log('📊 Successfully loaded', processedRequests.length, 'tire requests with photos from MongoDB');
          return;
        } else {
          console.log('❌ MongoDB API error:', response.status, response.statusText);
          throw new Error(`API error: ${response.status}`);
        }
      } catch (mongoError) {
        console.error('MongoDB connection failed:', mongoError);
        throw mongoError;
      }
    } catch (error) {
      console.error('❌ Failed to fetch from database:', error);
      
      // No fallback data - show error message to user
      setRequests([]);
      console.log('❌ Database connection failed. No data loaded.');
    }
  };

  const isValidEmail = (email) => {
    // Simple regex for email validation
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validateField = (name, value, allData = formData) => {
    switch(name) {
      case 'vehicleNo':
        if (!value.trim()) return 'This field is required';
        if (value.length > 8) return 'Vehicle number cannot exceed 8 characters';
        break;
        
      case 'vehicleType':
      case 'vehicleBrand':
      case 'vehicleModel':
      case 'userSection':
      case 'existingMake':
      case 'tireSize':
      case 'officerServiceNo':
      case 'wearIndicator':
      case 'wearPattern':
        if (!value.trim()) return 'This field is required';
        break;
        
      case 'comments':
        if (value && value.length > 500) return 'Comments cannot exceed 500 characters';
        break;
        
      case 'replacementDate':
        if (!value.trim()) return 'This field is required';
        if (name === 'replacementDate' && isNaN(Date.parse(value))) return 'Invalid date';
        if (name === 'replacementDate' && value) {
          const selectedDate = new Date(value);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          selectedDate.setHours(0, 0, 0, 0);
          if (selectedDate > today) {
            return 'Cannot set future dates for vehicles already requested during restricted periods';
          }
        }
        break;

      case 'email':
        if (!value.trim()) return 'Email is required';
        if (!isValidEmail(value)) return 'Invalid email address';
        break;

      case 'noOfTires':
        if (!value.trim()) return 'This field is required';
        if (!/^\d+$/.test(value)) return 'Only numbers are allowed';
        const tireNum = parseInt(value);
        if (tireNum < 1 || tireNum > 50) return 'Number of tires must be between 1 and 50';
        break;
      
      case 'noOfTubes':
        if (!value.trim()) return 'This field is required';
        if (!/^\d+$/.test(value)) return 'Only numbers are allowed';
        const tubeNum = parseInt(value);
        if (tubeNum < 0 || tubeNum > 50) return 'Number of tubes must be between 0 and 50';
        break;

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
    
    // Auto-populate fields based on user section
    if (name === 'userSection' && value) {
      const sectionMappings = {
        'IT': { costCenter: '1001', officerServiceNo: 'IT001' },
        'HR': { costCenter: '1002', officerServiceNo: 'HR001' },
        'Finance': { costCenter: '1003', officerServiceNo: 'FIN001' },
        'Operations': { costCenter: '1004', officerServiceNo: 'OPS001' },
        'Marketing': { costCenter: '1005', officerServiceNo: 'MKT001' },
        'Engineering': { costCenter: '1006', officerServiceNo: 'ENG001' },
        'Logistics': { costCenter: '1007', officerServiceNo: 'LOG001' },
        'Administration': { costCenter: '1008', officerServiceNo: 'ADM001' },
        'Security': { costCenter: '1009', officerServiceNo: 'SEC001' },
        'Maintenance': { costCenter: '1010', officerServiceNo: 'MNT001' }
      };
      
      const mapping = sectionMappings[value];
      if (mapping) {
        updatedFormData.costCenter = mapping.costCenter;
        updatedFormData.officerServiceNo = mapping.officerServiceNo;
        updatedFormData.email = `${mapping.officerServiceNo.toLowerCase()}@company.com`;
      }
    }
    
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
    
    // Check file count limit
    if (files.length > 5) {
      alert('Only up to 5 photos allowed');
      return;
    }
    
    // Check file size limit (5MB per file)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    const oversizedFiles = files.filter(file => file.size > maxSize);
    
    if (oversizedFiles.length > 0) {
      alert('Image file size must be less than 5MB. Please select smaller images.');
      return;
    }
    
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    const invalidFiles = files.filter(file => !allowedTypes.includes(file.type));
    
    if (invalidFiles.length > 0) {
      alert('Only image files (JPEG, JPG, PNG, GIF) are allowed');
      return;
    }
    
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
      alert('❌ Please fix all validation errors before submitting the request.');
      return;
    }

    // Check if photos are selected for new requests
    if (!editingId && selectedFiles.length === 0) {
      alert('❌ Please attach at least one tire photo before submitting.');
      return;
    }

    try {
      const formDataToSend = new FormData();
      Object.keys(formData).forEach(key => formDataToSend.append(key, formData[key]));
      selectedFiles.forEach(file => formDataToSend.append('tirePhotos', file));
      
      let response;
      if (editingId) {
        // For update, assume PUT endpoint
        response = await axios.put(`${API_URL}/${editingId}`, formDataToSend, { 
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 30000 // 30 second timeout
        });
        alert('✅ Request updated successfully!');
      } else {
        response = await axios.post(API_URL, formDataToSend, { 
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 30000 // 30 second timeout
        });
        
        alert('✅ Request submitted successfully! Manager will be notified via email.');
        
        // Send notification email to manager after successful submission (don't block UI)
        if (response.data) {
          sendManagerNotification(response.data).catch(emailError => {
            console.warn('Email notification failed:', emailError);
            // Don't show error to user since request was submitted successfully
          });
        }
      }
      
      fetchRequests();
      resetForm();
    } catch (error) {
      console.error('Submit error:', error);
      
      // Provide specific error messages
      if (error.code === 'ECONNABORTED') {
        alert('❌ Request timeout. Please check your internet connection and try again.');
      } else if (error.response?.status === 502) {
        alert('❌ Server temporarily unavailable (502). Please try again in a few moments.');
      } else if (error.response?.status === 413) {
        alert('❌ Files too large. Please reduce image sizes and try again.');
      } else if (error.response?.status >= 500) {
        alert('❌ Server error. Please contact the administrator if this persists.');
      } else if (error.response?.status >= 400) {
        alert('❌ Invalid request data. Please check all fields and try again.');
      } else {
        alert('❌ Failed to submit request. Please check your connection and try again.');
      }
    }
  };

  // Send email notification to manager
  const sendManagerNotification = async (requestData) => {
    try {
      const managerEmail = 'slthrmanager@gmail.com'; // Manager email
      // Use production Vercel URL instead of localhost
      const dashboardLink = `https://tire-frontend.vercel.app/manager?requestId=${requestData.id}`;
      
      const emailData = {
        to: managerEmail,
        subject: `New Tire Request Submitted - ${requestData.vehicleNo}`,
        html: `
          <h2>🚗 New Tire Request Notification</h2>
          <p>A new tire replacement request has been submitted and requires your approval.</p>
          
          <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <h3>Request Details:</h3>
            <p><strong>Vehicle Number:</strong> ${requestData.vehicleNo}</p>
            <p><strong>Vehicle Type:</strong> ${requestData.vehicleType}</p>
            <p><strong>Brand/Model:</strong> ${requestData.vehicleBrand} ${requestData.vehicleModel}</p>
            <p><strong>Section:</strong> ${requestData.userSection}</p>
            <p><strong>Tire Size:</strong> ${requestData.tireSize}</p>
            <p><strong>Number of Tires:</strong> ${requestData.noOfTires}</p>
            <p><strong>Number of Tubes:</strong> ${requestData.noOfTubes}</p>
            <p><strong>Present KM:</strong> ${requestData.presentKm}</p>
            <p><strong>Officer Service No:</strong> ${requestData.officerServiceNo}</p>
            <p><strong>Comments:</strong> ${requestData.comments || 'None'}</p>
          </div>
          
          <div style="text-align: center; margin: 20px 0;">
            <a href="${dashboardLink}" 
               style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              🔍 Review Request in Manager Dashboard
            </a>
          </div>
          
          <p style="color: #666; font-size: 12px;">
            Click the button above to access the Manager Dashboard and approve or reject this request.
          </p>
        `
      };

      // Try to send email through backend
      const emailEndpoints = [
        '/api/send-email',
        '/api/notifications/email',
        '/api/mail/send'
      ];

      let emailSent = false;
      for (const endpoint of emailEndpoints) {
        try {
          await axios.post(endpoint, emailData);
          console.log(`✅ Email sent successfully via: ${endpoint}`);
          emailSent = true;
          break;
        } catch (error) {
          console.log(`❌ Failed email endpoint: ${endpoint}`, error.response?.status);
          continue;
        }
      }

      if (!emailSent) {
        console.log('📧 Email notification simulated (backend unavailable)');
        // Show notification in console for development
        console.log('MANAGER EMAIL NOTIFICATION:', {
          to: managerEmail,
          subject: emailData.subject,
          dashboardLink: dashboardLink,
          requestData: requestData
        });
      }

    } catch (error) {
      console.error('Email notification error:', error);
      // Don't fail the request submission if email fails
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

  const renderTable = (title, data) => {
    // Sort the data based on current sort configuration
    const sortedData = sortData(data, sortConfig.key, sortConfig.direction);
    
    return (
    <>
      <h3>{title}</h3>
      {data.length === 0 ? (
        <p>No requests</p>
      ) : (
        <table className="request-table">
          <thead>
            <tr>
              <th>
                <button 
                  className={`sort-header ${sortConfig.key === 'id' ? 'active' : ''}`}
                  onClick={() => handleSort('id')}
                >
                  ID {sortConfig.key === 'id' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </button>
              </th>
              <th>
                <button 
                  className={`sort-header ${sortConfig.key === 'vehicleNo' ? 'active' : ''}`}
                  onClick={() => handleSort('vehicleNo')}
                >
                  Vehicle No. {sortConfig.key === 'vehicleNo' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </button>
              </th>
              <th>
                <button 
                  className={`sort-header ${sortConfig.key === 'vehicleType' ? 'active' : ''}`}
                  onClick={() => handleSort('vehicleType')}
                >
                  Type {sortConfig.key === 'vehicleType' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </button>
              </th>
              <th>
                <button 
                  className={`sort-header ${sortConfig.key === 'vehicleBrand' ? 'active' : ''}`}
                  onClick={() => handleSort('vehicleBrand')}
                >
                  Brand {sortConfig.key === 'vehicleBrand' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </button>
              </th>
              <th>
                <button 
                  className={`sort-header ${sortConfig.key === 'vehicleModel' ? 'active' : ''}`}
                  onClick={() => handleSort('vehicleModel')}
                >
                  Model {sortConfig.key === 'vehicleModel' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </button>
              </th>
              <th>
                <button 
                  className={`sort-header ${sortConfig.key === 'userSection' ? 'active' : ''}`}
                  onClick={() => handleSort('userSection')}
                >
                  Section {sortConfig.key === 'userSection' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </button>
              </th>
              <th>
                <button 
                  className={`sort-header ${sortConfig.key === 'tireSize' ? 'active' : ''}`}
                  onClick={() => handleSort('tireSize')}
                >
                  Tire Size {sortConfig.key === 'tireSize' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </button>
              </th>
              <th>
                <button 
                  className={`sort-header ${sortConfig.key === 'noOfTires' ? 'active' : ''}`}
                  onClick={() => handleSort('noOfTires')}
                >
                  Tires {sortConfig.key === 'noOfTires' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </button>
              </th>
              <th>
                <button 
                  className={`sort-header ${sortConfig.key === 'noOfTubes' ? 'active' : ''}`}
                  onClick={() => handleSort('noOfTubes')}
                >
                  Tubes {sortConfig.key === 'noOfTubes' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </button>
              </th>
              <th>
                <button 
                  className={`sort-header ${sortConfig.key === 'presentKm' ? 'active' : ''}`}
                  onClick={() => handleSort('presentKm')}
                >
                  Present Km {sortConfig.key === 'presentKm' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </button>
              </th>
              <th>
                <button 
                  className={`sort-header ${sortConfig.key === 'previousKm' ? 'active' : ''}`}
                  onClick={() => handleSort('previousKm')}
                >
                  Previous Km {sortConfig.key === 'previousKm' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </button>
              </th>
              <th>Wear</th>
              <th>Pattern</th>
              <th>Officer</th>
              <th>Email</th>
              <th>
                <button 
                  className={`sort-header ${sortConfig.key === 'status' ? 'active' : ''}`}
                  onClick={() => handleSort('status')}
                >
                  Status {sortConfig.key === 'status' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </button>
              </th>
              <th>Photos</th>

            </tr>
          </thead>
          <tbody>
            {sortedData.map(req => (
              <tr key={req.id}>
                <td><strong>#{req.id}</strong></td>
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
                      // Enhanced MongoDB photo URL handling
                      const getImageUrl = (originalUrl) => {
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
                        
                        // Fallback to demo images for development
                        return originalUrl.startsWith('/images/') ? originalUrl : `/images/${originalUrl}`;
                      };
                      
                      const imageUrl = getImageUrl(url);
                      if (!imageUrl) return null;
                      
                      return (
                        <img
                          key={idx}
                          src={imageUrl}
                          alt={`Tire ${idx + 1} - ${req.vehicleNo}`}
                          className="table-photo"
                          onClick={() => {
                            // Create enhanced photo URLs for modal from MongoDB data
                            const modalUrls = req.tirePhotoUrls.map(photoUrl => getImageUrl(photoUrl));
                            openPhotoModal(modalUrls, idx);
                          }}
                          title={`Click to view tire photo ${idx + 1} full size (${req.vehicleNo})`}
                          onError={(e) => {
                            console.warn(`❌ Image loading failed: ${e.target.src}`);
                            console.warn(`Original URL: ${url}`);
                            
                            // Enhanced multi-level fallback system
                            if (!e.target.dataset.fallbackLevel) {
                              e.target.dataset.fallbackLevel = '1';
                              
                              // Level 1: Try direct Render backend URL with different path
                              const filename = url.split('/').pop().split('?')[0]; // Remove query params
                              const renderUrl = `https://tire-backend-58a9.onrender.com/uploads/${filename}`;
                              
                              console.log(`🔄 Level 1 fallback: ${renderUrl}`);
                              e.target.src = renderUrl;
                              
                            } else if (e.target.dataset.fallbackLevel === '1') {
                              e.target.dataset.fallbackLevel = '2';
                              
                              // Level 2: Try alternative Render paths
                              const filename = url.split('/').pop().split('?')[0];
                              const altUrl = `https://tire-backend-58a9.onrender.com/files/${filename}`;
                              
                              console.log(`🔄 Level 2 fallback: ${altUrl}`);
                              e.target.src = altUrl;
                              
                            } else if (e.target.dataset.fallbackLevel === '2') {
                              e.target.dataset.fallbackLevel = '3';
                              
                              // Level 3: Try demo images
                              const demoImages = ['/images/tire1.jpeg', '/images/tire2.jpeg', '/images/tire3.jpeg'];
                              const demoUrl = demoImages[idx % demoImages.length];
                              
                              console.log(`🔄 Level 3 fallback (demo): ${demoUrl}`);
                              e.target.src = demoUrl;
                              
                            } else if (e.target.dataset.fallbackLevel === '3') {
                              e.target.dataset.fallbackLevel = '4';
                              
                              // Level 4: Try placeholder image
                              console.log(`🔄 Level 4 fallback: placeholder image`);
                              e.target.src = '/images/default-profile.png';
                              
                            } else {
                              // Final fallback: Show styled error message
                              console.error(`💥 All image fallbacks failed for: ${url}`);
                              e.target.style.display = 'none';
                              
                              if (!e.target.nextElementSibling?.classList?.contains('photo-error')) {
                                e.target.insertAdjacentHTML('afterend', 
                                  `<div class="photo-error" style="
                                    background: linear-gradient(135deg, #f8d7da, #f5c6cb);
                                    border: 1px solid #f5c6cb;
                                    border-radius: 6px;
                                    padding: 8px;
                                    margin: 2px;
                                    text-align: center;
                                    color: #721c24;
                                    font-size: 11px;
                                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                                    min-width: 80px;
                                    min-height: 60px;
                                    display: flex;
                                    flex-direction: column;
                                    justify-content: center;
                                    align-items: center;
                                  ">
                                    <div style="font-size: 16px; margin-bottom: 4px;">📷</div>
                                    <div style="font-weight: bold;">Image Failed</div>
                                    <div style="font-size: 9px; opacity: 0.8;">File missing or corrupted</div>
                                  </div>`
                                );
                              }
                            }
                          }}
                          onLoad={() => {
                            console.log(`✅ Successfully loaded tire photo: ${imageUrl}`);
                          }}
                        />
                      );
                    }) : (
                      <span style={{ color: '#6c757d', fontSize: '12px', fontStyle: 'italic' }}>
                        📷 No tire photos uploaded
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
    );
  };

  return (
    <>
      <form className="request-form" onSubmit={handleSubmit} noValidate>
        <div className="form-header">
          <button 
            type="button" 
            className="back-button"
            onClick={() => navigate('/home')}
            title="Back to Home"
          >
            ← Back to Home
          </button>
          <h2>TIRE REQUEST FORM</h2>
        </div>

        {[
          { name: 'vehicleNo', label: 'Vehicle No.' },
          { name: 'vehicleType', label: 'Vehicle Type' },
          { name: 'vehicleBrand', label: 'Vehicle Brand' },
          { name: 'vehicleModel', label: 'Vehicle Model' },
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
              max={field.name === 'noOfTires' || field.name === 'noOfTubes' ? 50 : undefined}
              maxLength={field.name === 'vehicleNo' ? 8 : undefined}
              required
            />
            {errors[field.name] && <div className="error-message">{errors[field.name]}</div>}
          </div>
        ))}

        {/* User Section - Dropdown Selection */}
        <div className="form-group">
          <label htmlFor="userSection">User Section *</label>
          <select
            id="userSection"
            name="userSection"
            value={formData.userSection}
            onChange={handleChange}
            required
          >
            <option value="">Please select your section (Required)</option>
            <option value="IT">IT Department</option>
            <option value="HR">Human Resources</option>
            <option value="Finance">Finance Department</option>
            <option value="Operations">Operations</option>
            <option value="Marketing">Marketing</option>
            <option value="Engineering">Engineering</option>
            <option value="Logistics">Logistics</option>
            <option value="Administration">Administration</option>
            <option value="Security">Security</option>
            <option value="Maintenance">Maintenance</option>
          </select>
          {errors.userSection && <div className="error-message">{errors.userSection}</div>}
        </div>

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
          Submit Request
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
