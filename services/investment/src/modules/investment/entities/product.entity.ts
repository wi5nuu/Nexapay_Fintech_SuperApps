import { ApiProperty } from '@nestjs/swagger';

export class ProductEntity {
  @ApiProperty({ description: 'Product ID', example: '1' })
  id: string;

  @ApiProperty({ description: 'Product name', example: 'Growth Mutual Fund' })
  name: string;

  @ApiProperty({
    description: 'Product type',
    enum: ['MUTUAL_FUND', 'BOND', 'DEPOSIT'],
    example: 'MUTUAL_FUND',
  })
  type: string;

  @ApiProperty({
    description: 'Product description',
    example: 'A diversified growth mutual fund',
  })
  description: string;

  @ApiProperty({
    description: 'Minimum investment amount',
    example: 1000,
  })
  minInvestment: number;

  @ApiProperty({
    description: 'Maximum investment amount',
    example: 1000000,
  })
  maxInvestment: number;

  @ApiProperty({
    description: 'Expected annual return percentage',
    example: 12.5,
  })
  expectedReturn: number;

  @ApiProperty({
    description: 'Risk level',
    enum: ['LOW', 'MEDIUM', 'HIGH'],
    example: 'MEDIUM',
  })
  riskLevel: string;

  @ApiProperty({
    description: 'Product status',
    enum: ['ACTIVE', 'INACTIVE', 'SOLD_OUT'],
    example: 'ACTIVE',
  })
  status: string;

  constructor(data: ProductEntityData) {
    this.id = data.id;
    this.name = data.name;
    this.type = data.type;
    this.description = data.description;
    this.minInvestment = data.minInvestment;
    this.maxInvestment = data.maxInvestment;
    this.expectedReturn = data.expectedReturn;
    this.riskLevel = data.riskLevel;
    this.status = data.status;
  }
}

export interface ProductEntityData {
  id: string;
  name: string;
  type: string;
  description: string;
  minInvestment: number;
  maxInvestment: number;
  expectedReturn: number;
  riskLevel: string;
  status: string;
}
