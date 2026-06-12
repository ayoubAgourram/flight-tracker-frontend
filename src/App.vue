<template>
  <FlightTracker />
</template>

<script setup>
// This imports the "shell" file you created, which automatically 
// pulls in your separated .html, .js, and .css files!
import FlightTracker from './FlightTracker.vue';
</script>

<style>
/* A tiny bit of global CSS to remove default browser margins 
   so your map touches the absolute edges of the screen */
body {
  margin: 0;
  padding: 0;
  overflow: hidden;
}
</style>