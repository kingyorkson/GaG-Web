import { v4 as uuidv4 } from 'uuid';

export class GameServer {
  constructor(io, supabase) {
    this.io = io;
    this.supabase = supabase;
    this.servers = new Map();
    this.playerSockets = new Map();

    this.setupSocketHandlers();
  }

  setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`Player connected: ${socket.id}`);

      socket.on('server:create', (data, callback) => {
        this.handleCreateServer(socket, data, callback);
      });

      socket.on('server:join', (data) => {
        this.handleJoinServer(socket, data);
      });

      socket.on('server:leave', (data) => {
        this.handleLeaveServer(socket, data);
      });

      socket.on('server:quickjoin', (data, callback) => {
        this.handleQuickJoin(socket, callback);
      });

      socket.on('friend:request', (data) => {
        this.handleFriendRequest(socket, data);
      });

      socket.on('friend:accept', (data) => {
        this.handleFriendAccept(socket, data);
      });

      socket.on('server:invite', (data) => {
        this.handleInviteFriend(socket, data);
      });

      socket.on('server:invite_response', (data) => {
        this.handleInviteResponse(socket, data);
      });

      socket.on('garden:update', (data) => {
        this.handleGardenUpdate(socket, data);
      });

      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });
    });
  }

  handleCreateServer(socket, data, callback) {
    const serverId = uuidv4().slice(0, 8);
    const isGenerated = !data.name;

    const server = {
      id: serverId,
      name: isGenerated ? `Generated Server ${Math.floor(Math.random() * 10000)}` : data.name,
      type: isGenerated ? 'generated' : (data.type || 'public'),
      owner: socket.userId || null,
      ownerName: socket.username || 'Unknown',
      players: [{
        id: socket.id,
        userId: socket.userId,
        username: socket.username,
      }],
      maxPlayers: 8,
      created: Date.now(),
    };

    this.servers.set(serverId, server);
    socket.join(`server:${serverId}`);
    socket.currentServer = serverId;

    if (callback) callback({ success: true, server });

    this.io.to(`server:${serverId}`).emit('server:joined', { server });
    this.io.to(`server:${serverId}`).emit('server:players', server.players);
  }

  handleJoinServer(socket, data) {
    const server = this.servers.get(data.serverId);
    if (!server) {
      socket.emit('error', { message: 'Server not found' });
      return;
    }

    if (server.players.length >= server.maxPlayers) {
      socket.emit('error', { message: 'Server is full' });
      return;
    }

    if (server.type === 'private' && server.owner !== socket.userId) {
      socket.emit('error', { message: 'Cannot join private server' });
      return;
    }

    if (socket.currentServer) {
      this.handleLeaveServer(socket, { serverId: socket.currentServer });
    }

    server.players.push({
      id: socket.id,
      userId: socket.userId,
      username: socket.username,
    });

    socket.join(`server:${data.serverId}`);
    socket.currentServer = data.serverId;

    socket.emit('server:joined', { server });
    this.io.to(`server:${data.serverId}`).emit('server:players', server.players);
  }

  handleLeaveServer(socket, data) {
    const serverId = data.serverId || socket.currentServer;
    if (!serverId) return;

    const server = this.servers.get(serverId);
    if (server) {
      server.players = server.players.filter(p => p.id !== socket.id);
      socket.leave(`server:${serverId}`);

      if (server.players.length === 0) {
        this.servers.delete(serverId);
      } else {
        this.io.to(`server:${serverId}`).emit('server:players', server.players);
      }
    }

    socket.currentServer = null;
  }

  handleQuickJoin(socket, callback) {
    let availableServer = null;

    for (const [id, server] of this.servers) {
      if (server.type !== 'private' && server.players.length < server.maxPlayers) {
        availableServer = server;
        break;
      }
    }

    if (!availableServer) {
      // Create a generated server
      this.handleCreateServer(socket, {}, (result) => {
        if (callback) callback(result);
      });
      return;
    }

    this.handleJoinServer(socket, { serverId: availableServer.id });
    if (callback) callback({ success: true, server: availableServer });
  }

  handleFriendRequest(socket, data) {
    const targetSocket = this.findSocketByUsername(data.username);
    if (targetSocket) {
      targetSocket.emit('friend:request', {
        username: socket.username,
        userId: socket.userId,
      });
      socket.emit('friend:request_sent', { username: data.username });
    } else {
      socket.emit('error', { message: 'User not found or offline' });
    }
  }

  handleFriendAccept(socket, data) {
    const targetSocket = this.findSocketByUsername(data.username);
    if (targetSocket) {
      targetSocket.emit('friend:added', {
        username: socket.username,
        userId: socket.userId,
      });
      socket.emit('friend:added', {
        username: data.username,
        userId: targetSocket.userId,
      });
    }
  }

  handleInviteFriend(socket, data) {
    const targetSocket = this.findSocketByUsername(data.username);
    if (!targetSocket) {
      socket.emit('error', { message: 'User not found or offline' });
      return;
    }

    targetSocket.emit('server:invite', {
      fromPlayer: socket.username,
      fromUserId: socket.userId,
      serverId: data.serverId,
    });
  }

  handleInviteResponse(socket, data) {
    const inviterSocket = this.findSocketByUsername(data.fromPlayer);
    if (!inviterSocket) {
      socket.emit('error', { message: 'Inviter is offline' });
      return;
    }

    if (data.accept) {
      const serverId = inviterSocket.currentServer;
      if (serverId) {
        this.handleJoinServer(socket, { serverId });
      }
    }

    inviterSocket.emit('server:invite_response', {
      player: socket.username,
      accepted: data.accept,
    });
  }

  handleGardenUpdate(socket, data) {
    socket.to(`server:${data.serverId}`).emit('garden:update', {
      userId: socket.userId,
      gardenData: data.gardenData,
    });
  }

  handleDisconnect(socket) {
    if (socket.currentServer) {
      this.handleLeaveServer(socket, { serverId: socket.currentServer });
    }
  }

  findSocketByUsername(username) {
    for (const [id, sock] of this.io.sockets.sockets) {
      if (sock.username === username) return sock;
    }
    return null;
  }

  getPublicServers() {
    const publicServers = [];
    for (const [id, server] of this.servers) {
      if (server.type !== 'private') {
        publicServers.push({
          id: server.id,
          name: server.name,
          type: server.type,
          ownerName: server.ownerName,
          playerCount: server.players.length,
          maxPlayers: server.maxPlayers,
        });
      }
    }
    return publicServers;
  }
}
