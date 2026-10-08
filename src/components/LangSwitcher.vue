<template>
  <label class="lang-sw" :class="variant" :title="$t('common.language')">
    <Languages size="1em" />
    <select :value="locale" @change="setLocale($event.target.value)" :aria-label="$t('common.language')">
      <option v-for="l in LOCALES" :key="l.code" :value="l.code">{{ l.label }}</option>
    </select>
  </label>
</template>

<script setup>
import { Languages } from 'lucide-vue-next'
import { LOCALES, locale, setLocale } from '../i18n/index.js'

// variant: 'light' (fond clair), 'dark' (en-tête sombre du site public)
defineProps({ variant: { type: String, default: 'light' } })
</script>

<style scoped>
.lang-sw { display: inline-flex; align-items: center; gap: 6px; height: 34px; padding: 0 10px; border-radius: 9px; cursor: pointer; font-size: .8rem; font-weight: 600; flex-shrink: 0; }
.lang-sw select { appearance: none; -webkit-appearance: none; background: transparent; border: none; outline: none; font: inherit; color: inherit; cursor: pointer; padding: 0; }
.lang-sw select option { color: #111827; background: #fff; }
.lang-sw.light { border: 1px solid var(--border, #e5e7eb); background: var(--surface, #fff); color: var(--text, #111827); }
.lang-sw.dark  { border: 1px solid #374151; background: transparent; color: #d1d5db; border-radius: 99px; }
.lang-sw.dark:hover { border-color: #16a34a; color: #4ade80; }
.lang-sw.purple { border: 1px solid #ddd6fe; background: #fff; color: #7c3aed; }
</style>
