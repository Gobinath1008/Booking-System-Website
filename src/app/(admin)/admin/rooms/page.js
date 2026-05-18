'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import styles from '../admin.module.css';

export default function RoomsPage() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
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
    zipCode: ''
  });

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        fetchRooms();
        setFormData({
          name: '', roomType: 'standard', roomNumber: '', floor: 1, occupancy: 2,
          pricePerDay: 0, pricePerNight: 0, location: '', city: '', state: '',
          address: '', zipCode: ''
        });
        setShowForm(false);
      } else {
        const error = await res.json();
        alert(error.message || 'Failed to add room');
      }
    } catch (error) {
      alert('Error adding room');
    }
  };

  return (
    <div className={styles.page}>
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h1 className={styles.title}>🏨 Room Management</h1>
          <button onClick={() => setShowForm(!showForm)} className="btn-primary">
            {showForm ? '✕ Close' : '➕ Add Room'}
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
                <input
                  type="text"
                  placeholder="Room Name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
                <select
                  value={formData.roomType}
                  onChange={(e) => setFormData({...formData, roomType: e.target.value})}
                >
                  <option value="economy">Economy</option>
                  <option value="standard">Standard</option>
                  <option value="deluxe">Deluxe</option>
                  <option value="family">Family</option>
                  <option value="suite">Suite</option>
                </select>
                <input
                  type="text"
                  placeholder="Room Number"
                  value={formData.roomNumber}
                  onChange={(e) => setFormData({...formData, roomNumber: e.target.value})}
                  required
                />
                <input
                  type="number"
                  placeholder="Floor"
                  value={formData.floor}
                  onChange={(e) => setFormData({...formData, floor: parseInt(e.target.value)})}
                  min="0"
                />
                <input
                  type="number"
                  placeholder="Occupancy (guests)"
                  value={formData.occupancy}
                  onChange={(e) => setFormData({...formData, occupancy: parseInt(e.target.value)})}
                  min="1"
                  required
                />

                <input
                  type="text"
                  placeholder="Location"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  required
                />
                <input
                  type="text"
                  placeholder="City"
                  value={formData.city}
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                />
                <input
                  type="text"
                  placeholder="State"
                  value={formData.state}
                  onChange={(e) => setFormData({...formData, state: e.target.value})}
                />
                <input
                  type="text"
                  placeholder="Address"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                />
                <input
                  type="text"
                  placeholder="Zip Code"
                  value={formData.zipCode}
                  onChange={(e) => setFormData({...formData, zipCode: e.target.value})}
                />
              </div>
              <button type="submit" className="btn-primary" style={{ marginTop: '16px' }}>
                Add Room
              </button>
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
                <div style={{ padding: '20px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>
                    {room.name}
                  </h3>
                  <p style={{ color: '#666', marginBottom: '12px' }}>
                    Room {room.roomNumber} • Floor {room.floor}
                  </p>
                  <p style={{ marginBottom: '4px' }}>Room Type: {room.roomType.toUpperCase()}</p>
                  <p style={{ marginBottom: '4px' }}>👥 Occupancy: {room.occupancy} guests</p>

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
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
