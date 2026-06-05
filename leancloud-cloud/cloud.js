const AV = require('leanengine');

const SLOT_IDS = ['s1', 's2', 's3'];
const ROLES = ['booker', 'follower'];

function assertAdmin(passcode) {
  const expected = process.env.ADMIN_PASSCODE;
  if (!expected) {
    throw new AV.Cloud.Error('ADMIN_PASSCODE is not configured', { status: 500 });
  }
  if (!passcode || passcode !== expected) {
    throw new AV.Cloud.Error('Invalid admin passcode', { status: 403 });
  }
}

function assertValidParams({ date, slotId, role, targetName }) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '')) {
    throw new AV.Cloud.Error('Invalid date', { status: 400 });
  }
  if (!SLOT_IDS.includes(slotId)) {
    throw new AV.Cloud.Error('Invalid slotId', { status: 400 });
  }
  if (!ROLES.includes(role)) {
    throw new AV.Cloud.Error('Invalid role', { status: 400 });
  }
  if (!targetName || typeof targetName !== 'string') {
    throw new AV.Cloud.Error('Invalid targetName', { status: 400 });
  }
}

AV.Cloud.define('adminPing', async request => {
  assertAdmin(request.params.passcode);
  return { ok: true };
});

AV.Cloud.define('adminDeleteBooking', async request => {
  const { passcode, date, slotId, role, targetName } = request.params;
  assertAdmin(passcode);
  assertValidParams({ date, slotId, role, targetName });

  const query = new AV.Query('Booking');
  query.equalTo('date', date);
  const booking = await query.first({ useMasterKey: true });

  if (!booking) {
    throw new AV.Cloud.Error('Booking date not found', { status: 404 });
  }

  const slots = booking.get('slots') || {};
  const slot = slots[slotId];
  if (!slot) {
    throw new AV.Cloud.Error('Slot not found', { status: 404 });
  }

  if (role === 'booker') {
    if (slot.booker !== targetName) {
      throw new AV.Cloud.Error('Booker does not match targetName', { status: 409 });
    }
    slot.booker = null;
  } else {
    const followers = Array.isArray(slot.followers) ? slot.followers : [];
    if (!followers.includes(targetName)) {
      throw new AV.Cloud.Error('Follower does not match targetName', { status: 409 });
    }
    slot.followers = followers.filter(name => name !== targetName);
  }

  booking.set('slots', slots);
  await booking.save(null, { useMasterKey: true });

  return { ok: true, date, slotId, role, targetName };
});
