import * as initMigration from './0001-init'

export const formBuilderMigrations = [
  {
    id: initMigration.migrationId,
    run: (...args: Parameters<typeof initMigration.runMigration>) =>
      initMigration.runMigration(...args),
  },
]
