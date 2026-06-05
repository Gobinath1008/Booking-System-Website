import mongoose from 'mongoose';

const VehicleSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  vehicleType: { type: String, enum: ['car', 'van', 'bus', 'bike'], required: true },
  registrationNumber: { type: String, required: true, unique: true, trim: true },
  model: { type: String, required: true },
  year: { type: Number, required: true },
  capacity: { type: Number, required: true, min: 1 },
  fuelType: { type: String, enum: ['petrol', 'diesel', 'electric', 'hybrid'], required: true },
  mileage: { type: Number, default: 0 },
  dailyRentalPrice: { type: Number, default: 0 },
  driverChargePerDay: { type: Number, default: 0 },
  location: { type: String, required: true },
  address: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  features: [String],
  description: { type: String, default: '' },
  image: { type: String, default: '' },
  images: [String],
  status: { type: String, enum: ['available', 'booked', 'maintenance', 'inactive'], default: 'available' },
  currentMileage: { type: Number, default: 0 },
  fuelLevel: { type: Number, default: 100 },
  lastMaintenanceDate: Date,
  insuranceExpiry: Date,
  isActive: { type: Boolean, default: true },
  availability: {
    monday: { available: Boolean },
    tuesday: { available: Boolean },
    wednesday: { available: Boolean },
    thursday: { available: Boolean },
    friday: { available: Boolean },
    saturday: { available: Boolean },
    sunday: { available: Boolean },
  },
}, { timestamps: true });

export default mongoose.models.Vehicle || mongoose.model('Vehicle', VehicleSchema);
