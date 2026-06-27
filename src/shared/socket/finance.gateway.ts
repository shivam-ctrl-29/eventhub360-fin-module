import {
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnGatewayInit,
    WebSocketGateway,
    WebSocketServer,
  } from '@nestjs/websockets';
  import { Logger } from '@nestjs/common';
  import { Server, Socket } from 'socket.io';
  
  @WebSocketGateway({
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
    namespace: '/finance',
  })
  export class FinanceGateway
    implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
  {
    @WebSocketServer()
    server: Server;
  
    private readonly logger = new Logger(FinanceGateway.name);
    private connectedClients = 0;
  
    afterInit(): void {
      this.logger.log('Finance WebSocket gateway initialized');
    }
  
    handleConnection(client: Socket): void {
      this.connectedClients++;
      this.logger.debug(`Client connected: ${client.id} | Total: ${this.connectedClients}`);
    }
  
    handleDisconnect(client: Socket): void {
      this.connectedClients--;
      this.logger.debug(`Client disconnected: ${client.id} | Total: ${this.connectedClients}`);
    }
  
    emit(event: string, data: unknown): void {
      this.server.emit(event, data);
    }
  
    emitToRoom(room: string, event: string, data: unknown): void {
      this.server.to(room).emit(event, data);
    }
  
    getConnectedClientsCount(): number {
      return this.connectedClients;
    }
  }