/**
 * Saved / Bookmarks source contract.
 * Confirms routes, empty copy, last-intent user binding, and that
 * password-recovery and account-suspension selftests stay in npm run selftest.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (path) => readFileSync(join(root, path), 'utf8');

const sidebar = read('src/components/layout/AppSidebar.tsx');
const navigator = read('src/navigation/RootNavigator.tsx');
const types = read('src/navigation/types.ts');
const savedApi = read('src/services/savedApi.ts');
const savedContext = read('src/context/SavedContext.tsx');
const screen = read('src/screens/saved/SavedScreen.tsx');
const bookmark = read('src/components/ui/BookmarkButton.tsx');
const pkg = read('package.json');
const app = read('App.tsx');

assert.match(sidebar, /label: 'My Connections'/);
assert.match(sidebar, /label: 'Saved', route: 'Saved'/);
assert.ok(
  sidebar.indexOf("label: 'My Connections'") < sidebar.indexOf("label: 'Saved'"),
);
assert.match(sidebar, /bookmark-outline/);
assert.equal(sidebar.includes("route: 'SavedPosts'"), false);

assert.match(types, /Saved: undefined/);
assert.match(navigator, /name="Saved"/);
assert.equal(navigator.includes('SavedPosts'), false);
assert.equal(navigator.includes('SavedJobs'), false);
assert.equal(navigator.includes('SavedServices'), false);

assert.match(savedApi, /\/posts\/\$\{id\}\/saves/);
assert.match(savedApi, /\/job-listings\/\$\{id\}\/saves/);
assert.match(savedApi, /\/services\/\$\{id\}\/saves/);
assert.match(savedApi, /\/saved\/posts/);
assert.match(savedApi, /\/saved\/jobs/);
assert.match(savedApi, /\/saved\/services/);
assert.match(savedApi, /return body\.isSaved/);
assert.equal(savedApi.includes('supabase'), false);

assert.match(savedContext, /userIdRef\.current !== currentUser/);
assert.match(savedContext, /epochs\.current/);
assert.match(savedContext, /boundUser/);
assert.match(savedContext, /shownLists/);
assert.match(savedContext, /slots\.current\.clear\(\)/);
assert.equal(savedContext.includes('useEffect'), false);
assert.match(savedContext, /emptyLists\(\)/);
assert.match(savedContext, /unsaveFromList/);
assert.match(savedContext, /active\.desired !== active\.confirmed/);
assert.equal(savedContext.includes('suspensionEpoch'), false);
assert.equal(savedContext.includes('supabase'), false);

assert.match(screen, /No saved posts yet\./);
assert.match(screen, /No saved jobs yet\./);
assert.match(screen, /No saved services yet\./);
assert.match(screen, /bucket\.error/);
assert.match(screen, /unsaveFromList/);
assert.match(screen, /Posts/);
assert.match(screen, /Jobs/);
assert.match(screen, /Services/);

assert.match(bookmark, /Save post/);
assert.match(bookmark, /Remove post from saved/);
assert.match(bookmark, /Save job/);
assert.match(bookmark, /Remove job from saved/);
assert.match(bookmark, /Save service/);
assert.match(bookmark, /Remove service from saved/);
assert.match(bookmark, /accessibilityRole="button"/);
assert.match(bookmark, /accessibilityState=\{\{ selected: saved \}\}/);

assert.match(app, /<SavedProvider>/);
assert.match(pkg, /password-recovery-selftest\.mjs/);
assert.match(pkg, /account-suspension-selftest\.mjs/);
assert.match(pkg, /saved-selftest\.mjs/);

const saveFiles = [
  'src/services/savedApi.ts',
  'src/context/SavedContext.tsx',
  'src/screens/saved/SavedScreen.tsx',
  'src/components/ui/BookmarkButton.tsx',
];
for (const path of saveFiles) {
  assert.equal(read(path).includes('supabase.from'), false, path);
}

console.log('saved-selftest ok');
