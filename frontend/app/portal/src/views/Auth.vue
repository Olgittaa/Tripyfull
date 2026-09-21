<template>
  <div class="auth-page">
    <Transition name="auth-card" appear>
      <div class="auth-card">
        <h1 class="auth-title">Tripyfull</h1>
        <p class="auth-sub">
          {{ isLogin ? t('auth.welcomeBack') : t('auth.startPlanning') }}
        </p>

        <div class="tab-switch">
          <button :class="{ active: isLogin }" @click="isLogin = true">
            {{ t('auth.signIn') }}
          </button>
          <button :class="{ active: !isLogin }" @click="isLogin = false">
            {{ t('auth.register') }}
          </button>
        </div>

        <form @submit.prevent="submit" class="auth-form">
          <TfInput v-model="username" :label="t('auth.username')" placeholder="username" />
          <TfInput
            v-model="password"
            :label="t('auth.password')"
            type="password"
            placeholder="••••••••"
          />
          <Transition name="fade">
            <p v-if="error" class="auth-error">
              <i class="pi pi-exclamation-circle"></i> {{ error }}
            </p>
          </Transition>
          <TfButton type="submit" variant="primary" class="w-full submit-btn" :loading="loading">
            {{ isLogin ? t('auth.signIn') : t('auth.register') }} <i class="pi pi-arrow-right"></i>
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
import { setAuth, t } from '@tripyfull/core';
import { TfInput, TfButton } from '@tripyfull/ui';
import { armSessionExpiry } from '@/session.js';

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
    armSessionExpiry();
    router.push(route.query.redirect || '/trips');
  } catch (err) {
    // The API returns errors as { error: "..." } (or occasionally plain text).
    const data = err.response?.data;
    error.value = data?.error || (typeof data === 'string' && data) || t('auth.genericError');
  } finally {
    loading.value = false;
  }
};
</script>
