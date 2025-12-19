function normalizeWhatsappNumber(number) {
  return String(number || '').replace(/\D/g, '');
}

function buildBookingMessage({
  agencyName,
  name,
  age,
  gender,
  phone,
  email,
  passportNumber,
  passportExpiry,
  packageTitle,
  travelers,
  preferredMonth,
  notes
}) {
  const lines = [];
  lines.push(`Booking Request – ${agencyName}`);
  lines.push('');
  lines.push(`Name: ${name}`);
  lines.push(`Age/Gender: ${age}, ${gender}`);
  lines.push(`Phone: ${phone}`);
  if (email) lines.push(`Email: ${email}`);
  lines.push(`Passport: ${passportNumber}, Exp: ${passportExpiry}`);
  lines.push('');
  lines.push(`Package: ${packageTitle}`);
  lines.push(`Travelers: ${travelers}`);
  lines.push(`Preferred Month: ${preferredMonth}`);
  if (notes) {
    lines.push('');
    lines.push(`Notes: ${notes}`);
  }
  return lines.join('\n');
}

function buildWhatsappLink({ number, message }) {
  const normalized = normalizeWhatsappNumber(number);
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${normalized}?text=${encoded}`;
}

module.exports = {
  normalizeWhatsappNumber,
  buildBookingMessage,
  buildWhatsappLink
};
