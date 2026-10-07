'use strict';

// Run inside the Twenty image using its NestJS services.
require('reflect-metadata');

const { join } = require('node:path');
const { NestFactory } = require('@nestjs/core');
const { DataSource, IsNull } = require('typeorm');

// Compiled Twenty modules still use src/ imports.
require('tsconfig-paths').register({
  baseUrl: process.cwd(),
  paths: { 'src/*': ['dist/*'] },
});

function loadTwentyExports(modulePaths) {
  const buildDirectory = join(process.cwd(), 'dist');
  return Object.fromEntries(
    Object.entries(modulePaths).map(([exportName, modulePath]) => [
      exportName,
      require(join(buildDirectory, modulePath))[exportName],
    ]),
  );
}

const {
  CommandModule,
  MetadataEventEmitter,
  SignInUpService,
  WorkspaceService,
  SubdomainManagerService,
  KeyValuePairService,
  OnboardingService,
  TwentyConfigService,
  CoreEntityCacheService,
  WorkspaceOrmManager,
  buildSystemAuthContext,
  UserEntity,
  WorkspaceEntity,
  UserWorkspaceEntity,
  RoleEntity,
  RoleTargetEntity,
} = loadTwentyExports({
  CommandModule: 'command/command.module',
  MetadataEventEmitter: 'engine/subscriptions/metadata-event/metadata-event-emitter',
  SignInUpService: 'engine/core-modules/auth/services/sign-in-up.service',
  WorkspaceService: 'engine/core-modules/workspace/services/workspace.service',
  SubdomainManagerService: 'engine/core-modules/domain/subdomain-manager/services/subdomain-manager.service',
  KeyValuePairService: 'engine/core-modules/key-value-pair/key-value-pair.service',
  OnboardingService: 'engine/core-modules/onboarding/onboarding.service',
  TwentyConfigService: 'engine/core-modules/twenty-config/twenty-config.service',
  CoreEntityCacheService: 'engine/core-entity-cache/services/core-entity-cache.service',
  WorkspaceOrmManager: 'engine/twenty-orm/workspace-orm.manager',
  buildSystemAuthContext: 'engine/twenty-orm/utils/build-system-auth-context.util',
  UserEntity: 'engine/core-modules/user/user.entity',
  WorkspaceEntity: 'engine/core-modules/workspace/workspace.entity',
  UserWorkspaceEntity: 'engine/core-modules/user-workspace/user-workspace.entity',
  RoleEntity: 'engine/metadata-modules/role/role.entity',
  RoleTargetEntity: 'engine/metadata-modules/role-target/role-target.entity',
});

const STATE_KEY = 'LOCAL_ADMIN_BOOTSTRAP_STATE';
const LOCK_KEY = 'LOCAL_ADMIN_BOOTSTRAP_LOCK';
const GLOBAL_SCOPE = {
  type: 'USER_VARIABLE',
  userId: null,
  workspaceId: null,
};
const DEMO_OBJECTS = ['company', 'person', 'opportunity', 'workflow', 'dashboard'];

async function bootstrap() {
  const config = readConfiguration();
  const app = await NestFactory.createApplicationContext(CommandModule, {
    logger: ['error', 'warn'],
  });
  const keyValuePairs = app.get(KeyValuePairService);
  let lockAcquired = false;

  try {
    if (app.get(TwentyConfigService).get('IS_BILLING_ENABLED')) {
      throw new Error('Bootstrap requires self-hosted Twenty with billing disabled');
    }

    lockAcquired = await keyValuePairs.setIfNotExists({
      ...GLOBAL_SCOPE,
      key: LOCK_KEY,
      value: { startedAt: new Date().toISOString() },
    });
    if (!lockAcquired) {
      throw new Error('Bootstrap lock exists; inspect the previous run before recovery');
    }

    const state = await readCompletedState(keyValuePairs, config);
    const { account, newlyCreated } = await getOrCreateAccount(app, config, state);

    await verifyAdminRole(app, account);
    await finishProfile(app, account, config);
    await clearOnboarding(keyValuePairs, account);
    await verifyAccount(app, account, newlyCreated);

    await keyValuePairs.set({
      ...GLOBAL_SCOPE,
      key: STATE_KEY,
      value: {
        ...bootstrapIdentity(config),
        userId: account.user.id,
        workspaceId: account.workspace.id,
        status: 'completed',
      },
    });
    console.log(
      `Bootstrap complete: admin account and workspace ${account.workspace.id}; all onboarding disabled`,
    );
  } finally {
    // Release only the lock acquired by this process. Keep the creation state.
    try {
      if (lockAcquired) {
        await keyValuePairs.delete({ ...GLOBAL_SCOPE, key: LOCK_KEY });
      }
    } finally {
      await closeApplication(app);
    }
  }
}

async function closeApplication(app) {
  // Drain events before closing Redis connections and queues.
  try {
    await app.get(MetadataEventEmitter).drain();
  } finally {
    await app.close();
  }
}

function requiredEnvironmentValue(name) {
  const value = process.env[name];
  if (!value?.trim()) {
    throw new Error(`${name} is required`);
  }
  return value;
}

function readConfiguration() {
  const config = {
    email: requiredEnvironmentValue('BOOTSTRAP_ADMIN_EMAIL').trim().toLowerCase(),
    password: requiredEnvironmentValue('BOOTSTRAP_ADMIN_PASSWORD'),
    lastName: requiredEnvironmentValue('BOOTSTRAP_ADMIN_LAST_NAME').trim(),
    displayName: requiredEnvironmentValue('BOOTSTRAP_WORKSPACE_NAME').trim(),
    subdomain: requiredEnvironmentValue('BOOTSTRAP_WORKSPACE_SUBDOMAIN').trim(),
  };

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(config.email)) {
    throw new Error('Invalid bootstrap email');
  }
  if (config.password.length < 12 || config.password.length > 50) {
    throw new Error('Bootstrap password must contain 12–50 characters');
  }
  return config;
}

function bootstrapIdentity({ email, displayName, subdomain }) {
  // Never store the password in the marker or rotate it on reruns.
  return { email, displayName, subdomain };
}

async function readCompletedState(keyValuePairs, config) {
  const [savedState] = await keyValuePairs.get({ ...GLOBAL_SCOPE, key: STATE_KEY });
  const state = savedState?.value;
  if (!state) return state;

  const configurationMatches = Object.entries(bootstrapIdentity(config)).every(
    ([key, value]) => state[key] === value,
  );
  if (!configurationMatches || state.status !== 'completed') {
    throw new Error(
      'Bootstrap identity differs or a previous run is incomplete; inspect before recovery',
    );
  }
  return state;
}

async function getOrCreateAccount(app, config, state) {
  const database = app.get(DataSource);
  const existingAccount = await findExistingAccount(database, config, state);
  if (existingAccount) {
    return { account: existingAccount, newlyCreated: false };
  }
  if (state) {
    throw new Error('Completed bootstrap account no longer exists');
  }

  const userCount = await database.getRepository(UserEntity).count({ withDeleted: true });
  if (userCount) {
    throw new Error('First bootstrap requires a fresh database without users or workspaces');
  }
  const workspaceCount = await database.getRepository(WorkspaceEntity).count({
    withDeleted: true,
  });
  if (workspaceCount) {
    throw new Error('First bootstrap requires a fresh database without users or workspaces');
  }

  await app.get(SubdomainManagerService).validateSubdomainOrThrow(config.subdomain);
  assertDemoPrefillHook(app.get(WorkspaceService));
  const newUserWithPicture = await prepareNewUser(app, config);

  // Activation spans multiple transactions. The marker prevents automatic replay
  // after a partial failure; inspect the persisted state before recovery.
  await app.get(KeyValuePairService).set({
    ...GLOBAL_SCOPE,
    key: STATE_KEY,
    value: { ...bootstrapIdentity(config), status: 'creating' },
  });
  const account = await createAccount(app, config, newUserWithPicture);
  return { account, newlyCreated: true };
}

async function findExistingAccount(database, config, state) {
  const user = await database.getRepository(UserEntity).findOneBy({
    email: config.email,
  });
  const workspace = await database.getRepository(WorkspaceEntity).findOneBy({
    subdomain: config.subdomain,
  });
  if (!user && !workspace) return null;

  const mismatchMessage = 'Existing administrator/workspace does not match bootstrap configuration';
  if (!user || !workspace) {
    throw new Error(mismatchMessage);
  }

  const isEnabledAdmin = !user.disabled && user.canAccessFullAdminPanel;
  const workspaceMatches = workspace.displayName === config.displayName
    && ['ACTIVE', 'CREATED'].includes(workspace.activationStatus);
  const identityMatches = !state
    || (state.userId === user.id && state.workspaceId === workspace.id);
  if (!isEnabledAdmin || !workspaceMatches || !identityMatches) {
    throw new Error(mismatchMessage);
  }

  // Without the new marker, adopt only a single matching account/workspace pair.
  // This supports migration from SQL bootstrap without recreating the workspace.
  if (!state) {
    const userCount = await database.getRepository(UserEntity).count({ withDeleted: true });
    if (userCount !== 1) {
      throw new Error('Only a single matching administrator/workspace can be adopted');
    }
    const workspaceCount = await database.getRepository(WorkspaceEntity).count({
      withDeleted: true,
    });
    if (workspaceCount !== 1) {
      throw new Error('Only a single matching administrator/workspace can be adopted');
    }
  }
  return { user, workspace };
}

async function prepareNewUser(app, config) {
  // Native password validation and hashing must succeed before persisting intent.
  return app.get(SignInUpService).computePartialUserFromUserPayload(
    {
      email: config.email,
      firstName: 'Admin',
      lastName: config.lastName,
      locale: 'en',
      isEmailAlreadyVerified: true,
    },
    { provider: 'password', password: config.password },
  );
}

async function createAccount(app, config, newUserWithPicture) {
  const account = await app.get(SignInUpService).signUpOnNewWorkspace(
    { type: 'newUserWithPicture', newUserWithPicture },
    { displayName: config.displayName, subdomain: config.subdomain },
  );

  account.workspace = await activateWithoutDemoData(app.get(WorkspaceService), account);
  return account;
}

function assertDemoPrefillHook(workspaceService) {
  if (typeof workspaceService.prefillCreatedWorkspaceRecords !== 'function') {
    throw new Error('Unsupported Twenty version: demo prefill hook is missing');
  }
}

async function activateWithoutDemoData(workspaceService, { user, workspace }) {
  assertDemoPrefillHook(workspaceService);

  // Override demo prefill only in this bootstrap process. Other activation steps
  // remain standard; server and worker use their own service instances.
  const originalPrefill = workspaceService.prefillCreatedWorkspaceRecords;
  workspaceService.prefillCreatedWorkspaceRecords = async () => {};
  try {
    return await workspaceService.activateWorkspace(user, workspace);
  } finally {
    workspaceService.prefillCreatedWorkspaceRecords = originalPrefill;
  }
}

async function finishProfile(app, { user, workspace }, config) {
  const users = app.get(DataSource).getRepository(UserEntity);
  const enabledAdmin = {
    id: user.id,
    disabled: false,
    canAccessFullAdminPanel: true,
    deletedAt: IsNull(),
  };
  // Update only profile fields; the loaded user may contain outdated credentials.
  const verification = await users.update(enabledAdmin, { isEmailVerified: true });
  if (!verification.affected) {
    throw new Error('Bootstrap administrator is no longer active');
  }
  if (!user.lastName?.trim()) {
    // Preserve a surname changed after bootstrap read the user.
    await users.update(
      { ...enabledAdmin, lastName: user.lastName ?? IsNull() },
      { lastName: config.lastName },
    );
  }

  const workspaceOrm = app.get(WorkspaceOrmManager);
  await workspaceOrm.executeInWorkspaceContext(async () => {
    const members = workspaceOrm.getRepository('workspaceMember', {
      shouldBypassPermissionChecks: true,
    });
    const member = await members.findOneBy({ userId: user.id });
    if (!member) {
      throw new Error('Administrator workspace member is missing');
    }
    if (!member.name?.lastName?.trim()) {
      await members.update(
        { id: member.id, name: { lastName: member.name?.lastName ?? IsNull() } },
        { name: { lastName: config.lastName } },
      );
    }
  }, buildSystemAuthContext(workspace.id));

  const cache = app.get(CoreEntityCacheService);
  await cache.invalidate('userEntity', user.id);
  await cache.invalidate('workspaceEntity', workspace.id);
}

async function clearOnboarding(keyValuePairs, { user, workspace }) {
  // Twenty merges all three scopes; clear step history as well as pending flags.
  const scopes = [
    { userId: user.id, workspaceId: null },
    { userId: null, workspaceId: workspace.id },
    { userId: user.id, workspaceId: workspace.id },
  ];
  for (const scope of scopes) {
    const rows = await keyValuePairs.get({ ...scope, type: 'USER_VARIABLE' });
    const onboardingRows = rows.filter(row => row.key.startsWith('ONBOARDING_'));
    for (const row of onboardingRows) {
      await keyValuePairs.delete({ ...scope, type: 'USER_VARIABLE', key: row.key });
    }
  }
}

async function verifyAdminRole(app, { user, workspace }) {
  const database = app.get(DataSource);
  const membership = await database.getRepository(UserWorkspaceEntity).findOneBy({
    userId: user.id,
    workspaceId: workspace.id,
  });
  const adminRole = await database.getRepository(RoleEntity).findOneBy({
    workspaceId: workspace.id,
    label: 'Admin',
  });
  if (!membership || !adminRole) {
    throw new Error('Bootstrap administrator role is missing');
  }

  const roleAssignment = await database.getRepository(RoleTargetEntity).findOneBy({
    workspaceId: workspace.id,
    userWorkspaceId: membership.id,
    roleId: adminRole.id,
  });
  if (!roleAssignment) {
    throw new Error('Bootstrap administrator role is missing');
  }
}

async function verifyAccount(app, { user, workspace }, newlyCreated) {
  const onboardingStatus = await app.get(OnboardingService).getOnboardingStatus({
    userId: user.id,
    workspaceId: workspace.id,
  });
  if (onboardingStatus !== 'COMPLETED') {
    throw new Error('Bootstrap onboarding is not complete');
  }

  // Reruns preserve business data, so check for empty objects only on creation.
  if (!newlyCreated) return;

  const workspaceOrm = app.get(WorkspaceOrmManager);
  await workspaceOrm.executeInWorkspaceContext(async () => {
    for (const object of DEMO_OBJECTS) {
      const repository = workspaceOrm.getRepository(object, {
        shouldBypassPermissionChecks: true,
      });
      const recordCount = await repository.count();
      if (recordCount) {
        throw new Error(`Unexpected demo records in ${object}`);
      }
    }
  }, buildSystemAuthContext(workspace.id));
}

bootstrap().catch(error => {
  console.error(`Bootstrap failed: ${error.message}`);
  process.exitCode = 1;
});
