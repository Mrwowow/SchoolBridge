/** SchoolBridge brand palette */
export const Colors = {
  // Primary brand blue
  brand: '#2F6BFF',
  brandLight: '#EBF0FF',
  brandDark: '#1A4FD6',

  // Neutral greys
  textPrimary: '#0D0D0D',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',

  background: '#F9FAFB',
  surface: '#FFFFFF',
  border: '#E5E7EB',
  divider: '#F3F4F6',

  // Semantic
  success: '#16A34A',
  successLight: '#DCFCE7',
  warning: '#D97706',
  warningLight: '#FEF3C7',
  error: '#DC2626',
  errorLight: '#FEE2E2',
  info: '#0284C7',
  infoLight: '#E0F2FE',

  // Message type badge colours (background / text)
  badge: {
    NOTE: { bg: '#EBF0FF', text: '#2F6BFF' },
    HOMEWORK: { bg: '#FEF3C7', text: '#D97706' },
    BEHAVIOUR: { bg: '#FEE2E2', text: '#DC2626' },
    ATTENDANCE: { bg: '#DCFCE7', text: '#16A34A' },
    RESULT: { bg: '#F3E8FF', text: '#7C3AED' },
    ANNOUNCEMENT: { bg: '#E0F2FE', text: '#0284C7' },
    FEE_REMINDER: { bg: '#FFF7ED', text: '#EA580C' },
    EVENT: { bg: '#FCE7F3', text: '#BE185D' },
  },

  // Tab bar
  tabActive: '#2F6BFF',
  tabInactive: '#9CA3AF',
  tabBackground: '#FFFFFF',
} as const;
