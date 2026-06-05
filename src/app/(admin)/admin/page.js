'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ halls: 0, totalBookings: 0, pendingBookings: 0, approvedBookings: 0 });
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [hallsRes, bookingsRes, meRes] = await Promise.all([
          fetch('/api/halls'),
          fetch('/api/bookings?all=true'),
          fetch('/api/auth/me')
        ]);
        const halls = await hallsRes.json();
        const bookings = await bookingsRes.json();
        const user = meRes.ok ? await meRes.json() : null;
        setCurrentUser(user);

        const b = Array.isArray(bookings) ? bookings : [];
        const pendingBookings = b.filter(x => x.status === 'pending');
        setStats({
          halls: Array.isArray(halls) ? halls.length : 0,
          totalBookings: b.length,
          pendingBookings: pendingBookings.length,
          approvedBookings: b.filter(x => x.status === 'approved').length,
        });
        setRecent(pendingBookings.slice(0, 6));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

const formatTime12h = (timeStr) => {
  if (!timeStr) return '';
  const [hourStr, minStr] = timeStr.split(':');
  const hour = parseInt(hourStr);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${String(hour12).padStart(2, '0')}:${minStr} ${ampm}`;
};

  const getDetails = (b) => {
    const resourceName = b.serviceType === 'vehicle' ? 
      `🚗 ${b.serviceId?.name || 'Vehicle'} (${b.serviceId?.registrationNumber || 'N/A'})` :
     b.serviceType === 'room' ? 
      `🏨 ${b.serviceId?.name || 'Room'} #${b.serviceId?.roomNumber || 'N/A'}` :
     `🏛️ ${b.serviceId?.name || 'Event Hall'}`;

    if (b.serviceType === 'room') {
      // For room bookings, show check-in and check-out clearly
      const checkInDate = b.roomCheckInDate ? format(new Date(b.roomCheckInDate), 'MMM d, yyyy') : '—';
      const checkOutDate = b.roomCheckOutDate ? format(new Date(b.roomCheckOutDate), 'MMM d, yyyy') : '—';
      const checkInTime = formatTime12h(b.roomCheckInTime || '14:00');
      const checkOutTime = formatTime12h(b.roomCheckOutTime || '12:00');
      const date = `Check-in: ${checkInDate}`;
      const time = `${checkInTime} → Check-out: ${checkOutTime}`;
      const info = b.roomPurpose || b.specialRequests || '';
      return { date, time, info, resourceName };
    }
    
    const rawDate = b.hallDate || b.vehiclePickupDate || b.roomCheckInDate || '';
    const date = rawDate ? format(new Date(rawDate), 'MMM d, yyyy') : '—';
    const startTimeStr = b.hallStartTime || b.vehiclePickupTime || b.roomCheckInTime || '';
    const endTimeStr = b.hallEndTime || b.vehicleReturnTime || b.roomCheckOutTime || '';
    const time = startTimeStr && endTimeStr ? `${formatTime12h(startTimeStr)} – ${formatTime12h(endTimeStr)}` : '';
    const info = b.purpose || b.vehicleDetails?.description || b.roomPurpose || '';
    return { date, time, info, resourceName };
  };

  const STAT_CARDS = [
    { icon: '🏛️', label: 'Total Halls',       value: stats.halls,          color: '#7c6fff', glow: 'rgba(124,111,255,0.2)' },
    { icon: '📅', label: 'Total Bookings',    value: stats.totalBookings,  color: '#4cc9f0', glow: 'rgba(76,201,240,0.2)'  },
    { icon: '⏳', label: 'Pending Requests',  value: stats.pendingBookings, color: '#f39c12', glow: 'rgba(243,156,18,0.2)' },
    { icon: '✅', label: 'Approved',          value: stats.approvedBookings,color: '#2ecc71', glow: 'rgba(46,204,113,0.2)' },
  ];

  const isSuperAdmin = currentUser?.role === 'super-admin';

  let QUICK_TOOLS = [
    { href: '/admin/bookings?type=hall', icon: '📋', label: 'Manage Bookings', sub: 'Review & approve requests', color: '#7c6fff' },
  ];

  if (isSuperAdmin) {
    QUICK_TOOLS.unshift({ href: '/admin/super-admin', icon: '👑', label: 'Super Admin Workspace', sub: 'Manage admins, users, and system-wide settings', color: '#8b5cf6' });
  }

  if (currentUser?.role === 'super-admin' || currentUser?.assignedServices?.includes('halls') || currentUser?.permissions?.hallAccess !== false) {
    QUICK_TOOLS.push({ href: '/admin/halls', icon: '🏢', label: 'Halls Inventory', sub: 'Add or edit hall details', color: '#2ecc71' });
  }
  if (currentUser?.role === 'super-admin' || currentUser?.assignedServices?.includes('vehicles') || currentUser?.permissions?.vehicleAccess !== false) {
    QUICK_TOOLS.push({ href: '/admin/vehicles', icon: '🚗', label: 'Vehicles Inventory', sub: 'Manage transport fleet', color: '#f39c12' });
  }
  if (currentUser?.role === 'super-admin' || currentUser?.assignedServices?.includes('rooms') || currentUser?.permissions?.guestRoomAccess !== false) {
    QUICK_TOOLS.push({ href: '/admin/rooms', icon: '🏨', label: 'Rooms Inventory', sub: 'Manage guest rooms', color: '#e74c3c' });
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f5f6fa', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <div style={{ width: 44, height: 44, border: '3px solid rgba(91,79,232,0.1)', borderTopColor: '#5b4fe8', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        <p style={{ color: '#4b5563', fontSize: 14, fontWeight: 600 }}>Loading Dashboard…</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f6fa' }}>

      {/* ── Top Header ── */}
      <header style={{
        background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(20px)',
        borderBottom: '1.5px solid #e2e6f3',
        position: 'sticky', top: '66px', zIndex: 20,
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 68 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: 'linear-gradient(135deg, #5b4fe8, #0ea5e9)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
              boxShadow: '0 4px 16px rgba(91,79,232,0.3)',
            }}>🏛️</div>
            <div>
              <h1 style={{ fontSize: 17, fontWeight: 800, color: '#1a1a2e', lineHeight: 1.2 }}>Admin Portal</h1>
              <p style={{ fontSize: 11, color: '#4b5563', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px' }}>Hall Management</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            {isSuperAdmin && (
              <Link href="/admin/super-admin">
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px',
                    background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                    color: '#fff', fontSize: 13, fontWeight: 700,
                    borderRadius: 10, boxShadow: '0 4px 16px rgba(139,92,246,0.25)',
                    border: 'none', cursor: 'pointer',
                  }}
                >
                  👑 Super Admin Workspace
                </motion.button>
              </Link>
            )}
            <Link href="/admin/bookings?status=pending">
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px',
                  background: 'linear-gradient(135deg, #5b4fe8, #4338ca)',
                  color: '#fff', fontSize: 13, fontWeight: 700,
                  borderRadius: 10, boxShadow: '0 4px 16px rgba(91,79,232,0.25)',
                  border: 'none', cursor: 'pointer',
                }}
              >
                ⏳ Review Pending ({stats.pendingBookings})
              </motion.button>
            </Link>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '40px 24px 80px' }}>

        {/* Welcome */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 40, textAlign: 'center' }}>
          <h2 style={{ fontSize: 32, fontWeight: 900, color: '#1a1a2e', letterSpacing: '-0.5px', marginBottom: 8 }}>Welcome back, Admin 👋</h2>
          <p style={{ color: '#4b5563', fontSize: 16 }}>Here&apos;s an overview of your hall bookings and management tools.</p>
        </motion.div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 24, marginBottom: 48, justifyContent: 'center' }}>
          {STAT_CARDS.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              style={{
                background: '#ffffff', border: `1.5px solid #e2e6f3`,
                borderRadius: 20, padding: '28px 24px',
                borderTop: `4px solid ${s.color}`,
                transition: 'all 0.3s ease',
                display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
              }}
              whileHover={{ y: -4, boxShadow: `0 12px 30px rgba(91,79,232,0.06), 0 0 20px ${s.glow}40` }}
            >
              <div style={{ fontSize: 32, marginBottom: 14, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.05))' }}>{s.icon}</div>
              <div style={{ fontSize: 38, fontWeight: 900, color: '#1a1a2e', letterSpacing: '-1.5px', marginBottom: 6, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 11, color: '#4b5563', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Quick Tools */}
        <section style={{ marginBottom: 48 }}>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: '#1a1a2e', marginBottom: 24, textAlign: 'center' }}>Quick Tools</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24, justifyContent: 'center' }}>
            {QUICK_TOOLS.map((t, i) => (
              <Link key={t.href} href={t.href} style={{ display: 'flex' }}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.08 }}
                  whileHover={{ y: -5, boxShadow: `0 12px 30px rgba(91,79,232,0.08), 0 0 0 1.5px ${t.color}50` }}
                  style={{
                    background: '#ffffff', border: '1.5px solid #e2e6f3',
                    borderRadius: 20, padding: '32px 24px',
                    cursor: 'pointer', transition: 'all 0.3s ease', 
                    display: 'flex', flexDirection: 'column', 
                    alignItems: 'center', textAlign: 'center', 
                    gap: 12,
                    width: '100%'
                  }}
                >
                  <div style={{
                    width: 56, height: 56, borderRadius: 16,
                    background: `${t.color}10`, border: `1.5px solid ${t.color}25`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26,
                  }}>{t.icon}</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#1a1a2e' }}>{t.label}</div>
                  <div style={{ fontSize: 13, color: '#4b5563', lineHeight: 1.5, flexGrow: 1 }}>{t.sub}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: t.color, marginTop: 8 }}>Open →</div>
                </motion.div>
              </Link>
            ))}
          </div>
        </section>

        {/* Recent Bookings */}
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#1a1a2e' }}>Pending Booking Requests</h3>
            <Link href="/admin/bookings">
              <span style={{
                fontSize: 13, color: '#5b4fe8', fontWeight: 700, padding: '7px 16px',
                background: '#f5f3ff', borderRadius: 9, border: '1.5px solid #e2e6f3',
                transition: 'all 0.2s', cursor: 'pointer',
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#5b4fe8'; e.currentTarget.style.background = '#ebe7ff'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e6f3'; e.currentTarget.style.background = '#f5f3ff'; }}
              >View All</span>
            </Link>
          </div>

          <div style={{
            background: '#ffffff', border: '1.5px solid #e2e6f3',
            borderRadius: 20, overflow: 'hidden',
            boxShadow: '0 4px 20px rgba(91,79,232,0.03)',
          }}>
            {recent.length === 0 ? (
              <div style={{ padding: '60px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: 52, marginBottom: 16, opacity: 0.8 }}>✅</div>
                <p style={{ color: '#9ca3af', fontSize: 15 }}>No pending booking requests right now. Check back later or review all bookings if needed.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #e2e6f3' }}>
                      {['User Details', 'Schedule', 'Purpose', 'Status', ''].map(h => (
                        <th key={h} style={{ padding: '14px 18px', fontSize: 11, fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.8px', textAlign: 'left' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recent.map((b) => {
                      const d = getDetails(b);
                      const statusColor = b.status === 'approved' ? '#2ecc71' : b.status === 'pending' ? '#f39c12' : '#e74c3c';
                      const statusBg = b.status === 'approved' ? 'rgba(46,204,113,0.1)' : b.status === 'pending' ? 'rgba(243,156,18,0.1)' : 'rgba(231,76,60,0.1)';
                      return (
                        <tr key={b._id} style={{ borderTop: '1.5px solid #eef0f8', transition: 'background 0.15s' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#fcfcff'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <td style={{ padding: '14px 18px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{
                                width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                                background: 'linear-gradient(135deg, #5b4fe8, #0ea5e9)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: '#fff', fontWeight: 800, fontSize: 15,
                              }}>{b.user?.name?.[0]?.toUpperCase() || '?'}</div>
                              <div>
                                <div style={{ fontWeight: 700, color: '#1a1a2e', fontSize: 14 }}>{b.user?.name || 'Unknown'}{(b.user?.department || b.department) ? ` (${b.user?.department || b.department})` : ''}</div>
                                <div style={{ fontSize: 12, color: '#4b5563' }}>{b.user?.department || b.user?.role || 'User'}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '14px 18px' }}>
                            <div style={{ fontWeight: 700, color: '#1a1a2e', fontSize: 13, marginBottom: 4 }}>{d.resourceName}</div>
                            <div style={{ fontWeight: 600, color: '#4b5563', fontSize: 13 }}>{d.date}</div>
                            {d.time && <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{d.time}</div>}
                          </td>
                          <td style={{ padding: '14px 18px' }}>
                            <div style={{ fontSize: 13, color: '#4b5563', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.info || '—'}</div>
                          </td>
                          <td style={{ padding: '14px 18px' }}>
                            <span style={{
                              padding: '4px 12px', borderRadius: 999, fontSize: 11, fontWeight: 700,
                              textTransform: 'uppercase', letterSpacing: '0.5px',
                              color: statusColor, background: statusBg,
                              border: `1px solid ${statusColor}40`,
                            }}>{b.status}</span>
                          </td>
                          <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                            <Link href={`/admin/bookings?bookingId=${b._id}`}>
                              <span style={{
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                width: 32, height: 32, borderRadius: 8,
                                background: '#f5f6fa', border: '1.5px solid #e2e6f3',
                                color: '#4b5563', fontSize: 14, cursor: 'pointer',
                                transition: 'all 0.2s',
                              }}
                                onMouseEnter={e => { e.currentTarget.style.background = '#f5f3ff'; e.currentTarget.style.color = '#5b4fe8'; e.currentTarget.style.borderColor = '#c4b5fd'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = '#f5f6fa'; e.currentTarget.style.color = '#4b5563'; e.currentTarget.style.borderColor = '#e2e6f3'; }}
                              >›</span>
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
