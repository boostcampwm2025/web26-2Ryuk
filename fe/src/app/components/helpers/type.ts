/**
 * 컴포넌트 간 관계 정의
 * 각 컴포넌트의 하위(children)와 상위(parent) 컴포넌트 정의
 */

export type ComponentCategory = 'shared' | 'layout' | 'page' | 'feature' | 'sprite';

export interface ComponentRelation {
  id: string;
  title: string;
  category: ComponentCategory;
  children?: string[]; // 하위 컴포넌트 ID 목록
  parents?: string[]; // 상위 컴포넌트 ID 목록
}

export const componentRelations: ComponentRelation[] = [
  // Shared Components (components/shared/)
  { id: 'go-back-button', title: 'GoBackButton', category: 'shared', children: ['text-button'] },
  { id: 'text-button', title: 'TextButton', category: 'shared', children: ['icon'] },
  { id: 'icon-button', title: 'IconButton', category: 'shared', children: ['icon', 'iconcircle'] },
  { id: 'icon', title: 'Icon', category: 'shared' },
  { id: 'iconcircle', title: 'IconCircle', category: 'shared', children: ['icon'] },
  { id: 'chip', title: 'Chip', category: 'shared', children: ['icon'] },
  { id: 'chip-button', title: 'ChipButton', category: 'shared', children: ['icon'] },
  { id: 'status-chip', title: 'StatusChip', category: 'shared', children: ['chip'] },
  { id: 'toggle-chip', title: 'ToggleChip', category: 'shared', children: ['chip'] },
  { id: 'textfield', title: 'Textfield', category: 'shared' },
  { id: 'search-form', title: 'SearchForm', category: 'shared', children: ['icon'] },
  {
    id: 'message-form',
    title: 'MessageForm',
    category: 'shared',
    children: ['textfield', 'icon-button'],
  },
  { id: 'stepper', title: 'Stepper', category: 'shared' },
  { id: 'toggle', title: 'Toggle', category: 'shared' },
  { id: 'progress-bar', title: 'ProgressBar', category: 'shared' },
  {
    id: 'remaining-time-bar',
    title: 'RemainingTimeBar',
    category: 'shared',
    children: ['progress-bar'],
  },
  {
    id: 'tag-selector',
    title: 'TagSelector',
    category: 'shared',
    children: ['textfield', 'toggle-chip'],
  },
  { id: 'text-tooltip', title: 'TextTooltip', category: 'shared' },
  { id: 'radio-button', title: 'RadioButton', category: 'shared' },
  {
    id: 'dialog',
    title: 'Dialog',
    category: 'shared',
    children: ['text-button', 'modal'],
  },
  { id: 'dropdown', title: 'Dropdown', category: 'shared', children: ['icon'] },

  // Layout Components (components/layout/)
  {
    id: 'header',
    title: 'Header',
    category: 'layout',
    children: ['logo', 'icon-button', 'profile'],
  },
  {
    id: 'hero-section',
    title: 'HeroSection',
    category: 'layout',
    children: ['iconcircle', 'logo-image', 'sprite-animation'],
  },
  { id: 'page-title-section', title: 'PageTitleSection', category: 'layout' },
  {
    id: 'board-page-title-section',
    title: 'BoardPageTitleSection',
    category: 'layout',
    children: ['page-title-section', 'search-form', 'text-button'],
  },
  {
    id: 'game-page-title-section',
    title: 'GamePageTitleSection',
    category: 'layout',
    children: ['page-title-section', 'search-form', 'radio-button'],
  },

  // Feature Components (features/*/components/)
  { id: 'chat-bubble', title: 'ChatBubble', category: 'feature' },
  { id: 'chat-bubbles', title: 'ChatBubbles', category: 'feature', children: ['chat-bubble'] },
  {
    id: 'chat-panel',
    title: 'ChatPanel',
    category: 'feature',
    children: ['chat-bubbles', 'message-form', 'iconcircle', 'icon-button'],
  },
  {
    id: 'global-chat-panel',
    title: 'GlobalChatPanel',
    category: 'feature',
    children: ['chat-panel'],
  },
  {
    id: 'room-chat-panel',
    title: 'RoomChatPanel',
    category: 'feature',
    children: ['chat-panel'],
  },
  { id: 'post-list-row', title: 'PostListRow', category: 'feature', children: ['chip', 'icon'] },
  { id: 'post-list-item', title: 'PostListItem', category: 'feature', children: ['chip', 'icon'] },
  {
    id: 'post-list-items',
    title: 'PostListItems',
    category: 'feature',
    children: ['post-list-item'],
  },
  {
    id: 'popular-posts-section',
    title: 'PopularPostsSection',
    category: 'feature',
    children: ['post-list-items', 'iconcircle', 'icon-button'],
  },
  { id: 'avatar', title: 'Avatar', category: 'shared' },
  { id: 'avatars', title: 'Avatars', category: 'shared', children: ['avatar'] },
  { id: 'profile', title: 'Profile', category: 'shared', children: ['avatar'] },
  { id: 'mic-setting', title: 'MicSetting', category: 'feature', children: ['toggle', 'icon'] },
  {
    id: 'password-setting',
    title: 'PasswordSetting',
    category: 'feature',
    children: ['toggle', 'icon', 'textfield'],
  },
  {
    id: 'room-creation-modal',
    title: 'RoomCreationModal',
    category: 'feature',
    children: [
      'textfield',
      'text-button',
      'stepper',
      'tag-selector',
      'mic-setting',
      'password-setting',
    ],
  },
  {
    id: 'room-update-modal',
    title: 'RoomUpdateModal',
    category: 'feature',
    children: [
      'textfield',
      'text-button',
      'stepper',
      'tag-selector',
      'mic-setting',
      'password-setting',
    ],
  },
  {
    id: 'room-card',
    title: 'RoomCard',
    category: 'feature',
    children: ['chip', 'status-chip', 'text-tooltip', 'icon-button', 'avatars'],
  },
  {
    id: 'room-info',
    title: 'RoomInfo',
    category: 'feature',
    children: ['chip', 'icon', 'icon-button'],
  },
  {
    id: 'voice-participant-card',
    title: 'VoiceParticipantCard',
    category: 'feature',
    children: ['avatar', 'slider', 'chip', 'icon-button'],
  },
  {
    id: 'realtime-rooms',
    title: 'RealtimeRoomsSection',
    category: 'feature',
    children: ['room-card', 'search-form', 'iconcircle', 'text-button'],
  },
  {
    id: 'game-card',
    title: 'GameCard',
    category: 'feature',
    children: ['icon', 'text-button'],
  },
  {
    id: 'game-card-grid',
    title: 'GameCardGrid',
    category: 'feature',
    children: ['game-card'],
  },
  { id: 'beaker-fill-view', title: 'BeakerFillView', category: 'feature' },
  {
    id: 'game-dropdown',
    title: 'GameDropdown',
    category: 'feature',
    children: ['dropdown'],
  },

  // Sprite Components
  { id: 'logo-image', title: 'LogoImage', category: 'sprite' },
  { id: 'logo', title: 'Logo', category: 'sprite', children: ['logo-image'] },
  { id: 'sprite-animation', title: 'SpriteAnimation', category: 'sprite' },
  { id: 'water-drop', title: 'WaterDrop', category: 'sprite' },
];

export function getComponentRelation(id: string): ComponentRelation | undefined {
  return componentRelations.find((rel) => rel.id === id);
}

export function getChildComponents(id: string): ComponentRelation[] {
  const relation = getComponentRelation(id);
  if (!relation || !relation.children) return [];
  return relation.children
    .map((childId) => getComponentRelation(childId))
    .filter((rel): rel is ComponentRelation => rel !== undefined);
}

export function getParentComponents(id: string): ComponentRelation[] {
  return componentRelations.filter((rel) => rel.children?.includes(id));
}

export function getCategoryPath(category: ComponentCategory): string {
  switch (category) {
    case 'shared':
      return '/components/shared';
    case 'layout':
      return '/components/layout';
    case 'page':
      return '/components/page';
    case 'feature':
      return '/components/features';
    case 'sprite':
      return '/components/sprite';
  }
}

export const sharedSections = [
  { id: 'icon', title: 'Icon' },
  { id: 'iconcircle', title: 'IconCircle' },
  { id: 'icon-button', title: 'IconButton' },
  { id: 'text-button', title: 'TextButton' },
  { id: 'text-button-icon', title: 'TextButton w/ Icon' },
  { id: 'chip-button', title: 'ChipButton' },
  { id: 'go-back-button', title: 'GoBackButton' },
  { id: 'text-field', title: 'Textfield' },
  { id: 'search-form', title: 'SearchForm' },
  { id: 'message-form', title: 'MessageForm' },
  { id: 'toggle', title: 'Toggle' },
  { id: 'slider', title: 'Slider' },
  { id: 'progress-bar', title: 'ProgressBar' },
  { id: 'remaining-time-bar', title: 'RemainingTimeBar' },
  { id: 'chip', title: 'Chip' },
  { id: 'toggle-chip', title: 'ToggleChip' },
  { id: 'status-chip', title: 'StatusChip' },
  { id: 'stepper', title: 'Stepper' },
  { id: 'tag-selector', title: 'TagSelector' },
  { id: 'text-tooltip', title: 'TextTooltip' },
  { id: 'radio-button', title: 'RadioButton' },
  { id: 'dialog', title: 'Dialog' },
  { id: 'dropdown', title: 'Dropdown' },
  { id: 'avatar', title: 'Avatar' },
  { id: 'avatars', title: 'Avatars' },
  { id: 'profile', title: 'Profile' },
];

export const layoutSections = [
  { id: 'header', title: 'Header' },
  { id: 'hero-section', title: 'HeroSection' },
  { id: 'page-title-section', title: 'PageTitleSection' },
  { id: 'board-page-title-section', title: 'BoardPageTitleSection' },
  { id: 'game-page-title-section', title: 'GamePageTitleSection' },
];

export const featureSections = [
  { id: 'chat-bubble', title: 'ChatBubble' },
  { id: 'chat-bubbles', title: 'ChatBubbles' },
  { id: 'chat-panel', title: 'ChatPanel' },
  { id: 'global-chat-panel', title: 'GlobalChatPanel' },
  { id: 'room-chat-panel', title: 'RoomChatPanel' },
  { id: 'post-list-row', title: 'PostListRow' },
  { id: 'post-list-item', title: 'PostListItem' },
  { id: 'post-list-items', title: 'PostListItems' },
  { id: 'popular-posts-section', title: 'PopularPostsSection' },
  { id: 'mic-setting', title: 'MicSetting' },
  { id: 'password-setting', title: 'PasswordSetting' },
  { id: 'room-creation-modal', title: 'RoomCreationModal' },
  { id: 'room-update-modal', title: 'RoomUpdateModal' },
  { id: 'room-card', title: 'RoomCard' },
  { id: 'room-info', title: 'RoomInfo' },
  { id: 'voice-participant-card', title: 'VoiceParticipantCard' },
  { id: 'realtime-rooms', title: 'RealtimeRoomsSection' },
  { id: 'game-card', title: 'GameCard' },
  { id: 'game-card-grid', title: 'GameCardGrid' },
  { id: 'beaker-fill-view', title: 'BeakerFillView' },
  { id: 'game-dropdown', title: 'GameDropdown' },
];

export const spriteSections = [
  { id: 'logo-image', title: 'LogoImage' },
  { id: 'logo', title: 'Logo' },
  { id: 'sprite-animation', title: 'SpriteAnimation' },
  { id: 'water-drop', title: 'WaterDrop' },
];
