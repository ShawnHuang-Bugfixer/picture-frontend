<template>
  <div id="app">
    <a-config-provider :locale="zhCN" :theme="theme">
      <BasicLayout />
    </a-config-provider>
  </div>
</template>

<script setup lang="ts">
import zhCN from 'ant-design-vue/es/locale/zh_CN';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
dayjs.locale('zh-cn');

import BasicLayout from '@/layouts/BasicLayout.vue'

const theme = {
  token: {
    colorPrimary: '#1e293b',
    colorInfo: '#2563eb',
    colorBgLayout: '#f3f5f8',
    colorBgContainer: '#ffffff',
    colorText: '#111827',
    colorTextSecondary: '#5b6472',
    borderRadius: 20,
    fontFamily: "'Avenir Next', 'PingFang SC', 'Microsoft YaHei', sans-serif",
  },
  components: {
    Button: {
      controlHeight: 44,
      borderRadius: 999,
    },
    Input: {
      controlHeight: 46,
    },
    Card: {
      borderRadiusLG: 20,
    },
    Layout: {
      headerBg: 'transparent',
      bodyBg: '#f3f5f8',
      footerBg: 'transparent',
      siderBg: 'transparent',
    },
  },
}
</script>

<style scoped></style>
