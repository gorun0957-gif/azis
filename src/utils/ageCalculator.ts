export function calculateAge(birthDateString: string): { years: number; months: number; days: number; text: string } {
  if (!birthDateString) {
    return { years: 0, months: 0, days: 0, text: '-' };
  }

  const birthDate = new Date(birthDateString);
  if (isNaN(birthDate.getTime())) {
    return { years: 0, months: 0, days: 0, text: '-' };
  }

  const today = new Date();
  let years = today.getFullYear() - birthDate.getFullYear();
  let months = today.getMonth() - birthDate.getMonth();
  let days = today.getDate() - birthDate.getDate();

  if (days < 0) {
    months--;
    const prevMonthLastDay = new Date(today.getFullYear(), today.getMonth(), 0).getDate();
    days += prevMonthLastDay;
  }

  if (months < 0) {
    years--;
    months += 12;
  }

  if (years < 0) {
    return { years: 0, months: 0, days: 0, text: 'Baru lahir' };
  }

  if (years === 0) {
    if (months === 0) {
      return { years, months, days, text: `${days} Hari` };
    }
    return { years, months, days, text: `${months} Bln ${days > 0 ? `${days} Hr` : ''}`.trim() };
  }

  if (years < 5) {
    if (months === 0) {
      return { years, months, days, text: `${years} Tahun` };
    }
    return { years, months, days, text: `${years} Thn ${months} Bln` };
  }

  return { years, months, days, text: `${years} Tahun` };
}

export function formatIndoDate(dateString: string): string {
  if (!dateString) return '-';
  try {
    const parts = dateString.split('-');
    if (parts.length === 3) {
      const year = parts[0];
      const monthIndex = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const months = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
      ];
      if (monthIndex >= 0 && monthIndex < 12) {
        return `${day} ${months[monthIndex]} ${year}`;
      }
    }
    const d = new Date(dateString);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    }
    return dateString;
  } catch {
    return dateString;
  }
}
