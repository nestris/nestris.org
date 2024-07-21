export enum TabID {
    MY_PROFILE = 'profile',
    CONTROL_PANEL = 'control-panel',
    FRIENDS = 'friends',
    SETTINGS = 'settings',
    PLAY = 'play',
    REVIEW = 'review',
    PUZZLES = 'puzzles',
    LEADERBOARD = 'leaderboard',
    LEARN = 'learn',
    // fullscreen tabs
    SOLO = 'solo',
    MULTIPLAYER = 'multiplayer',
    PLAY_PUZZLE = 'puzzle',
}

const IS_TAB_FULLSCREEN: {[key in TabID]: boolean} = {
    [TabID.MY_PROFILE]: false,
    [TabID.CONTROL_PANEL]: false,
    [TabID.FRIENDS]: false,
    [TabID.SETTINGS]: false,
    [TabID.PLAY]: false,
    [TabID.REVIEW]: false,
    [TabID.PUZZLES]: false,
    [TabID.LEADERBOARD]: false,
    [TabID.LEARN]: false,
    [TabID.SOLO]: true,
    [TabID.MULTIPLAYER]: true,
    [TabID.PLAY_PUZZLE]: true,
};

export const isTabFullscreen = (tab: TabID): boolean => IS_TAB_FULLSCREEN[tab];
  
export type ParametrizedTab = {
    tab: TabID,
    params: URLSearchParams | undefined,
};

const TAB_DISPLAY_NAMES: {[key in TabID]: string} = {
    [TabID.MY_PROFILE]: 'My Profile',
    [TabID.CONTROL_PANEL]: 'Control Panel',
    [TabID.FRIENDS]: 'Friends',
    [TabID.SETTINGS]: 'Settings',
    [TabID.PLAY]: 'Play',
    [TabID.REVIEW]: 'Review',
    [TabID.PUZZLES]: 'Puzzles',
    [TabID.LEADERBOARD]: 'Leaderboard',
    [TabID.SOLO]: 'Solo',
    [TabID.MULTIPLAYER]: 'Multiplayer',
    [TabID.PLAY_PUZZLE]: 'Play Puzzle',
    [TabID.LEARN]: 'Learn',
};
export const getTabDisplayName = (tab: TabID): string => TAB_DISPLAY_NAMES[tab];

const TAB_ICONS: {[key in TabID]?: string} = {
    [TabID.MY_PROFILE]: 'profile.svg',
    [TabID.CONTROL_PANEL]: 'control-panel.svg',
    [TabID.FRIENDS]: 'friends.svg',
    [TabID.SETTINGS]: 'settings.svg',
    [TabID.PLAY]: 'play.svg',
    [TabID.LEARN]: 'learn.svg',
    [TabID.REVIEW]: 'review.svg',
    [TabID.PUZZLES]: 'puzzles.svg',
    [TabID.LEADERBOARD]: 'leaderboard.svg',
    
};

const TAB_BADGE_ICONS: {[key in TabID]?: string} = {
    [TabID.FRIENDS]: 'friends-badge.svg',
}

export const getTabIcon = (tab: TabID): string => "./assets/img/tab-icons/" + TAB_ICONS[tab];

// if there is a badge version of the icon, use that, otherwise use the regular icon
export const getTabBadgeIcon = (tab: TabID): string => (TAB_BADGE_ICONS[tab] ? "./assets/img/tab-icons/" + TAB_BADGE_ICONS[tab] : getTabIcon(tab));