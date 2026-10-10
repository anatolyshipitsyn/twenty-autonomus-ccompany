import { defineRole } from 'twenty-sdk/define';

import { OBJECT_IDS } from 'src/constants/schema-identifiers';

export default defineRole({
  universalIdentifier: 'df2c648c-7336-41d3-bd74-e52b390fa597',
  label: 'Orchestrator Workflows',
  description: 'Read and apply authorized business transitions and journal commands.',
  canReadAllObjectRecords: false,
  canUpdateAllObjectRecords: false,
  canSoftDeleteAllObjectRecords: false,
  canDestroyAllObjectRecords: false,
  canBeAssignedToUsers: false,
  canBeAssignedToAgents: false,
  canBeAssignedToApiKeys: true,
  objectPermissions: [
    { objectUniversalIdentifier: OBJECT_IDS.aiTask, canReadObjectRecords: true, canUpdateObjectRecords: true },
    { objectUniversalIdentifier: OBJECT_IDS.aiRun, canReadObjectRecords: true, canUpdateObjectRecords: true },
    { objectUniversalIdentifier: OBJECT_IDS.aiRunJournal, canReadObjectRecords: true, canUpdateObjectRecords: true },
  ],
});
