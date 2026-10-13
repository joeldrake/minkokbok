<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { cloudEnabled, db, dbStatus } from './db';
import { useCurrentUser } from './composables/useCurrentUser';
import BrandLogo from './components/BrandLogo.vue';
import LoginDialog from './components/LoginDialog.vue';
import UpdatePrompt from './components/UpdatePrompt.vue';
import { clearSyncRejections, syncRejections } from './db/syncRejections';
import { forgetRecipeOrigin } from './navigation';

const { t } = useI18n();
const router = useRouter();
const route = useRoute();
const { user, isLoggedIn, isLoading, isAdmin, profile } = useCurrentUser();
const year = new Date().getFullYear();

function reload() {
  location.reload();
}

function onAccountSelect(event: CustomEvent<{ item: { value: string } }>) {
  const action = event.detail.item.value;
  if (action === 'profile') router.push({ name: 'profile' });
  if (action === 'public' && profile.value) router.push({ name: 'public', params: { username: profile.value.username } });
  if (action === 'admin') router.push({ name: 'admin' });
  if (action === 'logout') db.cloud.logout();
}
</script>

<template>
  <wa-page disable-navigation-toggle disable-sticky="header">
    <header slot="header" class="app-header wa-split">
      <RouterLink :to="{ name: 'list' }" class="brand plain-link wa-cluster wa-gap-xs" @click="forgetRecipeOrigin">
        <BrandLogo class="brand-logo" />
        <span>{{ t('app.name') }}</span>
      </RouterLink>

      <div class="wa-cluster wa-gap-s">
        <wa-button v-if="cloudEnabled" appearance="plain" size="s" :title="t('nav.find')" @click="router.push({ name: 'find' })">
          <wa-icon slot="start" name="magnifying-glass"></wa-icon>
          <span class="header-label">{{ t('nav.find') }}</span>
        </wa-button>
        <template v-if="cloudEnabled && !isLoading">
          <wa-dropdown v-if="isLoggedIn" placement="bottom-end" @wa-select="onAccountSelect">
            <wa-button slot="trigger" appearance="plain" size="s" with-caret>
              <wa-icon slot="start" name="circle-user"></wa-icon>
              <span class="header-label">{{ user?.name || user?.email || t('nav.account') }}</span>
            </wa-button>
            <wa-dropdown-item value="profile">
              <wa-icon slot="icon" name="user"></wa-icon>
              {{ t('nav.profile') }}
            </wa-dropdown-item>
            <wa-dropdown-item v-if="profile" value="public">
              <wa-icon slot="icon" name="globe"></wa-icon>
              {{ t('nav.publicPage') }}
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
      <wa-callout v-if="dbStatus === 'failed'" variant="danger" class="page-content db-failed">
        <wa-icon slot="icon" name="circle-exclamation"></wa-icon>
        <div class="wa-split">
          <span>{{ t('cloud.openFailed') }}</span>
          <!-- En synk som hänger går inte att avbryta, så ladda om sidan -->
          <wa-button size="s" appearance="plain" @click="reload()">{{ t('cloud.retry') }}</wa-button>
        </div>
      </wa-callout>
      <wa-callout v-if="syncRejections.length" variant="danger" class="page-content sync-rejected">
        <wa-icon slot="icon" name="circle-exclamation"></wa-icon>
        <div class="wa-split">
          <span>{{ t(syncRejections.some((r) => r.name === 'PermissionsDeniedError') ? 'cloud.rejectedPermission' : 'cloud.rejected') }}</span>
          <wa-button size="s" appearance="plain" @click="clearSyncRejections()">{{ t('cloud.dismiss') }}</wa-button>
        </div>
      </wa-callout>
      <!-- Listan sparas, så att tillbaka från ett recept visar den direkt i stället för att ladda om den -->
      <RouterView v-slot="{ Component }">
        <KeepAlive include="RecipeListView">
          <component :is="Component" />
        </KeepAlive>
      </RouterView>
    </main>

    <footer v-if="route.name === 'list'" slot="footer" class="app-footer">
      <div class="app-footer-inner wa-split wa-gap-l">
        <a href="https://github.com/joeldrake/minkokbok" class="wa-cluster wa-gap-xs" target="_blank" rel="noopener">
          <wa-icon family="brands" name="github" class="footer-github"></wa-icon>
          {{ t('app.github') }}
        </a>
        <span class="wa-caption-m wa-color-text-quiet">{{ year }}</span>
      </div>
    </footer>

    <LoginDialog v-if="cloudEnabled" />
    <UpdatePrompt />
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

.footer-github {
  font-size: var(--wa-font-size-l);
}

.local-notice,
.db-failed,
.sync-rejected {
  margin-block-end: var(--wa-space-l);
}

/* Långa e-postadresser kortas av i stället för att trycka ihop sidhuvudet */
.header-label {
  display: inline-block;
  max-inline-size: 14rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: bottom;
}

/* Bara ikoner innan texterna hinner krocka med logotypen och radbrytas */
@media (width < 48rem) {
  .header-label {
    display: none;
  }
}
</style>
