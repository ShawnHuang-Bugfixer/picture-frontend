<template>
  <div class="about">
    <div class="about-card">
      <p class="about-eyebrow">About</p>
      <h1>基于深度学习的图像超分辨率重构系统</h1>
      <p>
        这个平台主要用来处理低清图片和视频。你可以上传素材、发起修复任务、对比前后效果，
        再把典型结果整理成案例，方便个人复盘或团队协作。
      </p>
    </div>
  </div>
</template>

<style>
.about {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.about-card {
  max-width: 720px;
  padding: 32px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.86);
  box-shadow: 0 20px 48px rgba(15, 23, 42, 0.08);
}

.about-eyebrow {
  margin: 0 0 8px;
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.about h1 {
  margin: 0;
  font-size: 36px;
  line-height: 1.15;
}

.about p {
  line-height: 1.8;
}

@media (min-width: 1024px) {
  .about {
    min-height: 100vh;
  }
}
</style>
