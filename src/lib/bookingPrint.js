const escapeHtml = (value) => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');

const formatTime12h = (timeStr) => {
  if (!timeStr) return '';
  const [hourStr, minStr] = timeStr.split(':');
  const hour = parseInt(hourStr, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${String(hour12).padStart(2, '0')}:${minStr} ${ampm}`;
};

const formatDateTime = (value) => {
  if (!value) return '';
  try {
    return new Date(value).toLocaleString();
  } catch (error) {
    return String(value);
  }
};

const normalizeServiceId = (serviceId) => {
  if (!serviceId) return null;
  if (serviceId === '[object Object]') return null;
  if (typeof serviceId === 'object') {
    return String(serviceId._id || serviceId.id || '');
  }
  return String(serviceId);
};

const getServiceDetails = async (booking) => {
  const serviceId = normalizeServiceId(booking.serviceId);
  if (!serviceId) return {};

  try {
    if (booking.serviceType === 'hall') {
      if (typeof booking.serviceId === 'object' && booking.serviceId._id) return { hall: booking.serviceId };
      const res = await fetch(`/api/halls?id=${serviceId}`);
      if (res.ok) return { hall: await res.json() };
    }

    if (booking.serviceType === 'vehicle') {
      if (typeof booking.serviceId === 'object' && booking.serviceId._id) return { vehicle: booking.serviceId };
      const res = await fetch(`/api/vehicles?id=${serviceId}`);
      if (res.ok) return { vehicle: await res.json() };
    }

    if (booking.serviceType === 'room') {
      if (typeof booking.serviceId === 'object' && booking.serviceId._id) return { room: booking.serviceId };
      const res = await fetch(`/api/rooms?id=${serviceId}`);
      if (res.ok) return { room: await res.json() };
    }
  } catch {
    console.error('Failed to load service details for print report');
  }

  return {};
};

const getBookingDetails = (booking, serviceDetails = {}) => {
  const hall = booking.serviceId || serviceDetails.hall;
  const vehicle = booking.serviceId || serviceDetails.vehicle;
  const room = booking.serviceId || serviceDetails.room;

  switch (booking.serviceType) {
    case 'hall':
      return {
        date: booking.hallDate,
        time: `${formatTime12h(booking.hallStartTime)} - ${formatTime12h(booking.hallEndTime)}`,
        location: `🏛️ ${escapeHtml(hall?.name || 'Hall')}`,
        description: `<div><strong>${escapeHtml(booking.hallDate)} | ${formatTime12h(booking.hallStartTime)} to ${formatTime12h(booking.hallEndTime)}</strong></div><div>${escapeHtml(booking.attendees || 0)} attendees</div>${booking.purpose ? `<div><strong>Purpose:</strong> ${escapeHtml(booking.purpose)}</div>` : ''}`,
      };
    case 'vehicle': {
      const driverText = booking.withDriver ? 'With Driver' : 'Self-drive';
      const routeInfo = booking.pickupLocation && booking.returnLocation
        ? ` (${escapeHtml(booking.pickupLocation)} → ${escapeHtml(booking.returnLocation)})`
        : '';

      return {
        date: `${escapeHtml(booking.vehiclePickupDate)} to ${escapeHtml(booking.vehicleReturnDate)}`,
        time: `${formatTime12h(booking.vehiclePickupTime || '09:00')} - ${formatTime12h(booking.vehicleReturnTime || '09:00')}`,
        location: `🚗 ${escapeHtml(vehicle?.name || 'Vehicle')} (${escapeHtml(vehicle?.registrationNumber || 'N/A')})`,
        description: `<div><strong>Pickup:</strong> ${escapeHtml(booking.vehiclePickupDate)} at ${formatTime12h(booking.vehiclePickupTime || '09:00')}</div><div><strong>Return:</strong> ${escapeHtml(booking.vehicleReturnDate)} at ${formatTime12h(booking.vehicleReturnTime || '09:00')}</div><div>${escapeHtml(driverText)}${routeInfo}</div>${booking.purpose ? `<div><strong>Purpose:</strong> ${escapeHtml(booking.purpose)}</div>` : ''}`,
      };
    }
    case 'room': {
      const roomPurpose = booking.roomPurpose || booking.specialRequests;
      return {
        date: `Check-in: ${escapeHtml(booking.roomCheckInDate)} | Check-out: ${escapeHtml(booking.roomCheckOutDate)}`,
        time: `${formatTime12h(booking.roomCheckInTime || '14:00')} to ${formatTime12h(booking.roomCheckOutTime || '12:00')}`,
        location: `🏨 ${escapeHtml(room?.name || 'Room')} #${escapeHtml(room?.roomNumber || 'N/A')}${room?.floor !== undefined && room?.floor !== null ? ` (Floor ${escapeHtml(String(room.floor))})` : ''}`,
        description: `<div><strong>Check-in:</strong> ${escapeHtml(booking.roomCheckInDate)} at ${formatTime12h(booking.roomCheckInTime || '14:00')}</div><div><strong>Check-out:</strong> ${escapeHtml(booking.roomCheckOutDate)} at ${formatTime12h(booking.roomCheckOutTime || '12:00')}</div><div>${escapeHtml(booking.numberOfGuests ? `${booking.numberOfGuests} guests` : 'N/A guests')}${booking.numberOfRooms ? ` • ${escapeHtml(String(booking.numberOfRooms))} room${booking.numberOfRooms > 1 ? 's' : ''}` : ''}</div>${roomPurpose ? `<div><strong>Purpose:</strong> ${escapeHtml(roomPurpose)}</div>` : ''}`,
      };
    }    default:
      return { date: 'N/A', time: 'N/A', location: 'N/A', description: 'N/A' };
  }
};

export const buildBookingPrintHtml = (bookings, options = {}) => {
  const safeBookings = Array.isArray(bookings) ? bookings : [];
  const generatedAt = new Date().toLocaleString();

  const rows = safeBookings.map((booking, index) => {
    const serviceDetails = booking._serviceDetails || {};
    const details = getBookingDetails(booking, serviceDetails);
    const status = booking.status || 'pending';
    const statusLabel = status.toUpperCase();

    const detailLines = [
      `<div>${details.location}</div>`,
      `<div>${details.description}</div>`,
      `<div>By: ${escapeHtml(booking.guestName || booking.user?.name || 'Unknown')}</div>`,
    ];

    const actionInfo = booking.actionBy?.name && status !== 'pending'
      ? `${status === 'approved' ? 'Approved by:' : status === 'rejected' ? 'Rejected by:' : 'Cancelled by:'} ${booking.actionBy.name}${booking.actionAt ? ' — ' + formatDateTime(booking.actionAt) : ''}`
      : '';
    const cancelledInfo = !booking.actionBy?.name && status === 'cancelled' && booking.cancelledAt
      ? `Cancelled at: ${formatDateTime(booking.cancelledAt)}`
      : '';

    const statusInfo = [actionInfo, cancelledInfo].filter(Boolean).join('<br/>');

    return `
      <tr>
        <td>${index + 1}</td>
        <td>${escapeHtml(booking.serviceType === 'hall' ? 'Hall Booking' : booking.serviceType === 'vehicle' ? 'Vehicle Booking' : 'Room Booking')}</td>
        <td>${escapeHtml(details.date)}</td>
        <td class="details-cell">${detailLines.filter(Boolean).join('')}</td>
        <td>
          <span class="status ${escapeHtml(status)}">${escapeHtml(statusLabel)}</span>
          ${statusInfo ? `<br/><small style="color: #666; font-size: 11px;">${statusInfo}</small>` : ''}
        </td>
      </tr>
    `;
  }).join('');

  return `
    <html>
    <head>
      <title>Knowledge Institute of Technology, Salem</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; vertical-align: top; }
        td.details-cell { text-align: left; vertical-align: top; }
        td.details-cell div { margin-bottom: 6px; }
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
          <div style="font-size: 18px; font-weight: bold; color: #334155; font-family: Arial, sans-serif;">${escapeHtml(options.title || 'Booking Report')}</div>
          ${options.subtitle ? `<div style="font-size: 12px; color: #64748b; font-family: Arial, sans-serif; margin-top: 4px;">${escapeHtml(options.subtitle)}</div>` : ''}
          <div style="font-size: 11px; color: #64748b; font-family: Arial, sans-serif; margin-top: 4px;">Generated: ${escapeHtml(generatedAt)}</div>
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th>S.No</th>
            <th>Type</th>
            <th>Date</th>
            <th>Details</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
      <p style="margin-top: 20px; font-weight: bold;">Total Bookings: ${safeBookings.length}</p>
    </body>
    </html>
  `;
};

export const openBookingPrintWindow = async (bookings, options = {}) => {
  const enrichedBookings = await Promise.all((Array.isArray(bookings) ? bookings : []).map(async (booking) => {
    const serviceDetails = await getServiceDetails(booking);
    return { ...booking, _serviceDetails: serviceDetails };
  }));

  const printWindow = window.open('', '', 'height=600,width=800');
  if (!printWindow) return false;

  printWindow.document.write(buildBookingPrintHtml(enrichedBookings, options));
  printWindow.document.close();
  setTimeout(() => {
    printWindow.focus();
    printWindow.print();
  }, 250);

  return true;
};
