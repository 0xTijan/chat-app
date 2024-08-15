<script setup lang="ts">
import { useAuthStore } from '@/stores/auth';
import { useRoomsStore } from '@/stores/rooms';
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import type { RoomData, Message } from '@/stores/rooms';
import { io } from 'socket.io-client';

const authStore = useAuthStore();
const roomsStore = useRoomsStore();
const router = useRouter();
const route = useRoute();

const URL = "http://localhost:3000";

const socket = ref<any>(null);
const availableRooms = ref<any[]>([]);
const joinedRooms = ref<any[]>([]);
const selectedRoom = ref<any | null>(null);
const selectedAvailableRoom = ref<any | null>(null);
const newMessage = ref("");
const roomData = ref<RoomData | null>(null);
const messages = ref<Message[] | null>(null);

const handleLogout = async () => {
  await authStore.logout();
};

const selectRoom = (room: any) => {
  selectedRoom.value = room;
  router.push(`/${room.id}`);
};

const selectAvailableRoom = (room: any) => {
  socket.value = io(URL, {
      withCredentials: true,
      extraHeaders: {
        "Authorization": `Bearer ${authStore.currentJwt.access}`
      }
    });
  selectedAvailableRoom.value = room;
};

const loadRooms = async () => {
  const rooms = await roomsStore.getRooms();
  availableRooms.value = rooms.availableRooms;
  joinedRooms.value = rooms.joinedRooms;

  const roomId = Number(route.params.roomId);
  if (roomId) {
    const room = rooms.joinedRooms.find((room: any) => room.id === roomId);
    if (room) {
      selectedRoom.value = room;
    } else {
      router.push('/');
    }
  }

  // update socket
  if (socket.value) {
    socket.value.disconnect();
    socket.value = io(URL, {
      withCredentials: true,
      extraHeaders: {
        "Authorization": `Bearer ${authStore.currentJwt.access}`
      }
    });
  }
};

const joinChat = async () => {
  if (selectedAvailableRoom.value) {
    try {
      await roomsStore.joinRoom({
        name: selectedAvailableRoom.value.name,
        password: ""
      });
      socket.value.emit('join-room', { room_id: selectedAvailableRoom.value.id }, () => {
        console.log("done");
      });
      selectedAvailableRoom.value = null; // Clear selection
    } catch(err) {
      console.log(err);
    }
  }
};

const sendMessage = async() => {
  console.log(selectedRoom.value.id)
  if (newMessage.value.trim() && roomData) {
    console.log(`Sending message: ${newMessage.value}`);
    const payload = {
      content: newMessage.value,
      room_id: selectedRoom.value.id
    };
    console.log("payload, ", payload);

    if (socket.value) {
      socket.value.emit('message', payload, () => {
        console.log("done");
      });
    }
  
    newMessage.value = "";
  }
};

const getRoomData = async () => {
  if (selectedRoom.value && selectedRoom.value.id) {
    messages.value = [];
    const roomId = selectedRoom.value.id;
    const res = await roomsStore.getRoomById(roomId);
    const resMessages = await roomsStore.getRoomMessages(roomId);
    messages.value = resMessages.messages;
    roomData.value = res;

    socket.value.emit('join-room', { room_id: roomId }, () => {
      console.log("done");
    });

    socket.value.on("chat message", (a: any) => {
      if(messages.value) {
        messages.value = [
          ...messages.value,
          {
            ...a
          }
        ];
      } else {
        messages.value = [{
          ...a
        }]
      }
    });
  }
};

// Watchers
watch(authStore.currentJwt, loadRooms);
watch(selectedRoom, getRoomData);
watch(route, loadRooms);
/* Cleanup on unmount
onUnmounted(() => {
  if (isConnected) {
    socket.disconnect();
    isConnected = false;
  }
});*/
</script>

<template>
  <div class="flex h-screen bg-gray-900 text-white">
    <!-- Left Sidebar -->
    <div class="w-1/4 bg-gray-800 p-4 flex flex-col justify-between">
      <div>
        <h1 class="text-xl font-bold mb-4">Joined Rooms</h1>
        <ul>
          <li 
            v-for="(room, index) in joinedRooms" 
            :key="index" 
            @click="selectRoom(room)" 
            class="cursor-pointer p-2 mb-2 rounded hover:bg-gray-700"
          >
            {{ room.name }}
          </li>
        </ul>

        <hr class="my-4 border-gray-600" />

        <h1 class="text-xl font-bold mb-4">Available Rooms</h1>
        <ul>
          <li 
            v-for="(room, index) in availableRooms" 
            @click="selectAvailableRoom(room)" 
            :key="index" 
            class="cursor-pointer p-2 mb-2 rounded hover:bg-gray-700"
          >
            {{ room.name }}
          </li>
        </ul>
      </div>

      <RouterLink to="/join" class="text-blue-400 hover:text-blue-300 mt-6">
        <button class="w-full p-2 bg-blue-600 border border-blue-700 rounded text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
          Join Private Chat
        </button>
      </RouterLink>
      <RouterLink to="/create" class="text-blue-400 hover:text-blue-300 mt-2">
        <button class="w-full p-2 bg-blue-600 border border-blue-700 rounded text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
          Create New Chat
        </button>
      </RouterLink>

      <!-- User Data Box -->
      <div class="mt-8 p-4 bg-gray-700 rounded">
        <h2 class="text-lg font-semibold">{{ authStore.user.username }}</h2>
        <button @click="handleLogout" class="w-full mt-4 p-2 bg-red-600 rounded hover:bg-red-700">
          Logout
        </button>
      </div>
    </div>

    <!-- Middle Section (Chat Content) -->
    <div class="w-2/4 p-4">
      <div v-if="selectedRoom">
        <h1 class="text-xl font-bold mb-4">Selected Room: {{ selectedRoom.name }}</h1>
        <div class="chat-content p-4 bg-gray-800 rounded h-[65vh] overflow-y-scroll">
          <!-- Chat content will be rendered here -->
          <div class="chat-content p-4 bg-gray-800 rounded h-[65vh] overflow-y-scroll">
            <div v-for="(message, index) in messages" :key="index" class="mb-2">
              <div v-if="message.message_type === 'system'" class="text-center text-gray-400">
                <!-- System Message -->
                <p>{{ message.content }}</p>
              </div>
              <div v-else-if="message.user_id === authStore.user.id" class="text-right">
                <!-- Current User's Message -->
                <div class="inline-block p-2 bg-blue-600 rounded text-white">
                  <p>{{ message.content }}</p>
                </div>
              </div>
              <div v-else class="text-left">
                <!-- Other User's Message -->
                <div class="inline-block p-2 bg-gray-700 rounded text-white">
                  <p>{{ message.content }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="mt-4 flex">
          <input
            v-model="newMessage"
            type="text"
            placeholder="Type your message..."
            class="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            class="ml-2 p-2 bg-blue-600 border border-blue-700 rounded text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            @click="sendMessage"
          >
            Send
          </button>
        </div>
      </div>
      <div v-if="selectedAvailableRoom">
        <h1 class="text-xl font-bold mb-4">Join {{ selectedAvailableRoom.name }}?</h1>
        <div>
          <button
            class="w-full p-2 bg-blue-600 border border-blue-700 rounded text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            @click="joinChat"
          >
            Join Chat
          </button>
        </div>
      </div>
    </div>

    <!-- Right Sidebar (Chat Room Members and Details) -->
    <div class="w-1/4 bg-gray-800 p-4">
      <h1 class="text-xl font-bold mb-4">{{ roomData?.data?.room?.name || "Chat" }} Details</h1>
      <p v-if="!roomData">
        Select a chat to see details.
      </p>
      <div v-else>
        <p>{{ roomData?.data?.room?.name }}</p>
        <hr class="my-4 border-gray-600" />
        <h1 class="text-xl font-bold mb-4">Room Members</h1>
        <ul>
          <li 
            v-for="(member, index) in roomData?.data?.users" 
            :key="index" 
            class="p-2 mb-2 bg-gray-700 rounded"
          >
            <strong>{{ member.username }}</strong>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Your styles here */
</style>
