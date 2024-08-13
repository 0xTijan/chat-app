<script setup lang="ts">
import { useAuthStore } from '@/stores/auth';
import { useRoomsStore } from '@/stores/rooms';
import { onMounted, ref, watch } from 'vue';

const authStore = useAuthStore();
const roomsStore = useRoomsStore();

const availableRooms = ref<any[]>([]);
const joinedRooms = ref<any[]>([]);

const handleLogout = async () => {
  await authStore.logout();
};

// Watch for changes to myVariable
watch(authStore.currentJwt, async (newValue, oldValue) => {
  console.log(`myVariable changed from ${oldValue} to ${newValue}`);
  const rooms = await roomsStore.getRooms();
  console.log("got rooms ", rooms);
  availableRooms.value = rooms.availableRooms;
  joinedRooms.value = rooms.joinedRooms;
});

</script>

<template>  
  <h1>Current user</h1>
  <!-- Access user directly from the store -->
  {{ authStore.user.loggedIn ? authStore.user.username : "No user" }}

  <button @click="handleLogout">logout</button>

  <hr />

  <h1>Your chats:</h1>
  <ul>
    <li v-for="(room, index) in joinedRooms" :key="index">
      {{ room.name }}
    </li>
  </ul>
  <hr />
  <h1>Available chats:</h1>
  <ul>
    <li v-for="(room, index) in availableRooms" :key="index">
      {{ room.name }}
    </li>
  </ul>
</template>

<style>
/* Add your styles here */
</style>
