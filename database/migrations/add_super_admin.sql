-- ============================================================
-- SUPER ADMIN MIGRATION
-- Añade el concepto de super administrador (admin@examspot.com)
-- Solo el super admin puede ver y gestionar todos los usuarios
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- ============================================================
-- PASO 1: Añadir columna is_super_admin a profiles
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN NOT NULL DEFAULT false;

-- ============================================================
-- PASO 2: Función helper SECURITY DEFINER
-- Retorna true si el usuario actual es super admin
-- Usa SECURITY DEFINER para evitar recursión RLS en profiles
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_current_user_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(is_super_admin, false)
  FROM public.profiles
  WHERE id = auth.uid();
$$;

-- ============================================================
-- PASO 3: Actualizar política de SELECT en profiles
--
-- ANTES: cualquier admin podía ver todos los perfiles
-- AHORA: solo el super admin puede ver todos los perfiles
--        Los demás ven únicamente el suyo
-- ============================================================

DROP POLICY IF EXISTS "Users view own profile" ON public.profiles;

CREATE POLICY "Users view own profile"
  ON public.profiles FOR SELECT
  USING (
    auth.uid() = id
    OR public.is_current_user_super_admin()
  );

-- ============================================================
-- PASO 4: Actualizar política de UPDATE en profiles
--
-- ANTES: cualquier admin podía actualizar cualquier perfil
-- AHORA: solo el super admin puede actualizar perfiles ajenos
--        (cambiar rol, promover a teacher/admin, etc.)
-- ============================================================

DROP POLICY IF EXISTS "Admins update any profile" ON public.profiles;

CREATE POLICY "Super admin updates any profile"
  ON public.profiles FOR UPDATE
  USING (public.is_current_user_super_admin());

-- ============================================================
-- PASO 5: Marcar admin@examspot.com como super admin
--
-- Este UPDATE solo tiene efecto si el usuario ya existe.
-- Si aún no existe, créalo primero en Supabase Auth y luego
-- re-ejecuta este bloque, o corre solo este UPDATE.
-- ============================================================

UPDATE public.profiles
SET
  is_super_admin = true,
  role = 'admin'
WHERE email = 'admin@examspot.com';

-- Verificación: muestra el resultado
SELECT id, email, role, is_super_admin
FROM public.profiles
WHERE email = 'admin@examspot.com';

-- ============================================================
-- NOTA: Si el UPDATE no afectó ninguna fila es porque el usuario
-- aún no existe. Crea la cuenta en Supabase Auth → Authentication
-- → Users → "Add user", con email admin@examspot.com, luego
-- vuelve a ejecutar el UPDATE de arriba.
-- ============================================================
