import { Request, Response } from 'express';
import { ServerState } from '../server-state/server-state';
import { ServerRestartWarningMessage } from '../../shared/network/json-message';

export async function warnServerRestartRoute(req: Request, res: Response, state: ServerState) {

  // Toggle the server restart warning
  state.serverRestartWarning = !state.serverRestartWarning;

  state.onlineUserManager.sendToAllOnlineUsers(new ServerRestartWarningMessage(state.serverRestartWarning));
}
