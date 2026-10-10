import {
  defineRole,
  RowLevelPermissionPredicateGroupLogicalOperator,
  RowLevelPermissionPredicateOperand,
} from 'twenty-sdk/define';

import { FIELD_IDS, OBJECT_IDS } from 'src/constants/schema-identifiers';

export default defineRole({
  universalIdentifier: '640b37e1-a1bf-473c-8e00-3762c12602d1',
  label: 'Orchestrator Worker',
  description:
    'Read Journal and update pending records with a worker assignment in the single-worker workspace; no Task or Run writes.',
  canReadAllObjectRecords: false,
  canUpdateAllObjectRecords: false,
  canSoftDeleteAllObjectRecords: false,
  canDestroyAllObjectRecords: false,
  canBeAssignedToUsers: false,
  canBeAssignedToAgents: false,
  canBeAssignedToApiKeys: true,
  objectPermissions: [
    { objectUniversalIdentifier: OBJECT_IDS.aiRunJournal, canReadObjectRecords: true, canUpdateObjectRecords: true },
  ],
  rowLevelPermissionPredicateGroups: [
    {
      universalIdentifier: '5db626a2-17a9-480e-bd3e-a148ab8870c4',
      objectUniversalIdentifier: OBJECT_IDS.aiRunJournal,
      logicalOperator: RowLevelPermissionPredicateGroupLogicalOperator.AND,
    },
  ],
  rowLevelPermissionPredicates: [
    {
      universalIdentifier: '2dd899b6-64cc-4c33-bb37-222b74d99f0c',
      objectUniversalIdentifier: OBJECT_IDS.aiRunJournal,
      fieldUniversalIdentifier: FIELD_IDS['aiRunJournal.state'],
      operand: RowLevelPermissionPredicateOperand.IS,
      value: ['PENDING'],
      predicateGroupUniversalIdentifier: '5db626a2-17a9-480e-bd3e-a148ab8870c4',
      position: 0,
    },
    {
      universalIdentifier: '16b5df5a-e728-4223-804c-5b55dbc18b93',
      objectUniversalIdentifier: OBJECT_IDS.aiRunJournal,
      fieldUniversalIdentifier: FIELD_IDS['aiRunJournal.workerId'],
      operand: RowLevelPermissionPredicateOperand.IS_NOT_EMPTY,
      predicateGroupUniversalIdentifier: '5db626a2-17a9-480e-bd3e-a148ab8870c4',
      position: 1,
    },
  ],
});
