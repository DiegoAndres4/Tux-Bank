import {
  Controller,
  Get,
  Post,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import * as express from 'express';
import { AccountsService } from './accounts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('accounts')
@UseGuards(JwtAuthGuard)
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Post('crear')
  @HttpCode(HttpStatus.CREATED)
  async createAccount(@Req() req: express.Request) {
    const user = req.user as { userId: string; email: string; rol: string };
    return this.accountsService.createAccount(user.userId);
  }

  @Get('mi-cuenta')
  async getMyAccount(@Req() req: express.Request) {
    const user = req.user as { userId: string; email: string; rol: string };
    return this.accountsService.getAccountByUserId(user.userId);
  }

  @Get('todas')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async getAllAccounts() {
    return this.accountsService.getAllAccounts();
  }
}