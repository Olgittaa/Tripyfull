<template>
  <TfModal
    :modelValue="askToSignIn"
    title="Session expired"
    subtitle="Signed out after a day. Sign in and carry on from the same page."
    size="sm"
    :dismissible="false"
  >
    <form class="field-stack" @submit.prevent="submit">
      <TfInput v-model="user" label="Username" autocomplete="username" />
      <TfInput
        v-model="password"
        label="Password"
        type="password"
        placeholder="••••••••"
        autocomplete="current-password"
        :error="error"
      />
      <!-- Enter submits: the button lives in the footer, outside this form. -->
      <button type="submit" hidden></button>
    </form>
    <template #footer>
      <TfButton variant="ghost" :disabled="loading" @click="signOut">Sign out</TfButton>
      <TfButton variant="primary" :loading="loading" @click="submit">Sign in</TfButton>
    </template>
  </TfModal>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { api, setAuth, clearAuth, username } from '@tripyfull/core';
import { TfModal, TfInput, TfButton } from '@tripyfull/ui';
import { askToSignIn, settleSignIn, armSessionExpiry } from '@/session.js';

const router = useRouter();
const user = ref(username.value || '');
const password = ref('');
const error = ref('');
const loading = ref(false);

watch(askToSignIn, async (open) => {
  if (!open) return;
  user.value = username.value || '';
  password.value = '';
  error.value = '';
  loading.value = false;
  // The modal teleports to <body>; the password field is what needs typing.
  await nextTick();
  document.querySelector('.modal input[type="password"]')?.focus();
});

const submit = async () => {
  if (loading.value) return;
  error.value = '';
  loading.value = true;
  try {
    const res = await api.post('/api/auth/login', {
      username: user.value,
      password: password.value,
    });
    setAuth(res.data.token, res.data.username, res.data);
    armSessionExpiry();
    settleSignIn(true); // the requests that failed meanwhile replay themselves
  } catch (err) {
    const data = err.response?.data;
    error.value = data?.error || (typeof data === 'string' && data) || 'Could not sign in';
  } finally {
    loading.value = false;
  }
};

const signOut = () => {
  clearAuth();
  settleSignIn(false);
  router.push('/auth');
};
</script>
