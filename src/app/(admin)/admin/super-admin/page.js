'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { CartesianGrid, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';
import { toast } from 'react-hot-toast';
import { openBookingPrintWindow } from '../../../../lib/bookingPrint';

const formatTime12h = (timeStr) => {
  if (!timeStr) return '';
  const [hourStr, minStr] = timeStr.split(':');
  const hour = parseInt(hourStr);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${String(hour12).padStart(2, '0')}:${minStr} ${ampm}`;
};

export default function SuperAdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [admins, setAdmins] = useState([]);
  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Modals
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(null);
  
  const [userSearch, setUserSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [newAdmin, setNewAdmin] = useState({ name: '', email: '', phone: '', password: '', assignedServices: ['halls', 'vehicles', 'rooms'] });
  const [adminLoading, setAdminLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(userSearch), 400);
    return () => clearTimeout(timer);
  }, [userSearch]);

  const fetchData = useCallback(async () => {
    try {
      const [adminsRes, usersRes, bookingsRes] = await Promise.all([
        fetch('/api/admins'),
        fetch(`/api/users?search=${debouncedSearch}&status=all&role=all&blocked=all`),
        fetch('/api/bookings?all=true')
      ]);

      const adminData = await adminsRes.json();
      const userData = await usersRes.json();
      const bookingsData = await bookingsRes.json();

      setAdmins(Array.isArray(adminData) ? adminData : []);
      setUsers(Array.isArray(userData.users) ? userData.users : []);
      setBookings(Array.isArray(bookingsData) ? bookingsData : []);
    } catch {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      void fetchData();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [fetchData]);

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    if (!newAdmin.name || !newAdmin.email || !newAdmin.password) {
      toast.error('Please fill all required fields');
      return;
    }
    
    setAdminLoading(true);
    try {
      const res = await fetch('/api/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAdmin)
      });

      if (res.ok) {
        setShowAdminModal(false);
        setNewAdmin({ name: '', email: '', phone: '', password: '', assignedServices: ['halls', 'vehicles', 'rooms'] });
        fetchData();
        toast.success('Admin created successfully!');
      } else {
        const data = await res.json();
        toast.error(data.message || 'Failed to create admin');
      }
    } catch (error) {
      toast.error('Failed to create admin');
    } finally {
      setAdminLoading(false);
    }
  };

  const handleUpdateUserPermissions = async (userId, data) => {
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (res.ok) {
        fetchData();
        if (showUserModal?._id === userId) {
          setShowUserModal(prev => ({ ...prev, ...data, permissions: { ...(prev.permissions || {}), ...(data.permissions || {}) } }));
        }
        toast.success('User updated successfully');
      } else {
        const err = await res.json();
        toast.error(err.message || 'Failed to update permissions');
      }
    } catch (error) {
      toast.error('Error updating permissions');
    }
  };

  const handleDeleteAdmin = async (adminId) => {
    if (!confirm('Are you sure you want to revoke this admin?')) return;
    try {
      const res = await fetch(`/api/admins?id=${adminId}`, { method: 'DELETE' });
      if (res.ok) {
        fetchData();
        toast.success('Admin revoked successfully');
      } else {
        toast.error('Failed to revoke admin');
      }
    } catch (error) {
      toast.error('Error revoking admin');
    }
  };

  const getBookingStats = () => {
    if (!bookings.length) return { total: 0, pending: 0, approved: 0, rejected: 0, cancelled: 0 };
    return {
      total: bookings.length,
      pending: bookings.filter(b => b.status === 'pending').length,
      approved: bookings.filter(b => b.status === 'approved').length,
      rejected: bookings.filter(b => b.status === 'rejected').length,
      cancelled: bookings.filter(b => b.status === 'cancelled').length,
    };
  };

  const bookingStats = getBookingStats();

  const handlePrint = async () => {
    await openBookingPrintWindow(bookings, {
      title: 'Booking Report',
      subtitle: 'Super Admin Booking Logs'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-800 rounded-full animate-spin mb-4"></div>
        <p className="text-sm text-slate-500 font-medium">Loading workspace...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] py-8 selection:bg-slate-200 selection:text-black">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Dashboard Title & Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 flex items-center gap-3">
              <span className="p-2 bg-indigo-50 text-indigo-600 rounded-2xl shadow-sm border border-indigo-100">👑</span>
              Super Admin Workspace
            </h1>
            <p className="text-slate-500 font-medium mt-1">Manage administrators, control users permissions, and monitor system booking records.</p>
          </div>
          <div className="flex gap-3">
            <Link href="/" className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-xl transition-all border border-slate-200 shadow-sm flex items-center gap-2 hover:-translate-y-0.5">
              Public Site ↗
            </Link>
            <button
              onClick={() => setShowAdminModal(true)}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-md shadow-indigo-600/10 flex items-center gap-2 hover:-translate-y-0.5"
            >
              + New Admin
            </button>
          </div>
        </div>

        {/* Outer Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Sidebar Floating Card - 3 columns */}
          <aside className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl shadow-sm sticky top-24 z-30" style={{ padding: '24px' }}>
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center shadow-sm">
                <span className="text-white text-sm font-black tracking-wider">SA</span>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 leading-tight">Control Panel</h3>
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mt-0.5">System Menu</p>
              </div>
            </div>

            <nav style={{ display: 'flex', flexDirection: 'column' }}>
              {[
                { id: 'overview', label: 'Overview', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /> },
                { id: 'users', label: 'Users', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /> },
                { id: 'admins', label: 'Administrators', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /> },
                { id: 'bookings', label: 'Bookings', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /> },
                { id: 'services', label: 'Services', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /> }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-slate-900 text-white shadow-md shadow-slate-900/10 translate-x-1'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 hover:translate-x-1'
                  }`}
                  style={{
                    padding: '14px 20px',
                    marginBottom: '12px',
                    borderRadius: '12px',
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    fontSize: '14.5px',
                    fontWeight: '700'
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} style={{ flexShrink: 0 }}>
                    {tab.icon}
                  </svg>
                  {tab.label}
                </button>
              ))}
            </nav>
          </aside>

          {/* Tab Content Panel - 9 columns */}
          <main className="lg:col-span-9">
        
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Total Bookings', value: bookingStats.total, trend: '+12%', isPositive: true },
                { label: 'Pending Approval', value: bookingStats.pending, trend: 'Needs action', isPositive: false },
                { label: 'Approved', value: bookingStats.approved, trend: 'Completed', isPositive: true },
                { label: 'Total Users', value: users.length, trend: '+4 this week', isPositive: true },
              ].map((stat, idx) => (
                <div key={idx} className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
                  <p className="text-slate-500 font-medium text-sm mb-3">{stat.label}</p>
                  <div className="flex items-end justify-between">
                    <h3 className="text-3xl font-semibold text-slate-900 tracking-tight">{stat.value}</h3>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${stat.isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                      {stat.trend}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-900 mb-6">Booking Activity</h3>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                    <BarChart data={[
                      { name: 'Halls', count: bookings.filter(b => b.serviceType === 'hall').length },
                      { name: 'Vehicles', count: bookings.filter(b => b.serviceType === 'vehicle').length },
                      { name: 'Rooms', count: bookings.filter(b => b.serviceType === 'room').length },
                    ]} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                      <RechartsTooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '13px', fontWeight: '500'}} />
                      <Bar dataKey="count" fill="#0f172a" radius={[4, 4, 0, 0]} barSize={36} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col">
                <h3 className="text-sm font-semibold text-slate-900 mb-6">Status Distribution</h3>
                <div className="h-64 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Approved', value: bookingStats.approved },
                          { name: 'Pending', value: bookingStats.pending },
                          { name: 'Rejected', value: bookingStats.rejected },
                          { name: 'Cancelled', value: bookingStats.cancelled }
                        ].filter(d => d.value > 0)}
                        cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={4} dataKey="value" stroke="none"
                      >
                        {
                          [
                            { name: 'Approved', value: bookingStats.approved },
                            { name: 'Pending', value: bookingStats.pending },
                            { name: 'Rejected', value: bookingStats.rejected },
                            { name: 'Cancelled', value: bookingStats.cancelled }
                          ].filter(d => d.value > 0).map((entry, index) => {
                            const colors = {'Approved': '#10b981', 'Pending': '#f59e0b', 'Rejected': '#ef4444', 'Cancelled': '#94a3b8'};
                            return <Cell key={`cell-${index}`} fill={colors[entry.name]} />
                          })
                        }
                      </Pie>
                      <RechartsTooltip contentStyle={{borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '13px', fontWeight: '500'}} />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{fontSize: '12px', color: '#64748b'}} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
                <h3 className="text-base font-semibold text-slate-900">User Directory</h3>
                <div className="relative w-full sm:w-auto">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 w-full sm:w-64 text-sm transition-colors"
                  />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-3 font-medium border-b border-slate-200">User</th>
                      <th className="px-6 py-3 font-medium border-b border-slate-200">Role</th>
                      <th className="px-6 py-3 font-medium border-b border-slate-200">Permissions</th>
                      <th className="px-6 py-3 font-medium border-b border-slate-200 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {users.map(user => (
                      <tr key={user._id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs border border-slate-200">
                              {user.name?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-medium text-slate-900 text-sm">{user.name}</div>
                              <div className="text-xs text-slate-500">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium capitalize border ${
                            user.role === 'super-admin' ? 'bg-slate-900 text-white border-slate-900' :
                            user.role === 'admin' ? 'bg-slate-100 text-slate-800 border-slate-300' :
                            'bg-white text-slate-600 border-slate-200'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-1.5 flex-wrap">
                            {user.permissions?.blocked && <span className="px-2 py-0.5 bg-red-50 text-red-700 text-[10px] font-semibold rounded border border-red-100">Blocked</span>}
                            {user.permissions?.hallAccess !== false && <span className="px-2 py-0.5 bg-slate-50 text-slate-600 text-[10px] font-medium rounded border border-slate-200">Halls</span>}
                            {user.permissions?.vehicleAccess !== false && <span className="px-2 py-0.5 bg-slate-50 text-slate-600 text-[10px] font-medium rounded border border-slate-200">Vehicles</span>}
                            {user.permissions?.guestRoomAccess !== false && <span className="px-2 py-0.5 bg-slate-50 text-slate-600 text-[10px] font-medium rounded border border-slate-200">Rooms</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {user.role !== 'super-admin' && (
                            <button onClick={() => setShowUserModal(user)} className="text-sm font-medium text-slate-500 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm hover:bg-slate-50 transition-colors">
                              Edit
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* Admins Tab */}
        {activeTab === 'admins' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {admins.map(admin => (
              <div key={admin._id} className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col hover:border-slate-300 transition-colors">
                <div className="flex gap-3 items-center mb-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border ${admin.role === 'super-admin' ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                    {admin.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 text-sm truncate">{admin.name}</h3>
                    <p className="text-xs text-slate-500 truncate">{admin.email}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-5 flex-1">
                  {admin.role === 'super-admin' ? (
                    <span className="px-2 py-1 bg-slate-900 text-white text-[10px] font-medium rounded-md uppercase tracking-wide">Super Administrator</span>
                  ) : (
                    admin.assignedServices?.map(service => (
                      <span key={service} className="px-2 py-1 bg-slate-50 text-slate-600 border border-slate-200 text-[10px] font-medium rounded-md capitalize">{service}</span>
                    ))
                  )}
                </div>
                {admin.role !== 'super-admin' && (
                  <button onClick={() => handleDeleteAdmin(admin._id)} className="w-full py-2 bg-white hover:bg-red-50 text-red-600 border border-slate-200 hover:border-red-200 font-medium rounded-lg transition-colors text-sm">
                    Revoke Access
                  </button>
                )}
              </div>
            ))}
          </motion.div>
        )}

        {/* Bookings Tab */}
        {activeTab === 'bookings' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-5 border-b border-slate-200 flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">Recent Booking Logs</h3>
                </div>
                <button
                  onClick={handlePrint}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  🖨️ Print Report
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-3 font-medium border-b border-slate-200">User / Guest</th>
                      <th className="px-6 py-3 font-medium border-b border-slate-200">Service</th>
                      <th className="px-6 py-3 font-medium border-b border-slate-200">Details</th>
                      <th className="px-6 py-3 font-medium border-b border-slate-200 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {bookings.slice(0, 50).map(booking => (
                      <tr key={booking._id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-900 text-sm">{booking.user?.name || booking.guestName}</div>
                          <div className="text-xs text-slate-500">{booking.user?.department || booking.user?.role || 'Guest'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-medium text-slate-700 capitalize flex items-center gap-1.5">
                            {booking.serviceType === 'hall' && '🏛️ Hall'}
                            {booking.serviceType === 'vehicle' && '🚗 Vehicle'}
                            {booking.serviceType === 'room' && '🏨 Room'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-600">
                          {booking.serviceType === 'hall' && `${booking.hallDate} (${formatTime12h(booking.hallStartTime)} - ${formatTime12h(booking.hallEndTime)})`}
                          {booking.serviceType === 'vehicle' && `${booking.vehiclePickupDate} to ${booking.vehicleReturnDate}`}
                          {booking.serviceType === 'room' && `${booking.roomCheckInDate} to ${booking.roomCheckOutDate}`}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className={`inline-block px-2.5 py-1 rounded text-[11px] font-semibold capitalize border ${
                            booking.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            booking.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            booking.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                            'bg-slate-50 text-slate-700 border-slate-200'
                          }`}>
                            {booking.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* Services Tab */}
        {activeTab === 'services' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { id: 'halls', icon: '🏛️', name: 'Halls Management', desc: 'Oversee auditoriums & seminar halls', link: '/admin/halls' },
              { id: 'vehicles', icon: '🚗', name: 'Vehicles Management', desc: 'Control buses, cars & transport logs', link: '/admin/vehicles' },
              { id: 'rooms', icon: '🏨', name: 'Rooms Management', desc: 'Manage accommodation & guest lists', link: '/admin/rooms' }
            ].map(service => (
              <Link href={service.link} key={service.id}>
                <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:border-slate-300 hover:shadow transition-all cursor-pointer flex flex-col h-full">
                  <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center text-xl mb-4 border border-slate-100">
                    {service.icon}
                  </div>
                  <h3 className="text-base font-semibold text-slate-900 mb-1">{service.name}</h3>
                  <p className="text-xs text-slate-500 mb-6 flex-grow leading-relaxed">{service.desc}</p>
                  <div className="text-sm font-medium text-slate-900 flex items-center gap-1">
                    Open Settings <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </div>
                </div>
              </Link>
            ))}
          </motion.div>
        )}

          </main>
        </div>

        {/* User Permission Modal */}
        <AnimatePresence>
          {showUserModal && (
            <motion.div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowUserModal(null)}>
              <motion.div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-200" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }} onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-semibold text-slate-900">Manage Permissions</h2>
                  <button onClick={() => setShowUserModal(null)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                
                <div className="flex items-center gap-3 mb-6 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="w-10 h-10 rounded-full bg-white text-slate-900 flex items-center justify-center font-semibold text-sm border border-slate-200 shadow-sm">
                    {showUserModal.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 text-sm">{showUserModal.name}</div>
                    <div className="text-slate-500 text-xs">{showUserModal.email}</div>
                  </div>
                </div>

                <div className="space-y-5">
                  <div>
                    <h4 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Role Settings</h4>
                    <div className="mb-6">
                      <select 
                        value={showUserModal.role} 
                        onChange={(e) => handleUpdateUserPermissions(showUserModal._id, { role: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-shadow shadow-sm cursor-pointer"
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>

                    <h4 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Service Access</h4>
                    <div className="space-y-2 mb-6">
                      {[
                        { id: 'hallAccess', icon: '🏛️', label: 'Halls Booking' },
                        { id: 'vehicleAccess', icon: '🚗', label: 'Vehicles Booking' },
                        { id: 'guestRoomAccess', icon: '🏨', label: 'Rooms Booking' }
                      ].map(service => {
                        const isAllowed = showUserModal.permissions?.[service.id] !== false;
                        return (
                          <div key={service.id} className="flex items-center justify-between p-3 border border-slate-200 rounded-xl bg-white">
                            <div className="flex items-center gap-2">
                              <span className="text-base">{service.icon}</span>
                              <span className="text-sm font-medium text-slate-800">{service.label}</span>
                            </div>
                            <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                              <label className={`px-3 py-1 rounded-md text-xs font-medium cursor-pointer transition-colors ${isAllowed ? 'bg-white shadow-sm text-emerald-700' : 'text-slate-500 hover:text-slate-700'}`}>
                                <input type="radio" name={`service-${service.id}`} className="hidden" checked={isAllowed} onChange={() => { if (!isAllowed) handleUpdateUserPermissions(showUserModal._id, { [service.id]: true }) }} />
                                Allowed
                              </label>
                              <label className={`px-3 py-1 rounded-md text-xs font-medium cursor-pointer transition-colors ${!isAllowed ? 'bg-white shadow-sm text-red-700' : 'text-slate-500 hover:text-slate-700'}`}>
                                <input type="radio" name={`service-${service.id}`} className="hidden" checked={!isAllowed} onChange={() => { if (isAllowed) handleUpdateUserPermissions(showUserModal._id, { [service.id]: false }) }} />
                                Blocked
                              </label>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <h4 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Account Restrictions</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 border border-slate-200 rounded-xl bg-white">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{showUserModal.permissions?.blocked ? '🔒' : '✅'}</span>
                          <span className="text-sm font-medium text-slate-800">Account Login</span>
                        </div>
                        <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                          <label className={`px-3 py-1 rounded-md text-xs font-medium cursor-pointer transition-colors ${!showUserModal.permissions?.blocked ? 'bg-white shadow-sm text-emerald-700' : 'text-slate-500 hover:text-slate-700'}`}>
                            <input type="radio" name="account-status" className="hidden" checked={!showUserModal.permissions?.blocked} onChange={() => handleUpdateUserPermissions(showUserModal._id, { blockUser: false })} />
                            Active
                          </label>
                          <label className={`px-3 py-1 rounded-md text-xs font-medium cursor-pointer transition-colors ${showUserModal.permissions?.blocked ? 'bg-white shadow-sm text-red-700' : 'text-slate-500 hover:text-slate-700'}`}>
                            <input type="radio" name="account-status" className="hidden" checked={!!showUserModal.permissions?.blocked} onChange={() => handleUpdateUserPermissions(showUserModal._id, { blockUser: true })} />
                            Suspended
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Admin Creation Modal */}
        <AnimatePresence>
          {showAdminModal && (
            <motion.div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAdminModal(false)}>
              <motion.div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-200" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }} onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-semibold text-slate-900">Add Administrator</h2>
                  <button onClick={() => setShowAdminModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                <form onSubmit={handleCreateAdmin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">Full Name</label>
                    <input type="text" value={newAdmin.name} onChange={e => setNewAdmin({...newAdmin, name: e.target.value})} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-shadow shadow-sm placeholder:text-slate-400" placeholder="Jane Doe" required />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">Email Address</label>
                    <input type="email" value={newAdmin.email} onChange={e => setNewAdmin({...newAdmin, email: e.target.value})} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-shadow shadow-sm placeholder:text-slate-400" placeholder="jane@example.com" required />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">Password</label>
                    <input type="password" value={newAdmin.password} onChange={e => setNewAdmin({...newAdmin, password: e.target.value})} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-shadow shadow-sm placeholder:text-slate-400" placeholder="••••••••" required minLength={6} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-2 mt-1">Assigned Modules</label>
                    <div className="flex flex-wrap gap-2">
                      {['halls', 'vehicles', 'rooms'].map(service => (
                        <button key={service} type="button" onClick={() => setNewAdmin(prev => ({ ...prev, assignedServices: prev.assignedServices.includes(service) ? prev.assignedServices.filter(s => s !== service) : [...prev.assignedServices, service] }))} className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors capitalize ${newAdmin.assignedServices.includes(service) ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
                          {service}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="pt-2">
                    <button type="submit" disabled={adminLoading} className="w-full py-2.5 bg-slate-900 hover:bg-black text-white font-medium rounded-lg text-sm transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center">
                      {adminLoading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : 'Create Account'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}