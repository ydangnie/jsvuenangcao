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
/* Global styles for router host */
body {
    background-color: #eef2f5; 
    margin: 0;
}
#app-wrapper {
    /* Đảm bảo nội dung chiếm toàn bộ chiều rộng/chiều cao */
    min-height: 100vh;
}
</style>