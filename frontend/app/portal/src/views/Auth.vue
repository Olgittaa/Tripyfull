<template>
  <div class="auth-page">
    <Transition name="auth-card" appear>
      <div class="auth-card">
        <h1 class="auth-title">Tripyfull</h1>
        <p class="auth-sub">
          {{
            isLogin ? 'Welcome back — your trips are waiting' : 'Start planning your next adventure'
          }}
        </p>

        <div class="tab-switch">
          <button :class="{ active: isLogin }" @click="isLogin = true">Sign in</button>
          <button :class="{ active: !isLogin }" @click="isLogin = false">Register</button>
        </div>

        <form @submit.prevent="submit" class="auth-form">
          <TfInput v-model="username" label="Username" placeholder="username" />
          <TfInput v-model="password" label="Password" type="password" placeholder="••••••••" />
          <Transition name="fade">
            <p v-if="error" class="auth-error">
              <i class="pi pi-exclamation-circle"></i> {{ error }}
            </p>
          </Transition>
          <TfButton type="submit" variant="primary" class="w-full submit-btn" :loading="loading">
            {{ isLogin ? 'Sign in' : 'Register' }} <i class="pi pi-arrow-right"></i>
          </TfButton>
        </form>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { api } from '@tripyfull/core';
import { useRouter, useRoute } from 'vue-router';
import { setAuth } from '@tripyfull/core';
import { TfInput, TfButton } from '@tripyfull/ui';

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
    // The API returns errors as { error: "..." } (or occasionally plain text).
    const data = err.response?.data;
    error.value =
      data?.error ||
      (typeof data === 'string' && data) ||
      'Something went wrong. Please try again.';
  } finally {
    loading.value = false;
  }
};
</script>
