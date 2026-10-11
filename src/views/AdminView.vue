<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useCurrentUser } from '../composables/useCurrentUser';
import { inputValue } from '../utils';

interface Account {
  userId: string;
  email?: string;
  displayName?: string;
  license?: string;
  evalDaysLeft?: number;
  lastLogin?: string;
  deactivated: boolean;
  role: 'member' | 'admin' | null;
}

const { t } = useI18n();
const { user, isLoading, isAdmin } = useCurrentUser();

const accounts = ref<Account[]>();
const error = ref('');
const busy = ref<string>();
const confirmDelete = ref<Account>();

/** Anrop till Workerns admin-API med användarens Dexie Cloud-token. */
async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`/api/admin${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.value?.accessToken ?? ''}` },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error ?? t('admin.requestFailed', { status: res.status }));
  return body as T;
}

async function load() {
  error.value = '';
  try {
    accounts.value = await api<Account[]>('/users');
    accounts.value.sort((a, b) => (b.lastLogin ?? '').localeCompare(a.lastLogin ?? ''));
  } catch (e) {
    error.value = (e as Error).message;
  }
}

async function onRoleChange(account: Account, event: Event) {
  const value = inputValue(event);
  const role = value === 'none' ? null : (value as Account['role']);
  busy.value = account.userId;
  error.value = '';
  try {
    await api(`/users/${encodeURIComponent(account.userId)}/role`, { method: 'PUT', body: JSON.stringify({ role }) });
    account.role = role;
  } catch (e) {
    error.value = (e as Error).message;
    await load();
  } finally {
    busy.value = undefined;
  }
}

async function onDelete() {
  const account = confirmDelete.value;
  confirmDelete.value = undefined;
  if (!account) return;
  busy.value = account.userId;
  error.value = '';
  try {
    await api(`/users/${encodeURIComponent(account.userId)}`, { method: 'DELETE' });
    accounts.value = accounts.value?.filter((a) => a.userId !== account.userId);
  } catch (e) {
    error.value = (e as Error).message;
  } finally {
    busy.value = undefined;
  }
}

onMounted(() => {
  if (isAdmin.value) load();
});
watch(isAdmin, (admin) => {
  if (admin && !accounts.value) load();
});
</script>

<template>
  <div class="page-content wa-stack wa-gap-l">
    <h1 class="wa-heading-2xl">{{ t('admin.title') }}</h1>

    <wa-spinner v-if="isLoading"></wa-spinner>

    <wa-callout v-else-if="!isAdmin" variant="neutral">
      <wa-icon slot="icon" name="circle-info"></wa-icon>
      {{ t('admin.needsAdmin') }}
    </wa-callout>

    <template v-else>
      <wa-callout v-if="error" variant="danger" size="s">{{ error }}</wa-callout>
      <wa-spinner v-if="!accounts && !error"></wa-spinner>

      <div v-if="accounts" class="table-wrap">
        <table class="accounts">
          <thead>
            <tr>
              <th>{{ t('admin.account') }}</th>
              <th>{{ t('admin.license') }}</th>
              <th>{{ t('admin.lastLogin') }}</th>
              <th>{{ t('admin.role') }}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="account in accounts" :key="account.userId">
              <td>
                <div>{{ account.displayName || account.email || account.userId }}</div>
                <div v-if="account.displayName" class="wa-caption-s">{{ account.email || account.userId }}</div>
              </td>
              <td>
                {{ account.license ?? '–' }}
                <span v-if="account.license === 'eval' && account.evalDaysLeft != null" class="wa-caption-s">
                  {{ t('admin.daysLeft', { days: account.evalDaysLeft }) }}
                </span>
                <wa-tag v-if="account.deactivated" size="s" variant="danger">{{ t('admin.deactivated') }}</wa-tag>
              </td>
              <td>
                <wa-relative-time v-if="account.lastLogin" :date="account.lastLogin" lang="sv"></wa-relative-time>
                <template v-else>–</template>
              </td>
              <td>
                <wa-select
                  size="s"
                  :value="account.role ?? 'none'"
                  :disabled="busy === account.userId || account.userId === user?.userId"
                  @change="onRoleChange(account, $event)"
                >
                  <wa-option value="none">{{ t('admin.roles.none') }}</wa-option>
                  <wa-option value="member">{{ t('admin.roles.member') }}</wa-option>
                  <wa-option value="admin">{{ t('admin.roles.admin') }}</wa-option>
                </wa-select>
              </td>
              <td>
                <wa-button
                  v-if="account.userId !== user?.userId"
                  size="s"
                  appearance="plain"
                  variant="danger"
                  :loading="busy === account.userId"
                  @click="confirmDelete = account"
                >
                  <wa-icon name="trash" :label="t('admin.delete')"></wa-icon>
                </wa-button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <wa-dialog :open="Boolean(confirmDelete)" :label="t('admin.deleteTitle')" @wa-after-hide="confirmDelete = undefined">
      {{ t('admin.deleteText', { account: confirmDelete?.email || confirmDelete?.userId }) }}
      <wa-button slot="footer" appearance="plain" @click="confirmDelete = undefined">{{ t('login.cancel') }}</wa-button>
      <wa-button slot="footer" variant="danger" @click="onDelete">{{ t('admin.delete') }}</wa-button>
    </wa-dialog>
  </div>
</template>

<style scoped>
.table-wrap {
  overflow-x: auto;
}

.accounts {
  inline-size: 100%;
  border-collapse: collapse;
}

.accounts th,
.accounts td {
  padding: var(--wa-space-xs) var(--wa-space-s);
  text-align: start;
  vertical-align: middle;
  border-block-end: var(--wa-border-width-s) solid var(--wa-color-surface-border);
}

.accounts th {
  font-weight: var(--wa-font-weight-semibold);
  white-space: nowrap;
}

.accounts wa-select {
  min-inline-size: 9rem;
}
</style>
