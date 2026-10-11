<script setup lang="ts">
import { reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { db, PUBLIC_REALM } from '../db';
import { useCurrentUser } from '../composables/useCurrentUser';
import { inputValue } from '../utils';

const { t } = useI18n();
const router = useRouter();
const { isLoggedIn, profile } = useCurrentUser();

// Sökvägar som appen själv använder kan inte bli användarnamn.
const RESERVED = new Set(['recept', 'profil', 'logga-in', 'om', 'api', 'admin', 'installningar']);
const USERNAME_PATTERN = /^[a-z0-9](?:[a-z0-9-]{1,28})[a-z0-9]$/;

const host = location.host;
const form = reactive({ username: '', displayName: '', bio: '' });
const error = ref('');
const saved = ref(false);

watch(
  profile,
  (p) => {
    if (p) Object.assign(form, { username: p.username, displayName: p.displayName, bio: p.bio ?? '' });
  },
  { immediate: true },
);

async function onSubmit() {
  error.value = '';
  saved.value = false;
  const username = form.username.trim().toLowerCase();
  if (!USERNAME_PATTERN.test(username) || RESERVED.has(username)) {
    error.value = t('profile.usernameInvalid');
    return;
  }
  // OBS: kontrollerar bara mot profiler som synkats hit. Se beslutsunderlaget om unika namn.
  const existing = await db.profiles.where('username').equals(username).first();
  if (existing && existing.id !== profile.value?.id) {
    error.value = t('profile.usernameTaken');
    return;
  }
  const data = { username, displayName: form.displayName.trim() || username, bio: form.bio.trim() || undefined };
  if (profile.value) await db.profiles.update(profile.value.id, data);
  else await db.profiles.add({ ...data, realmId: PUBLIC_REALM });
  saved.value = true;
}
</script>

<template>
  <div class="page-content narrow wa-stack wa-gap-l">
    <h1 class="wa-heading-2xl">{{ t('profile.title') }}</h1>

    <wa-callout v-if="!isLoggedIn" variant="neutral">
      <wa-icon slot="icon" name="circle-info"></wa-icon>
      {{ t('profile.needsLogin') }}
    </wa-callout>

    <form v-else class="wa-stack wa-gap-l" @submit.prevent="onSubmit">
      <wa-input
        :label="t('profile.username')"
        :hint="t('profile.usernameHint', { url: `${host}/${form.username || '…'}` })"
        :value="form.username"
        required
        @input="form.username = inputValue($event).toLowerCase()"
      >
        <span slot="start" class="wa-color-text-quiet">/</span>
      </wa-input>
      <wa-input
        :label="t('profile.displayName')"
        :value="form.displayName"
        @input="form.displayName = inputValue($event)"
      ></wa-input>
      <wa-textarea :label="t('profile.bio')" :value="form.bio" rows="3" @input="form.bio = inputValue($event)"></wa-textarea>

      <wa-callout v-if="error" variant="danger" size="s">{{ error }}</wa-callout>
      <wa-callout v-if="saved" variant="success" size="s">{{ t('profile.saved') }}</wa-callout>

      <div class="wa-cluster wa-gap-s">
        <wa-button type="submit" variant="brand">{{ t('profile.save') }}</wa-button>
        <wa-button
          v-if="profile"
          appearance="plain"
          @click="router.push({ name: 'public', params: { username: profile.username } })"
        >
          {{ t('profile.viewPublic') }}
        </wa-button>
      </div>
    </form>
  </div>
</template>
