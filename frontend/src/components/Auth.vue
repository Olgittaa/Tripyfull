<template>
  <div class="auth-page">
    <Transition name="auth-card" appear>
      <div class="auth-card">
        <h1 class="auth-title">Tripyfull</h1>
        <p class="auth-sub">{{ isLogin ? 'Welcome back — your trips are waiting' : 'Start planning your next adventure' }}</p>

        <div class="tab-switch">
          <button :class="{ active: isLogin }" @click="isLogin = true">Sign in</button>
          <button :class="{ active: !isLogin }" @click="isLogin = false">Register</button>
        </div>

        <form @submit.prevent="submit" class="auth-form">
          <div class="field">
            <label>Username</label>
            <PInputText v-model="username" placeholder="username" required class="w-full" />
          </div>
          <div class="field">
            <label>Password</label>
            <PInputText v-model="password" type="password" placeholder="••••••••" required class="w-full" />
          </div>
          <Transition name="fade">
            <p v-if="error" class="auth-error">
              <i class="pi pi-exclamation-circle"></i> {{ error }}
            </p>
          </Transition>
          <PButton type="submit" :label="isLogin ? 'Sign in' : 'Register'"
            icon="pi pi-arrow-right" iconPos="right" class="w-full submit-btn" :loading="loading" />
        </form>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import api from '../api.js';
import { useRouter, useRoute } from 'vue-router';
import { setAuth } from '../auth.js';

const router = useRouter();
const route = useRoute();
const isLogin = ref(true);
const username = ref('');
const password = ref('');
const error = ref('');
const loading = ref(false);

const submit = async () => {
  error.value = '';
  loading.value = true;
  const endpoint = isLogin.value ? '/api/auth/login' : '/api/auth/register';
  try {
    const res = await api.post(endpoint, { username: username.value, password: password.value });
    setAuth(res.data.token, res.data.username, res.data);
    router.push(route.query.redirect || '/trips');
  } catch (err) {
    error.value = err.response?.data || 'Something went wrong. Please try again.';
  } finally {
    loading.value = false;
  }
};
</script>
