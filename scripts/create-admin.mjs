import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://djlwdmkdyoqsfmqewryi.supabase.co'
const supabaseAnonKey = 'sb_publishable_l3PVIevAcxFmMKLycceoCw_iVdQ0KKk'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function createAdmin() {
  const email = 'admin@examspot.com'
  const password = 'Admin123!'
  const fullName = 'Administrador'

  console.log(`Creando cuenta admin: ${email}`)

  // 1. Registrar usuario
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        role: 'admin',
        full_name: fullName,
      },
    },
  })

  if (error) {
    console.error('Error al registrar:', error.message)
    process.exit(1)
  }

  console.log('Usuario creado:', data.user?.id)

  // 2. Verificar que el perfil se creó con rol admin
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .single()

  if (profileError) {
    console.log('Perfil aún no creado (puede tomar un momento por el trigger)')
  } else {
    console.log('Perfil:', profile)
  }

  console.log('\n--- CUENTA ADMIN CREADA ---')
  console.log(`Email: ${email}`)
  console.log(`Password: ${password}`)
  console.log(`Rol: admin`)
  console.log('\nSi el email requiere confirmación, ve a Supabase Dashboard > Authentication > Users y confirma manualmente.')
}

createAdmin()
