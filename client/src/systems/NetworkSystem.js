import { io } from 'socket.io-client';

export class NetworkSystem {
  constructor() {
    this.serverUrl = 'http://localhost:3001';
    this.socket = null;
    this.currentServer = null;
    this.connected = false;
  }

  connect(token) {
    return new Promise((resolve) => {
      this.socket = io(this.serverUrl, {
        auth: { token },
        transports: ['websocket'],
      });

      this.socket.on('connect', () => {
        this.connected = true;
        resolve(true);
      });

      this.socket.on('connect_error', () => {
        resolve(false);
      });

      this.socket.on('disconnect', () => {
        this.connected = false;
      });

      this.setupListeners();
    });
  }

  setupListeners() {
    this.socket.on('server:joined', (data) => {
      this.currentServer = data.server;
      if (this.onServerJoined) this.onServerJoined(data);
    });

    this.socket.on('server:players', (players) => {
      if (this.onPlayersUpdate) this.onPlayersUpdate(players);
    });

    this.socket.on('server:invite', (data) => {
      if (this.onInviteReceived) this.onInviteReceived(data);
    });

    this.socket.on('server:invite_response', (data) => {
      if (this.onInviteResponse) this.onInviteResponse(data);
    });

    this.socket.on('friend:request', (data) => {
      if (this.onFriendRequest) this.onFriendRequest(data);
    });

    this.socket.on('friend:added', (data) => {
      if (this.onFriendAdded) this.onFriendAdded(data);
    });
  }

  async getServers() {
    try {
      const res = await fetch(`${this.serverUrl}/api/servers`);
      return await res.json();
    } catch {
      return [];
    }
  }

  createServer(name, type) {
    return new Promise((resolve) => {
      this.socket.emit('server:create', { name, type }, (response) => {
        resolve(response);
      });
    });
  }

  joinServer(serverId) {
    this.socket.emit('server:join', { serverId });
  }

  leaveServer() {
    if (this.socket && this.currentServer) {
      this.socket.emit('server:leave', { serverId: this.currentServer.id });
      this.currentServer = null;
    }
  }

  quickJoin() {
    return new Promise((resolve) => {
      this.socket.emit('server:quickjoin', {}, (response) => {
        resolve(response);
      });
    });
  }

  sendFriendRequest(username) {
    this.socket.emit('friend:request', { username });
  }

  acceptFriendRequest(username) {
    this.socket.emit('friend:accept', { username });
  }

  inviteFriend(username) {
    if (this.currentServer) {
      this.socket.emit('server:invite', { username, serverId: this.currentServer.id });
    }
  }

  respondToInvite(accept, fromPlayer) {
    this.socket.emit('server:invite_response', { accept, fromPlayer });
  }

  updateGarden(gardenData) {
    if (this.socket && this.currentServer) {
      this.socket.emit('garden:update', { serverId: this.currentServer.id, gardenData });
    }
  }

  disconnect() {
    this.leaveServer();
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.connected = false;
  }
}
