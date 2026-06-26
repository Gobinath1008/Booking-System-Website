'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import styles from './Navbar.module.css';

export default function Navbar({ user }) {
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  const isSuperAdmin = user?.role === 'super-admin';
  const isAdmin = user?.role === 'admin' || user?.role === 'super-admin';

  let navLinks = [];
  if (user) {
    if (isSuperAdmin) {
      // Super Admin - full access
      navLinks = [
        { href: '/admin', label: '📊 Dashboard' },
        { href: '/admin/super-admin', label: '👑 Super Admin' },
        { href: '/admin/halls', label: '🏛️ Halls' },
        { href: '/admin/vehicles', label: '🚗 Vehicles' },
        { href: '/admin/rooms', label: '🏨 Rooms' },
        { href: '/admin/bookings', label: '📋 Bookings' },
      ];
    } else if (isAdmin) {
      // Admin - check assignedServices OR permissions
      navLinks = [
        { href: '/admin', label: '📊 Dashboard' },
      ];
      const hasHall = user.assignedServices?.includes('halls') || user.permissions?.hallAccess !== false;
      const hasVehicle = user.assignedServices?.includes('vehicles') || user.permissions?.vehicleAccess !== false;
      const hasRoom = user.assignedServices?.includes('rooms') || user.permissions?.guestRoomAccess !== false;
      
      if (hasHall) navLinks.push({ href: '/admin/halls', label: '🏛️ Halls' });
      if (hasVehicle) navLinks.push({ href: '/admin/vehicles', label: '🚗 Vehicles' });
      if (hasRoom) navLinks.push({ href: '/admin/rooms', label: '🏨 Rooms' });
      navLinks.push({ href: '/admin/bookings', label: '📋 Bookings' });
    } else {
      // User - check permissions
      navLinks = [];
      if (user.permissions?.hallAccess !== false) navLinks.push({ href: '/halls', label: '🏛️ Halls' });
      if (user.permissions?.vehicleAccess !== false) navLinks.push({ href: '/vehicle-booking', label: '🚗 Vehicles' });
      if (user.permissions?.guestRoomAccess !== false) navLinks.push({ href: '/room-booking', label: '🏨 Rooms' });
      navLinks.push({ href: '/my-bookings', label: '📋 My Bookings' });
    }
  } else {
    // Guest
    navLinks = [
      { href: '/halls', label: '🏛️ Halls' },
      { href: '/vehicle-booking', label: '🚗 Vehicles' },
      { href: '/room-booking', label: '🏨 Rooms' },
      { href: '/login', label: '🔑 Login' },
    ];
  }

  const getRoleBadge = () => {
    if (isSuperAdmin) {
      return <span className={`${styles.roleBadge} ${styles.superAdminBadge}`}>👑 Super Admin</span>;
    }
    if (isAdmin) {
      return <span className={`${styles.roleBadge} ${styles.adminBadge}`}>🛡️ Admin</span>;
    }
    return <span className={`${styles.roleBadge} ${styles.userBadge}`}>👤 User</span>;
  };

  return (
    <nav className={styles.nav}>
      <div className={styles.inner}>
        {/* Logo */}
        <Link href={isAdmin ? '/admin' : '/'} className={styles.logo}>
          <img src="/logo.png" alt="KIOT Logo" className={styles.logoImage} />
          <div>
            <span className={styles.logoName}>KIOT</span>
            <span className={styles.logoSub}>Booking</span>
          </div>
        </Link>

        {/* Desktop nav links */}
        <div className={styles.links}>
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`${styles.link} ${pathname === l.href ? styles.linkActive : ''}`}
            >
              {l.label}
            </Link>
          ))}
        </div>

        {/* User info + logout or Login */}
        <div className={styles.right}>
          {user ? (
            <>
              <div className={styles.userInfo}>
                <div className={styles.userText}>
                  <span className={styles.userName}>{user.name}</span>
                  {getRoleBadge()}
                </div>
              </div>
              <Link href="/profile" className={styles.profileBtn}>👤 Profile</Link>
              <button onClick={handleLogout} className={styles.logoutBtn} suppressHydrationWarning>
                <span>🚪</span> Logout
              </button>
            </>
          ) : (
            <div className={styles.guestLinks} style={{ display: 'flex', gap: '8px' }}>
              <Link href="/login" className="btn-secondary btn-sm" style={{ padding: '6px 12px' }}>Login</Link>
              <Link href="/register" className="btn-primary btn-sm" style={{ padding: '6px 12px' }}>Register</Link>
            </div>
          )}
          {/* Mobile menu toggle */}
          <button className={styles.menuBtn} onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className={styles.mobileMenu}>
          {navLinks.map((l) => (
            <Link key={l.href} href={l.href} className={styles.mobileLink} onClick={() => setMenuOpen(false)}>
              {l.label}
            </Link>
          ))}
          {user ? (
            <>
              <Link href="/profile" className={styles.mobileProfile} onClick={() => setMenuOpen(false)}>
                👤 Profile
              </Link>
              <button onClick={handleLogout} className={styles.mobileLogout} suppressHydrationWarning>🚪 Logout</button>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px 16px' }}>
              <Link href="/login" className="btn-secondary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setMenuOpen(false)}>Login</Link>
              <Link href="/register" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setMenuOpen(false)}>Register</Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}