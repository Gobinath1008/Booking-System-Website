'use client';
import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import styles from './mybookings.module.css';
import { toast } from 'react-hot-toast';

const TABS = ['all', 'pending', 'approved', 'rejected', 'cancelled'];
const STATUS_COLORS = { pending: 'badge-pending', approved: 'badge-approved', rejected: 'badge-rejected', cancelled: 'badge-cancelled', completed: 'badge-completed', live: 'badge-live', finished: 'badge-finished' };
const STATUS_ICONS = { pending: '⏳', approved: '✅', rejected: '❌', cancelled: '🚫', completed: '✔️', live: '🟢', finished: '🏁' };
const SERVICE_ICONS = { hall: '🏛️', vehicle: '🚗', room: '🏨' };
const SERVICE_NAMES = { hall: 'Hall Booking', vehicle: 'Vehicle Rental', room: 'Room Booking' };

const getRealTimeStatus = (booking) => {
  if (booking.status !== 'approved') return booking.status;

  const now = new Date();
  
  if (booking.serviceType === 'hall') {
    const start = new Date(`${booking.hallDate}T${booking.hallStartTime}:00`);
    const end = new Date(`${booking.hallDate}T${booking.hallEndTime}:00`);
    if (now >= start && now <= end) return 'live';
    if (now > end) return 'finished';
  } else if (booking.serviceType === 'vehicle') {
    const start = new Date(`${booking.vehiclePickupDate}T${booking.vehiclePickupTime || '09:00'}:00`);
    const end = new Date(`${booking.vehicleReturnDate}T${booking.vehicleReturnTime || '09:00'}:00`);
    if (now >= start && now <= end) return 'live';
    if (now > end) return 'finished';
  } else if (booking.serviceType === 'room') {
    const start = new Date(`${booking.roomCheckInDate}T${booking.roomCheckInTime || '14:00'}:00`);
    const end = new Date(`${booking.roomCheckOutDate}T${booking.roomCheckOutTime || '12:00'}:00`);
    if (now >= start && now <= end) return 'live';
    if (now > end) return 'finished';
  }
  
  return 'approved';
};

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [cancelling, setCancelling] = useState(null);
  const [confirmModal, setConfirmModal] = useState(false);
  const [selectedForCancel, setSelectedForCancel] = useState(null);
  const [cancelReason, setCancelReason] = useState('');

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/bookings');
      if (!res.ok) {
        throw new Error('Failed to fetch bookings');
      }
      const data = await res.json();
      setBookings(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Could not load your bookings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { setTimeout(() => fetchBookings(), 0); }, [fetchBookings]);

  const handleCancel = async (id) => {
    setSelectedForCancel(id);
    setCancelReason('');
    setConfirmModal(true);
  };

  const confirmCancel = async () => {
    const id = selectedForCancel;
    setCancelling(id);
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: cancelReason })
      });
      if (res.ok) {
        setConfirmModal(false);
        setSelectedForCancel(null);
        toast.success('Booking cancelled successfully');
        fetchBookings();
      } else {
        const d = await res.json();
        toast.error(d.message || 'Failed to cancel booking');
        setConfirmModal(false);
        setSelectedForCancel(null);
      }
    } catch (error) {
      toast.error('An error occurred');
      setConfirmModal(false);
      setSelectedForCancel(null);
    } finally { 
      setCancelling(null); 
    }
  };

const formatTime12h = (timeStr) => {
  if (!timeStr) return '';
  const [hourStr, minStr] = timeStr.split(':');
  const hour = parseInt(hourStr);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${String(hour12).padStart(2, '0')}:${minStr} ${ampm}`;
};

  const getBookingDetails = (booking) => {
    switch (booking.serviceType) {
      case 'hall':
        return {
          date: booking.hallDate,
          time: `${formatTime12h(booking.hallStartTime)} - ${formatTime12h(booking.hallEndTime)}`,
          location: booking.purpose,
          description: `${booking.attendees} attendees`
        };
      case 'vehicle':
        return {
          date: `${booking.vehiclePickupDate} to ${booking.vehicleReturnDate}`,
          time: `${formatTime12h(booking.vehiclePickupTime || '09:00')} - ${formatTime12h(booking.vehicleReturnTime || '09:00')}`,
          location: `${booking.pickupLocation || 'N/A'} → ${booking.returnLocation || 'N/A'}`,
          description: `${booking.withDriver ? 'With Driver' : 'Self-drive'} • Fuel: ${booking.fuelOption}`
        };
      case 'room':
        return {
          date: `${booking.roomCheckInDate} to ${booking.roomCheckOutDate}`,
          time: `${formatTime12h(booking.roomCheckInTime || '14:00')} - ${formatTime12h(booking.roomCheckOutTime || '12:00')}`,
          location: `${booking.numberOfGuests} guests`,
          description: `${booking.numberOfRooms} room${booking.numberOfRooms > 1 ? 's' : ''}`
        };
      default:
        return { date: 'N/A', time: 'N/A', location: 'N/A', description: 'N/A' };
    }
  };

  const filtered = activeTab === 'all' ? bookings : bookings.filter(b => b.status === activeTab);
  const counts = {
    all: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    approved: bookings.filter(b => b.status === 'approved').length,
    rejected: bookings.filter(b => b.status === 'rejected').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length
  };

  const handlePrint = () => {
    const printWindow = window.open('', '', 'height=600,width=800');
    const content = `
      <html>
      <head>
        <title>Knowledge Institute of Technology, Salem</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          th { background-color: #1e3a8a; color: white; font-weight: bold; }
          tr:nth-child(even) { background-color: #f9f9f9; }
          .status { font-weight: bold; padding: 4px 8px; border-radius: 4px; }
          .pending { background: rgba(243,156,18,0.2); color: #F39C12; }
          .approved { background: rgba(46,204,113,0.2); color: #2ECC71; }
          .rejected { background: rgba(231,76,60,0.2); color: #E74C3C; }
          .cancelled { background: rgba(149,152,154,0.2); color: #6C757D; }
        </style>
      </head>
      <body>
        <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #1e3a8a; padding-bottom: 15px; margin-bottom: 20px;">
          <div style="display: flex; align-items: center; gap: 15px;">
            <img src="/logo.png" alt="KIOT Logo" style="height: 60px; width: auto;" />
            <div>
              <div style="font-size: 20px; font-weight: bold; color: #1e3a8a; font-family: Arial, sans-serif;">KNOWLEDGE INSTITUTE OF TECHNOLOGY</div>
              <div style="font-size: 14px; color: #475569; font-family: Arial, sans-serif; letter-spacing: 1px;">SALEM</div>
            </div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 18px; font-weight: bold; color: #334155; font-family: Arial, sans-serif;">Booking Report</div>
            <div style="font-size: 11px; color: #64748b; font-family: Arial, sans-serif; margin-top: 4px;">Generated: ${new Date().toLocaleString()}</div>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Type</th>
              <th>Date</th>
              <th>Details</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${filtered.map(b => `
              <tr>
                <td>${SERVICE_NAMES[b.serviceType]}</td>
                <td>${getBookingDetails(b).date}</td>
                <td><strong>${getBookingDetails(b).location}</strong><br/><small>${getBookingDetails(b).description}</small><br/><small>By: ${b.guestName || b.user?.name || 'Unknown'}</small></td>
                <td>
                  <span class="status ${b.status}">${b.status.toUpperCase()}</span>
                  ${b.actionBy?.name && b.status !== 'pending' ? `<br/><small style="color: #666; font-size: 11px;">${b.status === 'approved' ? 'Approved by:' : b.status === 'rejected' ? 'Rejected by:' : 'Cancelled by:'} ${b.actionBy.name}</small>` : ''}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <p style="margin-top: 20px; font-weight: bold;">Total Bookings: ${filtered.length}</p>
      </body>
      </html>
    `;
    printWindow.document.write(content);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); }, 250);
  };

  return (
    <div className={styles.page}>
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div className="page-header">
            <h1 className="page-title">My Bookings</h1>
            <p className="page-subtitle">{bookings.length} total bookings across all services</p>
          </div>
          <button onClick={handlePrint} className="btn-secondary" style={{ whiteSpace: 'nowrap' }}>
            🖨️ Print Report
          </button>
        </div>

        <div className="tabs">
          {TABS.map(tab => (
            <button key={tab} className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}>
              {tab === 'all' ? 'All' : tab.charAt(0).toUpperCase() + tab.slice(1)}
              {counts[tab] > 0 && <span className={styles.tabCount}>{counts[tab]}</span>}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="spinner-wrap"><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📄</div>
            <div className="empty-title">No {activeTab === 'all' ? '' : activeTab} bookings</div>
            <div className="empty-sub">
              {activeTab === 'all' ? "You haven't made any bookings yet." : `No ${activeTab} bookings found.`}
            </div>
          </div>
        ) : (
          <div className={styles.bookingList}>
            {filtered.map((b, idx) => {
              const details = getBookingDetails(b);
              const rtStatus = getRealTimeStatus(b);
              return (
                <motion.div
                  key={b._id}
                  className={styles.bookingCard}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <div className={styles.bookingLeft}>
                    <div className={styles.statusIcon}>{STATUS_ICONS[rtStatus]}</div>
                    <div className={styles.bookingInfo}>
                      <div className={styles.bookingHall}>
                        {SERVICE_ICONS[b.serviceType]} {SERVICE_NAMES[b.serviceType]}
                      </div>
                      <div className={styles.bookingMeta}>
                        📅 {details.date}
                      </div>
                      <div className={styles.bookingMeta}>
                        {details.time}
                      </div>
                      <div className={styles.bookingPurpose} style={{ fontWeight: 500, color: '#374151', marginTop: '4px' }}>
                        {details.location}
                      </div>
                      <div className={styles.bookingPurpose}>{details.description}</div>
                      <div style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '6px' }}>
                        👤 <strong>{b.guestName || b.user?.name || 'Unknown'}</strong>
                        {(b.guestPhone || b.user?.phone) ? ` • 📞 ${b.guestPhone || b.user?.phone}` : ''}
                      </div>
                      {b.adminNote && (
                        <div className={styles.adminNote}>💬 Admin: {b.adminNote}</div>
                      )}
                      {b.cancellationReason && (
                        <div className={styles.cancellationNote}>
                          🚫 {b.cancelledBy === 'admin' ? 'Admin ' : 'User '}cancelled: {b.cancellationReason}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className={styles.bookingRight}>
                    <span className={`badge ${STATUS_COLORS[rtStatus]}`}>{rtStatus === 'live' ? 'In Progress' : rtStatus.charAt(0).toUpperCase() + rtStatus.slice(1)}</span>
                    {['pending', 'approved'].includes(b.status) && (
                      <button className="btn-danger btn-sm" onClick={() => handleCancel(b._id)} disabled={cancelling === b._id}>
                        {cancelling === b._id ? '...' : '🗑️ Cancel'}
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Cancellation Confirmation Modal */}
      {confirmModal && selectedForCancel && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setConfirmModal(false)}>
          <div className="modal" style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h2 className="modal-title">🗑️ Cancel Booking</h2>
              <button className="modal-close" onClick={() => setConfirmModal(false)}>✕</button>
            </div>

            <div style={{ padding: '20px' }}>
              <p style={{ marginBottom: '16px' }}>Are you sure you want to cancel this booking?</p>
              <textarea
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                placeholder="Reason for cancellation (optional)"
                style={{ width: '100%', padding: '8px', marginBottom: '16px', borderRadius: '4px', border: '1px solid #ddd', minHeight: '80px' }}
              />
            </div>

            <div style={{ padding: '0 20px 20px', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => setConfirmModal(false)}>Cancel</button>
              <button className="btn-danger" onClick={confirmCancel} disabled={cancelling}>
                {cancelling ? 'Cancelling...' : 'Confirm Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
