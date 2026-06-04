'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import styles from '../admin.module.css';

const EMPTY_FORM = {
  name: '',
  roomType: 'standard',
  roomNumber: '',
  floor: 1,
  occupancy: 2,
  pricePerDay: 0,
  pricePerNight: 0,
  location: '',
  city: '',
  state: '',
  address: '',
  zipCode: '',
  status: 'available',
  isActive: true
};

export default function RoomsPage() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const res = await fetch('/api/rooms?all=true');
      const data = await res.json();
      setRooms(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleForm = () => {
    if (showForm) {
      setShowForm(false);
      setEditing(null);
      setFormData(EMPTY_FORM);
    } else {
      setShowForm(true);
    }
  };

  const handleStartEdit = (room) => {
    setEditing(room);
    setFormData({
      name: room.name || '',
      roomType: room.roomType || 'standard',
      roomNumber: room.roomNumber || '',
      floor: room.floor || 1,
      occupancy: room.occupancy || 2,
      pricePerDay: room.pricePerDay || 0,
      pricePerNight: room.pricePerNight || 0,
      location: room.location || '',
      city: room.city || '',
      state: room.state || '',
      address: room.address || '',
      zipCode: room.zipCode || '',
      status: room.status || 'available',
      isActive: room.isActive !== false
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeactivate = async (room) => {
    if (!confirm(`Deactivate "${room.name}" (Room ${room.roomNumber})? It won't appear in user listings.`)) return;
    try {
      const res = await fetch(`/api/rooms/${room._id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchRooms();
      } else {
        const error = await res.json();
        alert(error.message || 'Failed to deactivate room');
      }
    } catch (error) {
      alert('Error deactivating room');
    }
  };

  const handleActivate = async (room) => {
    if (!confirm(`Activate "${room.name}" (Room ${room.roomNumber})? It will appear in user listings.`)) return;
    try {
      const res = await fetch(`/api/rooms/${room._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: true })
      });
      if (res.ok) {
        fetchRooms();
      } else {
        const error = await res.json();
        alert(error.message || 'Failed to activate room');
      }
    } catch (error) {
      alert('Error activating room');
    }
  };

  const handleDelete = async (room) => {
    if (!confirm(`Are you sure you want to permanently delete room "${room.name}" (Room ${room.roomNumber})? This action cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/rooms/${room._id}?permanent=true`, { method: 'DELETE' });
      if (res.ok) {
        fetchRooms();
      } else {
        const error = await res.json();
        alert(error.message || 'Failed to delete room');
      }
    } catch (error) {
      alert('Error deleting room');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editing ? `/api/rooms/${editing._id}` : '/api/rooms';
      const method = editing ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        fetchRooms();
        setFormData(EMPTY_FORM);
        setEditing(null);
        setShowForm(false);
      } else {
        const error = await res.json();
        alert(error.message || `Failed to ${editing ? 'update' : 'add'} room`);
      }
    } catch (error) {
      alert(`Error ${editing ? 'updating' : 'adding'} room`);
    }
  };

  return (
    <div className={styles.page}>
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h1 className={styles.title}>🏨 Room Management</h1>
          <button onClick={handleToggleForm} className="btn-primary">
            {showForm ? '✕ Close' : '➕ Add Room'}
          </button>
        </div>

        {showForm && (
          <motion.div
            className="form-container"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ marginBottom: '32px' }}
          >
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>
              {editing ? `✏️ Edit Room: ${editing.name}` : '➕ Add New Room'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Room Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Hostal Room A"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Room Type</label>
                  <select
                    className="form-input"
                    value={formData.roomType}
                    onChange={(e) => setFormData({...formData, roomType: e.target.value})}
                  >
                    <option value="economy">Economy</option>
                    <option value="standard">Standard</option>
                    <option value="deluxe">Deluxe</option>
                    <option value="family">Family</option>
                    <option value="suite">Suite</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Room Number</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. 203"
                    value={formData.roomNumber}
                    onChange={(e) => setFormData({...formData, roomNumber: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Floor</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="Floor"
                    value={formData.floor}
                    onChange={(e) => setFormData({...formData, floor: parseInt(e.target.value) || 0})}
                    min="0"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Occupancy (guests)</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="Occupancy"
                    value={formData.occupancy}
                    onChange={(e) => setFormData({...formData, occupancy: parseInt(e.target.value) || 1})}
                    min="1"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Price Per Day</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="Price Per Day"
                    value={formData.pricePerDay}
                    onChange={(e) => setFormData({...formData, pricePerDay: parseFloat(e.target.value) || 0})}
                    min="0"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Price Per Night</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="Price Per Night"
                    value={formData.pricePerNight}
                    onChange={(e) => setFormData({...formData, pricePerNight: parseFloat(e.target.value) || 0})}
                    min="0"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select
                    className="form-input"
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                  >
                    <option value="available">Available</option>
                    <option value="occupied">Occupied</option>
                    <option value="cleaning">Cleaning</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="blocked">Blocked</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Location</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Block C, Floor 1"
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
                    required
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
                    required
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
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Zip Code</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Zip Code"
                    value={formData.zipCode}
                    onChange={(e) => setFormData({...formData, zipCode: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', gridColumn: 'span 2' }}>
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                    style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                  />
                  <label htmlFor="isActive" className="form-label" style={{ marginBottom: 0, cursor: 'pointer', fontSize: '15px' }}>
                    Visible to Users (Active)
                  </label>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <button type="button" className="btn-secondary" onClick={handleToggleForm}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editing ? '✅ Update Room' : '➕ Create Room'}
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {loading ? (
          <div className="spinner-wrap"><div className="spinner" /></div>
        ) : rooms.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🏨</div>
            <div className="empty-title">No rooms found</div>
            <div className="empty-sub">Add your first room to get started</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {rooms.map((room) => (
              <motion.div
                key={room._id}
                className="card"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px', display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                      {room.name}
                      {room.isActive === false && (
                        <span className="badge badge-rejected" style={{ marginLeft: '8px', fontSize: '10px' }}>
                          Hidden
                        </span>
                      )}
                    </h3>
                    <p style={{ color: '#666', marginBottom: '12px' }}>
                      Room {room.roomNumber} • Floor {room.floor}
                    </p>
                    <p style={{ marginBottom: '4px' }}>Room Type: {room.roomType.toUpperCase()}</p>
                    <p style={{ marginBottom: '4px' }}>👥 Occupancy: {room.occupancy} guests</p>
                    <p style={{ marginBottom: '4px' }}>💰 Day Price: ₹{room.pricePerDay} | Night Price: ₹{room.pricePerNight}</p>
                    <p style={{ marginBottom: '4px' }}>📍 {room.location}</p>

                    <p style={{ color: '#999', fontSize: '12px', marginTop: '8px' }}>
                      {room.city}, {room.state}
                    </p>
                    <div style={{ marginTop: '12px' }}>
                      <span className={`badge badge-${room.status}`}>{room.status}</span>
                    </div>
                    {room.amenities && room.amenities.length > 0 && (
                      <div style={{ marginTop: '12px' }}>
                        {room.amenities.map(amenity => (
                          <span key={amenity} style={{ display: 'inline-block', fontSize: '12px', backgroundColor: '#f0f0f0', padding: '4px 8px', borderRadius: '4px', marginRight: '4px', marginBottom: '4px' }}>
                            {amenity}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginTop: '20px', justifyContent: 'flex-end' }}>
                    <button className="btn-secondary btn-sm" onClick={() => handleStartEdit(room)}>
                      ✏️ Edit
                    </button>
                    {room.isActive !== false ? (
                      <button className="btn-danger btn-sm" onClick={() => handleDeactivate(room)}>
                        🗑️ Deactivate
                      </button>
                    ) : (
                      <button className="btn-primary btn-sm" onClick={() => handleActivate(room)}>
                        ✅ Activate
                      </button>
                    )}
                    <button className="btn-danger btn-sm" onClick={() => handleDelete(room)} style={{ opacity: 0.7 }}>
                      🗑️ Delete
                    </button>
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

