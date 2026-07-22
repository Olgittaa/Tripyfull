<template>
  <router-view />
</template>

<script setup></script>

<style>
/* dev-стайлгайд монтируется прямо в #app без app-shell,
   поэтому возвращаем прокрутку самому #app */
#app {
  height: 100%;
  overflow-y: auto;
}
</style>
