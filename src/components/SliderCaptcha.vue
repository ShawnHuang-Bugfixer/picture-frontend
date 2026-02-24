<template>
  <div class="slider-captcha-overlay" v-if="visible" @click="handleOverlayClick">
    <div class="slider-captcha-modal" @click.stop>
      <div class="slider-captcha-header">
        <h3>请完成滑块验证</h3>
        <button class="close-btn" @click="handleClose">×</button>
      </div>
      <div class="slider-captcha-content">
        <div class="slider-container">
          <div class="slider-track">
            <div class="slider-bg"></div>
            <div 
              class="slider-button" 
              :class="{ 'slider-button-success': isSuccess }"
              :style="{ left: sliderLeft + 'px' }"
              @mousedown="handleMouseDown"
              @touchstart="handleTouchStart"
            >
              <span v-if="!isSuccess">→</span>
              <span v-else>✓</span>
            </div>
          </div>
          <div class="slider-text">{{ sliderText }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'

interface Props {
  visible: boolean
}

interface Emits {
  (e: 'success'): void
  (e: 'close'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const sliderLeft = ref(0)
const isSuccess = ref(false)
const isDragging = ref(false)
const startX = ref(0)
const startLeft = ref(0)
const sliderText = ref('向右滑动完成验证')

// 监听 visible 变化，重置状态
watch(() => props.visible, (newVisible) => {
  if (newVisible) {
    resetSlider()
  }
})

const resetSlider = () => {
  sliderLeft.value = 0
  isSuccess.value = false
  isDragging.value = false
  sliderText.value = '向右滑动完成验证'
}

const handleMouseDown = (e: MouseEvent) => {
  if (isSuccess.value) return
  isDragging.value = true
  startX.value = e.clientX
  startLeft.value = sliderLeft.value
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}

const handleTouchStart = (e: TouchEvent) => {
  if (isSuccess.value) return
  isDragging.value = true
  startX.value = e.touches[0].clientX
  startLeft.value = sliderLeft.value
  document.addEventListener('touchmove', handleTouchMove)
  document.addEventListener('touchend', handleTouchEnd)
}

const handleMouseMove = (e: MouseEvent) => {
  if (!isDragging.value) return
  const deltaX = e.clientX - startX.value
  const newLeft = Math.max(0, Math.min(280, startLeft.value + deltaX))
  sliderLeft.value = newLeft
  
  if (newLeft >= 280) {
    handleSuccess()
  }
}

const handleTouchMove = (e: TouchEvent) => {
  if (!isDragging.value) return
  e.preventDefault()
  const deltaX = e.touches[0].clientX - startX.value
  const newLeft = Math.max(0, Math.min(280, startLeft.value + deltaX))
  sliderLeft.value = newLeft
  
  if (newLeft >= 280) {
    handleSuccess()
  }
}

const handleMouseUp = () => {
  isDragging.value = false
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
}

const handleTouchEnd = () => {
  isDragging.value = false
  document.removeEventListener('touchmove', handleTouchMove)
  document.removeEventListener('touchend', handleTouchEnd)
}

const handleSuccess = () => {
  isSuccess.value = true
  sliderText.value = '验证成功'
  setTimeout(() => {
    emit('success')
  }, 500)
}

const handleClose = () => {
  emit('close')
}

const handleOverlayClick = () => {
  emit('close')
}

onUnmounted(() => {
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
  document.removeEventListener('touchmove', handleTouchMove)
  document.removeEventListener('touchend', handleTouchEnd)
})
</script>

<style scoped>
.slider-captcha-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.slider-captcha-modal {
  background: white;
  border-radius: 8px;
  width: 400px;
  max-width: 90vw;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.slider-captcha-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.slider-captcha-header h3 {
  margin: 0;
  font-size: 16px;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #999;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: #333;
}

.slider-captcha-content {
  padding: 20px;
}

.slider-container {
  text-align: center;
}

.slider-track {
  position: relative;
  width: 320px;
  height: 40px;
  background: #f5f5f5;
  border-radius: 20px;
  margin: 0 auto 16px;
  overflow: hidden;
}

.slider-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 0;
  height: 100%;
  background: #52c41a;
  transition: width 0.3s ease;
}

.slider-button {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 36px;
  height: 36px;
  background: white;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  user-select: none;
}

.slider-button:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.slider-button-success {
  background: #52c41a;
  color: white;
}

.slider-text {
  color: #666;
  font-size: 14px;
}
</style> 