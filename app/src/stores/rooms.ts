import { defineStore } from 'pinia';
import axios from 'axios';
import { computed, ref } from 'vue';
import { URL, useAuthStore } from './auth';


export const useRoomsStore = defineStore('rooms', () => {
  const rooms = ref({
    availableRooms: [],
    joinedRooms: [],
  });
  const currentRooms = computed(() => rooms.value);
  const { currentJwt } = useAuthStore();

  const getRooms = async() => {
    const { data } = await axios.get(
      `${URL}/rooms/`,
      {
        headers: {
          "Authorization": `Bearer ${currentJwt.access}`
        }
      }
    );
    console.log(data);
    rooms.value = data;
    return data;
  }

  return { rooms: currentRooms, getRooms };
});