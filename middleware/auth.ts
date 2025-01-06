export default defineNuxtRouteMiddleware(async () => {
  // EDGE START
  const preLoginRoute = useState('preLoginRoute')

  if (!preLoginRoute.value) {
    // Save both pathname and query string
    const { pathname, search } = window.location
    preLoginRoute.value = `${pathname}${search}`
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
