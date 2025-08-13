import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import './SellerDashboard.css';

const API_URL = process.env.NODE_ENV === 'development' 
  ? `${process.env.REACT_APP_API_URL}/api/tire-orders`
  : '/api/tire-orders';

const Tooltip = ({ text, children }) => (
  <span className="tooltip-wrapper">
    {children}
    <span className="tooltip-text">{text}</span>
  </span>
);

function SellerDashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Modal state for viewing order details
  const [viewOrder, setViewOrder] = useState(null);

  const fetchOrders = () => {
    setLoading(true);
    axios.get(API_URL)
      .then(response => {
        console.log('Fetched orders:', response.data);
        setOrders(response.data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Failed to fetch orders:', error.response || error.message || error);
        setLoading(false);
        alert('Failed to fetch orders: ' + (error.response?.data || error.message || 'Unknown error'));
      });
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleConfirm = async (id) => {
    setActionLoadingId(id);
    try {
      await axios.put(`${API_URL}/${id}/confirm`);
      // Refresh orders after confirm
      await fetchOrders();
    } catch (error) {
      const errMsg = error.response?.data?.message || error.message || 'Unknown error';
      alert(`Failed to confirm order: ${errMsg}`);
    }
    setActionLoadingId(null);
  };

  const handleReject = async (id) => {
    const reason = prompt("Please enter the reason for rejection:");
    if (reason === null) return;

    setActionLoadingId(id);
    try {
      await axios.put(`${API_URL}/${id}/reject`, { reason });
      // Refresh orders after reject
      await fetchOrders();
    } catch (error) {
      alert('Failed to reject order');
    }
    setActionLoadingId(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this order?')) return;

    setActionLoadingId(id);
    try {
      await axios.delete(`${API_URL}/${id}`);
      setOrders(prev => prev.filter(order => order.id !== id));
    } catch (error) {
      const errMsg = error.response?.data?.message || error.message || 'Unknown error';
      alert(`Failed to delete order: ${errMsg}`);
    }
    setActionLoadingId(null);
  };

  // Generate PDF of order details
  const downloadPDF = (order) => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Tire Order Details", 14, 22);
    doc.setFontSize(12);

    let y = 35;
    const lineHeight = 10;
    const addLine = (label, value) => {
      doc.text(`${label}: ${value || '-'}`, 14, y);
      y += lineHeight;
    };

    addLine("Order ID", order.id);
    addLine("Vehicle No", order.vehicleNo);
    addLine("Vendor Name", order.vendorName);
    addLine("User Email", order.userEmail);
    addLine("Quantity", order.quantity);
    addLine("Tire Brand", order.tireBrand);
    addLine("Location", order.location);
    addLine("Status", order.status);
    if (order.rejectionReason) addLine("Rejection Reason", order.rejectionReason);

    doc.save(`Order_${order.id}.pdf`);
  };

  if (loading) return <p className="loading">Loading orders...</p>;

  const pendingOrders = orders.filter(order => (order.status || '').toLowerCase() === 'pending');

  // Relaxed filter to include any status containing confirm or reject (case-insensitive)
  const completedOrders = orders.filter(order => {
    const st = (order.status || '').toLowerCase();
    return st.includes('confirm') || st.includes('reject');
  });

  const renderOrderRow = (order, index, isPending) => {
    const status = (order.status || 'pending').toLowerCase();
    const isLoading = actionLoadingId === order.id;
    const rowClass = index % 2 === 0 ? 'even-row' : 'odd-row';

    return (
      <tr key={order.id} className={`${rowClass} ${status === 'rejected' ? 'row-rejected' : ''}`}>
        <td>{order.id}</td>
        <td>{order.vehicleNo || '-'}</td>
        <td>{order.vendorName || '-'}</td>
        <td>{order.userEmail || '-'}</td>
        <td>{order.quantity || '-'}</td>
        <td>{order.tireBrand || '-'}</td>
        <td>{order.location || '-'}</td>
        <td>
          <span className={`status ${status}`}>
            {order.status || 'PENDING'}
          </span>
        </td>
        <td className="actions-cell">
          {isPending ? (
            <>
              <Tooltip text="Confirm this order">
                <button
                  className="btn confirm"
                  onClick={() => handleConfirm(order.id)}
                  disabled={isLoading}
                  aria-label="Confirm order"
                >
                  {isLoading ? 'Confirming...' : '✔️'}
                </button>
              </Tooltip>
              <Tooltip text="Reject this order">
                <button
                  className="btn reject"
                  onClick={() => handleReject(order.id)}
                  disabled={isLoading}
                  aria-label="Reject order"
                >
                  {isLoading ? 'Rejecting...' : '❌'}
                </button>
              </Tooltip>
              <Tooltip text="Delete this order">
                <button
                  className="btn delete"
                  onClick={() => handleDelete(order.id)}
                  disabled={isLoading}
                  aria-label="Delete order"
                >
                  🗑️
                </button>
              </Tooltip>
            </>
          ) : (
            <>
              <Tooltip text="View order details">
                <button
                  className="btn view"
                  onClick={() => setViewOrder(order)}
                  aria-label="View order"
                >
                  👁️
                </button>
              </Tooltip>
              <Tooltip text="Download order as PDF">
                <button
                  className="btn download"
                  onClick={() => downloadPDF(order)}
                  aria-label="Download PDF"
                >
                  📄
                </button>
              </Tooltip>
              <Tooltip text="Delete this order">
                <button
                  className="btn delete"
                  onClick={() => handleDelete(order.id)}
                  disabled={isLoading}
                  aria-label="Delete order"
                >
                  {isLoading ? 'Deleting...' : '🗑️'}
                </button>
              </Tooltip>
            </>
          )}
        </td>
      </tr>
    );
  };

  return (
    <div className="dashboard-container">
      {/* Navigation Bar */}
      <nav style={{ 
        background: '#2c3e50', 
        padding: '10px 20px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        color: 'white',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', gap: '15px' }}>
          <button 
            onClick={() => window.open('https://tire-frontend.vercel.app/home', '_blank')}
            style={{ 
              background: '#3498db', 
              color: 'white', 
              border: 'none', 
              padding: '8px 16px', 
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            🏠 Home
          </button>
          <button 
            onClick={() => window.open('https://tire-frontend.vercel.app/manager', '_blank')}
            style={{ 
              background: '#e74c3c', 
              color: 'white', 
              border: 'none', 
              padding: '8px 16px', 
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            🧑‍💼 Manager Dashboard
          </button>
          <button 
            onClick={() => window.open('https://tire-frontend.vercel.app/engineer-dashboard', '_blank')}
            style={{ 
              background: '#e67e22', 
              color: 'white', 
              border: 'none', 
              padding: '8px 16px', 
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            🔧 Engineer Dashboard
          </button>
          <button 
            onClick={() => window.open('https://tire-frontend.vercel.app/tto-dashboard', '_blank')}
            style={{ 
              background: '#27ae60', 
              color: 'white', 
              border: 'none', 
              padding: '8px 16px', 
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            🚛 TTO Dashboard
          </button>
        </div>
        <div>
          <span>🛒 Seller Dashboard</span>
        </div>
      </nav>

      <h2 className="dashboard-title">📦 Seller Dashboard – Tire Orders</h2>

      <section>
        <h3 className="section-title">🕒 Pending Orders</h3>
        {pendingOrders.length === 0 ? (
          <p className="no-orders">No pending orders.</p>
        ) : (
          <div className="table-wrapper">
            <table className="orders-table" role="grid" aria-label="Pending orders">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Vehicle No</th>
                  <th>Vendor Name</th>
                  <th>User Email</th>
                  <th>No. of Tires</th>
                  <th>Tire Brand</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingOrders.map((order, i) => renderOrderRow(order, i, true))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="completed-section">
        <h3 className="section-title">✅ Confirmed & ❌ Rejected Orders</h3>
        {completedOrders.length === 0 ? (
          <p className="no-orders">No confirmed or rejected orders.</p>
        ) : (
          <div className="table-wrapper">
            <table className="orders-table" role="grid" aria-label="Confirmed and rejected orders">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Vehicle No</th>
                  <th>Vendor Name</th>
                  <th>User Email</th>
                  <th>No. of Tires</th>
                  <th>Tire Brand</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {completedOrders.map((order, i) => renderOrderRow(order, i, false))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Modal for viewing order details */}
      {viewOrder && (
        <div className="modal-overlay" onClick={() => setViewOrder(null)} role="dialog" aria-modal="true">
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Order Details - ID: {viewOrder.id}</h3>
            <ul>
              <li><strong>Vehicle No:</strong> {viewOrder.vehicleNo || '-'}</li>
              <li><strong>Vendor Name:</strong> {viewOrder.vendorName || '-'}</li>
              <li><strong>User Email:</strong> {viewOrder.userEmail || '-'}</li>
              <li><strong>Quantity:</strong> {viewOrder.quantity || '-'}</li>
              <li><strong>Tire Brand:</strong> {viewOrder.tireBrand || '-'}</li>
              <li><strong>Location:</strong> {viewOrder.location || '-'}</li>
              <li><strong>Status:</strong> {viewOrder.status || '-'}</li>
              {viewOrder.rejectionReason && (
                <li><strong>Rejection Reason:</strong> {viewOrder.rejectionReason}</li>
              )}
            </ul>
            <button onClick={() => setViewOrder(null)} className="btn close-btn" aria-label="Close modal">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default SellerDashboard;
