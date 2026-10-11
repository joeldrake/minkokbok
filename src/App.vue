<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { cloudEnabled, db } from './db';
import { useCurrentUser } from './composables/useCurrentUser';
import BrandLogo from './components/BrandLogo.vue';
import LoginDialog from './components/LoginDialog.vue';
import { clearSyncRejections, syncRejections } from './db/syncRejections';

const { t } = useI18n();
const router = useRouter();
const route = useRoute();
const { user, isLoggedIn, isLoading, isAdmin, profile } = useCurrentUser();

function onAccountSelect(event: CustomEvent<{ item: { value: string } }>) {
  const action = event.detail.item.value;
  if (action === 'profile') router.push({ name: 'profile' });
  if (action === 'admin') router.push({ name: 'admin' });
  if (action === 'logout') db.cloud.logout();
}
</script>

<template>
  <wa-page disable-navigation-toggle disable-sticky="header">
    <header slot="header" class="app-header wa-split">
      <RouterLink :to="{ name: 'list' }" class="brand plain-link wa-cluster wa-gap-xs">
        <BrandLogo class="brand-logo" />
        <span>{{ t('app.name') }}</span>
      </RouterLink>

      <div class="wa-cluster wa-gap-s">
        <template v-if="cloudEnabled && !isLoading">
          <wa-dropdown v-if="isLoggedIn" placement="bottom-end" @wa-select="onAccountSelect">
            <wa-button slot="trigger" appearance="plain" size="s" with-caret>
              <wa-icon slot="start" name="circle-user"></wa-icon>
              <span class="account-label">{{ user?.name || user?.email || t('nav.account') }}</span>
            </wa-button>
            <wa-dropdown-item value="profile">
              <wa-icon slot="icon" name="user"></wa-icon>
              {{ t('nav.profile') }}
            </wa-dropdown-item>
            <wa-dropdown-item v-if="isAdmin" value="admin">
              <wa-icon slot="icon" name="users-gear"></wa-icon>
              {{ t('nav.admin') }}
            </wa-dropdown-item>
            <wa-divider></wa-divider>
            <wa-dropdown-item value="logout">
              <wa-icon slot="icon" name="right-from-bracket"></wa-icon>
              {{ t('nav.logout') }}
            </wa-dropdown-item>
          </wa-dropdown>
          <wa-button v-else appearance="outlined" size="s" @click="db.cloud.login()">
            {{ t('nav.login') }}
          </wa-button>
        </template>
      </div>
    </header>

    <main>
      <wa-callout v-if="!cloudEnabled" variant="warning" appearance="filled" size="s" class="page-content local-notice">
        <wa-icon slot="icon" name="triangle-exclamation"></wa-icon>
        {{ t('cloud.notConfigured') }}
      </wa-callout>
      <wa-callout v-if="syncRejections.length" variant="danger" class="page-content sync-rejected">
        <wa-icon slot="icon" name="circle-exclamation"></wa-icon>
        <div class="wa-split">
          <span>{{ t(syncRejections.some((r) => r.name === 'PermissionsDeniedError') ? 'cloud.rejectedPermission' : 'cloud.rejected') }}</span>
          <wa-button size="s" appearance="plain" @click="clearSyncRejections()">{{ t('cloud.dismiss') }}</wa-button>
        </div>
      </wa-callout>
      <RouterView />
    </main>

    <footer v-if="route.name === 'list'" slot="footer" class="app-footer">
      <div class="app-footer-inner wa-split wa-gap-l">
        <div class="wa-cluster wa-gap-s">
          <BrandLogo class="footer-logo" />
          <span class="footer-name">{{ t('app.name') }}</span>
        </div>
        <nav class="wa-cluster wa-gap-l wa-caption-m">
          <RouterLink :to="{ name: 'import' }">{{ t('nav.importRecipes') }}</RouterLink>
          <RouterLink v-if="profile" :to="{ name: 'public', params: { username: profile.username } }">
            {{ t('nav.publicPage') }}
          </RouterLink>
          <RouterLink v-if="isLoggedIn" :to="{ name: 'profile' }">{{ t('nav.profile') }}</RouterLink>
        </nav>
      </div>
    </footer>

    <LoginDialog v-if="cloudEnabled" />
  </wa-page>
</template>

<style scoped>
.app-header {
  inline-size: 100%;
  max-inline-size: 72rem;
  margin-inline: auto;
}

.brand {
  font-family: var(--wa-font-family-heading);
  font-size: var(--wa-font-size-l);
  font-weight: var(--wa-font-weight-bold);
  letter-spacing: 0.01em;
}

.brand-logo {
  inline-size: 2.25rem;
  block-size: 2.25rem;
  filter: drop-shadow(0 1px 1px rgb(23 45 70 / 0.25));
}

.app-footer-inner {
  max-inline-size: 72rem;
  margin-inline: auto;
}

.footer-logo {
  inline-size: 1.75rem;
  block-size: 1.75rem;
}

.footer-name {
  font-family: var(--wa-font-family-heading);
  font-weight: var(--wa-font-weight-bold);
}

.local-notice,
.sync-rejected {
  margin-block-end: var(--wa-space-l);
}

@media (width < 30rem) {
  .account-label {
    display: none;
  }
}
</style>
