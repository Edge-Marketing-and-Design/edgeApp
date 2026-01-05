import { migrationId as initId, runMigration as runInitMigration } from './0001-init'

export const __MODULE_PASCAL__Migrations = [
  {
    id: initId,
    run: runInitMigration,
  },
]
