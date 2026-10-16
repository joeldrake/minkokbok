<script setup lang="ts">
import { reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { db, PUBLIC_REALM } from '../db';
import { useCurrentUser } from '../composables/useCurrentUser';
import { useLiveQuery } from '../composables/useLiveQuery';
import { inputValue } from '../utils';
import { syncRejections } from '../db/syncRejections';
import PalettePicker from '../components/PalettePicker.vue';
import BreadLoader from '../components/BreadLoader.vue';

const { t } = useI18n();
const router = useRouter();
const { isLoggedIn, isLoading, profile, canPublish } = useCurrentUser();

// Sökvägar som appen själv använder kan inte bli användarnamn.
const RESERVED = new Set(['recept', 'profil', 'hitta', 'logga-in', 'om', 'api', 'admin', 'installningar']);
const USERNAME_PATTERN = /^[a-z0-9](?:[a-z0-9-]{1,28})[a-z0-9]$/;

const host = location.host;
const form = reactive({ username: '', displayName: '', bio: '' });
const error = ref('');
const saved = ref(false);
const saving = ref(false);

watch(
  profile,
  (p) => {
    if (p) Object.assign(form, { username: p.username, displayName: p.displayName, bio: p.bio ?? '' });
  },
  { immediate: true },
);

/**
 * Om någon annan profil i den publika realmen redan har namnet. Alla profiler ligger i
 * rlm-public, som synkas hit i sin helhet. Servern kontrollerar inte unikhet; se
 * beslutsunderlaget.
 */
async function isUsernameTaken(username: string) {
  const existing = await db.profiles.where('username').equals(username).first();
  return Boolean(existing && existing.id !== profile.value?.id);
}

// Visar direkt medan man skriver om namnet redan är upptaget.
const usernameTaken = useLiveQuery(
  () => isUsernameTaken(form.username.trim()),
  () => [form.username.trim(), profile.value?.id],
);

async function onSubmit() {
  error.value = '';
  saved.value = false;
  const username = form.username.trim().toLowerCase();
  if (!USERNAME_PATTERN.test(username) || RESERVED.has(username)) {
    error.value = t('profile.usernameInvalid');
    return;
  }
  if (username !== profile.value?.username) {
    // Hämta det senaste från den publika realmen så att kontrollen inte går mot gammal data.
    // Går det inte att nå servern sparar vi inte, eftersom namnet då inte kan kontrolleras.
    try {
      await db.cloud.sync({ wait: true, purpose: 'pull' });
    } catch {
      error.value = t('profile.usernameUnverified');
      return;
    }
    if (await isUsernameTaken(username)) {
      error.value = t('profile.usernameTaken');
      return;
    }
  }
  const rejectionsBefore = syncRejections.value.length;
  const data = { username, displayName: form.displayName.trim() || username, bio: form.bio.trim() || undefined };
  if (profile.value) await db.profiles.update(profile.value.id, data);
  else await db.profiles.add({ ...data, realmId: PUBLIC_REALM });
  // Vänta på att servern tagit emot ändringen innan vi säger att den är sparad.
  saving.value = true;
  try {
    await db.cloud.sync({ wait: true, purpose: 'push' });
  } catch {
    // Offline eller nätverksfel: ändringen ligger kvar lokalt och skickas vid nästa synk.
  } finally {
    saving.value = false;
  }
  const rejected = syncRejections.value.slice(rejectionsBefore).some((r) => r.table === 'profiles');
  if (rejected) error.value = t('profile.rejected');
  else saved.value = true;
}
</script>

<template>
  <div class="page-content narrow wa-stack wa-gap-l">
    <h1 class="wa-heading-2xl">{{ t('profile.title') }}</h1>

    <BreadLoader v-if="isLoading" />

    <wa-callout v-else-if="!isLoggedIn" variant="neutral">
      <wa-icon slot="icon" name="circle-info"></wa-icon>
      <div class="wa-stack wa-gap-s">
        <span>{{ t('profile.needsLogin') }}</span>
        <div>
          <wa-button variant="brand" size="s" @click="db.cloud.login()">{{ t('nav.login') }}</wa-button>
        </div>
      </div>
    </wa-callout>

    <wa-callout v-else-if="!canPublish" variant="neutral">
      <wa-icon slot="icon" name="circle-info"></wa-icon>
      {{ t('profile.needsRole') }}
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
      <wa-callout v-if="usernameTaken && !error" variant="danger" size="s">{{ t('profile.usernameTaken') }}</wa-callout>
      <wa-input
        :label="t('profile.displayName')"
        :value="form.displayName"
        @input="form.displayName = inputValue($event)"
      ></wa-input>
      <wa-textarea :label="t('profile.bio')" :value="form.bio" rows="3" @input="form.bio = inputValue($event)"></wa-textarea>

      <wa-callout v-if="error" variant="danger" size="s">{{ error }}</wa-callout>
      <wa-callout v-if="saved" variant="success" size="s">{{ t('profile.saved') }}</wa-callout>

      <div class="wa-cluster wa-gap-s">
        <wa-button type="submit" variant="brand" :loading="saving" :disabled="usernameTaken">{{ t('profile.save') }}</wa-button>
        <wa-button
          v-if="profile"
          appearance="plain"
          @click="router.push({ name: 'public', params: { username: profile.username } })"
        >
          {{ t('profile.viewPublic') }}
        </wa-button>
      </div>
    </form>

    <wa-divider></wa-divider>
    <PalettePicker />
  </div>
</template>
