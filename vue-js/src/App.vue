<template>
  <div id="app-wrapper">
    <router-view></router-view>
  </div>
</template>

<script>
export default {
    name: 'AppRoot'
};
</script>

<style>
/* Đảm bảo style căn chỉnh body và #app-wrapper */
body {
    background-color: #eef2f5; 
    margin: 0;
}
#app-wrapper {
    min-height: 100vh;
}
</style>