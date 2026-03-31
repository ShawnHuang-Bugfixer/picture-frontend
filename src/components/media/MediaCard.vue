<template>
  <div
    class="media-card"
    :class="{ 'media-card--interactive': interactive, 'media-card--compact': compact }"
  >
    <div class="media-card__preview">
      <slot name="preview" />
    </div>
    <div class="media-card__body">
      <div v-if="eyebrow" class="media-card__eyebrow">{{ eyebrow }}</div>
      <div v-if="title" class="media-card__title">{{ title }}</div>
      <div v-if="subtitle" class="media-card__subtitle">{{ subtitle }}</div>
      <div v-if="$slots.meta" class="media-card__meta">
        <slot name="meta" />
      </div>
    </div>
    <div v-if="$slots.actions" class="media-card__actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title?: string
  subtitle?: string
  eyebrow?: string
  interactive?: boolean
  compact?: boolean
}

withDefaults(defineProps<Props>(), {
  title: '',
  subtitle: '',
  eyebrow: '',
  interactive: false,
  compact: false,
})
</script>

<style scoped lang="less">
@import '@/styles/variables.less';

.media-card {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  border: 1px solid @border-color;
  border-radius: @border-radius-xl;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.92) 0%, rgba(251, 251, 252, 0.94) 100%);
  box-shadow: @shadow-md;
}

.media-card--interactive {
  cursor: pointer;
  transition:
    transform 0.22s ease,
    box-shadow 0.22s ease,
    border-color 0.22s ease;
}

.media-card--interactive:hover {
  transform: translateY(-4px);
  border-color: rgba(37, 99, 235, 0.14);
  box-shadow: @shadow-lg;
}

.media-card__preview {
  padding: 14px 14px 0;
}

.media-card__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 10px;
  padding: 16px 18px 18px;
}

.media-card__eyebrow {
  color: @accent-color;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.media-card__title {
  font-size: 19px;
  font-weight: 600;
  line-height: 1.35;
  letter-spacing: -0.02em;
  word-break: break-word;
}

.media-card__subtitle {
  color: @text-secondary;
  font-size: 13px;
  line-height: 1.75;
  word-break: break-word;
}

.media-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.media-card__actions {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 14px 18px 18px;
  border-top: 1px solid rgba(15, 23, 42, 0.06);
}

.media-card--compact .media-card__body {
  gap: 8px;
  padding: 14px 16px 16px;
}

.media-card--compact .media-card__title {
  font-size: 16px;
}

.media-card--compact .media-card__subtitle {
  font-size: 12px;
  line-height: 1.65;
}
</style>
