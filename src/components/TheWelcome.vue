<script setup lang="ts">
import WelcomeItem from './WelcomeItem.vue'
import ToolingIcon from './icons/IconTooling.vue'
import EcosystemIcon from './icons/IconEcosystem.vue'
import CommunityIcon from './icons/IconCommunity.vue'
import SupportIcon from './icons/IconSupport.vue'
</script>

<template>
  <WelcomeItem>
    <template #icon>
      <SupportIcon />
    </template>
    <template #heading>上传开始</template>

    把低清图片或视频放进工作台后，就可以继续裁剪、扩图和提交超分任务。
  </WelcomeItem>

  <WelcomeItem>
    <template #icon>
      <ToolingIcon />
    </template>
    <template #heading>处理流程</template>

    素材上传后会进入统一流程，你可以补充说明、发起修复任务，并在结果中心查看输出。
  </WelcomeItem>

  <WelcomeItem>
    <template #icon>
      <EcosystemIcon />
    </template>
    <template #heading>结果沉淀</template>

    每一次处理都可以沉淀为案例，方便后续参考相似场景下的修复方式和输出效果。
  </WelcomeItem>

  <WelcomeItem>
    <template #icon>
      <CommunityIcon />
    </template>
    <template #heading>团队协作</template>

    团队工作台适合多人分工处理素材，统一查看结果，并把典型案例留给后续项目复用。
  </WelcomeItem>

  <WelcomeItem>
    <template #icon>
      <SupportIcon />
    </template>
    <template #heading>案例参考</template>

    案例库可以帮助你更快找到相似问题，判断哪些场景更适合直接超分，哪些需要先做额外处理。
  </WelcomeItem>
</template>
