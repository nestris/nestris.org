export enum InvitationType {
    FRIEND_REQUEST = "FRIEND_REQUEST",
    MATCH_REQUEST = "MATCH_REQUEST",
}

/**
 * An open invitation is an invitation that has been sent but not yet accepted or rejected.
 */
export interface Invitation {
    type: InvitationType;
    invitationID: string;
    senderID: string;
    senderUsername: string;
    senderSessionID: string;
    receiverID: string;
    receiverUsername: string;
    receiverSessionID?: string; // Not specified in the open invitation, only in the accepted invitation.
}

export enum InvitationCancellationReason {
    SENDER_DISCONNECT = "SENDER_DISCONNECT",
    RECEIVER_DISCONNECT = "RECEIVER_DISCONNECT",
    SENDER_ACTIVITY_START = "SENDER_ACTIVITY_START",
    RECEIVER_ACTIVITY_START = "RECEIVER_ACTIVITY_START",
    SENDER_CANCEL = "SENDER_CANCEL",
    RECEIVER_DECLINE = "RECEIVER_DECLINE",
}