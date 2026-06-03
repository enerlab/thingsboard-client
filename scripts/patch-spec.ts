import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { isDeepStrictEqual } from 'node:util'

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

/**
 * TB entities ship in up to four wire shapes: `Foo`, `FooInfo`, `FooWritable`,
 * `FooInfoWritable`. Read/write endpoints share the same Java model, so a patch
 * that fixes only the read shape almost always leaves the write path broken.
 *
 * `forEachShape` iterates all four variants of a base name, calls `fn` for
 * each that exists in the spec, and reports the outcome. Variants not in the
 * spec aren't an error — hey-api synthesizes `*Writable` shapes downstream from
 * the base type when the spec omits them. But missing variants are still worth
 * logging: it's how you spot when codegen tooling changes its synthesis policy
 * (now-missing variants previously present, or vice versa).
 *
 * `fn` returns `'patched'` for first-time mutations or `'already-patched'` for
 * idempotent re-runs. The result is summarized in a single log line per call
 * so PR diffs surface unintended skew.
 */
const SHAPE_SUFFIXES = ['', 'Info', 'Writable', 'InfoWritable'] as const

interface ForEachShapeResult {
  patched: string[]
  alreadyPatched: string[]
  missing: string[]
}

function forEachShape(
  baseName: string,
  schemas: Record<string, Schema>,
  fn: (schema: Schema, name: string) => 'patched' | 'already-patched',
): ForEachShapeResult {
  const result: ForEachShapeResult = { patched: [], alreadyPatched: [], missing: [] }
  for (const suffix of SHAPE_SUFFIXES) {
    const name = `${baseName}${suffix}`
    const schema = schemas[name]
    if (!schema) {
      result.missing.push(name)
      continue
    }
    const outcome = fn(schema, name)
    if (outcome === 'patched') result.patched.push(name)
    else result.alreadyPatched.push(name)
  }
  return result
}

function logShapeResult(label: string, r: ForEachShapeResult): void {
  const fmt = (xs: string[]) => (xs.length === 0 ? '(none)' : xs.join(', '))
  console.log(
    `patch-spec: ${label} shapes — patched: ${fmt(r.patched)}; already: ${fmt(r.alreadyPatched)}; missing-from-spec: ${fmt(r.missing)}`,
  )
}

/**
 * ThingsBoard's spec doesn't fully model the polymorphic
 * `CalculatedField.configuration` union — at minimum it lumps SIMPLE and SCRIPT
 * together, and historically omitted PROPAGATION entirely. Verified against
 * `BaseCalculatedFieldConfiguration` and the `@JsonSubTypes`/`@DiscriminatorMapping`
 * annotations on `CalculatedFieldConfiguration` in TB master.
 *
 * This patch:
 *  - narrows `SimpleCalculatedFieldConfiguration.type` to `['SIMPLE']`
 *  - synthesizes `ScriptCalculatedFieldConfiguration` (clone of Simple with `type: ['SCRIPT']`)
 *  - synthesizes `PropagationCalculatedFieldConfiguration` (when upstream omits it)
 *  - synthesizes `AlarmCalculatedFieldConfiguration` (all deps already exist in spec)
 *  - synthesizes `RelatedEntitiesAggregationCalculatedFieldConfiguration` and
 *    `EntityAggregationCalculatedFieldConfiguration` plus their deep dependency
 *    tree: `AggMetric`, `AggKeyInput`, `AggFunctionInput`, `BaseAggInterval`,
 *    the 8 `*Interval` subtypes (Hour/Day/Week/WeekSunSat/Month/Quarter/Year/Custom),
 *    and `Watermark`. Verified against the corresponding Java classes under
 *    `…/cf/configuration/aggregation/**` on TB master.
 *  - rewrites `CalculatedField{,Info}{,Writable}.configuration` to a 6-variant
 *    discriminated `oneOf`
 *
 * NOT covered yet — `GeofencingCalculatedFieldConfiguration`. It references
 * `EntityCoordinates` and `ZoneGroupConfiguration` (with further subtypes),
 * neither in the spec. Tracked for a follow-up; the SDK's `CalculatedField.type`
 * still lists `GEOFENCING` as a valid string literal so the operation isn't
 * unreachable — only the typed `configuration` shape is missing.
 *
 * Each gated mutation below has three valid states:
 *   - upstream still has a known broken/lumped shape  → apply the patch
 *   - we already applied the patch                    → idempotent no-op
 *   - anything else                                   → upstream changed; error
 *                                                       out so the maintainer
 *                                                       reviews this patch.
 */

/** Output field as `oneOf` of the two concrete subtypes. Inline because
 *  `$ref: '#/components/schemas/Output'` resolves to the bare base type in
 *  codegen — it loses the union and the `type: 'ATTRIBUTES' | 'TIME_SERIES'`
 *  literals. Inline `oneOf` produces precise discriminated-union TS types. */
const OUTPUT_ONEOF = {
  oneOf: [
    { $ref: '#/components/schemas/AttributesOutput' },
    { $ref: '#/components/schemas/TimeSeriesOutput' },
  ],
}

const ARGUMENT_MAP = {
  type: 'object',
  additionalProperties: { $ref: '#/components/schemas/Argument' },
  minProperties: 1,
}

const buildSimpleSchema = (): Schema => ({
  type: 'object',
  properties: {
    arguments: structuredClone(ARGUMENT_MAP),
    expression: { type: 'string' },
    output: structuredClone(OUTPUT_ONEOF),
    useLatestTs: { type: 'boolean' },
    type: { type: 'string', enum: ['SIMPLE'] },
  },
  required: ['arguments', 'output', 'type'],
})

const buildScriptSchema = (): Schema => ({
  type: 'object',
  properties: {
    arguments: structuredClone(ARGUMENT_MAP),
    expression: { type: 'string' },
    output: structuredClone(OUTPUT_ONEOF),
    useLatestTs: { type: 'boolean' },
    type: { type: 'string', enum: ['SCRIPT'] },
  },
  required: ['arguments', 'output', 'type'],
})

const buildPropagationSchema = (): Schema => ({
  type: 'object',
  properties: {
    type: { type: 'string', enum: ['PROPAGATION'] },
    arguments: structuredClone(ARGUMENT_MAP),
    expression: { type: ['string', 'null'] },
    output: structuredClone(OUTPUT_ONEOF),
    relation: {
      type: 'object',
      properties: {
        direction: { type: 'string', enum: ['TO', 'FROM'] },
        relationType: { type: 'string' },
      },
      required: ['direction', 'relationType'],
    },
    applyExpressionToResolvedArguments: { type: 'boolean' },
  },
  required: ['type', 'arguments', 'output', 'relation', 'applyExpressionToResolvedArguments'],
})

/**
 * AlarmCalculatedFieldConfiguration: no `output` on the wire (the Java
 * `getOutput()` returns null and isn't serialized). Wire fields mirror the
 * Java class: `arguments`, `createRules`, `clearRule`, propagation flags.
 * `createRules` is `Map<AlarmSeverity, AlarmRule>` — OpenAPI represents map
 * keys as plain `string` (AlarmSeverity narrowing is a JSON limitation).
 */
const buildAlarmSchema = (): Schema => ({
  type: 'object',
  properties: {
    type: { type: 'string', enum: ['ALARM'] },
    arguments: structuredClone(ARGUMENT_MAP),
    createRules: {
      type: 'object',
      additionalProperties: { $ref: '#/components/schemas/AlarmRule' },
      minProperties: 1,
    },
    clearRule: { $ref: '#/components/schemas/AlarmRule' },
    propagate: { type: 'boolean' },
    propagateToOwner: { type: 'boolean' },
    propagateToTenant: { type: 'boolean' },
    propagateRelationTypes: {
      type: 'array',
      items: { type: 'string' },
    },
  },
  required: ['type', 'arguments', 'createRules'],
})

/**
 * AggInput is a polymorphic interface in Java with two subtypes (`AggKeyInput`
 * and `AggFunctionInput`), discriminated on `type`. We model the subtypes as
 * standalone schemas and inline a oneOf+discriminator at the use site (in
 * `AggMetric.input`) so hey-api emits a precise discriminated union.
 */
const AGG_INPUT_ONEOF = {
  oneOf: [
    { $ref: '#/components/schemas/AggKeyInput' },
    { $ref: '#/components/schemas/AggFunctionInput' },
  ],
  discriminator: {
    propertyName: 'type',
    mapping: {
      key: '#/components/schemas/AggKeyInput',
      function: '#/components/schemas/AggFunctionInput',
    },
  },
}

const buildAggKeyInputSchema = (): Schema => ({
  type: 'object',
  properties: {
    type: { type: 'string', enum: ['key'] },
    key: { type: 'string' },
  },
  required: ['type', 'key'],
})

const buildAggFunctionInputSchema = (): Schema => ({
  type: 'object',
  properties: {
    type: { type: 'string', enum: ['function'] },
    function: { type: 'string' },
  },
  required: ['type', 'function'],
})

const buildAggMetricSchema = (): Schema => ({
  type: 'object',
  properties: {
    function: {
      type: 'string',
      enum: ['MIN', 'MAX', 'SUM', 'AVG', 'COUNT', 'COUNT_UNIQUE'],
    },
    filter: { type: 'string' },
    input: structuredClone(AGG_INPUT_ONEOF),
    defaultValue: { type: 'number', format: 'double' },
  },
  // Java has no @NotNull on any field. Required mirrors that, but TB validates
  // metrics at runtime — `metrics` map being NotEmpty is enforced at the
  // CF-configuration level (in `required` there).
  required: [],
})

/** BaseAggInterval is the abstract parent: `tz` (NotBlank) + optional offsetSec. */
const buildBaseAggIntervalSchema = (): Schema => ({
  type: 'object',
  properties: {
    tz: { type: 'string', minLength: 1 },
    offsetSec: { type: 'integer', format: 'int64' },
  },
  required: ['tz'],
})

/** allOf-extends BaseAggInterval and pins `type` to a single literal. */
const buildIntervalSubtype = (
  typeLiteral: string,
  extraProps: Record<string, unknown> = {},
  extraRequired: string[] = [],
): Schema => ({
  allOf: [
    { $ref: '#/components/schemas/BaseAggInterval' },
    {
      type: 'object',
      properties: {
        type: { type: 'string', enum: [typeLiteral] },
        ...extraProps,
      },
      required: ['type', ...extraRequired],
    },
  ],
})

const buildHourIntervalSchema = (): Schema => buildIntervalSubtype('HOUR')
const buildDayIntervalSchema = (): Schema => buildIntervalSubtype('DAY')
const buildWeekIntervalSchema = (): Schema => buildIntervalSubtype('WEEK')
const buildWeekSunSatIntervalSchema = (): Schema => buildIntervalSubtype('WEEK_SUN_SAT')
const buildMonthIntervalSchema = (): Schema => buildIntervalSubtype('MONTH')
const buildQuarterIntervalSchema = (): Schema => buildIntervalSubtype('QUARTER')
const buildYearIntervalSchema = (): Schema => buildIntervalSubtype('YEAR')
const buildCustomIntervalSchema = (): Schema =>
  buildIntervalSubtype(
    'CUSTOM',
    { durationSec: { type: 'integer', format: 'int64', minimum: 1 } },
    ['durationSec'],
  )

const AGG_INTERVAL_ONEOF = {
  oneOf: [
    { $ref: '#/components/schemas/HourInterval' },
    { $ref: '#/components/schemas/DayInterval' },
    { $ref: '#/components/schemas/WeekInterval' },
    { $ref: '#/components/schemas/WeekSunSatInterval' },
    { $ref: '#/components/schemas/MonthInterval' },
    { $ref: '#/components/schemas/QuarterInterval' },
    { $ref: '#/components/schemas/YearInterval' },
    { $ref: '#/components/schemas/CustomInterval' },
  ],
  discriminator: {
    propertyName: 'type',
    mapping: {
      HOUR: '#/components/schemas/HourInterval',
      DAY: '#/components/schemas/DayInterval',
      WEEK: '#/components/schemas/WeekInterval',
      WEEK_SUN_SAT: '#/components/schemas/WeekSunSatInterval',
      MONTH: '#/components/schemas/MonthInterval',
      QUARTER: '#/components/schemas/QuarterInterval',
      YEAR: '#/components/schemas/YearInterval',
      CUSTOM: '#/components/schemas/CustomInterval',
    },
  },
}

const buildWatermarkSchema = (): Schema => ({
  type: 'object',
  properties: {
    duration: { type: 'integer', format: 'int64', minimum: 0 },
  },
  required: ['duration'],
})

/**
 * RelatedEntitiesAggregationCalculatedFieldConfiguration: aggregation over
 * entities reachable via a relation path. `arguments`, `metrics`, `relation`,
 * and `output` are required; `scheduledUpdateInterval` is optional.
 */
const buildRelatedEntitiesAggregationSchema = (): Schema => ({
  type: 'object',
  properties: {
    type: { type: 'string', enum: ['RELATED_ENTITIES_AGGREGATION'] },
    relation: { $ref: '#/components/schemas/RelationPathLevel' },
    arguments: structuredClone(ARGUMENT_MAP),
    deduplicationIntervalInSec: { type: 'integer', format: 'int64' },
    metrics: {
      type: 'object',
      additionalProperties: { $ref: '#/components/schemas/AggMetric' },
      minProperties: 1,
    },
    output: structuredClone(OUTPUT_ONEOF),
    useLatestTs: { type: 'boolean' },
    scheduledUpdateInterval: { type: 'integer', format: 'int32' },
  },
  required: ['type', 'relation', 'arguments', 'metrics', 'output'],
})

/**
 * EntityAggregationCalculatedFieldConfiguration: aggregation over time
 * intervals for a single entity. `arguments`, `metrics`, `interval`, and
 * `output` are required; `watermark` and `produceIntermediateResult` optional.
 */
const buildEntityAggregationSchema = (): Schema => ({
  type: 'object',
  properties: {
    type: { type: 'string', enum: ['ENTITY_AGGREGATION'] },
    arguments: structuredClone(ARGUMENT_MAP),
    metrics: {
      type: 'object',
      additionalProperties: { $ref: '#/components/schemas/AggMetric' },
      minProperties: 1,
    },
    interval: structuredClone(AGG_INTERVAL_ONEOF),
    watermark: { $ref: '#/components/schemas/Watermark' },
    produceIntermediateResult: { type: 'boolean' },
    output: structuredClone(OUTPUT_ONEOF),
  },
  required: ['type', 'arguments', 'metrics', 'interval', 'output'],
})

function patchCalculatedFieldConfiguration(
  schemas: Record<string, Schema>,
  errors: string[],
): void {
  const simple = schemas.SimpleCalculatedFieldConfiguration
  if (!simple) {
    errors.push('CF configuration patch: SimpleCalculatedFieldConfiguration not found')
    return
  }

  // Every schema this patch references must exist; if upstream renames one of
  // them, openapi-ts would silently emit `unknown` for that field. Fail loud.
  for (const dep of ['Argument', 'AttributesOutput', 'TimeSeriesOutput', 'AlarmRule', 'RelationPathLevel']) {
    if (!schemas[dep]) {
      errors.push(`CF configuration patch: dependency schema "${dep}" not found`)
    }
  }

  // --- Simple: narrow `type` to ['SIMPLE'] only ----------------------------
  const patchedSimpleType = { type: 'string', enum: ['SIMPLE'] }
  const upstreamLumpedSimpleType = { type: 'string', enum: ['SIMPLE', 'SCRIPT'] }
  const simpleProps = (simple.properties ?? {}) as Record<string, unknown>
  if (simpleProps.type === undefined || isDeepStrictEqual(simpleProps.type, upstreamLumpedSimpleType)) {
    simpleProps.type = structuredClone(patchedSimpleType)
  } else if (!isDeepStrictEqual(simpleProps.type, patchedSimpleType)) {
    errors.push(
      'CF configuration patch: SimpleCalculatedFieldConfiguration.type is in an unknown shape — upstream may have changed it; review/remove patchCalculatedFieldConfiguration',
    )
  }
  simple.properties = simpleProps
  const simpleRequired = (simple.required ?? []) as string[]
  if (!simpleRequired.includes('type')) simpleRequired.push('type')
  simple.required = simpleRequired

  // --- Synthesize Script, Propagation, Alarm ------------------------------
  // For each: missing → install ours; matches our shape → idempotent no-op;
  // anything else → error (upstream may have added its own — review).
  const synthesized: ReadonlyArray<readonly [string, () => Schema]> = [
    // CF configuration variants
    ['ScriptCalculatedFieldConfiguration', buildScriptSchema],
    ['PropagationCalculatedFieldConfiguration', buildPropagationSchema],
    ['AlarmCalculatedFieldConfiguration', buildAlarmSchema],
    ['RelatedEntitiesAggregationCalculatedFieldConfiguration', buildRelatedEntitiesAggregationSchema],
    ['EntityAggregationCalculatedFieldConfiguration', buildEntityAggregationSchema],
    // Aggregation dependency tree — referenced by the two aggregation CF configs
    ['AggKeyInput', buildAggKeyInputSchema],
    ['AggFunctionInput', buildAggFunctionInputSchema],
    ['AggMetric', buildAggMetricSchema],
    ['BaseAggInterval', buildBaseAggIntervalSchema],
    ['HourInterval', buildHourIntervalSchema],
    ['DayInterval', buildDayIntervalSchema],
    ['WeekInterval', buildWeekIntervalSchema],
    ['WeekSunSatInterval', buildWeekSunSatIntervalSchema],
    ['MonthInterval', buildMonthIntervalSchema],
    ['QuarterInterval', buildQuarterIntervalSchema],
    ['YearInterval', buildYearIntervalSchema],
    ['CustomInterval', buildCustomIntervalSchema],
    ['Watermark', buildWatermarkSchema],
  ]
  for (const [name, build] of synthesized) {
    const expected = build()
    if (schemas[name] === undefined) {
      schemas[name] = expected
    } else if (!isDeepStrictEqual(schemas[name], expected)) {
      errors.push(
        `CF configuration patch: ${name} exists but doesn't match the patched shape — upstream may have added its own; reconcile patchCalculatedFieldConfiguration with upstream`,
      )
    }
  }

  // --- Rewrite `configuration` on every CalculatedField* parent -----------
  const configuration = {
    oneOf: [
      { $ref: '#/components/schemas/SimpleCalculatedFieldConfiguration' },
      { $ref: '#/components/schemas/ScriptCalculatedFieldConfiguration' },
      { $ref: '#/components/schemas/PropagationCalculatedFieldConfiguration' },
      { $ref: '#/components/schemas/AlarmCalculatedFieldConfiguration' },
      { $ref: '#/components/schemas/RelatedEntitiesAggregationCalculatedFieldConfiguration' },
      { $ref: '#/components/schemas/EntityAggregationCalculatedFieldConfiguration' },
    ],
    discriminator: {
      propertyName: 'type',
      mapping: {
        SIMPLE: '#/components/schemas/SimpleCalculatedFieldConfiguration',
        SCRIPT: '#/components/schemas/ScriptCalculatedFieldConfiguration',
        PROPAGATION: '#/components/schemas/PropagationCalculatedFieldConfiguration',
        ALARM: '#/components/schemas/AlarmCalculatedFieldConfiguration',
        RELATED_ENTITIES_AGGREGATION: '#/components/schemas/RelatedEntitiesAggregationCalculatedFieldConfiguration',
        ENTITY_AGGREGATION: '#/components/schemas/EntityAggregationCalculatedFieldConfiguration',
      },
    },
  }
  // Shapes we recognize as "upstream's current attempt that we want to replace":
  //   (a) flat `$ref` to Simple — the historical broken shape
  //   (b) 2-variant oneOf (Simple + Propagation) with SCRIPT lumped into Simple
  //       — the current 4.3.1 PE shape; upstream caught up on Propagation but
  //       still doesn't split SCRIPT.
  const upstreamShapes = [
    { $ref: '#/components/schemas/SimpleCalculatedFieldConfiguration' },
    {
      oneOf: [
        { $ref: '#/components/schemas/SimpleCalculatedFieldConfiguration' },
        { $ref: '#/components/schemas/PropagationCalculatedFieldConfiguration' },
      ],
      discriminator: {
        propertyName: 'type',
        mapping: {
          SIMPLE: '#/components/schemas/SimpleCalculatedFieldConfiguration',
          SCRIPT: '#/components/schemas/SimpleCalculatedFieldConfiguration',
          PROPAGATION: '#/components/schemas/PropagationCalculatedFieldConfiguration',
        },
      },
    },
  ]
  // Apply to every shape variant of CalculatedField — the read AND write paths
  // both need the discriminated union. Variants missing from the spec are
  // logged (hey-api synthesizes `*Writable` downstream when omitted); see
  // CLAUDE.md "Writable / Info shape skew".
  const cfShapeResult = forEachShape('CalculatedField', schemas, (parent, name) => {
    const props = parent.properties as Record<string, unknown> | undefined
    if (!props?.configuration) {
      errors.push(`CF configuration patch: ${name}.properties.configuration not found`)
      return 'already-patched'
    }
    if (isDeepStrictEqual(props.configuration, configuration)) {
      return 'already-patched'
    }
    if (upstreamShapes.some(s => isDeepStrictEqual(props.configuration, s))) {
      props.configuration = structuredClone(configuration)
      return 'patched'
    }
    errors.push(
      `CF configuration patch: ${name}.configuration is in an unrecognized shape — upstream may have evolved; review/extend the upstreamShapes list in patchCalculatedFieldConfiguration`,
    )
    return 'already-patched'
  })
  logShapeResult('CalculatedField.configuration', cfShapeResult)
}

/**
 * TB's spec types `requestBody.content.application/json.schema` as `{type:"string"}`
 * for endpoints that actually accept a JSON OBJECT body on the wire. The lie is
 * visible in the request description ("JSON object", "JSON with the telemetry
 * values", or a literal `{...}` example), but the schema says `string` — so
 * hey-api generates `body: string`, and `createConfig`'s default
 * `jsonBodySerializer` (`JSON.stringify(body)`) then runs on that string,
 * producing a JSON-encoded string literal on the wire (e.g. `"{\"k\":\"v\"}"`).
 * TB rejects with HTTP 400 `Request is not a JSON object`.
 *
 * Replace the schema with the on-the-wire shape so the generated type is an
 * object whose values are precise (`JsonValue`, recursive) and the default
 * serializer produces correct JSON. Avoids `unknown` in the published surface.
 *
 * ## Inclusion criterion
 *
 * Allowlist only endpoints whose upstream description is unambiguous about a
 * JSON-object body — either says "JSON object" / "JSON with ..." or shows a
 * `{...}` example. Endpoints with empty descriptions (`updateSecretValue`,
 * `updateApiKeyDescription`, `updateCustomMenuName`, `updateSecretDescription`,
 * the rule-engine / RPC handler variants, `claimDevice`, etc.) are intentionally
 * left alone — some of them genuinely accept a primitive string body
 * (Spring `@RequestBody String`), and patching blindly would break those
 * callers. Opt in here only after verifying TB behavior for the endpoint.
 */
const JSON_OBJECT_BODY_OPERATIONS: ReadonlySet<string> = new Set([
  'postDeviceAttributes',
  'postRpcRequest',
  'provisionDevice',
  'replyToCommand',
  'saveDeviceAttributes',
  'saveEntityAttributesV1',
  'saveEntityAttributesV2',
  'saveEntityTelemetry',
  'saveEntityTelemetryWithTTL',
])

/**
 * Recursive precise JSON value type. Used as the `additionalProperties` for
 * the patched request bodies so the generated type is
 * `Record<string, JsonValue>` instead of `Record<string, unknown>` — keeps
 * the "no `unknown` in the published surface" invariant from CLAUDE.md.
 */
/*
 * `null` is intentionally NOT in the union. TB rejects null attribute/telemetry
 * values with HTTP 500 "Can't parse value: null" (verified against PE 4.3.1.1
 * against POST /api/plugins/telemetry/DEVICE/{id}/attributes/SERVER_SCOPE,
 * both for new keys and overwriting existing ones). Surfacing null at TS would
 * mislead consumers — to remove an attribute, use `deleteEntityAttributes`.
 */
const JSON_VALUE_SCHEMA: Schema = {
  description: 'Any TB-accepted JSON value: string, number, boolean, object, or array (recursive). `null` is rejected by TB.',
  oneOf: [
    { type: 'string' },
    { type: 'number' },
    { type: 'boolean' },
    { type: 'array', items: { $ref: '#/components/schemas/JsonValue' } },
    { type: 'object', additionalProperties: { $ref: '#/components/schemas/JsonValue' } },
  ],
}

interface RequestBodyOperation {
  operationId?: string
  requestBody?: {
    content?: {
      'application/json'?: {
        schema?: unknown
      }
    }
  }
}

function patchJsonStringRequestBodies(spec: Spec, errors: string[]): void {
  const schemas = spec.components.schemas
  // Add JsonValue schema. Loud-fails if upstream introduces their own
  // JsonValue with a different shape — surfaces the conflict so the
  // maintainer can decide whether to keep ours, adopt upstream's, or rename.
  const existingJsonValue = schemas.JsonValue
  if (existingJsonValue === undefined) {
    schemas.JsonValue = structuredClone(JSON_VALUE_SCHEMA)
  } else if (isDeepStrictEqual(existingJsonValue, JSON_VALUE_SCHEMA)) {
    // Idempotent re-run — already present in the patched shape, no-op.
  } else {
    errors.push(
      `json-object body patch: schemas.JsonValue already exists in upstream with a different shape — review whether to keep this patch's version, adopt upstream's, or rename ours to avoid the collision`,
    )
  }
  const wrongSchema = { type: 'string' }
  const correctSchema = {
    type: 'object',
    additionalProperties: { $ref: '#/components/schemas/JsonValue' },
  }
  const paths = spec.paths as Record<string, Record<string, RequestBodyOperation>> | undefined
  if (!paths) {
    errors.push('json-object body patch: spec has no paths')
    return
  }
  let patched = 0
  let alreadyPatched = 0
  const seen = new Set<string>()
  for (const [pathStr, methods] of Object.entries(paths)) {
    for (const [method, op] of Object.entries(methods)) {
      if (typeof op !== 'object' || op === null) continue
      const opId = op.operationId
      if (!opId || !JSON_OBJECT_BODY_OPERATIONS.has(opId)) continue
      seen.add(opId)
      const slot = op.requestBody?.content?.['application/json']
      if (!slot) {
        errors.push(
          `json-object body patch: ${method.toUpperCase()} ${pathStr} (${opId}) has no application/json content`,
        )
        continue
      }
      if (isDeepStrictEqual(slot.schema, correctSchema)) {
        alreadyPatched++
        continue
      }
      if (isDeepStrictEqual(slot.schema, wrongSchema)) {
        slot.schema = structuredClone(correctSchema)
        patched++
        continue
      }
      errors.push(
        `json-object body patch: ${method.toUpperCase()} ${pathStr} (${opId}) schema is in an unrecognized shape — upstream may have fixed it or changed it; review JSON_OBJECT_BODY_OPERATIONS`,
      )
    }
  }
  const missing = [...JSON_OBJECT_BODY_OPERATIONS].filter((opId) => !seen.has(opId))
  if (missing.length > 0) {
    errors.push(
      `json-object body patch: operationIds in allowlist not found in spec: ${missing.join(', ')} — upstream may have renamed them; review JSON_OBJECT_BODY_OPERATIONS`,
    )
  }
  console.log(
    `patch-spec: JSON-object request bodies — patched: ${patched}, already-patched: ${alreadyPatched}`,
  )
}

/**
 * ThingsBoard's spec emits `OutputStrategy` — the abstract base of the
 * TimeSeries/Attributes output strategies — as an empty schema `{}`. openapi-ts
 * turns `{}` into `z.unknown()`, so the generated `zOutput.strategy` (a `$ref`
 * to it) keeps its input verbatim. The concrete `TimeSeriesOutput` /
 * `AttributesOutput` then re-declare `strategy` through an `allOf` (→ a zod
 * intersection), and zod parses the same `strategy` on both sides: the
 * `z.unknown()` branch keeps `ttl` as a number, the concrete branch coerces it
 * to a bigint (int64), and `0 !== 0n` makes the intersection unmergable —
 * `safeParse` throws `Unmergable intersection. Error path: ["strategy","ttl"]`.
 *
 * Give the base a minimal concrete shape (`type` only, mirroring
 * `TimeSeriesOutputStrategy` / `AttributesOutputStrategy`) so it generates
 * `z.object({ type: z.string() })`. An object schema strips the extra keys on
 * the base branch, leaving nothing for the intersection to collide on, while
 * the concrete branch still carries the full coerced strategy. Remove once
 * upstream gives `OutputStrategy` a real shape.
 */
function patchOutputStrategy(schemas: Record<string, Schema>, errors: string[]): void {
  const patched: Schema = {
    type: 'object',
    properties: { type: { type: 'string' } },
    required: ['type'],
  }
  const current = schemas.OutputStrategy
  if (current === undefined) {
    errors.push('OutputStrategy patch: schema not found')
    return
  }
  let applied = 0
  let alreadyPatched = 0
  if (isDeepStrictEqual(current, {})) {
    schemas.OutputStrategy = patched
    applied = 1
  } else if (isDeepStrictEqual(current, patched)) {
    alreadyPatched = 1
  } else {
    errors.push(
      'OutputStrategy patch: schema no longer matches the empty upstream shape or this patch — upstream may have fixed it; review/remove patchOutputStrategy',
    )
    return
  }
  console.log(`patch-spec: OutputStrategy — patched: ${applied}, already-patched: ${alreadyPatched}`)
}

/**
 * TB's spec marks `email` as `required` on the Customer schema, but ThingsBoard
 * returns `email: null` for customers that have none (confirmed in prod for
 * site-customers). Codegen then emits `email: z.string()` — required &
 * non-nullable — so the `getCustomerById` response validator rejects EVERY
 * customer with a null email (thingsboard/thingsboard#15673, nullable optionals).
 *
 * Root cause is `required: ['email', 'title']`. Drop `email` from `required` so
 * codegen emits it as optional; postgenerate's makeOptionalFieldsNullable() then
 * widens it to `.nullable().optional()`, matching every sibling contact field
 * (country/state/city/address/address2/zip/phone) — all already non-required in
 * the spec and already nullable on the wire.
 *
 * `title` stays required: TB's Customer.title is NOT NULL (the display name,
 * duplicated read-only into `name`) and is always present on the wire. The audit
 * of zCustomer confirms `email` and `title` were the only two non-nullable,
 * non-optional string fields — every other contact field was already loosened.
 * Don't blanket-nullable; only `email` is the genuine defect here.
 *
 * Covers all four shapes via forEachShape so a future CustomerWritable doesn't
 * regress (CustomerInfo carries the same `required` array today; *Writable
 * shapes are absent from the spec and synthesized downstream from the base).
 */
function patchCustomerNullableEmail(
  schemas: Record<string, Schema>,
  errors: string[],
): void {
  const FIELD = 'email'
  const result = forEachShape('Customer', schemas, (schema, name) => {
    const properties = schema.properties as Record<string, unknown> | undefined
    if (!properties || !(FIELD in properties)) {
      errors.push(
        `Customer email patch: "${name}" has no "${FIELD}" property — upstream may have renamed or removed it; review patchCustomerNullableEmail`,
      )
      return 'already-patched'
    }
    const required = schema.required
    if (!Array.isArray(required)) {
      // Nothing required → email is already non-required, nothing to do.
      return 'already-patched'
    }
    const idx = required.indexOf(FIELD)
    if (idx === -1) return 'already-patched'
    required.splice(idx, 1)
    return 'patched'
  })
  logShapeResult('Customer email', result)
  // Loud-fail if no Customer* shape matched at all: every variant landed in
  // `missing`, so the patch silently did nothing. Upstream likely renamed or
  // removed the Customer schemas — review/remove patchCustomerNullableEmail
  // rather than shipping a regression. (Per-shape defects — a present shape
  // missing the `email` property — already push their own error above.)
  if (result.patched.length === 0 && result.alreadyPatched.length === 0) {
    errors.push(
      'Customer email patch: found 0 matching Customer* schemas — upstream may have renamed or removed them; review/remove patchCustomerNullableEmail',
    )
  }
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

patchCalculatedFieldConfiguration(schemas, errors)
patchJsonStringRequestBodies(spec, errors)
patchOutputStrategy(schemas, errors)
patchCustomerNullableEmail(schemas, errors)

if (errors.length > 0) {
  console.error('patch-spec: ERRORS:')
  for (const err of errors) console.error(`  - ${err}`)
  process.exit(1)
}

writeFileSync(SPEC_PATH, JSON.stringify(spec, null, 2) + '\n', 'utf8')
console.log(`patch-spec: ${patched} discriminator mapping(s) added, ${skipped} already present`)
