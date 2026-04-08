'use client';

/**
 * PerfPanel — FPS/drawcall/memory overlay for development.
 *
 * Why a wrapper:
 * r3f-perf is a dev-only dependency. Guarding with NODE_ENV ensures
 * the import is tree-shaken from production bundles. Never ship a
 * perf overlay to users.
 */

import { Perf } from 'r3f-perf';

export function PerfPanel() {
  if (process.env.NODE_ENV !== 'development') return null;
  return <Perf position="top-left" />;
}