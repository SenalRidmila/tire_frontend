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
      console.log('🔍 Fetching tire requests from MongoDB Atlas...');
      
      // Try MongoDB tire_requests collection via Vercel proxy (to avoid CORS)
      try {
        const response = await fetch('/api/tire-requests', {
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
          setUsingMockData(false);
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
      console.error('� Failed to fetch from MongoDB, using fallback mock data:', error);
      
      // Enhanced mock data with proper photo URLs for demo
      const enhancedMockRequests = mockRequests.map(req => ({
        ...req,
        tirePhotoUrls: req.tirePhotoUrls ? req.tirePhotoUrls.map(url => 
          url.startsWith('/images/') ? url : `/images/${url}`
        ) : []
      }));
      
      setRequests(enhancedMockRequests);
      setUsingMockData(true);
      console.log('🎭 Using enhanced mock data with', enhancedMockRequests.length, 'sample requests');
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
        
        // Send notification email to manager
        await sendManagerNotification(newRequest);
        
        alert('🎭 Mock: Request submitted successfully! Manager has been notified via email. (Demo mode - backend unavailable)');
      }
      resetForm();
      return;
    }

    try {
      const formDataToSend = new FormData();
      Object.keys(formData).forEach(key => formDataToSend.append(key, formData[key]));
      selectedFiles.forEach(file => formDataToSend.append('tirePhotos', file));
      
      let response;
      if (editingId) {
        // For update, assume PUT endpoint
        response = await axios.put(`${API_URL}/${editingId}`, formDataToSend, { headers: { 'Content-Type': 'multipart/form-data' } });
        alert('Request updated successfully!');
      } else {
        response = await axios.post(API_URL, formDataToSend, { headers: { 'Content-Type': 'multipart/form-data' } });
        
        // Send notification email to manager after successful submission
        if (response.data) {
          await sendManagerNotification(response.data);
        }
        
        alert('Request submitted successfully! Manager has been notified via email.');
      }
      fetchRequests();
      resetForm();
    } catch (error) {
      console.error('Submit error:', error);
      alert('Failed to submit request. Please try again.');
    }
  };

  // Send email notification to manager
  const sendManagerNotification = async (requestData) => {
    try {
      const managerEmail = 'kaushalya@slt.lk'; // Manager email
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
