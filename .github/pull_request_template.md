## What changed

<!-- 1–3 sentence summary -->

## Phi 3×3×3 check

- Primitive touched: <!-- Book / Shelf / Card / none (infra) -->
- Loop served: <!-- Acquire / Read / Show / none (infra) -->
- Law: <!-- 1 read-to-beautify / 2 records-in-whitespace / 3 narrative-over-numbers / n/a -->
- Invariants preserved (all three): <!-- yes / note exception -->

## Boundary check

- [ ] `components/**` and `app/**` do NOT import `@supabase/supabase-js` or `@/lib/supabase/repositories/*`
- [ ] New data access goes through `@/lib/repository/*`
- [ ] Domain types in `@/types/*`; DB row shapes confined to `@/lib/supabase/repositories/*`

## Verification

- [ ] `npm run build` passes
- [ ] `npx next lint` passes
- [ ] Manual smoke: `/bookshelf` renders seeded books
- [ ] (if dev routes touched) `/api/dev/seed` wipe+reseed works

## Notes

<!-- tradeoffs, deferred work, anything strategist should know for doc updates -->
