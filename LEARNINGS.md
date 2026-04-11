# Project Phi — Engineering Learnings

> Toolkit of debugging patterns and principles accumulated during
> development. Each item is phrased so it applies to future situations
> that look unrelated but share the same shape.
> Extracted from STATUS.md during 2026-04-11 prune.

---

## Debugging patterns

### One variable at a time (Step 3a)
When debugging 3D rotations, vary one axis only and confirm the visual
before touching the next. Trying two at once makes debugging impossible.
Generalizes to any multi-parameter system: isolate, confirm, advance.

### Inspect env vars with JSON.stringify (Step 4b)
Plain `console.log` hides leading/trailing whitespace, newlines, and
literal `<...>` auto-link brackets. The `.env.local` Markdown-bracket
infection was invisible until stringified. Length comparison against
the expected string is cheap and devastatingly effective.

### Truth source is `node_modules/<pkg>/**/*.d.ts` (Step 4b)
Documentation can advertise unreleased versions (colorthief v3 on
lokeshdhakar.com but only v2 on npm). When in doubt, read installed
types. Three places must agree: README + `npm view <pkg>` + installed
`.d.ts`. On disagreement, trust the installed file.

### Simplest tool matching problem structure wins (Step 4b)
colorthief's MMCQ was overkill for book covers where the background
color lives at edges by design. Four-corner sampling beat a
general-purpose perceptual quantizer because it matched the actual
data structure. Signal: when a "more advanced" library introduces
more failure modes than it solves, the problem may be simpler than
the library.

### Long debug sessions are usually environment, not code (Step 4b)
Of five hurdles in Step 4b, only one was code logic. The other four
were external environment or package quirks. When stuck, suspect the
environment first.

### Production-like testing closes ambiguity faster (Step 4b)
Codespaces TLS issue with `example.com` caused real alarm, but Vercel's
environment had no such problem. Push to preview deployment as soon as
type-check passes; don't try to make every local edge case green first.

---

## React + Next.js patterns

### Strict Mode isn't the bug, undefended effects are (Step 4c)
When `useEffect` kicks off a side effect that writes to a shared
resource (DB, server), a per-effect `cancelled` flag only blocks React
state updates — the in-flight network request still completes. The
correct defense is module-level de-duplication: an in-flight promise
all callers await. This pattern protects against Suspense, streaming,
concurrent mount, and accidental double-invocation in production. Any
"should only happen once per browser session" helper needs this shape.

### Next.js dev server doesn't always hot-reload new API routes (Step 4c)
Adding `app/api/<x>/route.ts` sometimes requires full `npm run dev`
restart for Next.js to register it. If a new route returns 404 when
the file clearly exists, suspect the dev server state first.

### App Router's "one route.ts per directory" is silent and absolute (Step 4c)
Placing a second `route.ts` in a directory that already has one does
not error — the second file is silently ignored. Always create a new
directory for a new API route.

---

## Security & validation patterns

### Client Content-Type is never a security boundary (Step 4c)
Shallow validation (declared MIME, declared size) only fails honest
mistakes cheaply. The real boundary is whatever actually decodes the
bytes — sharp in our case. A `.txt` file with `Content-Type: image/png`
passes shallow validation and is correctly caught by sharp with
`decode_failed`. Any upload route must rely on a decoder for security,
not on headers.

### RLS is the source of truth, not application code (Step 4c)
Once `covers_user_insert_own_folder` was in place, the upload route
did not re-check `path startsWith user_id` in TS. The policy enforces
it at the database level. Re-implementing the check in application
code would create a place for the two definitions to drift. Pattern
for any future RLS-scoped resource: policy is authoritative,
application code must not duplicate it.

---

## 3D / shader patterns

### onBeforeCompile injection points must match shader chunks (Step 4f)
First attempt injected at `<map_fragment>`, which is USE_MAP-gated.
Since we don't set `material.map`, the chunk was empty, `.replace()`
silently matched nothing, and the shader failed to compile with
`VALIDATE_STATUS false`. Fix: inject at `<color_fragment>` (always
present) and use a private `vCoverUv` varying — don't depend on
three.js's internal `vUv` (also USE_MAP-gated). Pattern: when patching
shader chunks via `onBeforeCompile`, only inject at chunks that are
unconditionally emitted.

### normalMap needs grazing light, not more amplitude (Step 4f)
Amplifying normalScale without adjusting lights just shifts the same
invisible wash brighter. `normalMap` encodes surface angle variation,
but those variations only become visible brightness differences when
`dot(normal, lightDir)` varies across them. With top-down key light
(y=6) hitting a vertical face, dot product is near-constant and the
map disappears. Lowering the key light to grazing angle (y=2) and
adding a horizontal fill light reveals the grain. Environment presets
wash this out by flooding from all angles — intensity must be kept
low (0.25) for detail to survive.

### Always prefer the texture resolution where one stripe ≥ 2 pixels (Step 4f)
`repeat.set(1, 120)` on a 4×256 texture placed each stripe below the
Nyquist limit — GPU bilinear couldn't resolve it and produced diagonal
moiré. Every repeating normalMap must budget ≥ 2 pixels per stripe at
target on-screen size, then rely on mipmaps for distance.

---

## Deferred issues (moved from STATUS known issues)

These are known limitations, tracked here so STATUS stays current-only.

### Cover proxy
- **Next.js "Failed to generate cache key" warning** on every response.
  Harmless; Next.js internal cache layer trying and failing to key on
  the response. No effect on output.
- **HTTP 502 collapses DNS failure and upstream 4xx/5xx**. Semantically
  different, but cover-proxy maps both to 502. Acceptable for Phase 1;
  Step 6 should differentiate when callers need to distinguish.
- **`error.cause` not propagated** in responses. Route returns
  `{ kind, message }`; deep TLS / DNS / certificate detail stays in
  server logs only.
- **SSRF defense absent** — cover-proxy will fetch any http(s) URL.
  Phase 1 safe because URL sources are internal. Step 6 must add
  allowlist before user-supplied URLs become a vector.
- **Codespaces TLS root CA gap** — `https://example.com` fetch fails
  with `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`. Local-only; production
  unaffected.

### Cover upload
- **`/dev/upload` is a scratch page**, not a Phase 1 deliverable.
  Delete at Phase 1 gate or replace with real BookAddDialog in Step 7.
- **Anonymous sign-in has no rate limit** — Phase 2 adds edge rate
  limiting.
- **Anonymous user cleanup not automated**. `auth.users` rows with
  `is_anonymous = true` accumulate. Manual cleanup during dev; add
  scheduled cleanup before Phase 1 gate.
- **Content-addressed storage has no GC**. Dangling Storage objects
  accumulate when Phase 2 adds book deletion. Wire deletion to Storage
  removal at that time.
- **`getSession()` vs `getUser()` subtlety** — server must use
  `getUser()` (verifies JWT); client can use `getSession()` (local
  cookie parse). Decision to authorize must always come from
  `getUser()`.

### Step 4f leftovers
- **Paper grain subtle**, not Stripe-Press dramatic. V-groove redesign
  deferred. Revisit with real iPad lighting in Phase 2.
- **Front cover uses ShaderMaterial** — no PBR scene light response on
  front face. Back and spine still PBR-lit. If discontinuity becomes
  visible on a full shelf, port to `onBeforeCompile` patching of
  meshStandardMaterial in Phase 2.
- **`DEV_TEST_COVER_URL` hardcoded** in BookshelfScene. Remove in
  Step 7 when the real add-book flow provides URLs from DB.
- **`image.aladin.co.kr` remotePattern** in `next.config.js` is a
  Step 4a legacy. Remove during Phase 1 gate review.
  ## Step 4d learnings

### JS object literal duplicate keys are silent overrides (Step 4d)
`next.config.js`에 `experimental` 키를 두 번 정의하면 뒤엣것이 앞엣것을
조용히 덮어쓴다. lint가 잡지 않으면 모르고 지나간다. 단일 객체 설정
파일에 옵션을 추가할 때는 기존 키를 먼저 grep해서 병합 여부를 확인할
것. 특히 `experimental`처럼 여러 기능이 모이는 키는 위험 — 한 줄 잘못
넣으면 sharp가 webpack에 번들링되면서 4b/4c가 통째로 깨진다.

### Don't assume signatures of modules in the same codebase (Step 4d)
"같은 레포에 있으니까 안다"는 익숙함의 환각. `processImage()`는
railway-oriented `Result` 패턴이고 `ProcessedImage` 필드는 `webpBuffer`
(not `webp`)이며, `lib/image/hash.ts`는 `hashImageBytes` (not `sha1`)를
export한다. 새 라우트가 기존 모듈을 재사용할 때는 `cat`/`grep`으로
실제 시그니처를 먼저 확인할 것. 추측 7개를 한 번에 깨는 데 5분이면
충분하다.

### Railway-oriented Result must not be wrapped in try-catch (Step 4d)
`Result<T, E>` 패턴으로 에러를 표현하는 함수를 try-catch로 감싸면
(1) 절대 던지지 않는 함수에 무용한 가드를 씌우는 것이고 (2) 타입 정보
풍부한 `E` discriminated union을 일반 메시지로 뭉갠다. 호출자도 같은
패턴으로 받아 `if (!result.ok) return ...`로 분기하고 `result.error`를
그대로 전파해야 정보 손실이 없다.

### 4-corner dominantColor sampling assumes edge-solid covers (Step 4d)
`coverPipeline.ts`의 client-side 4-corner 샘플링은 "Aladin 책 표지처럼
가장자리가 솔리드 단색"이라는 구조적 가정 위에 서 있다. typographic
cover는 가장자리에 vignette + 중앙에 dominant 색상이라 이 가정이
깨진다. 결과: 본문은 와인색(`#4B203E`)인데 letterbox는 분홍/라일락으로
샘플링됨. **Phase 2에서 cover 파이프라인 통합 시 반드시 해결**:
typographic cover는 vignette 제거하거나, dominantColor 추출 전략을
"중앙 영역 평균"으로 분기하거나, generator가 dominantColor를 직접
반환해서 클라이언트 재계산을 우회해야 한다.