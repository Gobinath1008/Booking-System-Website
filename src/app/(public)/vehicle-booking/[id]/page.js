'use client';
// Force recompile
import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import styles from '@/app/(user)/book/[id]/booking.module.css';

const TYPE_ICONS = { car: '🚗', van: '🚐', bus: '🚌', bike: '🏍️' };

function VehicleDetailForm() {
  const router = useRouter();
  const { id } = useParams();
  const searchParams = useSearchParams();
  const dateParam = searchParams.get('date') || '';

  const [vehicle, setVehicle] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    pickupDate: dateParam, returnDate: dateParam, pickupTime: '09:00', returnTime: '09:00',
    pickupLocation: '', returnLocation: '', withDriver: false, purpose: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      fetch(`/api/vehicles?id=${id}`).then(r => r.json()),
      fetch(`/api/bookings?all=true&serviceType=vehicle`).then(r => r.json()),
      fetch('/api/auth/me')
    ]).then(async ([vehicleData, bookingsData, authRes]) => {
      setVehicle(vehicleData);
      setBookings(Array.isArray(bookingsData) ? bookingsData.filter(b => b.serviceId === id) : []);
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
          serviceType: 'vehicle',
          serviceId: id,
          vehiclePickupDate: form.pickupDate,
          vehicleReturnDate: form.returnDate,
          vehiclePickupTime: form.pickupTime,
          vehicleReturnTime: form.returnTime,
          pickupLocation: form.pickupLocation,
          returnLocation: form.returnLocation,
          withDriver: form.withDriver,
          purpose: form.purpose,
          totalAmount: vehicle?.dailyRentalPrice || 500,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message); return; }
      router.push('/my-bookings');
    } catch { setError('Something went wrong'); }
    finally { setSubmitting(false); }
  };

  if (loading) return <div className="spinner-wrap"><div className="spinner" /></div>;
  if (!vehicle || vehicle.message) return <div className="container p-12 text-center">Vehicle not found</div>;

  return (
    <div className={styles.page}>
      <div className="container">
        <Link href="/vehicle-booking" className={styles.backBtn}>← Back to Vehicles</Link>
        <div className={styles.layout}>
          {/* Form */}
          <div>
            <div className={styles.formHeader}>
              <h1 className={styles.formTitle}>Book a Vehicle</h1>
              <div className={styles.hallBadge}>
                <span>{TYPE_ICONS[vehicle.vehicleType] || '🚗'}</span>
                <div>
                  <div className={styles.hallBadgeName}>{vehicle?.name}</div>
                  <div className={styles.hallBadgeCap}>Capacity: {vehicle?.capacity} seats • {vehicle?.location}</div>
                </div>
              </div>
            </div>

            {msg && <div className="alert alert-success">{msg}</div>}
            {error && <div className="alert alert-error">{error}</div>}

            {user ? (
              <form onSubmit={handleSubmit}>
                <div className={styles.section}>
                  <h2 className={styles.sectionTitle}>📅 Pickup Date & Time</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <input type="date" className="form-input" required
                      min={new Date().toISOString().split('T')[0]}
                      value={form.pickupDate} onChange={e => setForm({...form, pickupDate: e.target.value})} />
                    <input type="time" className="form-input" required
                      value={form.pickupTime} onChange={e => setForm({...form, pickupTime: e.target.value})} />
                  </div>
                </div>

                <div className={styles.section}>
                  <h2 className={styles.sectionTitle}>📅 Return Date & Time</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <input type="date" className="form-input" required
                      min={new Date().toISOString().split('T')[0]}
                      value={form.returnDate} onChange={e => setForm({...form, returnDate: e.target.value})} />
                    <input type="time" className="form-input" required
                      value={form.returnTime} onChange={e => setForm({...form, returnTime: e.target.value})} />
                  </div>
                </div>

                <div className={styles.section}>
                  <h2 className={styles.sectionTitle}>📍 Locations</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <input type="text" className="form-input" placeholder="Pickup Location"
                      value={form.pickupLocation} onChange={e => setForm({...form, pickupLocation: e.target.value})} required />
                    <input type="text" className="form-input" placeholder="Return Location"
                      value={form.returnLocation} onChange={e => setForm({...form, returnLocation: e.target.value})} required />
                  </div>
                </div>

                <div className={styles.section}>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="driver" checked={form.withDriver}
                      onChange={e => setForm({...form, withDriver: e.target.checked})} />
                    <label htmlFor="driver" className="font-medium text-gray-700">Include Driver</label>
                  </div>
                </div>

                <div className={styles.section}>
                  <h2 className={styles.sectionTitle}>📋 Purpose</h2>
                  <textarea className="form-input" rows={3} placeholder="Official work, field visit..."
                    value={form.purpose} onChange={e => setForm({...form, purpose: e.target.value})} style={{ resize: 'vertical' }} />
                </div>

                <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={submitting}>
                  {submitting ? '⏳ Submitting...' : '🚀 Submit Booking Request'}
                </button>
              </form>
            ) : (
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-6 text-center mt-8">
                <p className="text-indigo-800 mb-4 font-medium">You need to be logged in to book this vehicle.</p>
                <Link href="/login" className="btn-primary inline-flex">🔑 Login to Book</Link>
              </div>
            )}
          </div>

          {/* Summary sidebar */}
          <div className={styles.summary}>
            <div className={styles.summaryCard}>
              <h3 className={styles.summaryTitle}>📋 Booking Summary</h3>
              <div className={styles.summaryRows}>
                <div className={styles.summaryRow}><span>Vehicle</span><strong>{vehicle?.name || '—'}</strong></div>
                <div className={styles.summaryRow}><span>Type</span><strong>{vehicle?.vehicleType || '—'}</strong></div>
                <div className={styles.summaryRow}><span>Pickup Date</span><strong>{form.pickupDate || '—'}</strong></div>
                <div className={styles.summaryRow}><span>Pickup Time</span><strong>{form.pickupTime || '—'}</strong></div>
                <div className={styles.summaryRow}><span>Return Date</span><strong>{form.returnDate || '—'}</strong></div>
                <div className={styles.summaryRow}><span>Return Time</span><strong>{form.returnTime || '—'}</strong></div>
                <div className={styles.summaryRow}><span>With Driver</span><strong>{form.withDriver ? 'Yes' : 'No'}</strong></div>
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

export default function VehicleDetailPage() {
  return (
    <Suspense fallback={<div className="spinner-wrap"><div className="spinner" /></div>}>
      <VehicleDetailForm />
    </Suspense>
  );
}