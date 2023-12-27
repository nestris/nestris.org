export enum TabID {
    MY_PROFILE = 'my-profile',
    FRIENDS = 'friends',
    ALERTS = 'alerts',
    HOME = 'home',
    PLAY = 'play',
    REVIEW = 'review',
    PUZZLES = 'puzzles',
    LEADERBOARD = 'leaderboard',
    MORE = 'more',
}
  
export type ParametrizedTab = {
    tab: TabID,
    params: URLSearchParams | undefined,
};

const TAB_DISPLAY_NAMES: {[key in TabID]: string} = {
    [TabID.MY_PROFILE]: 'My Profile',
    [TabID.FRIENDS]: 'Friends',
    [TabID.ALERTS]: 'Alerts',
    [TabID.HOME]: 'Home',
    [TabID.PLAY]: 'Play',
    [TabID.REVIEW]: 'Review',
    [TabID.PUZZLES]: 'Puzzles',
    [TabID.LEADERBOARD]: 'Leaderboard',
    [TabID.MORE]: 'More',
};
export const getTabDisplayName = (tab: TabID): string => TAB_DISPLAY_NAMES[tab];

const TAB_ICONS: {[key in TabID]: string} = {
    [TabID.MY_PROFILE]: 'profile.svg',
    [TabID.FRIENDS]: 'friends.svg',
    [TabID.ALERTS]: 'alerts.svg',
    [TabID.HOME]: 'home.svg',
    [TabID.PLAY]: 'play.svg',
    [TabID.REVIEW]: 'review.svg',
    [TabID.PUZZLES]: 'puzzles.svg',
    [TabID.LEADERBOARD]: 'leaderboard.svg',
    [TabID.MORE]: 'more.svg',
};
export const getTabIcon = (tab: TabID): string => "./assets/img/tab-icons/" + TAB_ICONS[tab];