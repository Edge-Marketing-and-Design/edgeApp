export default defineNuxtRouteMiddleware(async () => {
// EDGE START
  const preLoginRoute = useState('preLoginRoute')
  if (!preLoginRoute.value) {
    preLoginRoute.value = window.location.pathname
  }
  const auth: any = useState('auth')
  if (auth.value) {
    if (!auth.value.loggedIn) {
      return '/app/login'
    }
  }
  else {
    return '/app/login'
  }
// EDGE END
})
