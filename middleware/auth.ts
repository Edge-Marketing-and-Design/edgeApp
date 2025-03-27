export default defineNuxtRouteMiddleware(async () => {
  // EDGE START
  const preLoginRoute = useState('preLoginRoute')

  if (!preLoginRoute.value) {
    // Save both pathname and query string
    const { pathname, search } = window.location
    preLoginRoute.value = `${pathname}${search}`
  }

  const firstSection = window.location.pathname.split('/')[1] || ''
  const loginPath = `/${firstSection}/login`
  console.log('loginPath', loginPath)

  const auth: any = useState('auth')

  if (auth.value) {
    if (!auth.value.loggedIn) {
      return loginPath
    }
  }
  else {
    return loginPath
  }
  // EDGE END
})
