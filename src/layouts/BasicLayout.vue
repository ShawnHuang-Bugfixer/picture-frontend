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
}

.layout-sidebar {
  position: sticky;
  top: 0;
  height: 100vh;
  width: 292px;
  flex: 0 0 292px;
  padding: 16px;
}

.layout-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  padding: 18px 22px 26px 6px;
}

.layout-content {
  flex: 1;
  min-height: 0;
}

.is-auth-shell {
  display: block;
}

.is-auth-shell .layout-main {
  padding: 28px;
}

@media (max-width: 1080px) {
  .layout-sidebar {
    display: none;
  }

  .layout-main {
    padding: 16px;
  }
}
</style>
