import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Logger, UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import * as jwt from 'jsonwebtoken';
import { LeaderboardService } from './leaderboard.service';
import { LeaderboardPayload } from './dto/leaderboard.dto';

/** Shape of the decoded JWT payload (matches JwtStrategy.validate output) */
interface JwtPayload {
  sub: string;
  name: string;
  role: string;
}

/** Data we attach to each Socket so we don't re-decode on every message */
interface AuthenticatedSocket extends Socket {
  data: {
    userId?: string;
    userName?: string;
    role?: string;
    isAuthenticated: boolean;
  };
}

const JWT_SECRET = process.env.JWT_SECRET ?? 'SUPER_SECRET_KEY_CHANGE_IN_PRODUCTION';

/** Room name convention keeps contest rooms namespaced */
const contestRoom = (contestId: string) => `contest:${contestId}`;

@WebSocketGateway({
  cors: {
    origin: '*',   // tighten to your frontend origin in production
    credentials: true,
  },
  namespace: '/leaderboard',
})
export class LeaderboardGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  private readonly server!: Server;

  private readonly logger = new Logger(LeaderboardGateway.name);

  constructor(private readonly leaderboardService: LeaderboardService) {}

  // -------------------------------------------------------------------------
  // Lifecycle hooks
  // -------------------------------------------------------------------------

  afterInit(server: Server) {
    this.logger.log('LeaderboardGateway initialised');
  }

  /**
   * Authenticate on connection using the JWT supplied via:
   *   1. handshake.auth.token   (preferred — socket.io-client: `{ auth: { token } }`)
   *   2. handshake.headers.authorization  (Bearer <token>)
   *   3. handshake.query.token  (fallback for environments that can't set headers)
   *
   * Spectators (unauthenticated) are allowed in as read-only observers.
   */
  handleConnection(client: AuthenticatedSocket) {
    const token =
      client.handshake.auth?.token ??
      this.extractBearerToken(client.handshake.headers.authorization) ??
      (client.handshake.query?.token as string | undefined);

    if (token) {
      try {
        const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
        client.data = {
          userId: payload.sub,
          userName: payload.name,
          role: payload.role,
          isAuthenticated: true,
        };
        this.logger.debug(`Client connected: ${client.id} (user=${payload.name}, role=${payload.role})`);
      } catch {
        // Invalid token — treat as anonymous spectator
        client.data = { isAuthenticated: false };
        this.logger.debug(`Client connected: ${client.id} (invalid token → spectator)`);
      }
    } else {
      // No token at all — anonymous spectator
      client.data = { isAuthenticated: false };
      this.logger.debug(`Client connected: ${client.id} (no token → spectator)`);
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    this.logger.debug(`Client disconnected: ${client.id}`);
  }

  // -------------------------------------------------------------------------
  // Client → Server events
  // -------------------------------------------------------------------------

  /**
   * Event: joinContest
   * Payload: { contestId: string }
   *
   * Joins the contest room and immediately receives current standings —
   * handles reconnection mid-contest gracefully.
   */
  @SubscribeMessage('joinContest')
  async handleJoinContest(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { contestId: string },
  ) {
    const { contestId } = payload ?? {};

    if (!contestId) {
      client.emit('leaderboard:error', { message: 'contestId is required' });
      return;
    }

    const room = contestRoom(contestId);

    try {
      await client.join(room);
      this.logger.debug(`${client.id} joined room ${room}`);

      // Emit current standings immediately so the rejoining client is up to date
      const standings = await this.leaderboardService.computeStandings(contestId);
      client.emit('leaderboard:update', standings);
    } catch (err: any) {
      this.logger.warn(`joinContest error for ${client.id}: ${err.message}`);
      client.emit('leaderboard:error', { message: err.message ?? 'Failed to join contest' });
    }
  }

  /**
   * Event: leaveContest
   * Payload: { contestId: string }
   */
  @SubscribeMessage('leaveContest')
  async handleLeaveContest(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { contestId: string },
  ) {
    const { contestId } = payload ?? {};
    if (!contestId) return;

    const room = contestRoom(contestId);
    await client.leave(room);
    this.logger.debug(`${client.id} left room ${room}`);
  }

  // -------------------------------------------------------------------------
  // Server → Room broadcast (called by SubmissionProcessor)
  // -------------------------------------------------------------------------

  /**
   * Recompute standings for `contestId` and broadcast the result to every
   * client in the contest room (contestants + spectators).
   */
  async broadcastLeaderboard(contestId: string): Promise<void> {
    const room = contestRoom(contestId);

    // Skip broadcast when nobody is watching — avoids a pointless DB query
    const sockets = await this.server.in(room).fetchSockets();
    if (sockets.length === 0) {
      this.logger.debug(`No clients in room ${room}, skipping broadcast`);
      return;
    }

    try {
      const standings = await this.leaderboardService.computeStandings(contestId);
      this.server.to(room).emit('leaderboard:update', standings);
      this.logger.log(
        `Broadcasted leaderboard to room ${room} (${sockets.length} client(s), ${standings.entries.length} entry/entries)`,
      );
    } catch (err: any) {
      this.logger.error(`broadcastLeaderboard failed for ${contestId}: ${err.message}`);
    }
  }

  // -------------------------------------------------------------------------
  // Helper
  // -------------------------------------------------------------------------

  private extractBearerToken(authHeader?: string): string | undefined {
    if (!authHeader) return undefined;
    const [scheme, token] = authHeader.split(' ');
    return scheme?.toLowerCase() === 'bearer' ? token : undefined;
  }
}
