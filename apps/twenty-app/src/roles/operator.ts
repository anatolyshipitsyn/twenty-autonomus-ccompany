import { defineRole } from 'twenty-sdk/define';

import { OBJECT_IDS } from 'src/constants/schema-identifiers';

export default defineRole({
  universalIdentifier: 'd96b365d-e203-4cef-8267-1fb11b3d52ef',
  label: 'Orchestrator Operator',
  description: 'Read-only access to the durable AI Run Journal.',
  canReadAllObjectRecords: false,
  canUpdateAllObjectRecords: false,
  canSoftDeleteAllObjectRecords: false,
  canDestroyAllObjectRecords: false,
  canBeAssignedToUsers: true,
  canBeAssignedToAgents: false,
  canBeAssignedToApiKeys: false,
  objectPermissions: [
    { objectUniversalIdentifier: OBJECT_IDS.aiRunJournal, canReadObjectRecords: true },
  ],
});
