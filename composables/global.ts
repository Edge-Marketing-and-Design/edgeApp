export const globalState = reactive({
  drawer: false,
  dark: true,
})

export const projectSetOrg = async (organization: string, edgeFirebase: any, edgeGlobal: any) => {
  // set Organization Paths and start snapshots here
}

export const logOut = async (edgeFirebase: any, edgeGlobal: any) => {
  const auth = useState('auth')
  auth.value = ''
  globalState.drawer = false
  await edgeGlobal.edgeLogOut(edgeFirebase)
}
