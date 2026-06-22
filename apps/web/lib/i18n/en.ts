/**
 * English baseline messages. New locales (Hausa, Yoruba, Igbo, Pidgin) add a
 * sibling file with the same key shape; `messages` in index.ts maps locale → dict.
 */
export const en = {
  common: {
    loading: 'Loading…',
    save: 'Save changes',
    saved: 'Saved!',
    cancel: 'Cancel',
    add: 'Add',
    search: 'Search…',
    none: '—',
  },
  nav: {
    overview: 'Overview',
    pupils: 'Pupils',
    classes: 'Classes',
    messages: 'Messages',
    attendance: 'Attendance',
    results: 'Results',
    fees: 'Fees',
    staff: 'Staff',
    settings: 'Settings',
    platform: 'Platform',
    schools: 'Schools',
    analytics: 'Analytics',
    auditLog: 'Audit Log',
  },
  analytics: {
    title: 'Engagement',
    ackRate: 'Acknowledgement rate',
    readRate: 'Read rate',
    presentRate: 'Attendance rate',
    linkedGuardians: 'Linked guardians',
  },
  billing: {
    title: 'Subscription',
    plan: 'Plan',
    status: 'Status',
    period: 'Billing period',
  },
} as const;

export type Messages = typeof en;
