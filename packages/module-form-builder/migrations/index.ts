import { migrationId as initId, runMigration as runInitMigration } from './0001-init'

export const formBuilderMigrations = [
  {
    id: initId,
    run: runInitMigration,
  },
]
