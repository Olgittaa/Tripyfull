import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './index.css'
import PrimeVue from 'primevue/config'
import Aura from '@primeuix/themes/aura'
import ToastService from 'primevue/toastservice'
import ConfirmationService from 'primevue/confirmationservice'
import Tooltip from 'primevue/tooltip'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import SelectButton from 'primevue/selectbutton'
import DatePicker from 'primevue/datepicker'
import Card from 'primevue/card'
import Tag from 'primevue/tag'
import Toast from 'primevue/toast'
import Divider from 'primevue/divider'
import Dialog from 'primevue/dialog'
import ConfirmDialog from 'primevue/confirmdialog'
import ProgressBar from 'primevue/progressbar'
import 'primeicons/primeicons.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(PrimeVue, {
  theme: {
    preset: Aura,
    options: { darkModeSelector: false }
  }
})
app.use(ToastService)
app.use(ConfirmationService)

app.directive('tooltip', Tooltip)

app.component('PButton', Button)
app.component('PInputText', InputText)
app.component('PInputNumber', InputNumber)
app.component('PSelect', Select)
app.component('PSelectButton', SelectButton)
app.component('PDatePicker', DatePicker)
app.component('PCard', Card)
app.component('PTag', Tag)
app.component('PToast', Toast)
app.component('PDivider', Divider)
app.component('PDialog', Dialog)
app.component('PConfirmDialog', ConfirmDialog)
app.component('PProgressBar', ProgressBar)

app.mount('#app')
