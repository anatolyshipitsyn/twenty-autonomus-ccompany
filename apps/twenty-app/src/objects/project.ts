import { defineObject, FieldType, RelationType } from 'twenty-sdk/define';
import { FIELD_IDS, OBJECT_IDS } from 'src/constants/schema-identifiers';

export default defineObject({
  universalIdentifier: OBJECT_IDS.project,
  nameSingular: 'project',
  namePlural: 'projects',
  labelSingular: 'Project',
  labelPlural: 'Projects',
  icon: 'IconFolder',
  labelIdentifierFieldMetadataUniversalIdentifier: FIELD_IDS['project.githubRepositoryName'],
  fields: [
    { universalIdentifier: FIELD_IDS['project.githubRepositoryUrl'], name: 'githubRepositoryUrl', label: 'GitHub Repository URL', type: FieldType.TEXT, isNullable: false, defaultValue: "''" },
    { universalIdentifier: FIELD_IDS['project.githubOwner'], name: 'githubOwner', label: 'GitHub Owner', type: FieldType.TEXT, isNullable: false, defaultValue: "''" },
    { universalIdentifier: FIELD_IDS['project.githubRepositoryName'], name: 'githubRepositoryName', label: 'GitHub Repository Name', type: FieldType.TEXT, isNullable: false, defaultValue: "''" },
    { universalIdentifier: FIELD_IDS['project.baseRef'], name: 'baseRef', label: 'Base Ref', type: FieldType.TEXT, isNullable: true },
    { universalIdentifier: FIELD_IDS['project.allowedAgentKeys'], name: 'allowedAgentKeys', label: 'Allowed Agent Keys', type: FieldType.ARRAY, isNullable: true },
    { universalIdentifier: FIELD_IDS['project.executionPolicy'], name: 'executionPolicy', label: 'Execution Policy', type: FieldType.RAW_JSON, isNullable: true },
    { universalIdentifier: FIELD_IDS['project.aiTasks'], name: 'aiTasks', label: 'AI Tasks', type: FieldType.RELATION, isNullable: true, relationTargetObjectMetadataUniversalIdentifier: OBJECT_IDS.aiTask, relationTargetFieldMetadataUniversalIdentifier: FIELD_IDS['aiTask.project'], universalSettings: { relationType: RelationType.ONE_TO_MANY } }
  ],
});
