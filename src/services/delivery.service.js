const DeliverySlot = require("../models/deliverySlot.model");
const DeliveryCharge = require("../models/deliveryCharge.model");
const StoreSettings = require("../models/StoreSettings");

const FALLBACK_CHARGE = 250;
const MAX_ADVANCE_DAYS = 14;
const STORE_UTC_OFFSET_MINUTES = Number(
  process.env.STORE_UTC_OFFSET_MINUTES || 300
);

function getDistanceKm(lat1, lon1, lat2, lon2) {
  const toRad = (value) => (value * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function validCoordinate(value, limit) {
  if (value === undefined || value === null || value === "") return false;
  const number = Number(value);
  return Number.isFinite(number) && Math.abs(number) <= limit;
}

// Returns { charge, distanceKm, source } where source explains how it was chosen
async function calculateDeliveryCharge(latitude, longitude) {
  const config = await DeliveryCharge.findOne().lean();
  const defaultCharge = config ? config.defaultCharge : FALLBACK_CHARGE;
  const fallback = (source) => ({ charge: defaultCharge, distanceKm: null, source });

  if (!validCoordinate(latitude, 90) || !validCoordinate(longitude, 180)) {
    return fallback("default_no_location");
  }

  const store = await StoreSettings.findOne().lean();
  if (!store) {
    return fallback("default_no_store_location");
  }

  const distanceKm = getDistanceKm(
    Number(latitude),
    Number(longitude),
    store.lat,
    store.lon
  );
  const roundedDistance = Number(distanceKm.toFixed(2));
  const tier = (config?.tiers || []).find(
    (item) => distanceKm >= item.minKm && distanceKm < item.maxKm
  );

  if (!tier) {
    return {
      charge: defaultCharge,
      distanceKm: roundedDistance,
      source: "default_outside_tiers",
    };
  }

  return { charge: tier.charge, distanceKm: roundedDistance, source: "tier" };
}

// "Now" expressed in the store's local time, read through the UTC getters
function getStoreNow() {
  return new Date(Date.now() + STORE_UTC_OFFSET_MINUTES * 60_000);
}

function timeToMinutes(time) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function isValidDateString(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

// A slot is bookable if it runs on that weekday and is not too close to starting
function isSlotBookable(slot, dateString, storeNow = getStoreNow()) {
  const dayOfWeek = new Date(`${dateString}T00:00:00Z`).getUTCDay();
  if (!slot.isActive || !slot.daysOfWeek.includes(dayOfWeek)) return false;

  const today = storeNow.toISOString().slice(0, 10);
  if (dateString < today) return false;
  if (dateString > today) return true;

  const nowMinutes = storeNow.getUTCHours() * 60 + storeNow.getUTCMinutes();
  return timeToMinutes(slot.startTime) - slot.minLeadMinutes >= nowMinutes;
}

async function getAvailableSlots(days = 7) {
  const slots = await DeliverySlot.find({ isActive: true }).sort({
    sortOrder: 1,
    startTime: 1,
  });
  const storeNow = getStoreNow();
  const result = [];

  for (let offset = 0; offset < days; offset += 1) {
    const date = new Date(storeNow.getTime() + offset * 86_400_000)
      .toISOString()
      .slice(0, 10);
    const available = slots.filter((slot) => isSlotBookable(slot, date, storeNow));

    if (available.length > 0) {
      result.push({ date, slots: available });
    }
  }

  return result;
}

// For use by the future order flow: confirms a date + slot pair can be booked
async function validateDeliverySlot(dateString, slotId) {
  if (!isValidDateString(dateString)) {
    return { error: "Delivery date must be in YYYY-MM-DD format." };
  }

  const storeNow = getStoreNow();
  const lastDate = new Date(storeNow.getTime() + (MAX_ADVANCE_DAYS - 1) * 86_400_000)
    .toISOString()
    .slice(0, 10);
  if (dateString > lastDate) {
    return { error: `Delivery can be scheduled up to ${MAX_ADVANCE_DAYS} days ahead.` };
  }

  const slot = await DeliverySlot.findById(slotId);
  if (!slot || !isSlotBookable(slot, dateString, storeNow)) {
    return { error: "The selected delivery slot is not available." };
  }

  return { slot };
}

module.exports = {
  MAX_ADVANCE_DAYS,
  calculateDeliveryCharge,
  getAvailableSlots,
  validateDeliverySlot,
  isValidDateString,
};
