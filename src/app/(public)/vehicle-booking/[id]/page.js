'use client';
import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';

const TYPE_ICONS = { car: '🚗', van: '🚐', bus: '🚌', bike: '🏍️' };

function VehicleDetailForm() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const dateParam = searchParams.get('date') || '';

  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    pickupDate: dateParam, returnDate: dateParam, pickupTime: '09:00', returnTime: '09:00',
    pickupLocation: '', returnLocation: '', withDriver: false, purpose: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/vehicles?id=${id}`).then(r => r.json()).then(d => {
      setVehicle(d);
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
      setMsg('✅ Vehicle booked successfully!');
    } catch { setError('Something went wrong'); }
    finally { setSubmitting(false); }
  };

  if (loading) return <div className="spinner-wrap"><div className="spinner" /></div>;
  if (!vehicle || vehicle.message) return <div className="container p-12 text-center">Vehicle not found</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <Link href="/vehicle-booking" className="text-indigo-600 hover:underline mb-4 inline-block">← Back to Vehicles</Link>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Banner */}
          <div className="bg-gradient-to-r from-green-500 to-green-700 p-8 text-white">
            <div className="flex items-center gap-4">
              <span className="text-6xl">{TYPE_ICONS[vehicle.vehicleType] || '🚗'}</span>
              <div>
                <h1 className="text-3xl font-bold">{vehicle.name}</h1>
                <p className="text-green-100">{vehicle.model} • {vehicle.year}</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Vehicle Info */}
              <div>
                <h2 className="text-xl font-bold mb-4">Vehicle Details</h2>
                <div className="space-y-3 text-gray-600">
                  <p>👥 <strong>Capacity:</strong> {vehicle.capacity} seats</p>
                  <p>⛽ <strong>Fuel:</strong> {vehicle.fuelType}</p>
                  <p>📍 <strong>Location:</strong> {vehicle.location}</p>
                  <p>🏷️ <strong>Type:</strong> {vehicle.vehicleType}</p>
                  {vehicle.features?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {vehicle.features.map(f => <span key={f} className="chip">{f}</span>)}
                    </div>
                  )}
                </div>
                <div className="mt-6 p-4 bg-green-50 rounded-xl">
                  <div className="text-3xl font-bold text-green-600">₹{vehicle.dailyRentalPrice}</div>
                  <div className="text-green-700">per day</div>
                </div>
              </div>

              {/* Booking Form */}
              <div>
                <h2 className="text-xl font-bold mb-4">Book This Vehicle</h2>
                {msg && <div className="alert alert-success mb-4">{msg}</div>}
                {error && <div className="alert alert-error mb-4">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Pickup Date *</label>
                      <input type="date" className="form-input" required disabled
                        style={{ backgroundColor: '#f3f4f6', cursor: 'not-allowed' }}
                        min={new Date().toISOString().split('T')[0]}
                        value={form.pickupDate} onChange={e => setForm({...form, pickupDate: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Return Date *</label>
                      <input type="date" className="form-input" required disabled
                        style={{ backgroundColor: '#f3f4f6', cursor: 'not-allowed' }}
                        min={form.pickupDate || new Date().toISOString().split('T')[0]}
                        value={form.returnDate} onChange={e => setForm({...form, returnDate: e.target.value})} />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Pickup Location *</label>
                    <input type="text" className="form-input" placeholder="College campus"
                      value={form.pickupLocation} onChange={e => setForm({...form, pickupLocation: e.target.value})} required />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Return Location *</label>
                    <input type="text" className="form-input" placeholder="Same as pickup"
                      value={form.returnLocation} onChange={e => setForm({...form, returnLocation: e.target.value})} required />
                  </div>

                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="driver" checked={form.withDriver}
                      onChange={e => setForm({...form, withDriver: e.target.checked})} />
                    <label htmlFor="driver">Include Driver (+₹{vehicle.driverChargePerDay}/day)</label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Purpose</label>
                    <textarea className="form-input" rows={2} placeholder="Official work, field visit..."
                      value={form.purpose} onChange={e => setForm({...form, purpose: e.target.value})} />
                  </div>

                  <button type="submit" disabled={submitting} className="btn-primary w-full">
                    {submitting ? 'Booking...' : '🚗 Book Vehicle'}
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

export default function VehicleDetailPage() {
  return (
    <Suspense fallback={<div className="spinner-wrap"><div className="spinner" /></div>}>
      <VehicleDetailForm />
    </Suspense>
  );
}