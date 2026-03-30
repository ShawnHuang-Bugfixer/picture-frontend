<template>
  <div id="basicLayout" :class="{ 'is-auth-shell': isAuthShell }">
    <aside v-if="!isAuthShell" class="layout-sidebar">
      <GlobalSider />
    </aside>
    <div class="layout-main">
      <GlobalHeader />
      <main class="layout-content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import GlobalHeader from '@/components/GlobalHeader.vue'
import GlobalSider from '@/components/GlobalSider.vue'

const route = useRoute()

const isAuthShell = computed(() => route.meta?.shell === 'auth')
</script>

<style scoped lang="less">
@import '@/styles/variables.less';

#basicLayout {
  display: flex;
  min-height: 100vh;
  padding: 12px;
  gap: 12px;
}

.layout-sidebar {
  position: sticky;
  top: 12px;
  height: calc(100vh - 24px);
  width: 256px;
  flex: 0 0 256px;
}

.layout-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.layout-content {
  flex: 1;
  min-height: 0;
  padding: 4px 4px 20px;
}

.is-auth-shell {
  display: block;
  padding: 0;
}

.is-auth-shell .layout-main {
  min-height: 100vh;
  padding: 28px;
}

@media (max-width: 1080px) {
  .layout-sidebar {
    display: none;
  }

  .layout-main {
    gap: 12px;
  }

  .layout-content {
    padding: 4px 0 18px;
  }
}
</style>
