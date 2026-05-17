'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

const SERVICES = [
  {
    id: 'halls',
    title: 'Hall Booking',
    description: 'Book event halls, seminar rooms & conference spaces for your events.',
    icon: '🏛️',
    link: '/halls',
    gradient: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
    accent: '#7c3aed',
    image: '/images/halls.png',
  },
  {
    id: 'vehicles',
    title: 'Vehicle Booking',
    description: 'Rent cars, vans & buses for student and faculty transport needs.',
    icon: '🚗',
    link: '/vehicle-booking',
    gradient: 'linear-gradient(135deg, #059669, #0891b2)',
    accent: '#0891b2',
    image: '/images/vehicles.png',
  },
  {
    id: 'rooms',
    title: 'Guest Room',
    description: 'Reserve comfortable rooms for guests, visitors & official purposes.',
    icon: '🏨',
    link: '/room-booking',
    gradient: 'linear-gradient(135deg, #dc2626, #ea580c)',
    accent: '#ea580c',
    image: '/images/rooms.png',
  },
];

const STATS = [
  { label: 'Halls Available',   icon: '🏛️', key: 'halls' },
  { label: 'Vehicles Ready',    icon: '🚗', key: 'vehicles' },
  { label: 'Guest Rooms',       icon: '🏨', key: 'rooms' },
  { label: 'Pending Requests',  icon: '⏳', key: 'pending' },
];

export default function HomePage() {
  const [stats, setStats] = useState({ halls: 0, vehicles: 0, rooms: 0, pending: 0 });
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/halls').catch(() => ({ json: () => [] })),
      fetch('/api/vehicles').catch(() => ({ json: () => [] })),
      fetch('/api/rooms').catch(() => ({ json: () => [] })),
      fetch('/api/bookings').catch(() => ({ json: () => [] })),
      fetch('/api/auth/me').then(r => r.ok ? r.json() : null).catch(() => null),
    ])
      .then(responses => Promise.all(responses.map(r => r && typeof r.json === 'function' ? r.json() : r)))
      .then(([halls, vehicles, rooms, bookings, me]) => {
        setStats({
          halls:    Array.isArray(halls)    ? halls.length    : 0,
          vehicles: Array.isArray(vehicles) ? vehicles.length : 0,
          rooms:    Array.isArray(rooms)    ? rooms.length    : 0,
          pending:  Array.isArray(bookings) ? bookings.filter(x => x.status === 'pending').length : 0,
        });
        setCurrentUser(me);
      })
      .finally(() => setLoading(false));
  }, []);

  const displayServices = SERVICES.filter(svc => {
    if (!currentUser) return true; // show all to guests
    if (currentUser.role === 'super-admin') return true;
    if (svc.id === 'halls') return currentUser.assignedServices?.includes('halls') || currentUser.permissions?.hallAccess !== false;
    if (svc.id === 'vehicles') return currentUser.assignedServices?.includes('vehicles') || currentUser.permissions?.vehicleAccess !== false;
    if (svc.id === 'rooms') return currentUser.assignedServices?.includes('rooms') || currentUser.permissions?.guestRoomAccess !== false;
    return true;
  });

  return (
    <div style={{ minHeight: '100vh', background: '#f5f6fa', position: 'relative', overflow: 'hidden' }}>
      {/* Ambient blobs */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '-15%', left: '-10%', width: '55%', height: '60%', borderRadius: '50%', background: 'radial-gradient(circle, rgba(91,79,232,0.06) 0%, transparent 70%)', animation: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-20%', right: '-5%',  width: '50%', height: '60%', borderRadius: '50%', background: 'radial-gradient(circle, rgba(14,165,233,0.04) 0%, transparent 70%)' }} />
        <div style={{ position: 'absolute', top: '40%', left: '35%', width: '30%', height: '40%', borderRadius: '50%', background: 'radial-gradient(circle, rgba(91,79,232,0.03) 0%, transparent 70%)' }} />
      </div>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '80px 24px', position: 'relative', zIndex: 1 }}>

        {/* ── Hero ── */}
        <motion.div
          initial={{ opacity: 0, y: -24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{ textAlign: 'center', marginBottom: 72 }}
        >
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: '#f5f3ff', border: '1.5px solid #c4b5fd',
            borderRadius: 999, padding: '6px 18px', fontSize: 12, fontWeight: 700,
            color: '#5b4fe8', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 20,
          }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#0ea5e9', display: 'inline-block' }} />
            Campus Resource Management
          </span>

          <h1 style={{
            fontSize: 'clamp(2.4rem, 5vw, 4rem)', fontWeight: 900, color: '#1a1a2e',
            lineHeight: 1.08, letterSpacing: '-1.5px', marginBottom: 20,
          }}>
            Book College Resources{' '}
            <span style={{
              background: 'linear-gradient(135deg, #5b4fe8, #0ea5e9)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              Instantly
            </span>
          </h1>

          <p style={{ fontSize: '1.1rem', color: '#4b5563', maxWidth: 560, margin: '0 auto 36px', lineHeight: 1.8 }}>
            Select a module below to check availability, make reservations, and manage your bookings — all in one place.
          </p>

          {/* Live stats bar */}
          <div style={{
            display: 'inline-flex', gap: 0,
            background: '#ffffff', border: '1.5px solid #e2e6f3',
            borderRadius: 16, overflow: 'hidden',
            boxShadow: '0 4px 20px rgba(91,79,232,0.03)',
          }}>
            {STATS.map((s, i) => (
              <div key={s.key} style={{
                padding: '14px 24px', textAlign: 'center',
                borderRight: i < STATS.length - 1 ? '1.5px solid #eef0f8' : 'none',
              }}>
                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#1a1a2e', lineHeight: 1 }}>
                  {loading ? '—' : stats[s.key]}
                </div>
                <div style={{ fontSize: 11, color: '#4b5563', marginTop: 4, fontWeight: 600, letterSpacing: '0.5px' }}>
                  {s.icon} {s.label}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Service Cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
          {displayServices.map((svc, i) => (
            <motion.div
              key={svc.id}
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.12, duration: 0.5 }}
            >
              <div style={{
                borderRadius: 24, overflow: 'hidden',
                background: '#ffffff',
                border: '1.5px solid #e2e6f3',
                transition: 'all 0.4s cubic-bezier(.4,0,.2,1)',
                display: 'flex', flexDirection: 'column', height: '100%',
              }}
                onMouseEnter={e => {
                  e.currentTarget.style.border = `1.5px solid ${svc.accent}80`;
                  e.currentTarget.style.transform = 'translateY(-8px)';
                  e.currentTarget.style.boxShadow = `0 12px 36px rgba(91,79,232,0.08), 0 0 25px ${svc.accent}15`;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.border = '1.5px solid #e2e6f3';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {/* Banner Image */}
                <div style={{
                  height: 220, 
                  backgroundImage: `url(${svc.image})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  display: 'flex', alignItems: 'flex-end', padding: '20px 24px',
                  position: 'relative', overflow: 'hidden',
                }}>
                  {/* Colorful Gradient Overlay */}
                  <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to top, ${svc.accent}F2 0%, ${svc.accent}66 50%, transparent 100%)` }} />
                  
                  {/* Large Icon background */}
                  <div style={{ position: 'absolute', top: -10, right: -10, fontSize: 100, opacity: 0.15, lineHeight: 1, filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.5))' }}>
                    {svc.icon}
                  </div>
                  
                  {/* Clean Icon */}
                  <div style={{ position: 'relative', zIndex: 1, fontSize: 40, background: 'rgba(255,255,255,0.2)', padding: '12px', borderRadius: '16px', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.3)', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
                    {svc.icon}
                  </div>
                </div>

                {/* Body */}
                <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1a1a2e', marginBottom: 8 }}>{svc.title}</h2>
                  <p style={{ color: '#4b5563', fontSize: 14, lineHeight: 1.7, flexGrow: 1, marginBottom: 20 }}>
                    {svc.description}
                  </p>

                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 0', borderTop: '1.5px solid #eef0f8',
                    borderBottom: '1.5px solid #eef0f8', marginBottom: 20,
                  }}>
                    <span style={{ fontSize: 13, color: '#4b5563', fontWeight: 500 }}>Available Now</span>
                    {loading
                      ? <div style={{ width: 20, height: 20, border: '2px solid rgba(91,79,232,0.2)', borderTopColor: '#5b4fe8', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                      : <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#5b4fe8', background: '#f5f3ff', padding: '4px 12px', borderRadius: 8 }}>
                          {stats[svc.id]}
                        </span>
                    }
                  </div>

                  <Link href={svc.link}>
                    <button style={{
                      width: '100%', padding: '13px', borderRadius: 12,
                      background: svc.gradient, color: '#fff',
                      fontWeight: 700, fontSize: 14, letterSpacing: '0.3px',
                      transition: 'all 0.25s ease', cursor: 'pointer',
                      boxShadow: `0 4px 20px ${svc.accent}30`,
                    }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = `0 8px 28px ${svc.accent}50`; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = `0 4px 20px ${svc.accent}30`; }}
                    >
                      Open Module →
                    </button>
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}