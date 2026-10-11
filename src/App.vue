<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { cloudEnabled, db } from './db';
import { useCurrentUser } from './composables/useCurrentUser';

const { t } = useI18n();
const router = useRouter();
const { user, isLoggedIn } = useCurrentUser();

function onAccountSelect(event: CustomEvent<{ item: { value: string } }>) {
  const action = event.detail.item.value;
  if (action === 'profile') router.push({ name: 'profile' });
  if (action === 'logout') db.cloud.logout();
}
</script>

<template>
  <wa-page disable-navigation-toggle>
    <header slot="header" class="app-header wa-split">
      <RouterLink :to="{ name: 'list' }" class="brand plain-link wa-cluster wa-gap-xs">
        <wa-icon name="box-archive" class="brand-icon"></wa-icon>
        <span>{{ t('app.name') }}</span>
      </RouterLink>

      <div class="wa-cluster wa-gap-s">
        <wa-button variant="brand" size="s" @click="router.push({ name: 'new' })">
          <wa-icon slot="start" name="plus"></wa-icon>
          {{ t('nav.newRecipe') }}
        </wa-button>

        <template v-if="cloudEnabled">
          <wa-dropdown v-if="isLoggedIn" placement="bottom-end" @wa-select="onAccountSelect">
            <wa-button slot="trigger" appearance="plain" size="s" with-caret>
              <wa-icon slot="start" name="circle-user"></wa-icon>
              <span class="account-label">{{ user?.name || user?.email || t('nav.account') }}</span>
            </wa-button>
            <wa-dropdown-item value="profile">
              <wa-icon slot="icon" name="user"></wa-icon>
              {{ t('nav.profile') }}
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
      <RouterView />
    </main>
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
}

.brand-icon {
  color: var(--wa-color-brand-fill-loud);
}

.local-notice {
  margin-block-end: var(--wa-space-l);
}

@media (width < 30rem) {
  .account-label {
    display: none;
  }
}
</style>
