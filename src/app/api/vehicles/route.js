import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Vehicle from '@/models/Vehicle';
import { requireAdmin } from '@/lib/middleware';

export async function GET(request) {
  await connectDB();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const search = searchParams.get('search');
  const vehicleType = searchParams.get('vehicleType');
  const city = searchParams.get('city');
  const minPrice = searchParams.get('minPrice');
  const maxPrice = searchParams.get('maxPrice');
  const all = searchParams.get('all');

  // If id provided, return single vehicle
  if (id) {
    const vehicle = await Vehicle.findById(id);
    if (!vehicle) return NextResponse.json({ message: 'Vehicle not found' }, { status: 404 });
    return NextResponse.json(vehicle);
  }

  let query = { isActive: true, status: { $ne: 'inactive' } };

  if (all === 'true') {
    const adminRes = await requireAdmin(request);
    if (!adminRes.error) {
      delete query.isActive;
    }
  }

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { model: { $regex: search, $options: 'i' } },
      { registrationNumber: { $regex: search, $options: 'i' } },
    ];
  }
  if (vehicleType) query.vehicleType = vehicleType;
  if (city) query.city = { $regex: city, $options: 'i' };
  if (minPrice || maxPrice) {
    query.dailyRentalPrice = {};
    if (minPrice) query.dailyRentalPrice.$gte = parseInt(minPrice);
    if (maxPrice) query.dailyRentalPrice.$lte = parseInt(maxPrice);
  }

  const vehicles = await Vehicle.find(query).sort({ name: 1 });
  return NextResponse.json(vehicles);
}

export async function POST(request) {
  const { error } = await requireAdmin(request);
  if (error) return error;
  
  await connectDB();
  const body = await request.json();
  const { name, vehicleType, registrationNumber, model, year, capacity, fuelType, dailyRentalPrice, location, city, state, address } = body;

  if (!name || !vehicleType || !registrationNumber || !model || year === undefined || capacity === undefined || !fuelType || dailyRentalPrice === undefined || !location) {
    return NextResponse.json({ message: 'Required fields are missing' }, { status: 400 });
  }

  const exists = await Vehicle.findOne({ registrationNumber });
  if (exists) {
    return NextResponse.json({ message: 'Vehicle with this registration number already exists' }, { status: 400 });
  }

  const vehicle = await Vehicle.create({
    name,
    vehicleType,
    registrationNumber,
    model,
    year,
    capacity,
    fuelType,
    dailyRentalPrice,
    location,
    city,
    state,
    address,
  });

  return NextResponse.json(vehicle, { status: 201 });
}
