export const rates = { membership: 1500, monthly: 1800 };
export const classes = [
  { day: 'Monday', name: 'Mixed Dance Class', coach: 'Ashley', time: '6:00 PM' },
  { day: 'Tuesday', name: 'Hip Hop Dance and Dance Work-out', coach: 'Micko', time: '6:00 PM' },
  { day: 'Wednesday', name: 'Mixed Dance Class', coach: 'Ashley', time: '6:00 PM' },
  { day: 'Thursday', name: 'Hip Hop Dance and Dance Work-out', coach: 'Micko', time: '6:30 PM' },
  { day: 'Friday', name: 'Zumba Class', coach: 'JL John', time: '6:00 PM' },
];
export const coaches = [
  { name: 'Domz', image: 'coach-domz.png', detail: '19 years in fitness · 12 years coaching', qualifications: ['19 years in the fitness industry', '12 years as a fitness coach', 'Certified Personal Trainer', 'Certified in Nutrition Guidance', 'AED and Basic Life Support'] },
  { name: 'Paul', image: 'coach-paul.png', detail: 'Personal training & nutrition', qualifications: ['Certification in Sports Biomechanics', 'NASM Accredited Certification in Nutrition', 'Gold’s Gym Certification', 'Emergency First Aid and BLS with AED'] },
];
export const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const peso = value => '₱' + Number(value).toLocaleString('en-PH');
export function manilaDate(now = new Date()) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {timeZone:'Asia/Manila',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now).map(p => [p.type,p.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}
export function validateWorkout(data) {
  const date = String(data.trained_on || ''), exercise = String(data.exercise || '').trim();
  const weight = Number(data.weight_kg), reps = Number(data.reps);
  if (!exercise || exercise.length > 80) throw new Error('Enter an exercise with 1–80 characters.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date)) || new Date(date).toISOString().slice(0,10) !== date || date > manilaDate() || date < '2000-01-01') throw new Error('Choose a valid training date up to today.');
  if (data.weight_kg === '' || !Number.isFinite(weight) || weight < 0 || weight > 500) throw new Error('Weight must be between 0 and 500 kg.');
  if (!Number.isInteger(reps) || reps < 1 || reps > 100) throw new Error('Repetitions must be a whole number from 1 to 100.');
  return {trained_on:date,exercise,weight_kg:weight,reps};
}
export function membershipLabel(profile, today = manilaDate()) {
  if (profile.membership_status === 'active' && profile.valid_until && profile.valid_until >= today) return 'Active';
  if (profile.membership_status === 'active' || profile.membership_status === 'expired') return 'Expired';
  return 'Pending activation';
}
