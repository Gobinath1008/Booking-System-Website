import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import Hall from '@/models/Hall';
import { requireAuth, requireAdmin } from '@/lib/middleware';

export async function GET(request) {
  await connectDB();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const search = searchParams.get('search');
  const minCapacity = searchParams.get('minCapacity');
  const all = searchParams.get('all');

  // If id provided, return single hall
  if (id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'Invalid hall id' }, { status: 400 });
    }
    const hall = await Hall.findById(id);
    if (!hall) return NextResponse.json({ message: 'Hall not found' }, { status: 404 });
    return NextResponse.json(hall);
  }

  let query = { isActive: true };

  if (all === 'true') {
    const adminRes = await requireAdmin(request);
    if (!adminRes.error) {
      delete query.isActive;
    }
  }

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { location: { $regex: search, $options: 'i' } },
      { facilities: { $regex: search, $options: 'i' } },
    ];
  }
  if (minCapacity) query.capacity = { $gte: parseInt(minCapacity) };

  const halls = await Hall.find(query).sort({ name: 1 });
  return NextResponse.json(halls);
}

export async function POST(request) {
  const { error } = await requireAdmin(request);
  if (error) return error;
  await connectDB();
  const body = await request.json();
  const { name, capacity, location, facilities, description, isActive } = body;
  if (!name || !capacity || !location)
    return NextResponse.json({ message: 'Name, capacity and location are required' }, { status: 400 });
  const exists = await Hall.findOne({ name });
  if (exists) return NextResponse.json({ message: 'Hall with this name already exists' }, { status: 400 });
  const hall = await Hall.create({ name, capacity, location, facilities: facilities || [], description, isActive: isActive !== false });
  return NextResponse.json(hall, { status: 201 });
}
