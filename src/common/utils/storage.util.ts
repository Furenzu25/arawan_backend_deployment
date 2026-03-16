export function slugify(name: string): string {
  return (
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'unknown'
  );
}

export function loanIdShort(loanId: string): string {
  return loanId.slice(0, 8);
}

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getAgreementSignaturePath(
  customerSlug: string,
  loanId: string,
  date: Date,
): string {
  return `signatures/${customerSlug}/${loanIdShort(loanId)}/agreement_${formatDate(date)}.png`;
}

export function getPaymentSignaturePath(
  customerSlug: string,
  loanId: string,
  dayNumber: number,
  date: Date,
): string {
  return `signatures/${customerSlug}/${loanIdShort(loanId)}/day${dayNumber}_${formatDate(date)}.png`;
}

export function getProfilePhotoPath(
  customerSlug: string,
  customerId: string | null,
  ext: string,
  timestamp?: number,
): string {
  const suffix = customerId ?? String(timestamp ?? Date.now());
  return `profiles/${customerSlug}_${suffix}.${ext}`;
}
