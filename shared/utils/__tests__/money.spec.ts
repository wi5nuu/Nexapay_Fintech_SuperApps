import { Money } from './money';

describe('Money Value Object', () => {
  it('should add two money objects with the same currency', () => {
    const m1 = new Money(1000, 'IDR');
    const m2 = new Money(2000, 'IDR');
    const result = m1.add(m2);
    expect(result.getAmount()).toBe(3000);
  });

  it('should throw error on currency mismatch', () => {
    const m1 = new Money(1000, 'IDR');
    const m2 = new Money(2000, 'USD');
    expect(() => m1.add(m2)).toThrow('Currency mismatch');
  });
});
