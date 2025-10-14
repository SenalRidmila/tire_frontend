import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './RequestForm.css';
import BackendStatus from './BackendStatus';

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
  const [backendError, setBackendError] = useState(null);
  const [isLoadingData, setIsLoadingData] = useState(false);


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

  const fetchRequests = async (retryCount = 0) => {
    try {
      setIsLoadingData(true);
      setBackendError(null);
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
          setBackendError(null); // Clear any previous errors
          console.log('📊 Successfully loaded', processedRequests.length, 'tire requests with photos from MongoDB');
          return;
        } else if (response.status === 502 && retryCount < 2) {
          console.log(`🔄 502 Bad Gateway - Backend starting up. Retry ${retryCount + 1}/2 in 3 seconds...`);
          await new Promise(resolve => setTimeout(resolve, 3000));
          return fetchRequests(retryCount + 1);
        } else {
          console.log('❌ MongoDB API error:', response.status, response.statusText);
          throw new Error(`API error: ${response.status}`);
        }
      } catch (mongoError) {
        console.error('MongoDB connection failed:', mongoError);
        
        // Check if it's a 502 error (backend down/cold start)
        if (mongoError.message.includes('502')) {
          console.log('🔄 Backend appears to be starting up (502). This is common with Render free tier.');
          console.log('💡 Tip: The backend may be in "cold start" - it can take 30-60 seconds to wake up.');
        }
        
        throw mongoError;
      }
    } catch (error) {
      console.error('❌ Failed to fetch from database:', error);
      
      // Add user-friendly error message for 502 errors
      if (error.message.includes('502')) {
        console.log('📡 Backend Status: The Render backend appears to be starting up or temporarily unavailable.');
        console.log('⏳ This is normal for free tier hosting - please wait 30-60 seconds and try again.');
      }
      
      // Don't use mock data - keep empty array and show error state
      setRequests([]);
      setBackendError(error.message);
      console.log('❌ Database connection failed. No data loaded.');
    } finally {
      setIsLoadingData(false);
    }
  };

  const isValidEmail = (email) => {
    // Simple regex for email validation
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validateField = (name, value, allData = formData) => {
    switch(name) {
      case 'vehicleNo':
        if (!value.trim()) return 'Vehicle Number is required';
        if (!/^[A-Z0-9-]+$/i.test(value.trim())) return 'Vehicle Number should contain only letters, numbers and hyphens';
        if (value.trim().length < 3) return 'Vehicle Number should be at least 3 characters';
        break;

      case 'vehicleType':
        if (!value.trim()) return 'Vehicle Type is required';
        if (value.trim().length < 2) return 'Vehicle Type should be at least 2 characters';
        break;

      case 'vehicleBrand':
        if (!value.trim()) return 'Vehicle Brand is required';
        if (value.trim().length < 2) return 'Vehicle Brand should be at least 2 characters';
        break;

      case 'vehicleModel':
        if (!value.trim()) return 'Vehicle Model is required';
        if (value.trim().length < 2) return 'Vehicle Model should be at least 2 characters';
        break;

      case 'userSection':
        if (!value.trim()) return 'User Section is required';
        if (value.trim().length < 2) return 'User Section should be at least 2 characters';
        break;

      case 'replacementDate':
        if (!value.trim()) return 'Replacement Date is required';
        if (isNaN(Date.parse(value))) return 'Invalid date format';
        const selectedDate = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (selectedDate < today) return 'Replacement Date cannot be in the past';
        break;

      case 'existingMake':
        if (!value.trim()) return 'Existing Make is required';
        if (value.trim().length < 2) return 'Existing Make should be at least 2 characters';
        break;

      case 'tireSize':
        if (!value.trim()) return 'Tire Size is required';
        if (!/^[\d\w\/\-\s]+$/.test(value.trim())) return 'Invalid tire size format';
        break;

      case 'noOfTires':
        if (!value.trim()) return 'Number of Tires is required';
        if (!/^\d+$/.test(value)) return 'Only numbers are allowed';
        const tires = parseInt(value);
        if (tires < 1 || tires > 20) return 'Number of Tires should be between 1 and 20';
        break;

      case 'noOfTubes':
        if (!value.trim()) return 'Number of Tubes is required';
        if (!/^\d+$/.test(value)) return 'Only numbers are allowed';
        const tubes = parseInt(value);
        if (tubes < 0 || tubes > 20) return 'Number of Tubes should be between 0 and 20';
        break;

      case 'costCenter':
        if (!value.trim()) return 'Cost Center is required';
        if (!/^\d+$/.test(value)) return 'Only numbers are allowed';
        if (value.length < 4 || value.length > 10) return 'Cost Center should be between 4-10 digits';
        break;

      case 'presentKm':
        if (!value.trim()) return 'Present Km is required';
        if (!/^\d+$/.test(value)) return 'Only numbers are allowed';
        const presentKm = parseInt(value);
        if (presentKm < 0 || presentKm > 9999999) return 'Present Km should be between 0 and 9,999,999';
        break;

      case 'previousKm':
        if (!value.trim()) return 'Previous Km is required';
        if (!/^\d+$/.test(value)) return 'Only numbers are allowed';
        const previousKm = parseInt(value);
        if (previousKm < 0 || previousKm > 9999999) return 'Previous Km should be between 0 and 9,999,999';
        break;

      case 'wearIndicator':
        if (!value.trim()) return 'Wear Indicator is required';
        if (!['Yes', 'No'].includes(value)) return 'Please select Yes or No';
        break;

      case 'wearPattern':
        if (!value.trim()) return 'Wear Pattern is required';
        const validPatterns = ['One Edge', 'Both Edges', 'Center', 'Irregular', 'Normal'];
        if (!validPatterns.includes(value)) return 'Please select a valid wear pattern';
        break;

      case 'officerServiceNo':
        if (!value.trim()) return 'Officer Service Number is required';
        if (!/^[A-Z0-9]+$/i.test(value.trim())) return 'Service Number should contain only letters and numbers';
        if (value.trim().length < 3 || value.trim().length > 20) return 'Service Number should be between 3-20 characters';
        break;

      case 'comments':
        if (!value.trim()) return 'Comments are required';
        if (value.trim().length < 10) return 'Comments should be at least 10 characters';
        if (value.trim().length > 500) return 'Comments should not exceed 500 characters';
        break;

      case 'email':
        if (!value.trim()) return 'Email is required';
        if (!isValidEmail(value)) return 'Invalid email address format';
        break;

      default:
        return null;
    }

    // Cross-field validation for KM readings
    if (name === 'previousKm' || name === 'presentKm') {
      const prevKm = Number(allData.previousKm);
      const presKm = Number(allData.presentKm);
      if (!isNaN(prevKm) && !isNaN(presKm)) {
        if (prevKm >= presKm) {
          return 'Previous Km must be less than Present Km';
        }
        if ((presKm - prevKm) > 500000) {
          return 'KM difference seems too large (>500,000km)';
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
    
    // Comprehensive validation
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

  // Enhanced email notification system for the complete workflow
  const sendManagerNotification = async (requestData) => {
    try {
      const managerEmail = 'slthrmanager@gmail.com';
      const dashboardLink = `https://tire-slt.vercel.app/manager-dashboard?requestId=${requestData._id || requestData.id}`;
      
      const emailData = {
        to: managerEmail,
        subject: `🚗 New Tire Request - ${requestData.vehicleNo} (ID: ${requestData._id || requestData.id})`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px;">
            <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #1e3a8a; margin: 0;">🚗 New Tire Request Submitted</h1>
                <p style="color: #64748b; font-size: 16px; margin: 10px 0 0 0;">Request requires your immediate attention</p>
              </div>
              
              <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
                <h3 style="color: #1e40af; margin-top: 0;">📋 Request Details:</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr><td style="padding: 5px 0; font-weight: bold;">Request ID:</td><td>${requestData._id || requestData.id}</td></tr>
                  <tr><td style="padding: 5px 0; font-weight: bold;">Vehicle Number:</td><td>${requestData.vehicleNo}</td></tr>
                  <tr><td style="padding: 5px 0; font-weight: bold;">Vehicle Type:</td><td>${requestData.vehicleType}</td></tr>
                  <tr><td style="padding: 5px 0; font-weight: bold;">Brand/Model:</td><td>${requestData.vehicleBrand} ${requestData.vehicleModel}</td></tr>
                  <tr><td style="padding: 5px 0; font-weight: bold;">Section:</td><td>${requestData.userSection}</td></tr>
                  <tr><td style="padding: 5px 0; font-weight: bold;">Tire Size:</td><td>${requestData.tireSize}</td></tr>
                  <tr><td style="padding: 5px 0; font-weight: bold;">Number of Tires:</td><td>${requestData.noOfTires}</td></tr>
                  <tr><td style="padding: 5px 0; font-weight: bold;">Number of Tubes:</td><td>${requestData.noOfTubes}</td></tr>
                  <tr><td style="padding: 5px 0; font-weight: bold;">Present KM:</td><td>${requestData.presentKm}</td></tr>
                  <tr><td style="padding: 5px 0; font-weight: bold;">Officer Service No:</td><td>${requestData.officerServiceNo}</td></tr>
                  <tr><td style="padding: 5px 0; font-weight: bold;">Submitted Date:</td><td>${new Date().toLocaleString()}</td></tr>
                  <tr><td style="padding: 5px 0; font-weight: bold;">Email:</td><td>${requestData.email}</td></tr>
                </table>
              </div>
              
              <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
                <h4 style="color: #92400e; margin-top: 0;">💬 Comments:</h4>
                <p style="color: #92400e; margin: 0;">${requestData.comments || 'No additional comments provided.'}</p>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${dashboardLink}" 
                   style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px; box-shadow: 0 4px 14px 0 rgba(0,118,255,.39);">
                  🔍 Open Manager Dashboard
                </a>
              </div>
              
              <div style="background: #fee2e2; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
                <p style="color: #dc2626; margin: 0; font-weight: bold;">⚠️ Action Required: Please review and approve/reject this request to proceed with the workflow.</p>
              </div>
              
              <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <p style="color: #6b7280; font-size: 12px; margin: 0;"><em>This is an automated notification from the SLT Tire Management System.</em></p>
              </div>
            </div>
          </div>
        `
      };

      await axios.post('/api/send-email', emailData, { timeout: 10000 });
      console.log('✅ Manager notification email sent successfully');
    } catch (error) {
      console.log('📧 Manager email notification failed:', error.response?.status);
      // Show notification in console for development
      console.log('MANAGER EMAIL NOTIFICATION:', {
        to: managerEmail,
        subject: emailData.subject,
        dashboardLink: dashboardLink,
        requestData: requestData
      });
    }
  };

  // Send TTO notification after manager approval
  const sendTTONotification = async (requestData) => {
    try {
      const ttoEmail = 'slttransportofficer@gmail.com';
      const dashboardLink = `https://tire-slt.vercel.app/tto-dashboard?requestId=${requestData._id || requestData.id}`;
      
      const emailData = {
        to: ttoEmail,
        subject: `🚛 Manager Approved - Tire Request ${requestData.vehicleNo} (ID: ${requestData._id || requestData.id})`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px;">
            <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #059669; margin: 0;">✅ Manager Approved Tire Request</h1>
                <p style="color: #64748b; font-size: 16px; margin: 10px 0 0 0;">Request forwarded for TTO review</p>
              </div>
              <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
                <h3 style="color: #065f46; margin-top: 0;">📋 Approved Request Details:</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr><td style="padding: 5px 0; font-weight: bold;">Request ID:</td><td>${requestData._id || requestData.id}</td></tr>
                  <tr><td style="padding: 5px 0; font-weight: bold;">Vehicle Number:</td><td>${requestData.vehicleNo}</td></tr>
                  <tr><td style="padding: 5px 0; font-weight: bold;">Tire Size:</td><td>${requestData.tireSize}</td></tr>
                  <tr><td style="padding: 5px 0; font-weight: bold;">Number of Tires:</td><td>${requestData.noOfTires}</td></tr>
                  <tr><td style="padding: 5px 0; font-weight: bold;">Manager Approval:</td><td style="color: #059669; font-weight: bold;">✅ APPROVED</td></tr>
                </table>
              </div>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${dashboardLink}" 
                   style="background: linear-gradient(135deg, #059669, #047857); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px;">
                  🚛 Open TTO Dashboard
                </a>
              </div>
            </div>
          </div>
        `
      };

      await axios.post('/api/send-email', emailData, { timeout: 10000 });
      console.log('✅ TTO notification email sent successfully');
    } catch (error) {
      console.log('📧 TTO email notification failed:', error.response?.status);
    }
  };

  // Send Engineer notification after TTO assignment
  const sendEngineerNotification = async (requestData, assignedEngineer) => {
    try {
      const engineerEmail = 'engineerslt38@gmail.com';
      const dashboardLink = `https://tire-slt.vercel.app/engineer-dashboard?requestId=${requestData._id || requestData.id}`;
      
      const emailData = {
        to: engineerEmail,
        subject: `🔧 New Assignment - Tire Inspection ${requestData.vehicleNo} (ID: ${requestData._id || requestData.id})`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px;">
            <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #7c3aed; margin: 0;">🔧 New Engineering Assignment</h1>
                <p style="color: #64748b; font-size: 16px; margin: 10px 0 0 0;">Tire inspection and approval required</p>
              </div>
              <div style="background: #f3e8ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #8b5cf6;">
                <h3 style="color: #5b21b6; margin-top: 0;">🔍 Inspection Assignment:</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr><td style="padding: 5px 0; font-weight: bold;">Request ID:</td><td>${requestData._id || requestData.id}</td></tr>
                  <tr><td style="padding: 5px 0; font-weight: bold;">Vehicle Number:</td><td>${requestData.vehicleNo}</td></tr>
                  <tr><td style="padding: 5px 0; font-weight: bold;">Tire Size:</td><td>${requestData.tireSize}</td></tr>
                  <tr><td style="padding: 5px 0; font-weight: bold;">Number of Tires:</td><td>${requestData.noOfTires}</td></tr>
                  <tr><td style="padding: 5px 0; font-weight: bold;">Status:</td><td style="color: #059669;">Manager ✅ → TTO ✅ → Engineer 🔄</td></tr>
                </table>
              </div>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${dashboardLink}" 
                   style="background: linear-gradient(135deg, #7c3aed, #5b21b6); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px;">
                  🔧 Open Engineer Dashboard
                </a>
              </div>
            </div>
          </div>
        `
      };

      await axios.post('/api/send-email', emailData, { timeout: 10000 });
      console.log('✅ Engineer notification email sent successfully');
    } catch (error) {
      console.log('📧 Engineer email notification failed:', error.response?.status);
    }
  };

  // Send Final Approval notification to user  
  const sendFinalApprovalNotification = async (requestData) => {
    try {
      const userEmail = requestData.email;
      
      const emailData = {
        to: userEmail,
        subject: `🎉 APPROVED - Your Tire Request ${requestData.vehicleNo} (ID: ${requestData._id || requestData.id})`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px;">
            <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #059669; margin: 0;">🎉 Request APPROVED!</h1>
                <p style="color: #64748b; font-size: 16px; margin: 10px 0 0 0;">Your tire request has been fully approved</p>
              </div>
              <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
                <h3 style="color: #065f46; margin-top: 0;">✅ Approved Request Summary:</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr><td style="padding: 5px 0; font-weight: bold;">Request ID:</td><td>${requestData._id || requestData.id}</td></tr>
                  <tr><td style="padding: 5px 0; font-weight: bold;">Vehicle Number:</td><td>${requestData.vehicleNo}</td></tr>
                  <tr><td style="padding: 5px 0; font-weight: bold;">Tire Size:</td><td>${requestData.tireSize}</td></tr>
                  <tr><td style="padding: 5px 0; font-weight: bold;">Number of Tires:</td><td>${requestData.noOfTires}</td></tr>
                  <tr><td style="padding: 5px 0; font-weight: bold;">Final Status:</td><td style="color: #059669; font-weight: bold; font-size: 18px;">🎉 FULLY APPROVED</td></tr>
                </table>
              </div>
            </div>
          </div>
        `
      };

      await axios.post('/api/send-email', emailData, { timeout: 10000 });
      console.log('✅ Final approval notification sent to user');
    } catch (error) {
      console.log('📧 User approval email notification failed:', error.response?.status);
    }
  };

  // Send Seller notification for final processing
  const sendSellerNotification = async (requestData) => {
    try {
      const sellerEmail = 'slttiresellerseller@gmail.com';
      
      const emailData = {
        to: sellerEmail,
        subject: `💼 New Order - Process Tire Delivery ${requestData.vehicleNo} (ID: ${requestData._id || requestData.id})`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px;">
            <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #dc2626; margin: 0;">💼 New Tire Order</h1>
                <p style="color: #64748b; font-size: 16px; margin: 10px 0 0 0;">Fully approved request ready for processing</p>
              </div>
              <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
                <h3 style="color: #991b1b; margin-top: 0;">📦 Order Details:</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr><td style="padding: 5px 0; font-weight: bold;">Order ID:</td><td>${requestData._id || requestData.id}</td></tr>
                  <tr><td style="padding: 5px 0; font-weight: bold;">Vehicle Number:</td><td>${requestData.vehicleNo}</td></tr>
                  <tr><td style="padding: 5px 0; font-weight: bold;">Tire Size:</td><td style="color: #dc2626; font-weight: bold;">${requestData.tireSize}</td></tr>
                  <tr><td style="padding: 5px 0; font-weight: bold;">Quantity - Tires:</td><td style="color: #dc2626; font-weight: bold;">${requestData.noOfTires}</td></tr>
                  <tr><td style="padding: 5px 0; font-weight: bold;">Quantity - Tubes:</td><td style="color: #dc2626; font-weight: bold;">${requestData.noOfTubes}</td></tr>
                  <tr><td style="padding: 5px 0; font-weight: bold;">Section/Department:</td><td>${requestData.userSection}</td></tr>
                  <tr><td style="padding: 5px 0; font-weight: bold;">Customer Email:</td><td>${requestData.email}</td></tr>
                </table>
              </div>
            </div>
          </div>
        `
      };

      await axios.post('/api/send-email', emailData, { timeout: 10000 });
      console.log('✅ Seller notification email sent successfully');
    } catch (error) {
      console.log('📧 Seller email notification failed:', error.response?.status);
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
                        
                        // Handle base64 data URLs directly (common from MongoDB storage)
                        if (originalUrl.startsWith('data:image/')) {
                          return originalUrl; // Use base64 data URL directly
                        }
                        
                        // If already a full HTTP URL from MongoDB, use as is
                        if (originalUrl.startsWith('http')) return originalUrl;
                        
                        // Handle relative paths from MongoDB
                        if (originalUrl.startsWith('/uploads/')) {
                          return `https://tire-backend-58a9.onrender.com${originalUrl}`;
                        }
                        
                        // Detect and reject base64 fragments (common issue)
                        const isBase64Fragment = /^[A-Za-z0-9+/=]{10,}$/.test(originalUrl) || 
                                                originalUrl.includes('base64') || 
                                                originalUrl.length > 50;
                        
                        if (isBase64Fragment) {
                          console.warn(`Detected base64 fragment, using fallback: ${originalUrl}`);
                          return `/images/tire1.jpeg`; // Use demo image for fragments
                        }
                        
                        // Handle direct filenames from MongoDB (only if it looks like a real filename)
                        if (!originalUrl.startsWith('/') && originalUrl.includes('.') && originalUrl.length < 50) {
                          return `https://tire-backend-58a9.onrender.com/uploads/${originalUrl}`;
                        }
                        
                        // Fallback to demo images for development
                        return originalUrl.startsWith('/images/') ? originalUrl : `/images/tire1.jpeg`;
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
                            
                            // Don't try fallbacks for base64 data URLs that failed
                            if (url.startsWith('data:image/')) {
                              console.warn('Base64 data URL failed to load - using demo image');
                              e.target.src = '/images/tire1.jpeg';
                              return;
                            }
                            
                            // Enhanced multi-level fallback system for regular URLs
                            if (!e.target.dataset.fallbackLevel) {
                              e.target.dataset.fallbackLevel = '1';
                              
                              // Level 1: Try direct Render backend URL with different path
                              const filename = url.split('/').pop().split('?')[0]; // Remove query params
                              
                              // Skip if filename looks like base64 fragment
                              if (filename && filename.length < 100 && !filename.includes('base64')) {
                                const renderUrl = `https://tire-backend-58a9.onrender.com/uploads/${filename}`;
                                console.log(`🔄 Level 1 fallback: ${renderUrl}`);
                                e.target.src = renderUrl;
                                return;
                              }
                            } else if (e.target.dataset.fallbackLevel === '1') {
                              e.target.dataset.fallbackLevel = '2';
                              
                              // Level 2: Try alternative Render paths
                              const filename = url.split('/').pop().split('?')[0];
                              if (filename && filename.length < 100 && !filename.includes('base64')) {
                                const altUrl = `https://tire-backend-58a9.onrender.com/files/${filename}`;
                                console.log(`🔄 Level 2 fallback: ${altUrl}`);
                                e.target.src = altUrl;
                                return;
                              }
                            }
                            
                            // Final fallback: Use demo images
                            e.target.dataset.fallbackLevel = 'final';
                            const demoImages = ['/images/tire1.jpeg', '/images/tire2.jpeg', '/images/tire3.jpeg'];
                            const demoUrl = demoImages[idx % demoImages.length];
                            
                            console.log(`🔄 Final fallback (demo): ${demoUrl}`);
                            e.target.src = demoUrl;
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
      <BackendStatus 
        isLoading={isLoadingData}
        error={backendError}
        onRetry={() => fetchRequests()}
      />
      
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
                
                // Check if current URL is a base64 fragment or invalid
                const currentUrl = e.target.src;
                const originalUrl = photoModal.photos[photoModal.currentIndex];
                
                // Detect base64 fragments and don't try to create URLs from them
                const isBase64Fragment = /[A-Za-z0-9+/=]{20,}/.test(originalUrl) || 
                                        originalUrl.includes('base64') ||
                                        currentUrl.includes('AKHJG0GHSCyZAAAAAElFTkSuQmCC');
                
                if (isBase64Fragment) {
                  console.warn('Modal image is base64 fragment, using demo image');
                  e.target.src = '/images/tire1.jpeg';
                  return;
                }
                
                if (!e.target.dataset.modalFallbackTried) {
                  e.target.dataset.modalFallbackTried = 'true';
                  
                  // Only try fallbacks for valid-looking URLs
                  if (originalUrl.startsWith('http') || originalUrl.startsWith('/') || originalUrl.includes('.')) {
                    const fallbackUrls = [
                      originalUrl.includes('/uploads/') ? originalUrl : originalUrl.replace(BASE_URL, `${BASE_URL}/uploads`),
                      originalUrl.startsWith('http') ? originalUrl : `${BASE_URL}/uploads/${originalUrl}`,
                      `/uploads/${originalUrl.split('/').pop()}`,
                      originalUrl
                    ].filter(url => url !== currentUrl && !url.includes('AKHJG0GHSCyZAAAAAElFTkSuQmCC'));
                    
                    if (fallbackUrls.length > 0) {
                      console.log(`Trying fallback URL: ${fallbackUrls[0]}`);
                      e.target.src = fallbackUrls[0];
                      return;
                    }
                  }
                }
                
                // Final fallback: use demo image
                console.warn('All modal image fallbacks failed, using demo image');
                e.target.src = '/images/tire1.jpeg';
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
