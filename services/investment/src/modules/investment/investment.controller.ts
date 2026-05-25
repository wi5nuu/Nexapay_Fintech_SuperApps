import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiOkResponse,
  ApiCreatedResponse,
} from '@nestjs/swagger';
import { InvestmentService } from './investment.service';
import { BuyInvestmentDto } from './dto/buy-investment.dto';
import { WithdrawInvestmentDto } from './dto/withdraw-investment.dto';
import { ProductEntity } from './entities/product.entity';

@ApiTags('Investments')
@ApiBearerAuth()
@Controller()
export class InvestmentController {
  constructor(private readonly investmentService: InvestmentService) {}

  @Get('products')
  @ApiOperation({ summary: 'List all investment products' })
  @ApiOkResponse({ type: [ProductEntity] })
  async getProducts(
    @Query('type') type?: string,
    @Query('riskLevel') riskLevel?: string,
  ): Promise<ProductEntity[]> {
    return this.investmentService.getProducts({ type, riskLevel });
  }

  @Get('products/:id')
  @ApiOperation({ summary: 'Get product by ID' })
  @ApiOkResponse({ type: ProductEntity })
  async getProductById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ProductEntity> {
    return this.investmentService.getProductById(id);
  }

  @Post('investments/buy')
  @ApiOperation({ summary: 'Purchase an investment product' })
  @ApiCreatedResponse({ description: 'Investment created successfully' })
  @HttpCode(HttpStatus.CREATED)
  async buyInvestment(
    @Body() dto: BuyInvestmentDto,
  ): Promise<Record<string, unknown>> {
    return this.investmentService.buyInvestment(dto);
  }

  @Get('investments/portfolio')
  @ApiOperation({ summary: 'Get user portfolio' })
  @ApiOkResponse({ description: 'User portfolio with all investments' })
  async getPortfolio(
    @Query('userId') userId: string,
  ): Promise<Record<string, unknown>> {
    return this.investmentService.getPortfolio(userId);
  }

  @Get('investments/:id')
  @ApiOperation({ summary: 'Get investment by ID' })
  @ApiOkResponse({ description: 'Investment details' })
  async getInvestmentById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<Record<string, unknown>> {
    return this.investmentService.getInvestmentById(id);
  }

  @Post('investments/:id/withdraw')
  @ApiOperation({ summary: 'Withdraw an investment' })
  @ApiOkResponse({ description: 'Investment withdrawn' })
  @HttpCode(HttpStatus.OK)
  async withdrawInvestment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: WithdrawInvestmentDto,
  ): Promise<Record<string, unknown>> {
    return this.investmentService.withdrawInvestment(id, dto);
  }
}
