import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { KycService } from './kyc.service';
import { SubmitKycDto } from './dto/submit-kyc.dto';
import { ReviewKycDto } from './dto/review-kyc.dto';

@ApiTags('KYC')
@ApiBearerAuth()
@Controller('kyc')
export class KycController {
  constructor(private readonly kycService: KycService) {}

  @Post('submit')
  @ApiOperation({ summary: 'Submit KYC documents for verification' })
  async submitKyc(@Req() req: Request, @Body() dto: SubmitKycDto) {
    const userId = req['userId'] as string;
    return this.kycService.submitKyc(userId, dto);
  }

  @Get('status')
  @ApiOperation({ summary: 'Get current user KYC status' })
  async getKycStatus(@Req() req: Request) {
    const userId = req['userId'] as string;
    return this.kycService.getKycStatus(userId);
  }

  @Post(':id/review')
  @ApiOperation({ summary: 'Review and approve/reject KYC (admin/compliance)' })
  async reviewKyc(
    @Param('id') id: string,
    @Body() dto: ReviewKycDto,
    @Req() req: Request,
  ) {
    const reviewerId = req['userId'] as string;
    return this.kycService.reviewKyc(id, dto, reviewerId);
  }

  @Get('pending')
  @ApiOperation({ summary: 'List all pending KYC submissions (admin/compliance)' })
  async getPendingKycs() {
    return this.kycService.getPendingKycs();
  }
}
