import { ref, computed, onMounted } from 'vue';
import { defineStore } from 'pinia';
import axios from 'axios';
import { useRouter } from 'vue-router'; // Import useRouter
import Cookies from 'js-cookie'; // Import js-cookie

export const URL = "http://localhost:3000";

interface Jwt {
  access: string | null;
  refresh: string | null;
}

interface User {
  loggedIn: boolean;
  id: number | null;
  username: string | null;
  jwt: {
    access: string | null;
    refresh: string | null;
  }
}

export const useAuthStore = defineStore('jwt', () => {
  const router = useRouter(); // Use useRouter to get the router instance

  const jwt = ref<Jwt>({
    access: null,
    refresh: null,
  });

  const user = ref<User>({
    loggedIn: false,
    id: null,
    username: null,
    jwt: {
      access: null,
      refresh: null,
    }
  });

  // Helper function to persist data to localStorage
  const persistData = () => {
    localStorage.setItem('user', JSON.stringify(user.value));
  };

  // Helper function to load data from localStorage
  const loadData = () => {
    const storedUser = localStorage.getItem('user');
    
    if (storedUser) {
      user.value = JSON.parse(storedUser) as User;
    }
  };

  // Refresh access token with refresh token from cookies
  const refreshToken = async () => {
    try {
      const refreshToken = Cookies.get('refresh_token');
      console.log(refreshToken, Cookies.get("access_token"));

      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      console.log(refreshToken);

      const { data } = await axios.get(
        `${URL}/auth/refresh_token`,
        { withCredentials: true }
      );

      console.log(data)

      jwt.value.access = data.accessToken;
      Cookies.set('access_token', data.accessToken); // Optionally store the new access token in cookies
      persistData();
    } catch (error) {
      console.error('Failed to refresh token', error);
      await logout();
    }
  };

  // Login
  const login = async (username: string, password: string) => {
    if (user.value.loggedIn) return;

    const { data } = await axios.post<{
      tokens: { accessToken: string; refreshToken: string };
      id: number;
      username: string;
    }>(
      `${URL}/auth/login`,
      {
        username: username,
        password: password,
      }
    );

    console.log(data);
    jwt.value.access = data.tokens.accessToken;
    jwt.value.refresh = data.tokens.refreshToken;

    console.log("Setting access token:", data.tokens.accessToken);
    Cookies.set('access_token', data.tokens.accessToken, { path: '/' });

    console.log("Setting refresh token:", data.tokens.refreshToken);
    console.log("aa")
    Cookies.set('refresh_token', data.tokens.refreshToken, { path: '/', sameSite: "Lax", secure: false });

    console.log("Refresh token from cookie:", Cookies.get('refresh_token'));
    console.log("Access token from cookie:", Cookies.get('access_token'));

    user.value = {
      loggedIn: true,
      id: data.id,
      username: data.username,
      jwt: {
        access: data.tokens.accessToken,
        refresh: data.tokens.refreshToken
      }
    };

    persistData();

    // Redirect to /app after login
    router.push('/');
  };

  // Logout
  const logout = async () => {
    try {
      await axios.delete(`${URL}/auth/refresh_token`);
    } catch (error) {
      console.error("Failed to log out", error);
    } finally {
      jwt.value = { access: null, refresh: null };
      user.value = { loggedIn: false, id: null, username: null, jwt: { refresh: null, access: null } };
      Cookies.remove('access_token'); // Remove access token from cookies
      Cookies.remove('refresh_token'); // Remove refresh token from cookies
      persistData();

      // Redirect to /login after logout
      router.push('/login');
    }
  };

  // Signup
  const signup = async (username: string, password: string) => {
    const { data } = await axios.post(
      `${URL}/auth/signup`,
      {
        username: username,
        password: password,
      }
    );
    
    console.log("Setting access token:", data.tokens.accessToken);
    Cookies.set('access_token', data.tokens.accessToken, { path: '/' });

    console.log("Setting refresh token:", data.tokens.refreshToken);
    console.log("aa")
    Cookies.set('refresh_token', data.tokens.refreshToken, { path: '/', sameSite: "Lax", secure: false });

    console.log(data);

    // Redirect to /app after signup
    router.push('/');
  };

  const currentUser = computed(() => user.value);
  const currentJwt = computed(() => jwt.value);

  // Initialize the store
  onMounted(async () => {
    loadData();
    if (user.value.loggedIn) {
      try {
        console.log("refreshing tokens", Cookies.get("access_token"));
        await refreshToken();
      } catch (error) {
        console.error('Token refresh failed:', error);
        await logout();
      }
    } else if (router.currentRoute.value.path === '/signup') {
      router.push('/login');
    } else if (router.currentRoute.value.path !== '/login') {
      router.push('/login');
    }
  });

  return { currentJwt, user: currentUser, login, signup, logout, refreshToken };
});
