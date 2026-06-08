'use client';
// Force recompile
import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import styles from '@/app/(user)/book/[id]/booking.module.css';


function RoomDetailForm() {
  const router = useRouter();
  const { id } = useParams();
  const searchParams = useSearchParams();
  const dateParam = searchParams.get('date') || '';

  const [room, setRoom] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    checkIn: dateParam, checkOut: dateParam, checkInTime: '14:00', checkOutTime: '12:00',
    guests: 1, purpose: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  // Get today's date and current time
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const currentTimeStr = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');

  // Calculate minimum check-in time for today
  const getMinCheckInTime = (selectedDate) => {
    if (selectedDate === today) {
      // For today, set minimum time to current time (rounded up to next 30 minutes)
      const minutes = now.getMinutes();
      const hour = now.getHours();
      let minTime;
      if (minutes === 0) {
        minTime = `${String(hour).padStart(2, '0')}:00`;
      } else if (minutes <= 30) {
        minTime = `${String(hour).padStart(2, '0')}:30`;
      } else {
        minTime = `${String(hour + 1).padStart(2, '0')}:00`;
      }
      return minTime;
    }
    return '00:00';
  };

  const getMinCheckOutTime = (checkInDate, checkInTime) => {
    if (checkInDate === today && checkInTime) {
      const [h, m] = checkInTime.split(':').map(Number);
      // Check-out must be at least 1 hour after check-in (and not in the past)
      const checkOutDateTime = new Date();
      checkOutDateTime.setHours(h, m, 0, 0);
      checkOutDateTime.setHours(checkOutDateTime.getHours() + 1);
      return String(checkOutDateTime.getHours()).padStart(2, '0') + ':' + String(checkOutDateTime.getMinutes()).padStart(2, '0');
    }
    return checkInTime ? checkInTime : '12:00';
  };

  useEffect(() => {
    Promise.all([
      fetch(`/api/rooms?id=${id}`).then(r => r.json()),
      fetch(`/api/bookings?all=true&serviceType=room`).then(r => r.json()),
      fetch('/api/auth/me')
    ]).then(async ([roomData, bookingsData, authRes]) => {
      setRoom(roomData);
      setBookings(Array.isArray(bookingsData) ? bookingsData.filter(b => (b.serviceId?._id || b.serviceId) === id) : []);
      if (authRes.ok) {
        const u = await authRes.json();
        setUser(u);
      }
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
          roomPurpose: form.purpose
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message); return; }
      router.push('/my-bookings');
    } catch { setError('Something went wrong'); }
    finally { setSubmitting(false); }
  };

  if (loading) return <div className="spinner-wrap"><div className="spinner" /></div>;
  if (!room || room.message) return <div className="container p-12 text-center">Room not found</div>;

  return (
    <div className={styles.page}>
      <div className="container">
        <Link href="/room-booking" className={styles.backBtn}>← Back to Rooms</Link>
        <div className={styles.layout}>
          {/* Form */}
          <div>
            <div className={styles.formHeader}>
              <h1 className={styles.formTitle}>Book a Room</h1>
              <div className={styles.hallBadge}>
                <span>🛏️</span>
                <div>
                  <div className={styles.hallBadgeName}>Room {room?.roomNumber}</div>
                  <div className={styles.hallBadgeCap}>Occupancy: {room?.occupancy} guests • {room?.ac ? 'AC' : 'Non-AC'} • {room?.location}</div>
                </div>
              </div>
            </div>

            {msg && <div className="alert alert-success">{msg}</div>}
            {error && <div className="alert alert-error">{error}</div>}

            {user ? (
              <form onSubmit={handleSubmit}>
                <div className={styles.section}>
                  <h2 className={styles.sectionTitle}>📅 Check-in Date & Time</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <input type="date" className="form-input" required
                      min={today}
                      value={form.checkIn} onChange={e => setForm({...form, checkIn: e.target.value})} />
                    <input type="time" className="form-input" required
                      min={getMinCheckInTime(form.checkIn)}
                      value={form.checkInTime} onChange={e => setForm({...form, checkInTime: e.target.value})} />
                  </div>
                </div>

                <div className={styles.section}>
                  <h2 className={styles.sectionTitle}>📅 Check-out Date & Time</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <input type="date" className="form-input" required
                      min={form.checkIn}
                      value={form.checkOut} onChange={e => setForm({...form, checkOut: e.target.value})} />
                    <input type="time" className="form-input" required
                      min={form.checkOut === today ? currentTimeStr : '00:00'}
                      value={form.checkOutTime} onChange={e => setForm({...form, checkOutTime: e.target.value})} />
                  </div>
                </div>

                <div className={styles.section}>
                  <h2 className={styles.sectionTitle}>👥 Expected Guests</h2>
                  <input type="number" className="form-input" min="1" max={room?.occupancy} required
                    value={form.guests} onChange={e => setForm({...form, guests: parseInt(e.target.value)})} style={{ maxWidth: 200 }} />
                </div>

                <div className={styles.section}>
                  <h2 className={styles.sectionTitle}>📋 Purpose</h2>
                  <textarea className="form-input" rows={3} placeholder="What is the purpose of your booking?"
                    value={form.purpose} onChange={e => setForm({...form, purpose: e.target.value})} style={{ resize: 'vertical' }} />
                </div>

                <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={submitting}>
                  {submitting ? '⏳ Submitting...' : '🚀 Submit Booking Request'}
                </button>
              </form>
            ) : (
              <div className="bg-purple-50 border border-purple-100 rounded-xl p-6 text-center mt-8">
                <p className="text-purple-800 mb-4 font-medium">You need to be logged in to book this room.</p>
                <Link href="/login" className="btn-primary inline-flex">🔑 Login to Book</Link>
              </div>
            )}
          </div>

          {/* Summary sidebar */}
          <div className={styles.summary}>
            <div className={styles.summaryCard}>
              <h3 className={styles.summaryTitle}>📋 Booking Summary</h3>
              <div className={styles.summaryRows}>
                <div className={styles.summaryRow}><span>Room</span><strong>{room?.roomNumber ? `Room ${room.roomNumber}` : '—'}</strong></div>
                <div className={styles.summaryRow}><span>Hostel</span><strong>Boys Hostel</strong></div>
                <div className={styles.summaryRow}><span>AC Type</span><strong>{room?.ac ? 'AC' : 'Non-AC'}</strong></div>
                <div className={styles.summaryRow}><span>Check-in Date</span><strong>{form.checkIn || '—'}</strong></div>
                <div className={styles.summaryRow}><span>Check-in Time</span><strong>{form.checkInTime || '—'}</strong></div>
                <div className={styles.summaryRow}><span>Check-out Date</span><strong>{form.checkOut || '—'}</strong></div>
                <div className={styles.summaryRow}><span>Check-out Time</span><strong>{form.checkOutTime || '—'}</strong></div>
                <div className={styles.summaryRow}><span>Guests</span><strong>{form.guests}</strong></div>
              </div>
              <div className={styles.summaryNote}>
                ℹ️ Your request will be sent to admin for approval. You&apos;ll see the status in <strong>My Bookings</strong>.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>  );
}

export default function RoomDetailPage() {
  return (
    <Suspense fallback={<div className="spinner-wrap"><div className="spinner" /></div>}>
      <RoomDetailForm />
    </Suspense>
  );
}