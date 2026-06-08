/**
 * Money Value Object for high-precision financial calculations.
 * Avoids floating-point issues by using integer-based cents or high-precision math.
 */
export class Money {
  private readonly amount: number; // Stored in cents/smallest unit
  private readonly currency: string;

  constructor(amountInSmallestUnit: number, currency: string = 'IDR') {
    this.amount = Math.round(amountInSmallestUnit);
    this.currency = currency.toUpperCase();
  }

  /**
   * Factory method for creating Money from a decimal value (e.g., 100.50)
   */
  static fromDecimal(amount: number, currency: string = 'IDR'): Money {
    // Assuming 2 decimal places for now (standard for IDR, USD)
    return new Money(amount * 100, currency);
  }

  /**
   * Returns the amount in the base unit (e.g., 100.50)
   */
  toDecimal(): number {
    return this.amount / 100;
  }

  /**
   * Returns the amount in the smallest unit (e.g., 10050)
   */
  getAmount(): number {
    return this.amount;
  }

  getCurrency(): string {
    return this.currency;
  }

  add(other: Money): Money {
    this.checkCurrency(other);
    return new Money(this.amount + other.getAmount(), this.currency);
  }

  subtract(other: Money): Money {
    this.checkCurrency(other);
    return new Money(this.amount - other.getAmount(), this.currency);
  }

  multiply(factor: number): Money {
    return new Money(this.amount * factor, this.currency);
  }

  equals(other: Money): boolean {
    return this.amount === other.getAmount() && this.currency === other.getCurrency();
  }

  isGreaterThan(other: Money): boolean {
    this.checkCurrency(other);
    return this.amount > other.getAmount();
  }

  private checkCurrency(other: Money): void {
    if (this.currency !== other.getCurrency()) {
      throw new Error(`Currency mismatch: ${this.currency} vs ${other.getCurrency()}`);
    }
  }

  /**
   * Formats the money string based on locale
   */
  format(locale: string = 'id-ID'): string {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: this.currency,
    }).format(this.toDecimal());
  }
}
