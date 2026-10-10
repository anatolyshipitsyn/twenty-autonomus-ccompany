import { defineObject, FieldType, NumberDataType, RelationType } from 'twenty-sdk/define';
import { FIELD_IDS, OBJECT_IDS } from 'src/constants/schema-identifiers';

export default defineObject({
  universalIdentifier: OBJECT_IDS.aiTask,
  nameSingular: 'aiTask',
  namePlural: 'aiTasks',
  labelSingular: 'AI Task',
  labelPlural: 'AI Tasks',
  icon: 'IconCheckbox',
  labelIdentifierFieldMetadataUniversalIdentifier: FIELD_IDS['aiTask.title'],
  fields: [
    { universalIdentifier: FIELD_IDS['aiTask.title'], name: 'title', label: 'Title', type: FieldType.TEXT, isNullable: false, defaultValue: "''" },
    { universalIdentifier: FIELD_IDS['aiTask.description'], name: 'description', label: 'Description', type: FieldType.RICH_TEXT, isNullable: true },
    { universalIdentifier: FIELD_IDS['aiTask.acceptanceCriteria'], name: 'acceptanceCriteria', label: 'Acceptance Criteria', type: FieldType.RICH_TEXT, isNullable: true },
    { universalIdentifier: FIELD_IDS['aiTask.owner'], name: 'owner', label: 'Owner', type: FieldType.ACTOR, isNullable: true },
    { universalIdentifier: FIELD_IDS['aiTask.preparedInstruction'], name: 'preparedInstruction', label: 'Prepared Instruction', type: FieldType.RICH_TEXT, isNullable: true },
    { universalIdentifier: FIELD_IDS['aiTask.preparationSummary'], name: 'preparationSummary', label: 'Preparation Summary', type: FieldType.TEXT, isNullable: true },
    { universalIdentifier: FIELD_IDS['aiTask.routingPromptRef'], name: 'routingPromptRef', label: 'Routing Prompt Ref', type: FieldType.TEXT, isNullable: true },
    { universalIdentifier: FIELD_IDS['aiTask.status'], name: 'status', label: 'Status', type: FieldType.SELECT, options: [{position:0,label:'TODO',value:'TODO'},{position:1,label:'READY',value:'READY'},{position:2,label:'RUNNING',value:'RUNNING'},{position:3,label:'WAITING',value:'WAITING'},{position:4,label:'DONE',value:'DONE'},{position:5,label:'CANCELLED',value:'CANCELLED'}], isNullable: false, defaultValue: "'TODO'" },
    { universalIdentifier: FIELD_IDS['aiTask.priority'], name: 'priority', label: 'Priority', type: FieldType.NUMBER, isNullable: true, universalSettings: { dataType: NumberDataType.INT } },
    { universalIdentifier: FIELD_IDS['aiTask.requestVersion'], name: 'requestVersion', label: 'Request Version', type: FieldType.NUMBER, isNullable: true, universalSettings: { dataType: NumberDataType.INT } },
    { universalIdentifier: FIELD_IDS['aiTask.assignedAgentKey'], name: 'assignedAgentKey', label: 'Assigned Agent Key', type: FieldType.TEXT, isNullable: true },
    { universalIdentifier: FIELD_IDS['aiTask.phase'], name: 'phase', label: 'Phase', type: FieldType.SELECT, options: [{position:0,label:'CLAIMED',value:'CLAIMED'},{position:1,label:'STARTING',value:'STARTING'},{position:2,label:'REVIEW',value:'REVIEW'},{position:3,label:'QA',value:'QA'}], isNullable: true },
    { universalIdentifier: FIELD_IDS['aiTask.progressSummary'], name: 'progressSummary', label: 'Progress Summary', type: FieldType.TEXT, isNullable: true },
    { universalIdentifier: FIELD_IDS['aiTask.waitingReason'], name: 'waitingReason', label: 'Waiting Reason', type: FieldType.SELECT, options: [{position:0,label:'INPUT',value:'INPUT'},{position:1,label:'APPROVAL',value:'APPROVAL'},{position:2,label:'REVIEW',value:'REVIEW'},{position:3,label:'ERROR',value:'ERROR'},{position:4,label:'RECOVERY',value:'RECOVERY'}], isNullable: true },
    { universalIdentifier: FIELD_IDS['aiTask.question'], name: 'question', label: 'Question', type: FieldType.RICH_TEXT, isNullable: true },
    { universalIdentifier: FIELD_IDS['aiTask.answer'], name: 'answer', label: 'Answer', type: FieldType.RICH_TEXT, isNullable: true },
    { universalIdentifier: FIELD_IDS['aiTask.resultSummary'], name: 'resultSummary', label: 'Result Summary', type: FieldType.RICH_TEXT, isNullable: true },
    { universalIdentifier: FIELD_IDS['aiTask.resultUrl'], name: 'resultUrl', label: 'Result URL', type: FieldType.TEXT, isNullable: true },
    { universalIdentifier: FIELD_IDS['aiTask.cancelRequestedAt'], name: 'cancelRequestedAt', label: 'Cancel Requested At', type: FieldType.DATE_TIME, isNullable: true },
    { universalIdentifier: FIELD_IDS['aiTask.readyAt'], name: 'readyAt', label: 'Ready At', type: FieldType.DATE_TIME, isNullable: true },
    { universalIdentifier: FIELD_IDS['aiTask.project'], name: 'project', label: 'Project', type: FieldType.RELATION, isNullable: false, relationTargetObjectMetadataUniversalIdentifier: OBJECT_IDS.project, relationTargetFieldMetadataUniversalIdentifier: FIELD_IDS['project.aiTasks'], universalSettings: { relationType: RelationType.MANY_TO_ONE, joinColumnName: 'projectId' } },
    { universalIdentifier: FIELD_IDS['aiTask.runs'], name: 'runs', label: 'Runs', type: FieldType.RELATION, isNullable: true, relationTargetObjectMetadataUniversalIdentifier: OBJECT_IDS.aiRun, relationTargetFieldMetadataUniversalIdentifier: FIELD_IDS['aiRun.task'], universalSettings: { relationType: RelationType.ONE_TO_MANY } },
    { universalIdentifier: FIELD_IDS['aiTask.journalEntries'], name: 'journalEntries', label: 'Journal Entries', type: FieldType.RELATION, isNullable: true, relationTargetObjectMetadataUniversalIdentifier: OBJECT_IDS.aiRunJournal, relationTargetFieldMetadataUniversalIdentifier: FIELD_IDS['aiRunJournal.task'], universalSettings: { relationType: RelationType.ONE_TO_MANY } },
    { universalIdentifier: FIELD_IDS['aiTask.activeRun'], name: 'activeRun', label: 'Active Run', type: FieldType.RELATION, isNullable: true, relationTargetObjectMetadataUniversalIdentifier: OBJECT_IDS.aiRun, relationTargetFieldMetadataUniversalIdentifier: FIELD_IDS['aiRun.activeForTasks'], universalSettings: { relationType: RelationType.MANY_TO_ONE, joinColumnName: 'activeRunId' } }
  ],
});
