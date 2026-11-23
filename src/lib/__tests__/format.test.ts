import { describe, expect, it } from 'vitest';
import { ago, fmt, fmtShort } from '../format';

describe('fmt', () => {
  it('uses ₹ and Indian digit grouping', () => {
    expect(fmt(150000)).toBe('₹1,50,000');
    expect(fmt(89896)).toBe('₹89,896');
    expect(fmt(50000000000)).toBe('₹50,00,00,00,000');
    expect(fmt(999)).toBe('₹999');
    expect(fmt(0)).toBe('₹0');
  });
  it('rounds to whole rupees', () => {
    expect(fmt(7509.6)).toBe('₹7,510');
  });
  it('shows a dash for missing values', () => {
    expect(fmt(null)).toBe('—');
    expect(fmt(undefined)).toBe('—');
    expect(fmt(NaN)).toBe('—');
  });
  it('puts the minus before the ₹', () => {
    expect(fmt(-640)).toBe('-₹640');
  });
});

describe('fmtShort', () => {
  it('uses lakh and crore for large amounts', () => {
    expect(fmtShort(380000)).toBe('₹3.8L');
    expect(fmtShort(100000)).toBe('₹1L');
    expect(fmtShort(25000000)).toBe('₹2.5Cr');
  });
  it('keeps full Indian grouping under a lakh', () => {
    expect(fmtShort(42150)).toBe('₹42,150');
  });
});

describe('ago', () => {
  const now = Date.UTC(2026, 10, 23, 12);
  it('reads as minutes, hours, days', () => {
    expect(ago(now - 30e3, now)).toBe('just now');
    expect(ago(now - 5 * 60e3, now)).toBe('5m ago');
    expect(ago(now - 2 * 3600e3, now)).toBe('2h ago');
    expect(ago(now - 3 * 86400e3, now)).toBe('3d ago');
  });
});
