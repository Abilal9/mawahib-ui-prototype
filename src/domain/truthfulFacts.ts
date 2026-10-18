/**
 * Pure display and create rules for user-visible facts.
 * Missing data stays absent. These helpers do not invent a substitute fact.
 */

export function displayCategory(
  category: string | null | undefined,
): string | null {
  const trimmed = category?.trim() ?? '';
  return trimmed.length > 0 ? trimmed : null;
}

/** A missing price is null. A real 0 stays 0. */
export function displayPrice(
  price: number | null | undefined,
): number | null {
  if (typeof price !== 'number' || !Number.isFinite(price)) return null;
  return price;
}

/**
 * Own profile omits userId so Service Detail stays in owner mode.
 * Every other provider is passed explicitly.
 */
export function serviceDetailRoute(
  serviceId: string,
  providerId: string,
  viewerId: string,
): { serviceId: string; userId?: string } {
  if (providerId === viewerId) return { serviceId };
  return { serviceId, userId: providerId };
}

export function postedJobCreate(input: {
  title: string;
  location?: string | null;
  description?: string | null;
}): { title: string; location: string; description: string } {
  const title = input.title.trim();
  const location = input.location?.trim() ?? '';
  if (!title) throw new Error('Enter a job title.');
  if (!location) throw new Error('Enter a job location.');
  return {
    title,
    location,
    description: input.description?.trim() ?? '',
  };
}

export function requiredTitle(value: string, label: string): string {
  const trimmed = value.trim();
  if (!trimmed) throw new Error(`Enter a ${label}.`);
  return trimmed;
}

export type ServicePackageName = 'Basic' | 'Standard' | 'Premium';

export type ServicePackageDraft = {
  name: ServicePackageName;
  price: string;
  delivery: string;
  features: string[];
  required: boolean;
};

export function buildServicePackages(
  drafts: ServicePackageDraft[],
  parsePrice: (value: string) => number | null,
): {
  name: ServicePackageName;
  price: number;
  deliveryLabel: string;
  includes: string[];
}[] {
  const included = drafts.filter((draft) => {
    const started =
      draft.price.trim().length > 0 ||
      draft.delivery.trim().length > 0 ||
      draft.features.some((feature) => feature.trim().length > 0);
    return draft.required || started;
  });

  return included.map((draft) => {
    const price = parsePrice(draft.price);
    const deliveryLabel = draft.delivery.trim();
    const includes = draft.features.map((feature) => feature.trim()).filter(Boolean);
    if (price === null) {
      throw new Error(`Enter a price for ${draft.name}.`);
    }
    if (!deliveryLabel) {
      throw new Error(`Enter a delivery time for ${draft.name}.`);
    }
    if (includes.length === 0) {
      throw new Error(`Add at least one included item for ${draft.name}.`);
    }
    return { name: draft.name, price, deliveryLabel, includes };
  });
}
