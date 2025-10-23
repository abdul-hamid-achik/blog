import { User } from '@/lib/auth';

export interface Context {
  locale: string;
  user: User;
}

