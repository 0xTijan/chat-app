<script setup lang="ts">
import { useAuthStore } from '@/stores/auth';
import { useRoomsStore } from '@/stores/rooms';
import { ref } from 'vue';

const chatName = ref('');
const password = ref('');

const authStore = useAuthStore();
const roomsStore = useRoomsStore();

const joinChat = async () => {
  await roomsStore.joinRoom({
    name: chatName.value,
    password: password.value,
  });
}
</script>

<template>
  <div class="flex items-center justify-center min-h-screen bg-black text-white">
    <div class="w-full max-w-lg p-8 bg-gray-800 rounded-lg shadow-lg">
      <h1 class="text-2xl font-bold mb-6">Join Private Chat</h1>

      <div class="mb-4">
        <label for="chatName" class="block text-sm font-medium mb-2">Chat Name</label>
        <input
          v-model="chatName"
          id="chatName"
          type="text"
          class="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter chat name"
        />
      </div>

      <div class="mb-6">
        <label for="password" class="block text-sm font-medium mb-2">Password</label>
        <input
          v-model="password"
          id="password"
          type="password"
          class="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter password"
        />
      </div>

      <button
        @click="joinChat"
        class="w-full p-2 bg-blue-600 border border-blue-700 rounded text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        Join Chat
      </button>

      <RouterLink
        to="/"
        class="text-blue-400 hover:text-blue-300 mt-6"
      >
        Back
      </RouterLink>
    </div>
  </div>
</template>

<style>
/* Add any additional custom styles here */
</style>
