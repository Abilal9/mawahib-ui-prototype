/**
 * Engagement money helpers. The API returns `chargeableTotal` as the canonical
 * amount to charge (package + add-ons) — never derive the payable amount from
 * `packagePrice` or from a free-text label. Dependency-free so selftests can
 * import it directly.
 */

export interface ChargeableDetail {
  packagePrice?: string | number | null;
  chargeableTotal?: string | number | null;
  currency?: string | null;
  addons?: unknown;
}

function toAmount(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const num = typeof value === 'number' ? value : Number(String(value).trim());
  if (!Number.isFinite(num)) return null;
  return Math.round(num * 100) / 100;
}

/** Amount to charge, or null when absent / not payable (<= 0). */
export function chargeableAmount(
  detail: ChargeableDetail | null | undefined,
): number | null {
  const amount = toAmount(detail?.chargeableTotal);
  return amount !== null && amount > 0 ? amount : null;
}

export interface AddonLine {
  id: string;
  title: string;
  amount: number;
}

/** Add-on rows for the summary, tolerant of both `{money}` and `{price}` shapes. */
export function addonLines(addons: unknown): AddonLine[] {
  if (!Array.isArray(addons)) return [];
  return addons.map((raw, index) => {
    const row = (raw && typeof raw === 'object' ? raw : {}) as Record<
      string,
      unknown
    >;
    const money = row.money as { amount?: unknown } | undefined;
    const amount =
      toAmount(money?.amount) ??
      toAmount(
        typeof row.price === 'string'
          ? row.price.replace(/,/g, '').match(/-?\d+(?:\.\d+)?/)?.[0]
          : row.price,
      ) ??
      0;
    return {
      id: typeof row.id === 'string' ? row.id : `addon-${index}`,
      title:
        typeof row.title === 'string' && row.title
          ? row.title
          : typeof row.name === 'string' && row.name
            ? row.name
            : 'Add-on',
      amount,
    };
  });
}
