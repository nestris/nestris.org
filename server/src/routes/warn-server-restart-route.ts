import { Request, Response } from 'express';
import { ServerState } from '../old/server-state';
import { ServerRestartWarningMessage } from '../../shared/network/json-message';

export async function warnServerRestartRoute(req: Request, res: Response, state: ServerState) {

  // Toggle the server restart warning
  state.serverRestartWarning = !state.serverRestartWarning;

  state.onlineUserManager.sendToAllOnlineUsers(new ServerRestartWarningMessage(state.serverRestartWarning));
}
