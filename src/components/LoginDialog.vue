<script setup lang="ts">
import { computed, nextTick, ref, shallowRef, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import type { DXCAlert, DXCUserInteraction } from 'dexie-cloud-addon';
import { db } from '../db';
import { inputValue } from '../utils';

/**
 * Egen inloggningsruta för Dexie Cloud (customLoginGui: true).
 * Dexie Cloud lägger ut det som behöver fråga användaren i db.cloud.userInteraction;
 * vi ritar det med Web Awesome och svenska texter i stället för den inbyggda rutan.
 */
const { t, te } = useI18n();

const interaction = shallowRef<DXCUserInteraction>();
db.cloud.userInteraction.subscribe((ui) => (interaction.value = ui));

const values = ref<Record<string, string>>({});
const submitting = ref(false);
const form = ref<HTMLFormElement>();

watch(interaction, async (ui) => {
  values.value = {};
  submitting.value = false;
  if (!ui) return;
  // Sätt markören i första fältet så man kan börja skriva direkt.
  await nextTick();
  (form.value?.querySelector('wa-input') as HTMLElement | null)?.focus();
});

const type = computed(() => interaction.value?.type ?? 'generic');
const title = computed(() => (te(`login.${type.value}.title`) ? t(`login.${type.value}.title`) : interaction.value?.title));
const submitLabel = computed(() =>
  te(`login.${type.value}.submit`) ? t(`login.${type.value}.submit`) : interaction.value?.submitLabel,
);

/** Inloggningssätt (t.ex. Google) som Dexie Cloud erbjuder, om sådana är påslagna. */
const options = computed(() => (interaction.value && 'options' in interaction.value ? interaction.value.options : undefined));

function fieldLabel(name: string, fallback?: string) {
  return te(`login.fields.${name}.label`) ? t(`login.fields.${name}.label`) : fallback;
}
function fieldHint(name: string) {
  return te(`login.fields.${name}.hint`) ? t(`login.fields.${name}.hint`) : undefined;
}

/** Svensk text för kända meddelanden, annars Dexie Clouds engelska med parametrarna insatta. */
function alertText(alert: DXCAlert) {
  if (te(`login.alerts.${alert.messageCode}`)) return t(`login.alerts.${alert.messageCode}`, alert.messageParams);
  return alert.message.replace(/\{(\w+)\}/g, (_, key: string) => alert.messageParams[key] ?? '');
}

const alertVariant = { error: 'danger', warning: 'warning', info: 'brand' } as const;
const alertIcon = { error: 'circle-exclamation', warning: 'triangle-exclamation', info: 'envelope' } as const;

function submit(params = values.value) {
  if (!interaction.value || submitting.value) return;
  submitting.value = true;
  // Ta bort mellanslag som lätt följer med när man kopierar koden från mejlet.
  const cleaned = Object.fromEntries(Object.entries(params).map(([k, v]) => [k, v.trim()]));
  interaction.value.onSubmit(cleaned);
}

function cancel() {
  interaction.value?.onCancel();
}

function onAfterHide(event: Event) {
  // Stängd med Esc eller krysset medan Dexie Cloud fortfarande väntar på svar.
  if (event.target === event.currentTarget && interaction.value) cancel();
}
</script>

<template>
  <wa-dialog :open="Boolean(interaction)" :label="title" class="login-dialog" @wa-after-hide="onAfterHide">
    <form v-if="interaction" ref="form" class="wa-stack wa-gap-l" @submit.prevent="submit()">
      <p v-if="te(`login.${type}.intro`)" class="intro">{{ t(`login.${type}.intro`) }}</p>

      <wa-callout v-for="(alert, i) in interaction.alerts" :key="i" :variant="alertVariant[alert.type]">
        <wa-icon slot="icon" :name="alertIcon[alert.type]"></wa-icon>
        {{ alertText(alert) }}
      </wa-callout>

      <div v-if="options?.length" class="wa-stack wa-gap-s">
        <wa-button
          v-for="option in options"
          :key="option.value"
          appearance="outlined"
          size="l"
          @click="submit({ [option.name]: option.value })"
        >
          <img v-if="option.iconUrl" slot="start" :src="option.iconUrl" alt="" class="option-icon" />
          {{ option.displayName }}
        </wa-button>
        <wa-divider></wa-divider>
      </div>

      <wa-input
        v-for="(field, name) in interaction.fields"
        :key="name"
        :type="field.type === 'otp' ? 'text' : field.type"
        :label="fieldLabel(String(name), field.label)"
        :hint="fieldHint(String(name))"
        :autocomplete="field.type === 'otp' ? 'one-time-code' : field.type === 'email' ? 'email' : undefined"
        :value="values[name] ?? ''"
        size="l"
        required
        @input="values[name] = inputValue($event)"
      ></wa-input>

      <div class="wa-stack wa-gap-s">
        <wa-button type="submit" variant="brand" size="l" :loading="submitting">{{ submitLabel }}</wa-button>
        <wa-button v-if="interaction.cancelLabel" appearance="plain" size="l" @click="cancel">
          {{ te(`login.${type}.cancel`) ? t(`login.${type}.cancel`) : t('login.cancel') }}
        </wa-button>
      </div>

      <wa-callout v-if="te(`login.${type}.why.title`)" variant="neutral">
        <wa-icon slot="icon" name="circle-info"></wa-icon>
        <strong>{{ t(`login.${type}.why.title`) }}</strong>
        <ul class="why">
          <li>{{ t(`login.${type}.why.devices`) }}</li>
          <li>{{ t(`login.${type}.why.localRecipes`) }}</li>
        </ul>
      </wa-callout>
    </form>
  </wa-dialog>
</template>

<style scoped>
.login-dialog {
  --width: 28rem;
}

/* Lite större text: inloggningen ska vara lätt att läsa även för den som inte ser så bra. */
.login-dialog form {
  font-size: var(--wa-font-size-l);
}

.intro {
  margin: 0;
}

.why {
  margin: var(--wa-space-2xs) 0 0;
  padding-inline-start: 1.25em;
}

.option-icon {
  inline-size: 1.25em;
  block-size: 1.25em;
}
</style>
