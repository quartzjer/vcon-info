// Shared constants for vCon Info application

export const VCON_TYPES = {
  UNSIGNED: 'unsigned',
  SIGNED: 'signed',
  ENCRYPTED: 'encrypted'
};

export const VALIDATION_STATUS = {
  IDLE: 'idle',
  VALID: 'valid', 
  INVALID: 'invalid'
};

export const DIALOG_TYPES = {
  RECORDING: 'recording',
  TEXT: 'text',
  TRANSFER: 'transfer',
  INCOMPLETE: 'incomplete'
};

export const TABS = {
  INSPECTOR: 'inspector',
  TIMELINE: 'timeline',
  RAW: 'raw'
};

export const TYPE_COLORS = {
  [DIALOG_TYPES.RECORDING]: {
    bg: 'bg-orange-500/20',
    border: 'border-orange-500/30', 
    text: 'text-orange-300',
    dot: 'bg-orange-500'
  },
  [DIALOG_TYPES.TEXT]: {
    bg: 'bg-green-500/20',
    border: 'border-green-500/30',
    text: 'text-green-300', 
    dot: 'bg-green-500'
  },
  [DIALOG_TYPES.TRANSFER]: {
    bg: 'bg-blue-500/20',
    border: 'border-blue-500/30',
    text: 'text-blue-300',
    dot: 'bg-blue-500'
  },
  [DIALOG_TYPES.INCOMPLETE]: {
    bg: 'bg-red-500/20',
    border: 'border-red-500/30',
    text: 'text-red-300', 
    dot: 'bg-red-500'
  }
};

export const STATUS_COLORS = {
  [VALIDATION_STATUS.IDLE]: {
    indicator: 'bg-gray-600',
    text: 'text-gray-400'
  },
  [VALIDATION_STATUS.VALID]: {
    indicator: 'bg-green-500',
    text: 'text-green-300'
  },
  [VALIDATION_STATUS.INVALID]: {
    indicator: 'bg-red-500', 
    text: 'text-red-400'
  }
};

export const VCON_TYPE_STYLES = {
  [VCON_TYPES.UNSIGNED]: {
    text: 'Unsigned',
    classes: 'bg-gray-700 text-gray-300'
  },
  [VCON_TYPES.SIGNED]: {
    text: 'JWS Signed',
    classes: 'bg-blue-500/20 text-blue-300'
  },
  [VCON_TYPES.ENCRYPTED]: {
    text: 'JWE Encrypted', 
    classes: 'bg-purple-500/20 text-purple-300'
  }
};

export const DEFAULT_EXPANDED_NODES = new Set(['parties', 'dialog', 'analysis', 'attachments']);

export const INPUT_DEBOUNCE_MS = 300;

export const ICONS = {
  SHIELD: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.618 5.984A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>`,
  LOCK: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>`,
  UNLOCK: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"></path>`,
  CHECK: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>`,
  HEART: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>`
};