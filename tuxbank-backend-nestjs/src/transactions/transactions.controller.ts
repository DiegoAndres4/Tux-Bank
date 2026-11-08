import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import * as express from 'express';
import { TransactionsService } from './transactions.service';
import { TransferDto } from './dto/transfer.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('transactions')
@UseGuards(JwtAuthGuard)
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post('transferir')
  @HttpCode(HttpStatus.OK)
  async transferir(
    @Req() req: express.Request,
    @Body() transferDto: TransferDto,
  ) {
    const user = req.user as { userId: string };
    return this.transactionsService.transferir(user.userId, transferDto);
  }

  @Get('historial')
  async getHistorial(@Req() req: express.Request) {
    const user = req.user as { userId: string };
    return this.transactionsService.getHistorial(user.userId);
  }
}
