-- ============================================================
-- SECURITY FIX MIGRATION
-- Corrige vulnerabilidades críticas de RLS y autenticación
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- ============================================================
-- PASO 1: Función helper para obtener el rol del usuario actual
-- SECURITY DEFINER: bypassa RLS en profiles para evitar recursión
-- ============================================================

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- ============================================================
-- PASO 2: Re-habilitar RLS en profiles (estaba deshabilitado)
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PASO 3: Eliminar políticas inseguras de profiles
-- ============================================================

-- INSEGURA: expone todos los perfiles a cualquiera
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- INSEGURA: permite cambiar el propio rol a 'admin' o 'teacher'
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- INSEGURA: permite insert con cualquier rol
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- ============================================================
-- PASO 4: Crear políticas seguras para profiles
-- ============================================================

DROP POLICY IF EXISTS "Users view own profile"               ON public.profiles;
DROP POLICY IF EXISTS "New users must register as student"   ON public.profiles;
DROP POLICY IF EXISTS "Users update own profile no role change" ON public.profiles;
DROP POLICY IF EXISTS "Admins update any profile"            ON public.profiles;
DROP POLICY IF EXISTS "No direct profile deletion"           ON public.profiles;
DROP POLICY IF EXISTS "No profile deletion"                  ON public.profiles;

-- SELECT: cada usuario ve solo su propio perfil; admin ve todos
CREATE POLICY "Users view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.current_user_role() = 'admin');

-- INSERT: solo se puede crear con rol 'student'
-- Impide que alguien se auto-registre como admin/teacher
CREATE POLICY "New users must register as student"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id AND role = 'student');

-- UPDATE: el usuario puede actualizar sus datos pero NO su rol
CREATE POLICY "Users update own profile no role change"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND role = public.current_user_role());

-- UPDATE: solo admin puede cambiar roles (promover teacher/admin)
CREATE POLICY "Admins update any profile"
  ON public.profiles FOR UPDATE
  USING (public.current_user_role() = 'admin');

-- DELETE: nadie puede borrar perfiles directamente (solo cascade de auth)
CREATE POLICY "No direct profile deletion"
  ON public.profiles FOR DELETE
  USING (false);

-- ============================================================
-- PASO 5: CRÍTICO - Eliminar acceso directo de estudiantes al banco
--
-- "Students can view approved questions for practice" es PELIGROSA:
-- permite SELECT * FROM question_bank, que incluye correct_answer.
-- Los estudiantes solo deben acceder vía funciones SECURITY DEFINER
-- que NO devuelven correct_answer.
-- ============================================================

DROP POLICY IF EXISTS "Students can view approved questions for practice" ON public.question_bank;

-- Admin: acceso total (ya creada en add_admin_role.sql)
-- Teacher: solo SELECT de aprobadas (ya creada en add_admin_role.sql)
-- Estudiante: SIN ACCESO DIRECTO (solo vía RPCs que no exponen respuestas)

-- ============================================================
-- PASO 5b: Tabla `questions` (legacy práctica)
--
-- start_practice_session copia correct_answer a esta tabla.
-- La política actual permite que el estudiante (created_by = auth.uid())
-- lea todas las columnas DURANTE el examen (antes de enviar).
-- Fix: el estudiante solo puede leer sus preguntas de práctica
-- DESPUÉS de que el intento esté completado (is_completed = true).
-- Mientras toma el examen, usa la función get_practice_questions_safe().
-- ============================================================

DROP POLICY IF EXISTS "Questions are viewable if exam is accessible" ON public.questions;

CREATE POLICY "Questions are viewable if exam is accessible"
  ON public.questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.exams
      WHERE exams.id = questions.exam_id
      AND (
        -- Exámenes publicados: cualquier autenticado puede ver
        (exams.status = 'published' AND exams.is_public = true)
        -- Dueño del examen (teacher/admin gestionando su examen)
        OR (
          exams.created_by = auth.uid()
          AND public.current_user_role() IN ('teacher', 'admin')
        )
        -- Práctica propia del estudiante: SOLO si el intento ya fue completado
        -- (impide leer correct_answer durante el examen activo)
        OR (
          exams.created_by = auth.uid()
          AND exams.status = 'practice'
          AND EXISTS (
            SELECT 1 FROM public.exam_attempts
            WHERE exam_attempts.exam_id = exams.id
            AND exam_attempts.user_id = auth.uid()
            AND exam_attempts.is_completed = true
          )
        )
      )
    )
  );

-- Función segura para que el estudiante obtenga preguntas de práctica
-- SIN correct_answer (la usa el ExamTaker mientras toma el examen)
CREATE OR REPLACE FUNCTION public.get_practice_questions_safe(p_exam_id UUID)
RETURNS TABLE (
  id         UUID,
  type       TEXT,
  question_text TEXT,
  options    JSONB,
  terms      JSONB,
  points     INTEGER,
  order_index INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verificar que el examen pertenece al usuario actual y es práctica
  IF NOT EXISTS (
    SELECT 1 FROM public.exams
    WHERE id = p_exam_id
    AND created_by = auth.uid()
    AND status = 'practice'
  ) THEN
    RAISE EXCEPTION 'Examen de práctica no disponible';
  END IF;

  -- Retornar preguntas SIN correct_answer ni explanation
  RETURN QUERY
  SELECT
    q.id,
    q.type,
    q.question_text,
    q.options,
    q.terms,
    q.points,
    q.order_index
  FROM public.questions q
  WHERE q.exam_id = p_exam_id
  ORDER BY q.order_index;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_practice_questions_safe TO authenticated;

-- ============================================================
-- PASO 6: Corregir handle_new_user
-- ANTES: usaba raw_user_meta_data->>'role' (cualquiera podía
--        registrarse como admin pasando {role:'admin'})
-- AHORA: siempre crea el perfil con role='student'
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    'student',  -- hardcoded: nunca confiar en metadata del cliente
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$;

-- ============================================================
-- PASO 7: Corregir search_path en funciones (warnings de Supabase)
-- Previene ataques de search_path injection
-- ============================================================

-- handle_updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- get_exam_questions_for_student
CREATE OR REPLACE FUNCTION public.get_exam_questions_for_student(exam_id_param UUID)
RETURNS TABLE (
  id UUID,
  type TEXT,
  question_text TEXT,
  options JSONB,
  points INTEGER,
  order_index INTEGER,
  explanation TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.exams
    WHERE exams.id = exam_id_param
    AND status = 'published'
  ) THEN
    RAISE EXCEPTION 'Exam not available';
  END IF;

  RETURN QUERY
  SELECT
    qb.id,
    qb.type,
    qb.question_text,
    qb.options,       -- opciones SÍ (para mostrar)
    qb.points,
    eq.order_index,
    NULL::TEXT as explanation  -- explicación NO antes de enviar
    -- correct_answer NO se devuelve nunca aquí
  FROM public.exam_questions eq
  JOIN public.question_bank qb ON qb.id = eq.question_bank_id
  WHERE eq.exam_id = exam_id_param
  ORDER BY eq.order_index;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_exam_questions_for_student TO authenticated;

-- get_random_questions_for_practice
CREATE OR REPLACE FUNCTION public.get_random_questions_for_practice(
  num_questions INTEGER,
  categories TEXT[] DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  type TEXT,
  question_text TEXT,
  options JSONB,
  points INTEGER,
  difficulty TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  config_difficulty JSONB;
  easy_count INTEGER;
  medium_count INTEGER;
  hard_count INTEGER;
BEGIN
  SELECT difficulty_distribution INTO config_difficulty
  FROM public.practice_config
  LIMIT 1;

  easy_count   := FLOOR(num_questions * (config_difficulty->>'easy')::NUMERIC   / 100);
  medium_count := FLOOR(num_questions * (config_difficulty->>'medium')::NUMERIC / 100);
  hard_count   := num_questions - easy_count - medium_count;

  RETURN QUERY
  (
    -- correct_answer NO se devuelve (SECURITY DEFINER protege acceso)
    SELECT qb.id, qb.type, qb.question_text, qb.options, qb.points, qb.difficulty
    FROM public.question_bank qb
    WHERE qb.status = 'approved' AND qb.difficulty = 'easy'
    AND (categories IS NULL OR qb.category = ANY(categories))
    ORDER BY RANDOM() LIMIT easy_count
  )
  UNION ALL
  (
    SELECT qb.id, qb.type, qb.question_text, qb.options, qb.points, qb.difficulty
    FROM public.question_bank qb
    WHERE qb.status = 'approved' AND qb.difficulty = 'medium'
    AND (categories IS NULL OR qb.category = ANY(categories))
    ORDER BY RANDOM() LIMIT medium_count
  )
  UNION ALL
  (
    SELECT qb.id, qb.type, qb.question_text, qb.options, qb.points, qb.difficulty
    FROM public.question_bank qb
    WHERE qb.status = 'approved' AND qb.difficulty = 'hard'
    AND (categories IS NULL OR qb.category = ANY(categories))
    ORDER BY RANDOM() LIMIT hard_count
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_random_questions_for_practice TO authenticated;

-- get_question_bank_stats
CREATE OR REPLACE FUNCTION public.get_question_bank_stats()
RETURNS TABLE (
  total_questions   BIGINT,
  approved_count    BIGINT,
  pending_count     BIGINT,
  rejected_count    BIGINT,
  ai_generated_count BIGINT,
  manual_count      BIGINT,
  imported_count    BIGINT,
  categories_count  BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT,
    COUNT(*) FILTER (WHERE status = 'approved')::BIGINT,
    COUNT(*) FILTER (WHERE status = 'pending')::BIGINT,
    COUNT(*) FILTER (WHERE status = 'rejected')::BIGINT,
    COUNT(*) FILTER (WHERE source = 'ai_generated')::BIGINT,
    COUNT(*) FILTER (WHERE source = 'manual')::BIGINT,
    COUNT(*) FILTER (WHERE source = 'imported')::BIGINT,
    COUNT(DISTINCT category)::BIGINT
  FROM public.question_bank;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_question_bank_stats TO authenticated;

-- ============================================================
-- PASO 8: Políticas de Storage para question-images
-- ============================================================

DROP POLICY IF EXISTS "Admins can upload question images" ON storage.objects;
DROP POLICY IF EXISTS "Public read for question images"   ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete question images" ON storage.objects;
-- Por si se crearon con nombres distintos en sesiones anteriores:
DROP POLICY IF EXISTS "Admin upload question images"      ON storage.objects;
DROP POLICY IF EXISTS "Public can read question images"   ON storage.objects;

CREATE POLICY "Admins can upload question images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'question-images'
    AND public.current_user_role() = 'admin'
  );

CREATE POLICY "Public read for question images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'question-images');

CREATE POLICY "Admins can delete question images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'question-images'
    AND public.current_user_role() = 'admin'
  );

-- ============================================================
-- NOTA FINAL: "Leaked Password Protection Disabled"
-- Esto se activa en el Dashboard de Supabase:
-- Authentication → Settings → Enable leaked password protection
-- No se puede configurar por SQL.
-- ============================================================
