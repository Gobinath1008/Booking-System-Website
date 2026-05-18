'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import styles from '../admin.module.css';

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    vehicleType: 'car',
    registrationNumber: '',
    model: '',
    year: new Date().getFullYear(),
    capacity: 5,
    fuelType: 'petrol',
    dailyRentalPrice: 0,
    driverChargePerDay: 0,
    location: '',
    city: '',
    state: '',
    address: ''
  });

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      const res = await fetch('/api/vehicles?all=true');
      const data = await res.json();
      setVehicles(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        fetchVehicles();
        setFormData({
          name: '', vehicleType: 'car', registrationNumber: '', model: '', year: new Date().getFullYear(),
          capacity: 5, fuelType: 'petrol', dailyRentalPrice: 0, driverChargePerDay: 0,
          location: '', city: '', state: '', address: ''
        });
        setShowForm(false);
      } else {
        const error = await res.json();
        alert(error.message || 'Failed to add vehicle');
      }
    } catch (error) {
      alert('Error adding vehicle');
    }
  };

  return (
    <div className={styles.page}>
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h1 className={styles.title}>🚗 Vehicle Management</h1>
          <button onClick={() => setShowForm(!showForm)} className="btn-primary">
            {showForm ? '✕ Close' : '➕ Add Vehicle'}
          </button>
        </div>

        {showForm && (
          <motion.div
            className="form-container"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Vehicle Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Vehicle Name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Vehicle Type</label>
                  <select
                    className="form-input"
                    value={formData.vehicleType}
                    onChange={(e) => setFormData({...formData, vehicleType: e.target.value})}
                  >
                    <option value="car">Car</option>
                    <option value="van">Van</option>
                    <option value="bus">Bus</option>
                    <option value="bike">Bike</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Registration Number</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Registration Number"
                    value={formData.registrationNumber}
                    onChange={(e) => setFormData({...formData, registrationNumber: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Model</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Model"
                    value={formData.model}
                    onChange={(e) => setFormData({...formData, model: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Year</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="Year"
                    value={formData.year}
                    onChange={(e) => setFormData({...formData, year: parseInt(e.target.value)})}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Capacity (seats)</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="Capacity (seats)"
                    value={formData.capacity}
                    onChange={(e) => setFormData({...formData, capacity: parseInt(e.target.value)})}
                    min="1"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Fuel Type</label>
                  <select
                    className="form-input"
                    value={formData.fuelType}
                    onChange={(e) => setFormData({...formData, fuelType: e.target.value})}
                  >
                    <option value="petrol">Petrol</option>
                    <option value="diesel">Diesel</option>
                    <option value="electric">Electric</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Location</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Location"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">City</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="City"
                    value={formData.city}
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">State</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="State"
                    value={formData.state}
                    onChange={(e) => setFormData({...formData, state: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Address</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Address"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                  />
                </div>
              </div>
              <button type="submit" className="btn-primary" style={{ marginTop: '16px' }}>
                Add Vehicle
              </button>
            </form>
          </motion.div>
        )}

        {loading ? (
          <div className="spinner-wrap"><div className="spinner" /></div>
        ) : vehicles.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🚗</div>
            <div className="empty-title">No vehicles found</div>
            <div className="empty-sub">Add your first vehicle to get started</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {vehicles.map((vehicle) => (
              <motion.div
                key={vehicle._id}
                className="card"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div style={{ padding: '20px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>
                    {vehicle.name}
                  </h3>
                  <p style={{ color: '#666', marginBottom: '12px' }}>
                    {vehicle.vehicleType.toUpperCase()} • {vehicle.model} ({vehicle.year})
                  </p>
                  <p style={{ marginBottom: '4px' }}>📝 Reg: {vehicle.registrationNumber}</p>
                  <p style={{ marginBottom: '4px' }}>👥 Capacity: {vehicle.capacity} seats</p>
                  <p style={{ marginBottom: '4px' }}>⛽ {vehicle.fuelType}</p>

                  <p style={{ color: '#999', fontSize: '12px', marginTop: '8px' }}>
                    {vehicle.city}, {vehicle.state}
                  </p>
                  <div style={{ marginTop: '12px' }}>
                    <span className={`badge badge-${vehicle.status}`}>{vehicle.status}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
