'use client';
import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';

const TYPE_ICONS = { economy: '🛏️', standard: '🛏️', deluxe: '✨', family: '👨‍👩‍👧‍👦', suite: '👑' };

function RoomDetailForm() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const dateParam = searchParams.get('date') || '';

  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    checkIn: dateParam, checkOut: dateParam, checkInTime: '14:00', checkOutTime: '12:00',
    guests: 1, specialRequests: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/rooms?id=${id}`).then(r => r.json()).then(d => {
      setRoom(d);
      setLoading(false);
    });
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true); setError('');
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceType: 'room',
          serviceId: id,
          roomCheckInDate: form.checkIn,
          roomCheckOutDate: form.checkOut,
          roomCheckInTime: form.checkInTime,
          roomCheckOutTime: form.checkOutTime,
          numberOfGuests: form.guests,
          specialRequests: form.specialRequests,
          totalAmount: room?.pricePerNight || 500,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message); return; }
      setMsg('✅ Room booked successfully!');
    } catch { setError('Something went wrong'); }
    finally { setSubmitting(false); }
  };

  if (loading) return <div className="spinner-wrap"><div className="spinner" /></div>;
  if (!room || room.message) return <div className="container p-12 text-center">Room not found</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <Link href="/room-booking" className="text-indigo-600 hover:underline mb-4 inline-block">← Back to Rooms</Link>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-purple-500 to-purple-700 p-8 text-white">
            <div className="flex items-center gap-4">
              <span className="text-6xl">{TYPE_ICONS[room.roomType] || '🛏️'}</span>
              <div>
                <h1 className="text-3xl font-bold">{room.name}</h1>
                <p className="text-purple-100">Room {room.roomNumber} • Floor {room.floor}</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h2 className="text-xl font-bold mb-4">Room Details</h2>
                <div className="space-y-3 text-gray-600">
                  <p>🛏️ <strong>Type:</strong> {room.roomType}</p>
                  <p>👥 <strong>Occupancy:</strong> {room.occupancy} guests</p>
                  <p>📍 <strong>Location:</strong> {room.location}</p>
                  {room.amenities?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {room.amenities.map(a => <span key={a} className="chip">{a}</span>)}
                    </div>
                  )}
                </div>
                <div className="mt-6 p-4 bg-purple-50 rounded-xl">
                  <div className="text-3xl font-bold text-purple-600">₹{room.pricePerNight}</div>
                  <div className="text-purple-700">per night</div>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-bold mb-4">Book This Room</h2>
                {msg && <div className="alert alert-success mb-4">{msg}</div>}
                {error && <div className="alert alert-error mb-4">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Check-in *</label>
                      <input type="date" className="form-input" required disabled
                        style={{ backgroundColor: '#f3f4f6', cursor: 'not-allowed' }}
                        min={new Date().toISOString().split('T')[0]}
                        value={form.checkIn} onChange={e => setForm({...form, checkIn: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Check-out *</label>
                      <input type="date" className="form-input" required disabled
                        style={{ backgroundColor: '#f3f4f6', cursor: 'not-allowed' }}
                        min={form.checkIn || new Date().toISOString().split('T')[0]}
                        value={form.checkOut} onChange={e => setForm({...form, checkOut: e.target.value})} />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Number of Guests *</label>
                    <input type="number" className="form-input" min="1" max={room.occupancy}
                      value={form.guests} onChange={e => setForm({...form, guests: parseInt(e.target.value)})} required />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Special Requests</label>
                    <textarea className="form-input" rows={2} placeholder="Any special requirements..."
                      value={form.specialRequests} onChange={e => setForm({...form, specialRequests: e.target.value})} />
                  </div>

                  <button type="submit" disabled={submitting} className="btn-primary w-full">
                    {submitting ? 'Booking...' : '🏨 Book Room'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function RoomDetailPage() {
  return (
    <Suspense fallback={<div className="spinner-wrap"><div className="spinner" /></div>}>
      <RoomDetailForm />
    </Suspense>
  );
}