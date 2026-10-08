<template>
  <div class="pub-home">
    <!-- Hero -->
    <section class="pub-hero">
      <div class="pub-container">
        <div class="pub-hero-content">
          <div class="pub-hero-tag"><Leaf size="1em" /> {{ $t('home.available') }}</div>
          <h1 class="pub-hero-title">
            {{ $t('home.heroTitle1') }}<br/>
            <span class="pub-hero-accent">{{ $t('home.heroTitle2') }}</span>
          </h1>
          <p class="pub-hero-desc">
            {{ $t('home.heroDesc') }}
          </p>

          <!-- Search box -->
          <div class="pub-hero-search">
            <div class="pub-hero-search-wrap">
              <span class="search-icon"><Search size="1em" /></span>
              <input
                v-model="query"
                class="pub-hero-inp"
                :placeholder="$t('home.searchPh')"
                @keyup.enter="doSearch"
                @input="debouncedSearch"
              />
              <button class="pub-hero-btn" @click="doSearch">
                {{ $t('common.search') }}
              </button>
            </div>
            <p class="pub-hero-locate">
              {{ $t('home.or') }} <button @click="locateMe" class="pub-locate-btn"><MapPin size="1em" /> {{ $t('home.useLocation') }}</button> {{ $t('home.toSeeNearby') }}
            </p>
          </div>

          <!-- Quick links -->
          <div class="pub-hero-chips">
            <button v-for="tag in quickTags" :key="tag" @click="query=tag;doSearch()" class="pub-hero-chip">{{ tag }}</button>
          </div>
        </div>

        <div class="pub-hero-visual">
          <div class="pub-hero-card-float">
            <div class="pub-float-icon"><Pill size="1em" /></div>
            <div class="pub-float-info">
              <div class="pub-float-title">Paracetamol 500mg</div>
              <div class="pub-float-location">{{ $t('home.demo1') }}</div>
            </div>
            <span class="pub-float-stock">{{ $t('pub.inStockCaps') }}</span>
          </div>
          <div class="pub-hero-card-float pub-hero-card-offset1">
            <div class="pub-float-icon"><Stethoscope size="1em" /></div>
            <div class="pub-float-info">
              <div class="pub-float-title">Amoxicilline 500mg</div>
              <div class="pub-float-location">{{ $t('home.demo2') }}</div>
            </div>
            <span class="pub-float-stock">{{ $t('pub.inStockCaps') }}</span>
          </div>
          <div class="pub-hero-card-float pub-hero-card-offset2">
            <div class="pub-float-icon"><Syringe size="1em" /></div>
            <div class="pub-float-info">
              <div class="pub-float-title">Ibuprofène 400mg</div>
              <div class="pub-float-location">{{ $t('home.demo3') }}</div>
            </div>
            <span class="pub-float-stock">{{ $t('pub.availableN', { n: 3 }) }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- How it works -->
    <section class="pub-how-section">
      <div class="pub-container">
        <div class="pub-section-header">
          <h2 class="pub-section-title">{{ $t('home.howTitle') }}</h2>
          <p class="pub-section-sub">{{ $t('home.howSub') }}</p>
        </div>
        <div class="pub-steps-grid">
          <div v-for="step in steps" :key="step.num" class="pub-step-card">
            <div class="pub-step-icon" :style="{background:step.bg}"><component :is="step.icon" size="1em" /></div>
            <div class="pub-step-num">{{ step.num }}</div>
            <h3 class="pub-step-title">{{ $t(step.title) }}</h3>
            <p class="pub-step-desc">{{ $t(step.desc) }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Nearby pharmacies -->
    <section class="pub-pharmacies-section">
      <div class="pub-container">
        <div class="pub-pharmacies-header">
          <div class="pub-pharmacies-title-wrap">
            <h2 class="pub-section-title">{{ $t('home.availablePharmacies') }}</h2>
            <p class="pub-pharmacies-count">{{ $t('home.partnerCount', { n: cartStore.pharmacies.length }) }}</p>
          </div>
          <div class="pub-pharmacies-actions">
            <button @click="locateMe" class="pub-btn-outline">
              <MapPin size="1em" /> {{ cartStore.userLocation ? $t('home.nearest') : $t('pub.locateMe') }}
            </button>
            <RouterLink to="/pharmacies" class="pub-btn-green">{{ $t('home.seeAll') }}</RouterLink>
          </div>
        </div>

        <div v-if="cartStore.loading" class="pub-loading">
          <div class="pub-spinner"></div>
          {{ $t('common.loading') }}
        </div>
        <div v-else-if="!cartStore.pharmacies.length" class="pub-empty">
          <div class="pub-empty-icon"><Hospital size="1em" /></div>
          <p class="pub-empty-text">{{ $t('home.noPharmacy') }}</p>
        </div>
        <div v-else class="pub-pharmacies-grid">
          <div v-for="ph in cartStore.pharmacies.slice(0,6)" :key="ph.id" class="pub-card" @click="$router.push('/pharmacie/'+ph.id)">
            <div class="pub-card-content">
              <div class="pub-card-header">
                <div class="pub-card-pharmacy">
                  <div class="pub-card-icon" :class="{ 'has-logo': pharmacyLogoUrl(ph) }">
                    <img v-if="pharmacyLogoUrl(ph)" :src="pharmacyLogoUrl(ph)" :alt="ph.name"/>
                    <Hospital v-else size="1em" />
                  </div>
                  <div class="pub-card-info">
                    <div class="pub-card-name">{{ ph.name }}</div>
                    <div class="pub-card-city"><MapPin size="1em" /> {{ ph.city || $t('pub.defaultCountry') }}</div>
                  </div>
                </div>
                <DutyBadge v-if="dutyStatus(ph)" :pharmacy="ph"/>
                <span v-else class="pub-badge-green">{{ $t('pub.open') }}</span>
              </div>
              <div v-if="ph.duty_days?.length" style="font-size:.75rem;color:#4338ca;margin-top:6px;">
                <Moon size="1em" /> {{ $t('pub.dutyLabel') }} {{ formatDutyDays(ph.duty_days, 'short') }} · {{ formatDutyHours(ph) }}
              </div>
              <div v-if="ph.distance" class="pub-card-distance">
                <Navigation size="1em" /> {{ formatDistance(ph.distance) }}
              </div>
              <div class="pub-card-contact">
                <Phone size="1em" /> <span v-if="ph.phone" class="mono-ltr">{{ ph.phone }}</span><template v-else>{{ $t('pub.notProvided') }}</template>
                <span v-if="ph.email"> · {{ ph.email }}</span>
              </div>
              <div class="pub-card-stats">
                <div class="pub-stat">
                  <div class="pub-stat-value">{{ ph._count?.products ?? '—' }}</div>
                  <div class="pub-stat-label">{{ $t('nav.products') }}</div>
                </div>
                <div class="pub-stat pub-stat-blue">
                  <div class="pub-stat-value">{{ ph.subscription?.plan || 'FREE' }}</div>
                  <div class="pub-stat-label">{{ $t('super.ph.plan') }}</div>
                </div>
              </div>
            </div>
            <div class="pub-card-footer">
              <button class="pub-btn-green pub-btn-sm" @click.stop="$router.push('/pharmacie/'+ph.id)">
                {{ $t('pub.seeProducts') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { Leaf, Search, MapPin, Pill, Stethoscope, Syringe, Hospital, Moon, Navigation, Phone, ShoppingCart } from 'lucide-vue-next'
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '../../stores/cart.js'
import { dutyStatus, formatDutyDays, formatDutyHours } from '../../utils/duty.js'
import DutyBadge from '../../components/DutyBadge.vue'
import { pharmacyLogoUrl } from '../../utils/logo.js'
import { formatDistance } from '../../utils/geo.js'

const router    = useRouter()
const cartStore = useCartStore()
const query     = ref('')

const quickTags = ['Paracetamol', 'Amoxicilline', 'Ibuprofène', 'Vitamines', 'Antitussif', 'Antipaludéen']
const steps = [
  // title / desc : clés i18n
  { num:1, icon:Search, bg:'#f0fdf4', title:'home.step1Title', desc:'home.step1Desc' },
  { num:2, icon:ShoppingCart, bg:'#eff6ff', title:'home.step2Title', desc:'home.step2Desc' },
  { num:3, icon:Hospital, bg:'#f5f3ff', title:'home.step3Title', desc:'home.step3Desc' },
]

let dt
function debouncedSearch() { clearTimeout(dt); dt = setTimeout(() => { if (query.value.length >= 2) cartStore.searchProducts(query.value) }, 400) }
function doSearch() { if (query.value.trim()) router.push({ path: '/recherche', query: { q: query.value.trim() } }) }
function locateMe() {
  if (!navigator.geolocation) return
  navigator.geolocation.getCurrentPosition(pos => {
    cartStore.userLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude }
    cartStore.fetchPharmacies(pos.coords.latitude, pos.coords.longitude)
  })
}

onMounted(() => {
  cartStore.fetchPharmacies(
    cartStore.userLocation?.lat,
    cartStore.userLocation?.lng
  )
})
</script>

<style scoped>
/* Variables */
.pub-home {
  --primary: #16a34a;
  --primary-dark: #15803d;
  --primary-light: #4ade80;
  --gray-50: #f9fafb;
  --gray-100: #f3f4f6;
  --gray-200: #e5e7eb;
  --gray-300: #d1d5db;
  --gray-400: #9ca3af;
  --gray-500: #6b7280;
  --gray-600: #4b5563;
  --gray-700: #374151;
  --gray-800: #1f2937;
  --gray-900: #111827;
  width: 100%;
  overflow-x: hidden;
}

/* Reset box-sizing */
* {
  box-sizing: border-box;
}

/* Container responsive - corrigé pour éviter le débordement */
.pub-container {
  max-width: 1280px;
  width: 100%;
  margin: 0 auto;
  padding: 0 1rem;
  overflow-x: hidden;
}

@media (min-width: 640px) {
  .pub-container {
    padding: 0 1.5rem;
  }
}

@media (min-width: 1024px) {
  .pub-container {
    padding: 0 2rem;
  }
}

/* Hero Section - corrigé */
.pub-hero {
  background: linear-gradient(135deg, #0f172a 0%, #1a1a2e 50%, #0d1117 100%);
  padding: clamp(2rem, 6vw, 5rem) 0;
  min-height: auto;
  overflow-x: hidden;
  width: 100%;
}

.pub-hero .pub-container {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
  align-items: center;
}

@media (min-width: 768px) {
  .pub-hero .pub-container {
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
  }
}

@media (min-width: 1024px) {
  .pub-hero .pub-container {
    gap: 3rem;
  }
}

.pub-hero-content {
  max-width: 100%;
  overflow-x: visible;
}

.pub-hero-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(22, 163, 74, 0.15);
  border: 1px solid rgba(22, 163, 74, 0.3);
  color: var(--primary-light);
  border-radius: 999px;
  padding: 0.3rem 0.9rem;
  font-size: 0.75rem;
  font-weight: 700;
  margin-bottom: 1rem;
}

@media (min-width: 640px) {
  .pub-hero-tag {
    font-size: 0.8rem;
    padding: 0.35rem 1rem;
  }
}

.pub-hero-title {
  font-size: clamp(1.5rem, 5vw, 2.4rem);
  font-weight: 800;
  color: white;
  line-height: 1.2;
  margin-bottom: 0.75rem;
  overflow-wrap: break-word;
}

@media (min-width: 640px) {
  .pub-hero-title {
    margin-bottom: 1rem;
  }
}

.pub-hero-accent {
  color: var(--primary-light);
}

.pub-hero-desc {
  color: var(--gray-400);
  font-size: clamp(0.875rem, 3vw, 0.95rem);
  line-height: 1.5;
  margin-bottom: 1.5rem;
  overflow-wrap: break-word;
}

@media (min-width: 640px) {
  .pub-hero-desc {
    line-height: 1.7;
    margin-bottom: 1.75rem;
  }
}

/* Search box responsive - évite le débordement */
.pub-hero-search {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 14px;
  padding: 1rem;
  width: 100%;
  overflow-x: auto;
}

.pub-hero-search-wrap {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: white;
  border-radius: 10px;
  padding: 0.5rem;
  width: 100%;
  min-width: 0;
}

@media (min-width: 640px) {
  .pub-hero-search-wrap {
    padding: 0.5rem;
    padding-inline-start: 1rem;
  }
}

.search-icon {
  font-size: 1rem;
  flex-shrink: 0;
}

@media (min-width: 640px) {
  .search-icon {
    font-size: 1.2rem;
  }
}

.pub-hero-inp {
  flex: 1;
  border: none;
  outline: none;
  font-size: 0.875rem;
  font-family: inherit;
  background: transparent;
  min-width: 0;
  width: 100%;
}

@media (min-width: 640px) {
  .pub-hero-inp {
    font-size: 0.9rem;
  }
}

.pub-hero-btn {
  background: var(--primary);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.5rem 0.875rem;
  font-size: 0.75rem;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.12s;
  flex-shrink: 0;
}

@media (min-width: 640px) {
  .pub-hero-btn {
    padding: 0.55rem 1.2rem;
    font-size: 0.875rem;
  }
}

.pub-hero-btn:hover {
  background: var(--primary-dark);
}

.pub-hero-locate {
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 0.6rem;
  overflow-wrap: break-word;
}

@media (min-width: 640px) {
  .pub-hero-locate {
    font-size: 0.8rem;
    margin-top: 0.65rem;
  }
}

.pub-locate-btn {
  background: none;
  border: none;
  color: var(--primary-light);
  cursor: pointer;
  font-weight: 600;
  font-size: inherit;
  padding: 0;
  display: inline;
}

.pub-locate-btn:hover {
  text-decoration: underline;
}

/* Chips - évite le débordement horizontal */
.pub-hero-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1rem;
  overflow-x: auto;
  padding-bottom: 0.25rem;
  -webkit-overflow-scrolling: touch;
}

.pub-hero-chips::-webkit-scrollbar {
  height: 4px;
}

.pub-hero-chips::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
}

.pub-hero-chips::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 10px;
}

.pub-hero-chip {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: var(--gray-300);
  border-radius: 999px;
  padding: 0.3rem 0.8rem;
  font-size: 0.7rem;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
  flex-shrink: 0;
}

@media (min-width: 640px) {
  .pub-hero-chip {
    padding: 0.3rem 0.9rem;
    font-size: 0.75rem;
  }
}

.pub-hero-chip:hover {
  background: rgba(22, 163, 74, 0.2);
  border-color: rgba(22, 163, 74, 0.4);
  color: var(--primary-light);
}

/* Hero Visual - version corrigée sans débordement */
.pub-hero-visual {
  display: none;
  position: relative;
  width: 100%;
  overflow-x: visible;
}

@media (min-width: 768px) {
  .pub-hero-visual {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    position: relative;
    min-height: 380px;
  }
}

/* Cartes flottantes corrigées */
.pub-hero-card-float {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: white;
  border-radius: 12px;
  padding: 0.875rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  width: 100%;
  max-width: 320px;
  margin: 0;
  position: relative;
  left: auto;
  right: auto;
}

@media (min-width: 1024px) {
  .pub-hero-card-float {
    max-width: 360px;
    gap: 0.8rem;
    padding: 0.9rem;
  }
}

/* Positions relatives sans débordement */
@media (min-width: 768px) {
  .pub-hero-card-offset1 {
    position: relative;
    left: 1.25rem;
    top: -0.625rem;
    margin-bottom: -0.625rem;
  }
}

@media (min-width: 1024px) {
  .pub-hero-card-offset1 {
    left: 1.875rem;
    top: -0.625rem;
  }
}

@media (min-width: 768px) {
  .pub-hero-card-offset2 {
    position: relative;
    left: 0.625rem;
    top: -0.625rem;
  }
}

@media (min-width: 1024px) {
  .pub-hero-card-offset2 {
    left: 0.625rem;
    top: -0.625rem;
  }
}

.pub-float-icon {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 10px;
  background: var(--gray-100);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  flex-shrink: 0;
}

.pub-float-info {
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.pub-float-title {
  font-weight: 700;
  font-size: 0.8rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (min-width: 1024px) {
  .pub-float-title {
    font-size: 0.9rem;
  }
}

.pub-float-location {
  font-size: 0.65rem;
  color: var(--gray-500);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (min-width: 1024px) {
  .pub-float-location {
    font-size: 0.75rem;
  }
}

.pub-float-stock {
  background: #f0fdf4;
  color: var(--primary);
  font-size: 0.6rem;
  font-weight: 700;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  flex-shrink: 0;
  white-space: nowrap;
}

@media (min-width: 640px) {
  .pub-float-stock {
    font-size: 0.7rem;
    padding: 0.2rem 0.7rem;
  }
}

/* How it works section */
.pub-how-section {
  padding: clamp(2rem, 8vw, 3.75rem) 0;
  background: white;
}

.pub-section-header {
  text-align: center;
  margin-bottom: clamp(1.5rem, 5vw, 2.5rem);
}

.pub-section-title {
  font-size: clamp(1.5rem, 5vw, 1.875rem);
  font-weight: 800;
  color: var(--gray-900);
  margin-bottom: 0.5rem;
}

.pub-section-sub {
  font-size: clamp(0.875rem, 3vw, 1rem);
  color: var(--gray-500);
  max-width: 600px;
  margin: 0 auto;
}

.pub-steps-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

@media (min-width: 640px) {
  .pub-steps-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1.5rem;
  }
}

@media (min-width: 1024px) {
  .pub-steps-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 1.5rem;
  }
}

.pub-step-card {
  text-align: center;
  padding: clamp(1.25rem, 4vw, 1.75rem);
}

.pub-step-icon {
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  margin: 0 auto 1rem;
}

@media (min-width: 640px) {
  .pub-step-icon {
    width: 3.8rem;
    height: 3.8rem;
    font-size: 1.6rem;
  }
}

.pub-step-num {
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 50%;
  background: var(--primary);
  color: white;
  font-weight: 800;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 0.75rem;
}

.pub-step-title {
  font-weight: 700;
  font-size: clamp(0.9rem, 3.5vw, 1rem);
  margin-bottom: 0.5rem;
  color: var(--gray-800);
}

.pub-step-desc {
  font-size: clamp(0.75rem, 2.5vw, 0.875rem);
  color: var(--gray-500);
  line-height: 1.5;
}

/* Pharmacies section */
.pub-pharmacies-section {
  padding: clamp(2rem, 8vw, 3.75rem) 0;
  background: var(--gray-50);
}

.pub-pharmacies-header {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 1.75rem;
  gap: 1rem;
}

@media (min-width: 768px) {
  .pub-pharmacies-header {
    flex-direction: row;
    align-items: center;
    margin-bottom: 1.75rem;
    gap: 1rem;
  }
}

.pub-pharmacies-title-wrap {
  flex: 1;
}

.pub-pharmacies-count {
  color: var(--gray-500);
  font-size: 0.8rem;
}

@media (min-width: 640px) {
  .pub-pharmacies-count {
    font-size: 0.875rem;
  }
}

.pub-pharmacies-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

@media (max-width: 480px) {
  .pub-pharmacies-actions {
    width: 100%;
  }
  .pub-pharmacies-actions > * {
    flex: 1 1 0;
    justify-content: center;
  }
  .pub-hero-search {
    padding: 0.75rem;
  }
}

.pub-btn-outline {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  background: white;
  color: var(--gray-700);
  border: 1px solid var(--gray-300);
  border-radius: 8px;
  padding: 0.55rem 1rem;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.12s;
  white-space: nowrap;
}

@media (min-width: 640px) {
  .pub-btn-outline {
    padding: 0.55rem 1.1rem;
    font-size: 0.875rem;
  }
}

.pub-btn-outline:hover {
  border-color: var(--primary);
  color: var(--primary);
}

.pub-btn-green {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.55rem 1rem;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  text-decoration: none;
  transition: background 0.12s;
  white-space: nowrap;
}

@media (min-width: 640px) {
  .pub-btn-green {
    padding: 0.55rem 1.1rem;
    font-size: 0.875rem;
  }
}

.pub-btn-green:hover {
  background: var(--primary-dark);
}

.pub-btn-sm {
  padding: 0.4rem 0.8rem;
  font-size: 0.75rem;
}

@media (min-width: 640px) {
  .pub-btn-sm {
    padding: 0.45rem 1rem;
    font-size: 0.8rem;
  }
}

/* Loading and empty states */
.pub-loading {
  text-align: center;
  padding: 2.5rem;
  color: var(--gray-500);
}

.pub-spinner {
  width: 1.75rem;
  height: 1.75rem;
  border: 3px solid var(--gray-200);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  margin: 0 auto 0.75rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.pub-empty {
  text-align: center;
  padding: 2.5rem;
}

.pub-empty-icon {
  font-size: 2rem;
  margin-bottom: 0.75rem;
}

.pub-empty-text {
  color: var(--gray-500);
}

/* Pharmacies grid */
.pub-pharmacies-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

@media (min-width: 640px) {
  .pub-pharmacies-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1.25rem;
  }
}

@media (min-width: 1024px) {
  .pub-pharmacies-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 1.5rem;
  }
}

/* Pharmacy card */
.pub-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.2s;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.pub-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
}

.pub-card-content {
  padding: 1rem;
  flex: 1;
}

@media (min-width: 640px) {
  .pub-card-content {
    padding: 1.25rem;
  }
}

.pub-card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.625rem;
  margin-bottom: 0.75rem;
}

.pub-card-pharmacy {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
  min-width: 0;
}

.pub-card-icon {
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 12px;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  flex-shrink: 0;
}
.pub-card-icon.has-logo { background: #fff; overflow: hidden; }
.pub-card-icon img { width: 100%; height: 100%; object-fit: contain; }

@media (min-width: 640px) {
  .pub-card-icon {
    width: 3rem;
    height: 3rem;
    font-size: 1.3rem;
  }
}

.pub-card-info {
  flex: 1;
  min-width: 0;
}

.pub-card-name {
  font-weight: 700;
  font-size: 0.85rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (min-width: 640px) {
  .pub-card-name {
    font-size: 0.95rem;
  }
}

.pub-card-city {
  font-size: 0.7rem;
  color: var(--gray-500);
  margin-top: 0.15rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (min-width: 640px) {
  .pub-card-city {
    font-size: 0.78rem;
  }
}

.pub-badge-green {
  background: #f0fdf4;
  color: var(--primary);
  font-size: 0.65rem;
  font-weight: 700;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  flex-shrink: 0;
  white-space: nowrap;
}

@media (min-width: 640px) {
  .pub-badge-green {
    font-size: 0.7rem;
    padding: 0.25rem 0.7rem;
  }
}

.pub-card-distance {
  font-size: 0.7rem;
  color: var(--primary);
  font-weight: 600;
  margin-bottom: 0.5rem;
}

@media (min-width: 640px) {
  .pub-card-distance {
    font-size: 0.8rem;
    margin-bottom: 0.5rem;
  }
}

.pub-card-contact {
  font-size: 0.7rem;
  color: var(--gray-500);
  margin-bottom: 0.875rem;
  word-break: break-word;
  line-height: 1.4;
}

@media (min-width: 640px) {
  .pub-card-contact {
    font-size: 0.8rem;
    margin-bottom: 1rem;
  }
}

.pub-card-stats {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0;
}

.pub-stat {
  flex: 1;
  background: var(--gray-50);
  border-radius: 8px;
  padding: 0.5rem;
  text-align: center;
}

@media (min-width: 640px) {
  .pub-stat {
    padding: 0.6rem;
  }
}

.pub-stat-blue {
  background: #eff6ff;
}

.pub-stat-value {
  font-weight: 800;
  font-family: 'JetBrains Mono', monospace;
  color: var(--primary);
  font-size: 0.9rem;
}

@media (min-width: 640px) {
  .pub-stat-value {
    font-size: 1.1rem;
  }
}

.pub-stat-blue .pub-stat-value {
  color: #2563eb;
}

.pub-stat-label {
  font-size: 0.6rem;
  color: var(--gray-500);
  font-weight: 600;
  margin-top: 0.15rem;
}

@media (min-width: 640px) {
  .pub-stat-label {
    font-size: 0.68rem;
  }
}

.pub-card-footer {
  padding: 0.75rem 1rem;
  border-top: 1px solid var(--gray-100);
  display: flex;
  justify-content: flex-end;
}

@media (min-width: 640px) {
  .pub-card-footer {
    padding: 0.8rem 1.25rem;
  }
}

/* Touch optimizations */
@media (hover: hover) {
  .pub-hero-btn:hover,
  .pub-btn-green:hover,
  .pub-btn-outline:hover,
  .pub-hero-chip:hover,
  .pub-locate-btn:hover {
    opacity: 1;
  }
}

@media (hover: none) {
  .pub-hero-btn:active,
  .pub-btn-green:active,
  .pub-btn-outline:active,
  .pub-card:active {
    transform: scale(0.98);
  }
}
</style>