import type { PersistenceChoice } from '../config/types';
import { localStoragePersistence } from './localStorage';
import { memoryPersistence } from './memory';
import type { PersistenceAdapter } from './types';

export function resolvePersistence(choice: PersistenceChoice): PersistenceAdapter {
  if (choice === 'localStorage') return localStoragePersistence();
  if (choice === 'memory') return memoryPersistence();
  return choice;
}
