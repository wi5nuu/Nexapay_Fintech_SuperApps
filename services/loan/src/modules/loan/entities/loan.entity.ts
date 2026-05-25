import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum LoanStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  ACTIVE = 'ACTIVE',
  REJECTED = 'REJECTED',
  COMPLETED = 'COMPLETED',
  DEFAULTED = 'DEFAULTED',
}

export enum RepaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  LATE = 'LATE',
  DEFAULTED = 'DEFAULTED',
}

export class RepaymentEntity {
  @ApiProperty()
  id: string;

  @ApiProperty()
  loanId: string;

  @ApiProperty()
  dueDate: Date;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  paidAmount: number;

  @ApiProperty({ enum: RepaymentStatus })
  status: RepaymentStatus;

  @ApiPropertyOptional()
  paidAt?: Date;

  @ApiProperty()
  penaltyAmount: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class LoanEntity {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  interestRate: number;

  @ApiProperty()
  termMonths: number;

  @ApiProperty({ enum: LoanStatus })
  status: LoanStatus;

  @ApiProperty()
  purpose: string;

  @ApiPropertyOptional()
  creditScore?: number;

  @ApiPropertyOptional()
  monthlyPayment?: number;

  @ApiPropertyOptional()
  totalPayable?: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional()
  approvedAt?: Date;

  @ApiPropertyOptional()
  approvedBy?: string;

  @ApiPropertyOptional()
  rejectedAt?: Date;

  @ApiPropertyOptional()
  rejectedBy?: string;

  @ApiPropertyOptional()
  rejectedReason?: string;

  @ApiPropertyOptional()
  disbursedAt?: Date;

  @ApiProperty({ type: [RepaymentEntity] })
  repayments: RepaymentEntity[];
}

export class CreditScoreEntity {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  score: number;

  @ApiProperty()
  factors: Record<string, unknown>;

  @ApiProperty()
  lastUpdated: Date;

  @ApiProperty()
  createdAt: Date;
}
