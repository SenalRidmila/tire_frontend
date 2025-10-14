import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './TireOrder.css';

const API_URL = process.env.NODE_ENV === 'development' 
  ? `${process.env.REACT_APP_API_URL}/api/tire-orders`
  : '/api/tire-orders';

const Tooltip = ({ text, children }) => (
  <span className="tooltip-wrapper">
    {children}
    <span className="tooltip-text">{text}</span>
  </span>
);

function TireOrder() {
  const [formData, setFormData] = useState({
    vehicleNo: '',
    vendorName: '',
    userEmail: '',
    quantity: '',
    tireBrand: '',
    location: '',
  });
  const [orders, setOrders] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formValid, setFormValid] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  // Re-validate form whenever formData changes
  useEffect(() => {
    setFormValid(validateForm(false)); // false = no alert, just check validity silently
  }, [formData]);

  const fetchOrders = async () => {
    try {
      const res = await axios.get(API_URL);
      setOrders(res.data);
    } catch (err) {
      console.error('Error fetching orders:', err);
      alert('Failed to fetch orders.');
    }
  };

  // validation with optional alert
  const validateForm = (showAlert = true) => {
    if (!formData.vehicleNo.trim()) {
      if(showAlert) alert('Vehicle No is required.');
      return false;
    }
    if (!formData.vendorName.trim()) {
      if(showAlert) alert('Vendor Name is required.');
      return false;
    }
    if (!formData.userEmail.trim()) {
      if(showAlert) alert('User Email is required.');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.userEmail)) {
      if(showAlert) alert('Please enter a valid email address.');
      return false;
    }
    if (!formData.tireBrand.trim()) {
      if(showAlert) alert('Tire Brand is required.');
      return false;
    }
    if (!formData.location.trim()) {
      if(showAlert) alert('Location is required.');
      return false;
    }
    if (!(formData.quantity > 0)) {
      if(showAlert) alert('Quantity must be at least 1.');
      return false;
    }
    return true;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'quantity' ? Number(value) : value,
    }));
  };

  const resetForm = () => {
    setFormData({
      vehicleNo: '',
      vendorName: '',
      userEmail: '',
      quantity: '',
      tireBrand: '',
      location: '',
    });
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);

    const payload = {
      ...formData,
      status: 'pending',
    };

    try {
      let response;
      if (editingId) {
        response = await axios.put(`${API_URL}/${editingId}`, payload);
        if (response.status === 200) alert('Order updated successfully!');
      } else {
        response = await axios.post(API_URL, payload);
        if ([200, 201].includes(response.status)) alert('Order created successfully!');
      }
      resetForm();
      fetchOrders();
    } catch (err) {
      console.error('Error submitting order:', err.response?.data || err.message || err);
      alert('Failed to submit order. Please try again.');
    }
    setLoading(false);
  };

  const handleEdit = (order) => {
    setFormData({
      vehicleNo: order.vehicleNo || '',
      vendorName: order.vendorName || '',
      userEmail: order.userEmail || '',
      quantity: order.quantity || 1,
      tireBrand: order.tireBrand || '',
      location: order.location || '',
    });
    setEditingId(order.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this order?')) {
      try {
        await axios.delete(`${API_URL}/${id}`);
        alert('Order deleted successfully.');
        fetchOrders();
      } catch (err) {
        console.error('Error deleting order:', err);
        alert('Failed to delete order.');
      }
    }
  };

  const pendingOrders = orders.filter(o => o.status?.toLowerCase() === 'pending');
  const processedOrders = orders.filter(o =>
    ['confirmed', 'rejected'].includes(o.status?.toLowerCase())
  );

  const renderTable = (title, data) => (
    <>
      <h3 className="section-title">{title}</h3>
      {data.length === 0 ? (
        <p className="no-orders">No {title.toLowerCase()}.</p>
      ) : (
        <div className="table-wrapper">
          <table className="orders-table" role="grid" aria-label={title}>
            <thead>
              <tr>
                <th>Vehicle No</th>
                <th>Vendor</th>
                <th>User Email</th>
                <th>No. of Tires</th>
                <th>Tire Brand</th>
                <th>Location</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map(order => {
                const status = order.status?.toLowerCase() || 'pending';
                return (
                  <tr key={order.id} className={status === 'rejected' ? 'row-rejected' : ''}>
                    <td>{order.vehicleNo}</td>
                    <td>{order.vendorName}</td>
                    <td>{order.userEmail}</td>
                    <td>{order.quantity}</td>
                    <td>{order.tireBrand}</td>
                    <td>{order.location}</td>
                    <td>
                      <span className={`status ${status}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="actions-cell">
                      <Tooltip text="Edit order">
                        <button onClick={() => handleEdit(order)} disabled={loading} aria-label="Edit order">
                          ✏️
                        </button>
                      </Tooltip>
                      <Tooltip text="Delete order">
                        <button className="delete-btn" onClick={() => handleDelete(order.id)} disabled={loading} aria-label="Delete order">
                          🗑️
                        </button>
                      </Tooltip>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );

  return (
    <div className="tire-order-container">
      <h2 className="dashboard-title">🛒 Tire Order Management</h2>

      <form className="tire-order-form" onSubmit={handleSubmit}>
        <input
          type="text"
          name="vehicleNo"
          value={formData.vehicleNo}
          onChange={handleChange}
          placeholder="Vehicle No"
          disabled={loading}
          required
        />
        <input
          type="text"
          name="vendorName"
          value={formData.vendorName}
          onChange={handleChange}
          placeholder="Vendor Name (Ordered By)"
          disabled={loading}
          required
        />
        <input
          type="email"
          name="userEmail"
          value={formData.userEmail}
          onChange={handleChange}
          placeholder="User Email (Customer)"
          disabled={loading}
          required
        />
        <input
          type="number"
          name="quantity"
          value={formData.quantity}
          onChange={handleChange}
          placeholder="Number of Tires"
          min="1"
          disabled={loading}
          required
        />
        <input
          type="text"
          name="tireBrand"
          value={formData.tireBrand}
          onChange={handleChange}
          placeholder="Tire Brand"
          disabled={loading}
          required
        />
        <input
          type="text"
          name="location"
          value={formData.location}
          onChange={handleChange}
          placeholder="Location"
          disabled={loading}
          required
        />

        <button
  type="submit"
  className="btn submit-btn full-width"
>

  {loading ? (editingId ? 'Updating...' : 'Submitting...') : (editingId ? 'Update Order' : 'Create Order')}
</button>

        {editingId && !loading && (
          <button
            type="button"
            onClick={resetForm}
            className="btn cancel-btn"
            aria-label="Cancel edit"
          >
            Cancel Edit
          </button>
        )}
      </form>

      {renderTable('Pending Orders', pendingOrders)}
      {renderTable('Confirmed / Rejected Orders', processedOrders)}
    </div>
  );
}

export default TireOrder;
