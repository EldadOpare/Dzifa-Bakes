export const orderStatuses = ['new', 'confirmed', 'in progress', 'ready', 'completed', 'cancelled'] as const;

export type OrderTone = 'primary' | 'info' | 'warning' | 'success' | 'neutral' | 'danger';

export const statusTone: Record<string, OrderTone> = {
  new: 'primary',
  confirmed: 'info',
  'in progress': 'warning',
  ready: 'success',
  completed: 'neutral',
  cancelled: 'danger',
};

export const isOpenOrder = (status: string) => status !== 'completed' && status !== 'cancelled';
