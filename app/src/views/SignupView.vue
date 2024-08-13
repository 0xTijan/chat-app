<script setup lang="ts">
import { useAuthStore } from '@/stores/auth';
import { ref } from "vue";

// Get the auth store instance
const authStore = useAuthStore();

const username = ref("");
const password = ref("");

// Signup function
const handleSignup = async () => {
  await authStore.signup(username.value, password.value);
};
</script>

<template>
  <h1>Signup</h1>
  <input v-model="username" placeholder="Username" />
  <br />
  <input type="password" v-model="password" placeholder="Password" />
  <br />
  <button @click="handleSignup">Signup</button>
  <hr />
  <RouterLink to="/login">OR Login</RouterLink>
  <hr />
  
  <h1>Current user</h1>
  <!-- Access user directly from the store -->
  {{ authStore.user.loggedIn ? authStore.user.username : "No user" }}
</template>

<style>
/* Add your styles here */
</style>
