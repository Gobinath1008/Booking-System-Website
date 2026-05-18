import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import GuestRoom from '@/models/GuestRoom';
import { requireAdmin } from '@/lib/middleware';

export async function GET(request) {
  await connectDB();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const search = searchParams.get('search');
  const roomType = searchParams.get('roomType');
  const city = searchParams.get('city');
  const minPrice = searchParams.get('minPrice');
  const maxPrice = searchParams.get('maxPrice');
  const occupancy = searchParams.get('occupancy');
  const all = searchParams.get('all');

  // If id provided, return single room
  if (id) {
    const room = await GuestRoom.findById(id);
    if (!room) return NextResponse.json({ message: 'Room not found' }, { status: 404 });
    return NextResponse.json(room);
  }

  let query = { isActive: true, status: { $ne: 'blocked' } };

  if (all === 'true') {
    const adminRes = await requireAdmin(request);
    if (!adminRes.error) {
      delete query.isActive;
    }
  }

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { roomNumber: { $regex: search, $options: 'i' } },
      { roomType: { $regex: search, $options: 'i' } },
    ];
  }
  if (roomType) query.roomType = roomType;
  if (city) query.city = { $regex: city, $options: 'i' };
  if (occupancy) query.occupancy = { $gte: parseInt(occupancy) };
  if (minPrice || maxPrice) {
    query.pricePerDay = {};
    if (minPrice) query.pricePerDay.$gte = parseInt(minPrice);
    if (maxPrice) query.pricePerDay.$lte = parseInt(maxPrice);
  }

  const rooms = await GuestRoom.find(query).sort({ floor: 1, roomNumber: 1 });
  return NextResponse.json(rooms);
}

export async function POST(request) {
  const { error } = await requireAdmin(request);
  if (error) return error;
  
  await connectDB();
  const body = await request.json();
  const { name, roomType, roomNumber, floor, occupancy, pricePerDay, pricePerNight, location, city, state, address, zipCode } = body;

  if (!name || !roomType || !roomNumber || floor === undefined || occupancy === undefined || pricePerDay === undefined || pricePerNight === undefined || !location) {
    return NextResponse.json({ message: 'Required fields are missing' }, { status: 400 });
  }

  const exists = await GuestRoom.findOne({ roomNumber });
  if (exists) {
    return NextResponse.json({ message: 'Room with this number already exists' }, { status: 400 });
  }

  const room = await GuestRoom.create({
    name,
    roomType,
    roomNumber,
    floor,
    occupancy,
    pricePerDay,
    pricePerNight,
    location,
    city,
    state,
    address,
    zipCode,
  });

  return NextResponse.json(room, { status: 201 });
}
