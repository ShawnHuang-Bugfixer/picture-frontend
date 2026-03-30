<template>
  <div id="app">
    <a-config-provider :locale="zhCN" :theme="theme">
      <BasicLayout />
    </a-config-provider>
  </div>
</template>

<script setup lang="ts">
import zhCN from 'ant-design-vue/es/locale/zh_CN'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
dayjs.locale('zh-cn')

import BasicLayout from '@/layouts/BasicLayout.vue'

const theme = {
  token: {
    colorPrimary: '#202123',
    colorInfo: '#3b82f6',
    colorBgLayout: '#f7f7f8',
    colorBgContainer: '#ffffff',
    colorText: '#202123',
    colorTextSecondary: '#6b7280',
    colorBorder: '#e5e7eb',
    borderRadius: 18,
    fontFamily: "'Avenir Next', 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif",
  },
  components: {
    Button: {
      controlHeight: 44,
      borderRadius: 14,
      primaryShadow: 'none',
    },
    Input: {
      controlHeight: 44,
    },
    Select: {
      controlHeight: 44,
    },
    InputNumber: {
      controlHeight: 44,
    },
    DatePicker: {
      controlHeight: 44,
    },
    Card: {
      borderRadiusLG: 18,
    },
    Layout: {
      headerBg: 'transparent',
      bodyBg: '#f7f7f8',
      footerBg: 'transparent',
      siderBg: 'transparent',
    },
    Table: {
      headerBg: '#fafafa',
      headerColor: '#6b7280',
      borderColor: '#e5e7eb',
      rowHoverBg: '#fafafa',
    },
    Tabs: {
      inkBarColor: '#202123',
      itemSelectedColor: '#202123',
      itemColor: '#6b7280',
    },
  },
}
</script>

<style scoped></style>
