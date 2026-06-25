import { Global, Module } from '@nestjs/common';
import { FinanceGateway } from './finance.gateway';

@Global()
@Module({
  providers: [FinanceGateway],
  exports: [FinanceGateway],
})
export class SocketModule {}