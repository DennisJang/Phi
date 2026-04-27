import { describe, it, expect } from 'vitest';
import {
  RESERVED_HANDLES,
  isReservedHandle,
  type ReservedGroup,
} from './reserved';

describe('RESERVED_HANDLES', () => {
  it('contains exactly 50 entries', () => {
    expect(RESERVED_HANDLES.size).toBe(50);
  });

  it('distributes 10 entries to each of the 5 groups', () => {
    const groups = Array.from(RESERVED_HANDLES.values());
    const counts: Record<ReservedGroup, number> = {
      system: 0,
      brand: 0,
      route: 0,
      common: 0,
      ownership: 0,
    };
    for (const g of groups) counts[g]++;
    expect(counts).toEqual({
      system: 10,
      brand: 10,
      route: 10,
      common: 10,
      ownership: 10,
    });
  });
});

describe('isReservedHandle', () => {
  it.each<[string, ReservedGroup]>([
    ['admin', 'system'],
    ['phibook', 'brand'],
    ['u', 'route'],
    ['help', 'common'],
    ['root', 'ownership'],
  ])('matches %s in group %s', (handle, group) => {
    expect(isReservedHandle(handle)).toEqual({ handle, group });
  });

  it('lookup is case-insensitive and normalizes to lowercase', () => {
    expect(isReservedHandle('PHI')).toEqual({ handle: 'phi', group: 'brand' });
    expect(isReservedHandle('Admin')).toEqual({ handle: 'admin', group: 'system' });
  });

  it('trims surrounding whitespace before lookup', () => {
    expect(isReservedHandle('  admin  ')).toEqual({
      handle: 'admin',
      group: 'system',
    });
  });

  it('returns null for empty input', () => {
    expect(isReservedHandle('')).toBeNull();
    expect(isReservedHandle('   ')).toBeNull();
  });

  it('does NOT match by prefix — "book" is not the route entry "b"', () => {
    expect(isReservedHandle('book')).toBeNull();
  });

  it('returns null for non-reserved handles', () => {
    expect(isReservedHandle('valid_user_handle')).toBeNull();
    expect(isReservedHandle('dennis_jang')).toBeNull();
  });
});
