import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const SPEC_PATH = resolve(import.meta.dirname, '..', 'spec', 'thingsboard-openapi.json')

/**
 * Discriminator mappings missing from the ThingsBoard OpenAPI spec.
 *
 * ThingsBoard's Java code uses @JsonSubTypes annotations with specific discriminator
 * values, but their spec generator doesn't translate these into OpenAPI discriminator
 * mappings. Without explicit mappings, codegen tools fall back to using schema class
 * names as literal values, which causes runtime validation failures.
 *
 * Each key is the parent schema name, and the value is the discriminator mapping
 * (discriminator value → $ref path).
 */
const DISCRIMINATOR_MAPPINGS: Record<string, Record<string, string>> = {
  AiModelConfig: {
    OPENAI: '#/components/schemas/OpenAiChatModelConfig',
    AZURE_OPENAI: '#/components/schemas/AzureOpenAiChatModelConfig',
    GOOGLE_AI_GEMINI: '#/components/schemas/GoogleAiGeminiChatModelConfig',
    GOOGLE_VERTEX_AI_GEMINI: '#/components/schemas/GoogleVertexAiGeminiChatModelConfig',
    MISTRAL_AI: '#/components/schemas/MistralAiChatModelConfig',
    ANTHROPIC: '#/components/schemas/AnthropicChatModelConfig',
    AMAZON_BEDROCK: '#/components/schemas/AmazonBedrockChatModelConfig',
    GITHUB_MODELS: '#/components/schemas/GitHubModelsChatModelConfig',
    OLLAMA: '#/components/schemas/OllamaChatModelConfig',
  },
  AlarmConditionSpec: {
    SIMPLE: '#/components/schemas/SimpleAlarmConditionSpec',
    DURATION: '#/components/schemas/DurationAlarmConditionSpec',
    REPEATING: '#/components/schemas/RepeatingAlarmConditionSpec',
  },
  AlarmSchedule: {
    ANY_TIME: '#/components/schemas/AnyTimeSchedule',
    SPECIFIC_TIME: '#/components/schemas/SpecificTimeSchedule',
    CUSTOM: '#/components/schemas/CustomTimeSchedule',
  },
  AttributesOutputStrategy: {
    IMMEDIATE: '#/components/schemas/AttributesImmediateOutputStrategy',
    RULE_CHAIN: '#/components/schemas/AttributesRuleChainOutputStrategy',
  },
  CfArgumentDynamicSourceConfiguration: {
    RELATION_PATH_QUERY: '#/components/schemas/RelationPathQueryDynamicSourceConfiguration',
    CURRENT_OWNER: '#/components/schemas/CurrentOwnerDynamicSourceConfiguration',
  },
  CoapDeviceTypeConfiguration: {
    DEFAULT: '#/components/schemas/DefaultCoapDeviceTypeConfiguration',
    EFENTO: '#/components/schemas/EfentoCoapDeviceTypeConfiguration',
  },
  DeliveryMethodNotificationTemplate: {
    WEB: '#/components/schemas/WebDeliveryMethodNotificationTemplate',
    EMAIL: '#/components/schemas/EmailDeliveryMethodNotificationTemplate',
    SMS: '#/components/schemas/SmsDeliveryMethodNotificationTemplate',
    SLACK: '#/components/schemas/SlackDeliveryMethodNotificationTemplate',
    MICROSOFT_TEAMS: '#/components/schemas/MicrosoftTeamsDeliveryMethodNotificationTemplate',
    MOBILE_APP: '#/components/schemas/MobileAppDeliveryMethodNotificationTemplate',
  },
  DeviceConfiguration: {
    DEFAULT: '#/components/schemas/DefaultDeviceConfiguration',
  },
  DeviceProfileConfiguration: {
    DEFAULT: '#/components/schemas/DefaultDeviceProfileConfiguration',
  },
  DeviceProfileProvisionConfiguration: {
    DISABLED: '#/components/schemas/DisabledDeviceProfileProvisionConfiguration',
    ALLOW_CREATE_NEW_DEVICES: '#/components/schemas/AllowCreateNewDevicesDeviceProfileProvisionConfiguration',
    CHECK_PRE_PROVISIONED_DEVICES: '#/components/schemas/CheckPreProvisionedDevicesDeviceProfileProvisionConfiguration',
    X509_CERTIFICATE_CHAIN: '#/components/schemas/X509CertificateChainProvisionConfiguration',
  },
  DeviceProfileTransportConfiguration: {
    DEFAULT: '#/components/schemas/DefaultDeviceProfileTransportConfiguration',
    MQTT: '#/components/schemas/MqttDeviceProfileTransportConfiguration',
    COAP: '#/components/schemas/CoapDeviceProfileTransportConfiguration',
    LWM2M: '#/components/schemas/Lwm2mDeviceProfileTransportConfiguration',
    SNMP: '#/components/schemas/SnmpDeviceProfileTransportConfiguration',
  },
  DeviceTransportConfiguration: {
    DEFAULT: '#/components/schemas/DefaultDeviceTransportConfiguration',
    MQTT: '#/components/schemas/MqttDeviceTransportConfiguration',
    COAP: '#/components/schemas/CoapDeviceTransportConfiguration',
    LWM2M: '#/components/schemas/Lwm2mDeviceTransportConfiguration',
    SNMP: '#/components/schemas/SnmpDeviceTransportConfiguration',
  },
  EntityExportDataObject: {
    DEVICE: '#/components/schemas/DeviceExportData',
    OTA_PACKAGE: '#/components/schemas/OtaPackageExportData',
    RULE_CHAIN: '#/components/schemas/RuleChainExportData',
    WIDGET_TYPE: '#/components/schemas/WidgetTypeExportData',
    WIDGETS_BUNDLE: '#/components/schemas/WidgetsBundleExportData',
  },
  EntityFilter: {
    singleEntity: '#/components/schemas/SingleEntityFilter',
    entityList: '#/components/schemas/EntityListFilter',
    entityName: '#/components/schemas/EntityNameFilter',
    entityType: '#/components/schemas/EntityTypeFilter',
    assetType: '#/components/schemas/AssetTypeFilter',
    deviceType: '#/components/schemas/DeviceTypeFilter',
    edgeType: '#/components/schemas/EdgeTypeFilter',
    entityViewType: '#/components/schemas/EntityViewTypeFilter',
    apiUsageState: '#/components/schemas/ApiUsageStateFilter',
    relationsQuery: '#/components/schemas/RelationsQueryFilter',
    assetSearchQuery: '#/components/schemas/AssetSearchQueryFilter',
    deviceSearchQuery: '#/components/schemas/DeviceSearchQueryFilter',
    entityViewSearchQuery: '#/components/schemas/EntityViewSearchQueryFilter',
    edgeSearchQuery: '#/components/schemas/EdgeSearchQueryFilter',
  },
  EventFilter: {
    ERROR: '#/components/schemas/ErrorEventFilter',
    LC_EVENT: '#/components/schemas/LifeCycleEventFilter',
    STATS: '#/components/schemas/StatisticsEventFilter',
    DEBUG_RULE_NODE: '#/components/schemas/RuleNodeDebugEventFilter',
    DEBUG_RULE_CHAIN: '#/components/schemas/RuleChainDebugEventFilter',
    DEBUG_CALCULATED_FIELD: '#/components/schemas/CalculatedFieldDebugEventFilter',
  },
  JobConfiguration: {
    DUMMY: '#/components/schemas/DummyJobConfiguration',
  },
  JobResult: {
    DUMMY: '#/components/schemas/DummyJobResult',
  },
  KeyFilterPredicate: {
    STRING: '#/components/schemas/StringFilterPredicate',
    NUMERIC: '#/components/schemas/NumericFilterPredicate',
    BOOLEAN: '#/components/schemas/BooleanFilterPredicate',
    COMPLEX: '#/components/schemas/ComplexFilterPredicate',
  },
  LwM2MBootstrapServerCredential: {
    NO_SEC: '#/components/schemas/NoSecLwM2MBootstrapServerCredential',
    PSK: '#/components/schemas/PSKLwM2MBootstrapServerCredential',
    RPK: '#/components/schemas/RPKLwM2MBootstrapServerCredential',
    X509: '#/components/schemas/X509LwM2MBootstrapServerCredential',
  },
  MobilePage: {
    DEFAULT: '#/components/schemas/DefaultMobilePage',
    DASHBOARD: '#/components/schemas/DashboardPage',
    WEB_VIEW: '#/components/schemas/WebViewPage',
    CUSTOM: '#/components/schemas/CustomMobilePage',
  },
  NotificationDeliveryMethodConfig: {
    SLACK: '#/components/schemas/SlackNotificationDeliveryMethodConfig',
    MOBILE_APP: '#/components/schemas/MobileAppNotificationDeliveryMethodConfig',
  },
  NotificationRuleRecipientsConfig: {
    ALARM: '#/components/schemas/EscalatedNotificationRuleRecipientsConfig',
  },
  NotificationRuleTriggerConfig: {
    ALARM: '#/components/schemas/AlarmNotificationRuleTriggerConfig',
    ALARM_COMMENT: '#/components/schemas/AlarmCommentNotificationRuleTriggerConfig',
    ALARM_ASSIGNMENT: '#/components/schemas/AlarmAssignmentNotificationRuleTriggerConfig',
    DEVICE_ACTIVITY: '#/components/schemas/DeviceActivityNotificationRuleTriggerConfig',
    ENTITY_ACTION: '#/components/schemas/EntityActionNotificationRuleTriggerConfig',
    RULE_ENGINE_COMPONENT_LIFECYCLE_EVENT: '#/components/schemas/RuleEngineComponentLifecycleEventNotificationRuleTriggerConfig',
    EDGE_CONNECTION: '#/components/schemas/EdgeConnectionNotificationRuleTriggerConfig',
    EDGE_COMMUNICATION_FAILURE: '#/components/schemas/EdgeCommunicationFailureNotificationRuleTriggerConfig',
    NEW_PLATFORM_VERSION: '#/components/schemas/NewPlatformVersionNotificationRuleTriggerConfig',
    ENTITIES_LIMIT: '#/components/schemas/EntitiesLimitNotificationRuleTriggerConfig',
    API_USAGE_LIMIT: '#/components/schemas/ApiUsageLimitNotificationRuleTriggerConfig',
    RATE_LIMITS: '#/components/schemas/RateLimitsNotificationRuleTriggerConfig',
    TASK_PROCESSING_FAILURE: '#/components/schemas/TaskProcessingFailureNotificationRuleTriggerConfig',
    RESOURCES_SHORTAGE: '#/components/schemas/ResourcesShortageNotificationRuleTriggerConfig',
  },
  NotificationTargetConfig: {
    PLATFORM_USERS: '#/components/schemas/PlatformUsersNotificationTargetConfig',
    SLACK: '#/components/schemas/SlackNotificationTargetConfig',
    MICROSOFT_TEAMS: '#/components/schemas/MicrosoftTeamsNotificationTargetConfig',
  },
  OllamaAuth: {
    NONE: '#/components/schemas/None',
    BASIC: '#/components/schemas/Basic',
    TOKEN: '#/components/schemas/Token',
  },
  Output: {
    TIME_SERIES: '#/components/schemas/TimeSeriesOutput',
    ATTRIBUTES: '#/components/schemas/AttributesOutput',
  },
  SmsProviderConfiguration: {
    AWS_SNS: '#/components/schemas/AwsSnsSmsProviderConfiguration',
    TWILIO: '#/components/schemas/TwilioSmsProviderConfiguration',
    SMPP: '#/components/schemas/SmppSmsProviderConfiguration',
  },
  SnmpCommunicationConfig: {
    TELEMETRY_QUERYING: '#/components/schemas/TelemetryQueryingSnmpCommunicationConfig',
    CLIENT_ATTRIBUTES_QUERYING: '#/components/schemas/ClientAttributesQueryingSnmpCommunicationConfig',
    SHARED_ATTRIBUTES_SETTING: '#/components/schemas/SharedAttributesSettingSnmpCommunicationConfig',
    TO_DEVICE_RPC_REQUEST: '#/components/schemas/ToDeviceRpcRequestSnmpCommunicationConfig',
    TO_SERVER_RPC_REQUEST: '#/components/schemas/ToServerRpcRequestSnmpCommunicationConfig',
  },
  TaskResult: {
    DUMMY: '#/components/schemas/DummyTaskResult',
  },
  TbChatResponse: {
    SUCCESS: '#/components/schemas/Success',
    FAILURE: '#/components/schemas/Failure',
  },
  TbContent: {
    TEXT: '#/components/schemas/TbTextContent',
  },
  TimeSeriesOutputStrategy: {
    IMMEDIATE: '#/components/schemas/TimeSeriesImmediateOutputStrategy',
    RULE_CHAIN: '#/components/schemas/TimeSeriesRuleChainOutputStrategy',
  },
  TransportPayloadTypeConfiguration: {
    JSON: '#/components/schemas/JsonTransportPayloadConfiguration',
    PROTOBUF: '#/components/schemas/ProtoTransportPayloadConfiguration',
  },
  TwoFaAccountConfig: {
    TOTP: '#/components/schemas/TotpTwoFaAccountConfig',
    SMS: '#/components/schemas/SmsTwoFaAccountConfig',
    EMAIL: '#/components/schemas/EmailTwoFaAccountConfig',
    BACKUP_CODE: '#/components/schemas/BackupCodeTwoFaAccountConfig',
  },
  TwoFaProviderConfig: {
    TOTP: '#/components/schemas/TotpTwoFaProviderConfig',
    SMS: '#/components/schemas/SmsTwoFaProviderConfig',
    EMAIL: '#/components/schemas/EmailTwoFaProviderConfig',
    BACKUP_CODE: '#/components/schemas/BackupCodeTwoFaProviderConfig',
  },
  UsersFilter: {
    USER_LIST: '#/components/schemas/UserListFilter',
    CUSTOMER_USERS: '#/components/schemas/CustomerUsersFilter',
    TENANT_ADMINISTRATORS: '#/components/schemas/TenantAdministratorsFilter',
    AFFECTED_TENANT_ADMINISTRATORS: '#/components/schemas/AffectedTenantAdministratorsFilter',
    SYSTEM_ADMINISTRATORS: '#/components/schemas/SystemAdministratorsFilter',
    ALL_USERS: '#/components/schemas/AllUsersFilter',
    ORIGINATOR_ENTITY_OWNER_USERS: '#/components/schemas/OriginatorEntityOwnerUsersFilter',
    AFFECTED_USER: '#/components/schemas/AffectedUserFilter',
  },
  VersionCreateRequest: {
    SINGLE_ENTITY: '#/components/schemas/SingleEntityVersionCreateRequest',
    COMPLEX: '#/components/schemas/ComplexVersionCreateRequest',
  },
  VersionLoadRequest: {
    SINGLE_ENTITY: '#/components/schemas/SingleEntityVersionLoadRequest',
    ENTITY_TYPE: '#/components/schemas/EntityTypeVersionLoadRequest',
  },
}

// ---------------------------------------------------------------------------

interface Discriminator {
  propertyName: string
  mapping?: Record<string, string>
}

interface Schema {
  discriminator?: Discriminator
  [key: string]: unknown
}

interface Spec {
  components: { schemas: Record<string, Schema> }
  [key: string]: unknown
}

const spec: Spec = JSON.parse(readFileSync(SPEC_PATH, 'utf8'))
const schemas = spec.components.schemas

let patched = 0
let skipped = 0
const errors: string[] = []

for (const [parentName, mapping] of Object.entries(DISCRIMINATOR_MAPPINGS)) {
  const schema = schemas[parentName]
  if (!schema) {
    errors.push(`Schema "${parentName}" not found in spec`)
    continue
  }

  if (!schema.discriminator) {
    errors.push(`Schema "${parentName}" has no discriminator`)
    continue
  }

  if (schema.discriminator.mapping) {
    skipped++
    continue
  }

  // Validate all referenced schemas exist
  for (const [value, ref] of Object.entries(mapping)) {
    const refName = ref.split('/').pop()!
    if (!schemas[refName]) {
      errors.push(`Schema "${parentName}": mapping value "${value}" references unknown schema "${refName}"`)
    }
  }

  schema.discriminator.mapping = mapping
  patched++
}

if (errors.length > 0) {
  console.error('patch-spec: ERRORS:')
  for (const err of errors) console.error(`  - ${err}`)
  process.exit(1)
}

writeFileSync(SPEC_PATH, JSON.stringify(spec, null, 2) + '\n', 'utf8')
console.log(`patch-spec: ${patched} discriminator mapping(s) added, ${skipped} already present`)
