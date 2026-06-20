import { Logger } from '@nestjs/common';
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

/**
 * RealtimeGateway — socket.io namespace `/realtime`
 *
 * Authentication: clients must send `{ token: '<JWT>' }` in the socket
 * handshake `auth` object. The gateway validates the token on connection.
 *
 * Events emitted by the server:
 *   message:new        { messageId, schoolId, title, type }
 *   receipt:updated    { messageId, pupilId, readAt, acknowledgedAt }
 *   notification:new   { notificationId, title, body }
 *
 * Rooms:
 *   school:<schoolId>  — all members of a school
 *   user:<userId>      — individual user notifications
 */
@WebSocketGateway({
  namespace: '/realtime',
  cors: { origin: '*', credentials: true },
})
export class RealtimeGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(RealtimeGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  afterInit() {
    this.logger.log('RealtimeGateway initialised at /realtime');
  }

  async handleConnection(client: Socket) {
    try {
      const token =
        (client.handshake.auth as Record<string, string | undefined>)['token'] ??
        (client.handshake.headers['authorization'] as string | undefined)?.replace('Bearer ', '');

      if (!token) throw new Error('No token provided');

      const payload = this.jwtService.verify<{ sub: string }>(token, {
        secret: this.config.getOrThrow('JWT_ACCESS_SECRET'),
      });

      // Store userId on socket for room assignment
      (client as Socket & { userId: string }).userId = payload.sub;

      await client.join(`user:${payload.sub}`);
      this.logger.debug(`Client connected: ${client.id} userId=${payload.sub}`);
    } catch (err) {
      this.logger.warn(`Rejected socket ${client.id}: ${(err as Error).message}`);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`Client disconnected: ${client.id}`);
  }

  // ── Client-initiated: join school room ─────────────────────────────────

  @SubscribeMessage('school:join')
  handleJoinSchool(
    @MessageBody() data: { schoolId: string },
    @ConnectedSocket() client: Socket,
  ) {
    void client.join(`school:${data.schoolId}`);
    this.logger.debug(`${client.id} joined school:${data.schoolId}`);
    return { event: 'school:joined', data: { schoolId: data.schoolId } };
  }

  // ── Server-side emitters (called from other services) ─────────────────

  emitNewMessage(schoolId: string, payload: unknown) {
    this.server.to(`school:${schoolId}`).emit('message:new', payload);
  }

  emitReceiptUpdated(userId: string, payload: unknown) {
    this.server.to(`user:${userId}`).emit('receipt:updated', payload);
  }

  emitNotification(userId: string, payload: unknown) {
    this.server.to(`user:${userId}`).emit('notification:new', payload);
  }
}
