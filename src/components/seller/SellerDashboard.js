import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './SellerDashboard.css';

const SellerDashboard = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const API_URL = process.env.NODE_ENV === 'production' 
    ? 'https://tire-backend-58a9.onrender.com/api'
    : '/api';

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/tire-orders`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setOrders(data);
      setError(null);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError('Failed to load tire orders. Please try again.');
      // No mock data - keep empty array to show real error state
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // Enhanced sorting functionality for Seller Dashboard
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortedData = (data) => {
    if (!sortConfig.key) return data;

    return [...data].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      // Handle different data types for sorting
      if (sortConfig.key === 'id') {
        aValue = a._id || a.id;
        bValue = b._id || b.id;
      } else if (sortConfig.key === 'orderDate') {
        aValue = new Date(a.orderDate || a.createdAt || 0);
        bValue = new Date(b.orderDate || b.createdAt || 0);
      } else if (sortConfig.key === 'replacementDate') {
        aValue = new Date(a.replacementDate || 0);
        bValue = new Date(b.replacementDate || 0);
      } else if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  };

  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return ' 🔄';
    }
    return sortConfig.direction === 'asc' ? ' ⬆️' : ' ⬇️';
  };

  const handleConfirmOrder = async (orderId) => {
    try {
      const response = await fetch(`${API_URL}/tire-orders/${orderId}/confirm`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setOrders(orders.map(order => 
          order.id === orderId 
            ? { ...order, status: 'CONFIRMED' }
            : order
        ));
        alert('✅ Order confirmed successfully!');
      } else {
        throw new Error('Failed to confirm order');
      }
    } catch (error) {
      console.error('Error confirming order:', error);
      alert('❌ Failed to confirm order. Please try again.');
    }
  };

  const handleRejectOrder = async (orderId) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;

    try {
      const response = await fetch(`${API_URL}/tire-orders/${orderId}/reject`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
      });

      if (response.ok) {
        setOrders(orders.map(order => 
          order.id === orderId 
            ? { ...order, status: 'REJECTED', rejectionReason: reason }
            : order
        ));
        alert('✅ Order rejected successfully!');
      } else {
        throw new Error('Failed to reject order');
      }
    } catch (error) {
      console.error('Error rejecting order:', error);
      alert('❌ Failed to reject order. Please try again.');
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'PENDING': return '#ffc107';
      case 'CONFIRMED': return '#28a745';
      case 'REJECTED': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toUpperCase()) {
      case 'PENDING': return '🔄';
      case 'CONFIRMED': return '✅';
      case 'REJECTED': return '❌';
      default: return '❓';
    }
  };

  if (loading) {
    return (
      <div className="seller-dashboard">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading tire orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="seller-dashboard">
      <div className="dashboard-header">
        <button 
          className="back-btn"
          onClick={() => navigate('/home')}
        >
          ← Back to Home
        </button>
        <h1>🏪 Tire Seller Dashboard</h1>
        <p>Manage incoming tire orders from customers</p>
      </div>

      {error && (
        <div className="error-banner">
          <span>⚠️ {error}</span>
        </div>
      )}

      <div className="dashboard-stats">
        <div className="stat-card">
          <h3>{orders.length}</h3>
          <p>Total Orders</p>
        </div>
        <div className="stat-card">
          <h3>{orders.filter(o => o.status === 'PENDING').length}</h3>
          <p>Pending Orders</p>
        </div>
        <div className="stat-card">
          <h3>{orders.filter(o => o.status === 'CONFIRMED').length}</h3>
          <p>Confirmed Orders</p>
        </div>
        <div className="stat-card">
          <h3>{orders.filter(o => o.status === 'REJECTED').length}</h3>
          <p>Rejected Orders</p>
        </div>
      </div>

      <div className="orders-section">
        <h2>📦 Tire Orders</h2>
        
        {orders.length === 0 ? (
          <div className="no-orders">
            <h3>📪 No Orders Found</h3>
            <p>No tire orders have been received yet.</p>
          </div>
        ) : (
          <div className="orders-table-container">
            <table className="orders-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort('id')} style={{cursor: 'pointer'}} title="Click to sort by ID">
                    Order ID{getSortIcon('id')}
                  </th>
                  <th>Vehicle No</th>
                  <th>Tire Brand</th>
                  <th>Quantity</th>
                  <th onClick={() => handleSort('orderDate')} style={{cursor: 'pointer'}} title="Click to sort by Date">
                    Date{getSortIcon('orderDate')}
                  </th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {getSortedData(orders).map(order => (
                  <tr key={order.id}>
                    <td>
                      <strong>#{order.id}</strong>
                    </td>
                    <td>{order.vehicleNo}</td>
                    <td>{order.tireBrand || 'Standard Tire'}</td>
                    <td>{order.quantity} tires</td>
                    <td>
                      {order.orderDate ? new Date(order.orderDate).toLocaleDateString('en-CA') : 
                       order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-CA') : 
                       order.submittedDate ? new Date(order.submittedDate).toLocaleDateString('en-CA') : 'N/A'}
                    </td>
                    <td>
                      <span 
                        className="status-badge"
                        style={{ backgroundColor: getStatusColor(order.status) }}
                      >
                        {getStatusIcon(order.status)} {order.status}
                      </span>
                    </td>
                    <td>
                      {order.status === 'PENDING' ? (
                        <div className="action-buttons">
                          <button
                            className="confirm-btn"
                            onClick={() => handleConfirmOrder(order.id)}
                          >
                            ✅ Confirm
                          </button>
                          <button
                            className="reject-btn"
                            onClick={() => handleRejectOrder(order.id)}
                          >
                            ❌ Reject
                          </button>
                        </div>
                      ) : (
                        <span className="action-completed">
                          {order.status === 'CONFIRMED' ? '✅ Confirmed' : '❌ Rejected'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="contact-info">
        <h3>📞 Contact Information</h3>
        <p><strong>Email:</strong> slttiersellerseller@gmail.com</p>
        <p><strong>Business Hours:</strong> Monday - Friday, 8:00 AM - 6:00 PM</p>
        <p><strong>Emergency Contact:</strong> +94 XX XXX XXXX</p>
      </div>
    </div>
  );
};

export default SellerDashboard;