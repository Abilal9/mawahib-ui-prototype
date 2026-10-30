import { catalogService } from '../services/catalogService';
import { jobService } from '../services/jobService';
import { resetTaxonomyCache } from '../services/taxonomyApi';

/**
 * Clears persona-specific module caches when leaving the authenticated tree.
 * Guest discovery does not use these caches in Phase E; this only prevents
 * account A data from surviving into a later signed-out/Guest session.
 */
export function resetPrivateModuleCaches(): void {
  catalogService.clearLocalCaches();
  jobService.clearLocalCaches();
  resetTaxonomyCache();
}
