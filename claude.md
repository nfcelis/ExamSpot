# ExamSpot - Plataforma de Exámenes en Línea con IA

## Descripción del Proyecto

Aplicación web para la creación, publicación y realización de exámenes tipo cuestionario en línea. Los administradores gestionan el banco de preguntas mediante creación manual, generación con IA e importación. Los profesores crean exámenes seleccionando preguntas del banco aprobado. Los estudiantes toman exámenes y reciben retroalimentación inteligente generada por IA para entrenarse en los temas.

## Stack Tecnológico

### Frontend
- **React 18** con Vite
- **Tailwind CSS** para estilos
- **React Router** para navegación
- Framework UI: Headless UI o Radix UI (para componentes accesibles)

### Backend y Base de Datos
- **Supabase** (PostgreSQL con Row Level Security)
  - Authentication (JWT)
  - Database (PostgreSQL)
  - Storage (para PDFs y material)
  - Realtime (opcional para notificaciones)

### IA
- **Groq** (API - GRATIS)
  - Modelo: Llama 3.3 70B
  - Generación de preguntas desde PDFs/material
  - Calificación de respuestas abiertas
  - Generación de feedback personalizado
  - Análisis de similitud semántica

### Herramientas de Desarrollo
- **Vite** (bundler)
- **ESLint** (linting)
- **React Hook Form** (manejo de formularios)
- **Zod** (validación de schemas)
- **React Query** (data fetching y caché)
- **Zustand** (estado global)

## Arquitectura del Sistema

### Estructura de Carpetas

```
exam-platform/
├── src/
│   ├── components/
│   │   ├── common/           # Componentes reutilizables
│   │   │   ├── Button.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── Toast.jsx
│   │   │   ├── LoadingSpinner.jsx
│   │   │   ├── Card.jsx
│   │   │   └── Badge.jsx
│   │   ├── auth/             # Autenticación
│   │   │   ├── LoginForm.jsx
│   │   │   ├── RegisterForm.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── admin/            # Vista administrador (NUEVO)
│   │   │   ├── QuestionCard.jsx
│   │   │   ├── QuestionApprovalModal.jsx
│   │   │   ├── FeedbackReviewModal.jsx
│   │   │   ├── QuestionEditor.jsx
│   │   │   ├── CategoryManager.jsx
│   │   │   ├── BulkImporter.jsx
│   │   │   └── QuestionFilters.jsx
│   │   ├── exam/             # Exámenes
│   │   │   ├── ExamCard.jsx
│   │   │   ├── ExamForm.jsx
│   │   │   ├── ExamList.jsx
│   │   │   └── ExamFilters.jsx
│   │   ├── question/         # Preguntas
│   │   │   ├── QuestionForm.jsx
│   │   │   ├── QuestionTypes/
│   │   │   │   ├── MultipleChoice.jsx
│   │   │   │   ├── OpenEnded.jsx
│   │   │   │   ├── FillBlank.jsx
│   │   │   │   └── Matching.jsx
│   │   │   ├── QuestionPreview.jsx
│   │   │   └── QuestionList.jsx
│   │   ├── student/          # Vista estudiante
│   │   │   ├── ExamTaker.jsx
│   │   │   ├── QuestionDisplay.jsx
│   │   │   ├── ProgressBar.jsx
│   │   │   ├── ResultsView.jsx
│   │   │   ├── FeedbackDisplay.jsx
│   │   │   ├── MaterialReferences.jsx
│   │   │   ├── PracticeExam.jsx
│   │   │   └── Timer.jsx
│   │   └── teacher/          # Vista profesor (MODIFICADO)
│   │       ├── Dashboard.jsx
│   │       ├── ExamCreator.jsx
│   │       ├── QuestionSelector.jsx
│   │       ├── QuestionBankBrowser.jsx
│   │       └── Analytics.jsx
│   ├── pages/                # Páginas principales
│   │   ├── admin/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── QuestionBankManager.jsx
│   │   │   ├── QuestionGenerator.jsx
│   │   │   ├── PendingQuestionsReview.jsx
│   │   │   ├── FeedbackReviewQueue.jsx
│   │   │   ├── PracticeConfig.jsx
│   │   │   └── Analytics.jsx
│   │   ├── teacher/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── ExamCreator.jsx
│   │   │   └── QuestionBankBrowser.jsx
│   │   ├── student/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── ExamTaker.jsx
│   │   │   ├── Results.jsx
│   │   │   ├── History.jsx
│   │   │   └── PracticeMode.jsx
│   │   ├── Home.jsx
│   │   └── NotFound.jsx
│   ├── hooks/                # Custom hooks
│   │   ├── useAuth.js
│   │   ├── useExams.js
│   │   ├── useQuestions.js
│   │   ├── useQuestionBank.js
│   │   ├── useAI.js
│   │   ├── useExamAttempt.js
│   │   └── useToast.js
│   ├── lib/                  # Utilidades y configuración
│   │   ├── supabase.js
│   │   ├── groq.js
│   │   ├── validators.js
│   │   └── utils.js
│   ├── services/             # Servicios API
│   │   ├── examService.js
│   │   ├── questionService.js
│   │   ├── questionBankService.js
│   │   ├── adminService.js
│   │   ├── aiService.js
│   │   ├── grading.js
│   │   └── analyticsService.js
│   ├── store/                # Estado global (Zustand)
│   │   ├── authStore.js
│   │   ├── examStore.js
│   │   └── uiStore.js
│   ├── types/                # TypeScript types (opcional)
│   │   ├── exam.ts
│   │   ├── question.ts
│   │   └── user.ts
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── public/
├── database/
│   ├── schema.sql            # Schema completo de Supabase
│   └── migrations/
│       └── add_admin_role.sql
├── .env.example
├── package.json
├── vite.config.js
├── tailwind.config.js
└── README.md
```

## Sistema de Roles y Permisos

### ROL 1: Administrador (NUEVO)

**Responsabilidades:**
- Gestión completa del banco de preguntas
- Generación de preguntas con IA desde material educativo
- Creación manual de preguntas
- Aprobación/rechazo de preguntas generadas por IA
- Aprobación/rechazo/modificación de feedback de IA
- Configuración de parámetros de prácticas (número de preguntas)
- Importación masiva de preguntas (CSV/Excel)
- Exportación de banco de preguntas
- Gestión de categorías y etiquetas
- Ver analytics globales del banco

**Permisos:**
- ✅ CRUD completo en tabla `question_bank`
- ✅ Aprobar/rechazar preguntas con estado `pending`
- ✅ Generar preguntas con IA (Groq API)
- ✅ Configurar `practice_config` global
- ✅ Ver analytics de uso del banco completo
- ✅ Importar/exportar preguntas en lote
- ✅ Gestionar categorías y subcategorías
- ✅ Revisar y modificar feedback de IA
- ❌ NO puede crear exámenes (eso es exclusivo del profesor)
- ❌ NO puede tomar exámenes (eso es exclusivo del estudiante)

**Flujos Principales:**

**1. Crear Pregunta Manual:**
```
Admin → Dashboard → "Crear Pregunta"
→ Formulario (tipo, texto, opciones, respuesta correcta)
→ Categoría + Subcategoría + Tags
→ Guardar → Estado: 'approved' (directamente aprobada)
→ Disponible inmediatamente para profesores
```

**2. Generar Preguntas con IA:**
```
Admin → "Generar Preguntas con IA"
→ Subir PDF o pegar contexto
→ Configurar:
   - # de preguntas: 20
   - Tipos: mixto o específicos
   - Dificultad: fácil/medio/difícil
   - Categoría/Subcategoría
→ IA procesa (Groq Llama 3.3)
→ Preguntas generadas → Estado: 'pending'
→ Admin revisa cada pregunta:
   - Preview completo
   - Editar si es necesario
   - Aprobar ✅ o Rechazar ❌
→ Aprobadas → Estado: 'approved'
→ Disponibles para profesores
```

**3. Configurar Prácticas:**
```
Admin → "Configuración de Prácticas"
→ Número de preguntas por práctica: 10
→ Tiempo límite: 15 minutos (o sin límite)
→ Distribución de dificultad:
   - Fácil: 30%
   - Medio: 50%
   - Difícil: 20%
→ Categorías habilitadas para práctica
→ Guardar → Aplica globalmente
```

**4. Revisar Feedback de IA:**
```
Admin → "Cola de Revisión de Feedback"
→ Lista de feedback pendientes
→ Por cada uno:
   - Pregunta original
   - Respuesta del estudiante
   - Score asignado por IA
   - Feedback generado por IA
→ Opciones:
   - ✅ Aprobar (mantener como está)
   - ❌ Rechazar (ocultar, asignar score manual)
   - ✏️ Modificar (editar feedback y/o score)
→ Guardar decisión
→ Estudiante ve versión final
```

---

### ROL 2: Profesor (MODIFICADO)

**Responsabilidades:**
- Crear/editar/eliminar sus propios exámenes
- Seleccionar preguntas del banco aprobado
- Configurar parámetros de sus exámenes
- Ver resultados de estudiantes en sus exámenes
- Ver analytics de sus exámenes

**Permisos:**
- ✅ CRUD de exámenes propios (solo los que él creó)
- ✅ SOLO LECTURA del banco de preguntas (ver y seleccionar)
- ✅ Ver intentos de estudiantes en sus exámenes
- ✅ Configurar tiempo límite, aleatorización, visibilidad
- ✅ Subir material complementario para sus exámenes
- ❌ NO puede modificar el banco de preguntas
- ❌ NO puede generar preguntas con IA
- ❌ NO puede crear preguntas nuevas
- ❌ NO puede aprobar/rechazar preguntas

**Flujos Principales:**

**1. Crear Examen Seleccionando del Banco:**
```
Profesor → Dashboard → "Crear Examen"
→ Configuración básica:
   - Título: "Parcial 1 - TOGAF"
   - Descripción
   - Tiempo límite: 90 minutos
   - Aleatorizar: Sí
   - Visibilidad: Público
→ "Agregar Preguntas"
→ Navegar banco de preguntas:
   - Filtros:
     * Categoría: "Arquitectura Empresarial"
     * Subcategoría: "TOGAF"
     * Tags: ["adm", "fase-a"]
     * Dificultad: Medio
     * Tipo: Mixto
   - Ver preview de cada pregunta
   - "Agregar a Examen" (crea referencia, no copia)
→ Lista de preguntas seleccionadas (10 preguntas)
→ Reordenar si es necesario
→ Guardar como borrador
→ Publicar examen
```

**2. Editar Examen Existente:**
```
Profesor → Mis Exámenes → "Editar"
→ Modificar configuración (tiempo, título, etc.)
→ Agregar/quitar preguntas del banco
→ No puede editar contenido de las preguntas
→ Guardar cambios
```

**3. Ver Resultados:**
```
Profesor → Examen → "Resultados"
→ Lista de estudiantes que lo tomaron
→ Score de cada uno
→ Click en estudiante → Ver respuestas individuales
→ Ver feedback que IA generó
→ Analytics: preguntas más difíciles, promedio, etc.
```

---

### ROL 3: Estudiante (SIN CAMBIOS MAYORES)

**Responsabilidades:**
- Tomar exámenes publicados
- Ver sus resultados y feedback
- Practicar con modo práctica
- Ver su historial de intentos

**Permisos:**
- ✅ Tomar exámenes publicados y públicos
- ✅ Ver sus propios intentos y resultados
- ✅ Modo práctica (configurado por admin)
- ✅ Ver feedback de IA en sus respuestas
- ❌ NO puede ver banco de preguntas directamente
- ❌ NO puede ver respuestas correctas antes de enviar
- ❌ NO puede modificar respuestas después de enviar

**Flujos Principales:**

**1. Tomar Examen:**
```
Estudiante → Dashboard → Ver exámenes disponibles
→ Seleccionar "Parcial 1 - TOGAF"
→ Ver detalles (# preguntas, tiempo)
→ "Comenzar Examen"
→ Responder preguntas (navegación o scroll)
→ Auto-save cada 10 segundos
→ "Enviar Examen"
→ Confirmación
→ Procesamiento (IA califica abiertas)
→ Ver resultados con feedback
```

**2. Modo Práctica (NUEVO):**
```
Estudiante → Dashboard → "Practicar"
→ Sistema muestra configuración:
   - "10 preguntas aleatorias"
   - "15 minutos"
→ Seleccionar categorías (opcional):
   [ ] TOGAF
   [ ] Patrones de Diseño
   [x] Todas
→ "Comenzar Práctica"
→ Sistema selecciona 10 preguntas aleatorias del banco:
   - Distribución: 30% fácil, 50% medio, 20% difícil
   - De categorías seleccionadas
   - Estado: 'approved'
→ Estudiante responde
→ Al finalizar:
   - Score inmediato
   - Respuestas correctas VISIBLES (diferencia con examen)
   - Feedback de IA
   - Explicaciones
→ "Repetir Práctica" (nuevas preguntas aleatorias)
```

**3. Ver Historial:**
```
Estudiante → "Mi Historial"
→ Lista de exámenes tomados
→ Por cada examen:
   - Todos los intentos
   - Score por intento
   - Fecha/hora
→ Gráfica de progreso
→ Click en intento → Ver detalles completos
```

---

## Modelo de Base de Datos

### Tablas Principales

#### 1. Tabla `profiles`

```sql
-- Usuarios (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('student', 'teacher', 'admin')),
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice
CREATE INDEX idx_profiles_role ON profiles(role);
```

#### 2. Tabla `question_bank` (MODIFICADA - NUEVA ESTRUCTURA)

```sql
-- Banco centralizado de preguntas (gestionado por admin)
CREATE TABLE question_bank (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Metadata de creación
  created_by UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Estado de aprobación (NUEVO)
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES profiles(id), -- Admin que revisó
  reviewed_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT, -- Razón si fue rechazada
  
  -- Origen de la pregunta (NUEVO)
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'ai_generated', 'imported')),
  ai_generation_metadata JSONB, -- {prompt, model, temperature, etc.}
  
  -- Categorización (MEJORADA)
  category TEXT NOT NULL, -- ej: "Arquitectura Empresarial"
  subcategory TEXT, -- ej: "TOGAF", "Zachman"
  tags TEXT[], -- ej: ["adm", "fase-a", "stakeholders"]
  difficulty TEXT NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  
  -- Contenido de la pregunta
  type TEXT NOT NULL CHECK (type IN ('multiple_choice', 'open_ended', 'fill_blank', 'matching')),
  question_text TEXT NOT NULL,
  
  -- Opciones (para multiple choice y matching)
  options JSONB, -- ["opción 1", "opción 2", "opción 3", "opción 4"]
  
  -- Respuesta correcta (formato flexible según tipo)
  correct_answer JSONB NOT NULL,
  -- Ejemplos:
  -- Multiple choice: 1 (índice) o [1,3] si múltiple
  -- Open ended: "Texto de respuesta modelo"
  -- Fill blank: ["respuesta1", "respuesta2"]
  -- Matching: {"term1": "def1", "term2": "def2"}
  
  -- Datos adicionales
  explanation TEXT, -- Explicación de la respuesta correcta
  points INTEGER DEFAULT 10,
  allow_partial_credit BOOLEAN DEFAULT false,
  
  -- Material de referencia
  reference_material TEXT, -- ej: "Lectura 3: TOGAF Framework"
  reference_page TEXT, -- ej: "Capítulo 5, págs 45-48"
  
  -- Metadata de uso
  is_public BOOLEAN DEFAULT true, -- Visible para todos los profesores
  usage_count INTEGER DEFAULT 0, -- Cuántas veces se ha usado en exámenes
  avg_score DECIMAL(5,2), -- Score promedio cuando se usa (actualizado)
  
  -- Constraints
  CONSTRAINT valid_status CHECK (status IN ('pending', 'approved', 'rejected')),
  CONSTRAINT valid_source CHECK (source IN ('manual', 'ai_generated', 'imported')),
  CONSTRAINT valid_difficulty CHECK (difficulty IN ('easy', 'medium', 'hard'))
);

-- Índices para performance
CREATE INDEX idx_question_bank_status ON question_bank(status);
CREATE INDEX idx_question_bank_category ON question_bank(category);
CREATE INDEX idx_question_bank_subcategory ON question_bank(subcategory);
CREATE INDEX idx_question_bank_tags ON question_bank USING GIN(tags);
CREATE INDEX idx_question_bank_created_by ON question_bank(created_by);
CREATE INDEX idx_question_bank_difficulty ON question_bank(difficulty);
CREATE INDEX idx_question_bank_type ON question_bank(type);
```

#### 3. Tabla `practice_config` (NUEVA)

```sql
-- Configuración global de modo práctica (solo admin puede modificar)
CREATE TABLE practice_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Configuración de práctica
  questions_per_practice INTEGER NOT NULL DEFAULT 10,
  time_limit_minutes INTEGER, -- NULL = sin límite
  
  -- Distribución de dificultad (porcentajes que suman 100)
  difficulty_distribution JSONB DEFAULT '{"easy": 30, "medium": 50, "hard": 20}'::jsonb,
  
  -- Categorías habilitadas para práctica
  categories_enabled TEXT[], -- NULL = todas habilitadas
  
  -- Configuraciones adicionales
  show_correct_answers BOOLEAN DEFAULT true, -- Mostrar respuestas correctas al finalizar
  allow_retry BOOLEAN DEFAULT true,
  
  -- Audit
  updated_by UUID REFERENCES profiles(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar configuración inicial (solo debe haber un registro)
INSERT INTO practice_config (questions_per_practice, time_limit_minutes)
VALUES (10, 15);

-- Solo debe haber un registro (singleton)
CREATE UNIQUE INDEX idx_practice_config_singleton ON practice_config((1));
```

#### 4. Tabla `exams` (MODIFICADA)

```sql
-- Exámenes creados por profesores
CREATE TABLE exams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Información básica
  title TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Estado y visibilidad
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  is_public BOOLEAN DEFAULT true,
  access_link TEXT UNIQUE, -- Para exámenes privados
  link_expiration TIMESTAMP WITH TIME ZONE,
  
  -- Configuración del examen
  randomize_order BOOLEAN DEFAULT false,
  time_limit INTEGER, -- minutos (NULL = sin límite)
  
  -- Metadata
  question_count INTEGER DEFAULT 0, -- Calculado automáticamente
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_exams_created_by ON exams(created_by);
CREATE INDEX idx_exams_status ON exams(status);
```

#### 5. Tabla `exam_questions` (NUEVA - Relación Many-to-Many)

```sql
-- Relación entre exámenes y preguntas del banco
-- Un examen tiene muchas preguntas del banco
-- Una pregunta del banco puede estar en muchos exámenes
CREATE TABLE exam_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  question_bank_id UUID NOT NULL REFERENCES question_bank(id) ON DELETE CASCADE,
  order_index INTEGER DEFAULT 0, -- Orden en el examen
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Una pregunta solo puede estar una vez en el mismo examen
  UNIQUE(exam_id, question_bank_id)
);

-- Índices
CREATE INDEX idx_exam_questions_exam_id ON exam_questions(exam_id);
CREATE INDEX idx_exam_questions_question_id ON exam_questions(question_bank_id);
```

#### 6. Tabla `materials` (SIN CAMBIOS)

```sql
-- Material complementario (PDFs, presentaciones)
CREATE TABLE materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  file_path TEXT NOT NULL, -- Path en Supabase Storage
  file_type TEXT NOT NULL CHECK (file_type IN ('pdf', 'pptx', 'docx')),
  uploaded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice
CREATE INDEX idx_materials_exam_id ON materials(exam_id);
```

#### 7. Tabla `exam_attempts` (SIN CAMBIOS)

```sql
-- Intentos de examen por estudiante
CREATE TABLE exam_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Scoring
  score NUMERIC DEFAULT 0,
  max_score NUMERIC DEFAULT 0,
  percentage NUMERIC DEFAULT 0,
  
  -- Timing
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  time_spent INTEGER, -- segundos
  
  -- Estado
  is_completed BOOLEAN DEFAULT false,
  is_practice BOOLEAN DEFAULT false -- NUEVO: Diferenciar práctica de examen real
);

-- Índices
CREATE INDEX idx_exam_attempts_user_id ON exam_attempts(user_id);
CREATE INDEX idx_exam_attempts_exam_id ON exam_attempts(exam_id);
CREATE INDEX idx_exam_attempts_is_practice ON exam_attempts(is_practice);
```

#### 8. Tabla `exam_answers` (MODIFICADA)

```sql
-- Respuestas individuales del estudiante
CREATE TABLE exam_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attempt_id UUID NOT NULL REFERENCES exam_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES question_bank(id) ON DELETE CASCADE,
  
  -- Respuesta del estudiante
  user_answer JSONB, -- Formato flexible según tipo de pregunta
  
  -- Calificación
  is_correct BOOLEAN DEFAULT false,
  score NUMERIC DEFAULT 0,
  
  -- Feedback de IA
  feedback TEXT, -- Feedback final (puede ser modificado por admin)
  ai_analysis JSONB, -- Análisis completo de IA
  -- {
  --   "correct_aspects": ["concepto1", "concepto2"],
  --   "incorrect_aspects": ["error1"],
  --   "missing_concepts": ["faltante1"],
  --   "reasoning": "explicación",
  --   "material_references": [...]
  -- }
  
  -- Estado de revisión (NUEVO)
  feedback_status TEXT DEFAULT 'auto' CHECK (feedback_status IN ('auto', 'pending_review', 'reviewed')),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_exam_answers_attempt_id ON exam_answers(attempt_id);
CREATE INDEX idx_exam_answers_question_id ON exam_answers(question_id);
CREATE INDEX idx_exam_answers_feedback_status ON exam_answers(feedback_status);
```

#### 9. Tabla `ai_feedback_reviews` (NUEVA)

```sql
-- Revisiones de feedback de IA por parte del admin
CREATE TABLE ai_feedback_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Referencia
  exam_answer_id UUID REFERENCES exam_answers(id) ON DELETE CASCADE NOT NULL,
  
  -- Feedback original de IA
  original_feedback TEXT NOT NULL,
  original_score NUMERIC NOT NULL,
  original_ai_analysis JSONB NOT NULL,
  
  -- Revisión del admin
  reviewed_by UUID REFERENCES profiles(id) NOT NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  admin_decision TEXT NOT NULL CHECK (admin_decision IN ('approved', 'rejected', 'modified')),
  
  -- Si fue modificado o rechazado
  modified_feedback TEXT,
  modified_score NUMERIC,
  admin_notes TEXT, -- Notas internas del admin
  
  CONSTRAINT valid_decision CHECK (admin_decision IN ('approved', 'rejected', 'modified'))
);

-- Índices
CREATE INDEX idx_ai_feedback_reviews_exam_answer ON ai_feedback_reviews(exam_answer_id);
CREATE INDEX idx_ai_feedback_reviews_reviewed_by ON ai_feedback_reviews(reviewed_by);
CREATE INDEX idx_ai_feedback_reviews_decision ON ai_feedback_reviews(admin_decision);
```

---

## Row Level Security (RLS)

### Habilitar RLS en todas las tablas

```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_bank ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_feedback_reviews ENABLE ROW LEVEL SECURITY;
```

### Políticas para `profiles`

```sql
-- Ver solo su propio perfil
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

-- Actualizar solo su propio perfil
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);
```

### Políticas para `question_bank`

```sql
-- Admins: acceso completo
CREATE POLICY "Admins have full access to question bank"
ON question_bank FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);

-- Profesores: solo lectura de preguntas aprobadas
CREATE POLICY "Teachers can view approved questions"
ON question_bank FOR SELECT
USING (
  status = 'approved'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'teacher'
  )
);

-- Estudiantes: NO acceso directo al banco
-- (Solo a través de exámenes/prácticas)
CREATE POLICY "Students cannot access question bank directly"
ON question_bank FOR SELECT
USING (false);
```

### Políticas para `practice_config`

```sql
-- Solo admins pueden modificar
CREATE POLICY "Only admins can modify practice config"
ON practice_config FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);

-- Todos pueden ver (para saber configuración de práctica)
CREATE POLICY "Everyone can view practice config"
ON practice_config FOR SELECT
USING (auth.uid() IS NOT NULL);
```

### Políticas para `exams`

```sql
-- Profesores ven sus propios exámenes
CREATE POLICY "Teachers can view own exams"
ON exams FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'teacher'
  )
  AND (
    created_by = auth.uid() OR
    status = 'published' -- También pueden ver publicados de otros
  )
);

-- Solo el creador puede modificar su examen
CREATE POLICY "Only creator can update exam"
ON exams FOR UPDATE
USING (
  auth.uid() = created_by
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'teacher'
  )
);

-- Solo el creador puede eliminar su examen
CREATE POLICY "Only creator can delete exam"
ON exams FOR DELETE
USING (auth.uid() = created_by);

-- Solo profesores pueden crear exámenes
CREATE POLICY "Only teachers can create exams"
ON exams FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'teacher'
  )
);

-- Estudiantes solo ven exámenes publicados
CREATE POLICY "Students can view published exams"
ON exams FOR SELECT
USING (
  status = 'published'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'student'
  )
);
```

### Políticas para `exam_questions`

```sql
-- Profesores pueden gestionar preguntas de sus exámenes
CREATE POLICY "Teachers can manage questions in their exams"
ON exam_questions FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM exams
    WHERE exams.id = exam_questions.exam_id
    AND exams.created_by = auth.uid()
  )
);

-- Estudiantes pueden ver preguntas de exámenes publicados
CREATE POLICY "Students can view questions in published exams"
ON exam_questions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM exams
    WHERE exams.id = exam_questions.exam_id
    AND exams.status = 'published'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'student'
    )
  )
);
```

### Políticas para `exam_attempts`

```sql
-- Usuarios solo ven sus propios intentos
CREATE POLICY "Users can view own attempts"
ON exam_attempts FOR SELECT
USING (auth.uid() = user_id);

-- Usuarios pueden crear sus propios intentos
CREATE POLICY "Authenticated users can create attempts"
ON exam_attempts FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Profesores pueden ver intentos en sus exámenes
CREATE POLICY "Teachers can view attempts in their exams"
ON exam_attempts FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM exams
    WHERE exams.id = exam_attempts.exam_id
    AND exams.created_by = auth.uid()
  )
);

-- Nadie puede modificar intentos completados
CREATE POLICY "Cannot modify completed attempts"
ON exam_attempts FOR UPDATE
USING (is_completed = false AND auth.uid() = user_id);

-- Nadie puede eliminar intentos
CREATE POLICY "No one can delete attempts"
ON exam_attempts FOR DELETE
USING (false);
```

### Políticas para `exam_answers`

```sql
-- Solo el dueño del intento puede ver sus respuestas
CREATE POLICY "Users can view own answers"
ON exam_answers FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM exam_attempts
    WHERE exam_attempts.id = exam_answers.attempt_id
    AND exam_attempts.user_id = auth.uid()
  )
);

-- Profesores pueden ver respuestas en sus exámenes
CREATE POLICY "Teachers can view answers in their exams"
ON exam_answers FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM exam_attempts
    JOIN exams ON exams.id = exam_attempts.exam_id
    WHERE exam_attempts.id = exam_answers.attempt_id
    AND exams.created_by = auth.uid()
  )
);

-- Solo durante el examen se pueden insertar respuestas
CREATE POLICY "Users can insert answers during exam"
ON exam_answers FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM exam_attempts
    WHERE exam_attempts.id = exam_answers.attempt_id
    AND exam_attempts.user_id = auth.uid()
    AND exam_attempts.is_completed = false
  )
);

-- No se pueden modificar respuestas enviadas
CREATE POLICY "Cannot modify submitted answers"
ON exam_answers FOR UPDATE
USING (false);
```

### Políticas para `ai_feedback_reviews`

```sql
-- Solo admins pueden gestionar reviews
CREATE POLICY "Only admins can manage feedback reviews"
ON ai_feedback_reviews FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);
```

---

## Funciones de Supabase

### Función para obtener preguntas sin respuestas (para estudiantes)

```sql
-- Función segura que retorna preguntas SIN respuestas correctas
CREATE OR REPLACE FUNCTION get_exam_questions_for_student(exam_id_param UUID)
RETURNS TABLE (
  id UUID,
  type TEXT,
  question_text TEXT,
  options JSONB,
  points INTEGER,
  order_index INTEGER,
  explanation TEXT
) 
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar que el examen está publicado
  IF NOT EXISTS (
    SELECT 1 FROM exams
    WHERE id = exam_id_param
    AND status = 'published'
  ) THEN
    RAISE EXCEPTION 'Exam not available';
  END IF;
  
  -- Retornar preguntas SIN correct_answer
  RETURN QUERY
  SELECT 
    qb.id,
    qb.type,
    qb.question_text,
    qb.options,
    qb.points,
    eq.order_index,
    NULL::TEXT as explanation -- NO mostrar explicación antes de enviar
  FROM exam_questions eq
  JOIN question_bank qb ON qb.id = eq.question_bank_id
  WHERE eq.exam_id = exam_id_param
  ORDER BY eq.order_index;
END;
$$ LANGUAGE plpgsql;

-- Dar permiso a usuarios autenticados
GRANT EXECUTE ON FUNCTION get_exam_questions_for_student TO authenticated;
```

### Función para modo práctica

```sql
-- Función para seleccionar preguntas aleatorias para práctica
CREATE OR REPLACE FUNCTION get_random_questions_for_practice(
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
SECURITY DEFINER
AS $$
DECLARE
  config_difficulty JSONB;
  easy_count INTEGER;
  medium_count INTEGER;
  hard_count INTEGER;
BEGIN
  -- Obtener configuración de práctica
  SELECT difficulty_distribution INTO config_difficulty
  FROM practice_config
  LIMIT 1;
  
  -- Calcular cuántas preguntas de cada dificultad
  easy_count := FLOOR(num_questions * (config_difficulty->>'easy')::NUMERIC / 100);
  medium_count := FLOOR(num_questions * (config_difficulty->>'medium')::NUMERIC / 100);
  hard_count := num_questions - easy_count - medium_count;
  
  -- Retornar preguntas aleatorias
  RETURN QUERY
  (
    -- Fáciles
    SELECT qb.id, qb.type, qb.question_text, qb.options, qb.points, qb.difficulty
    FROM question_bank qb
    WHERE qb.status = 'approved'
    AND qb.difficulty = 'easy'
    AND (categories IS NULL OR qb.category = ANY(categories))
    ORDER BY RANDOM()
    LIMIT easy_count
  )
  UNION ALL
  (
    -- Medias
    SELECT qb.id, qb.type, qb.question_text, qb.options, qb.points, qb.difficulty
    FROM question_bank qb
    WHERE qb.status = 'approved'
    AND qb.difficulty = 'medium'
    AND (categories IS NULL OR qb.category = ANY(categories))
    ORDER BY RANDOM()
    LIMIT medium_count
  )
  UNION ALL
  (
    -- Difíciles
    SELECT qb.id, qb.type, qb.question_text, qb.options, qb.points, qb.difficulty
    FROM question_bank qb
    WHERE qb.status = 'approved'
    AND qb.difficulty = 'hard'
    AND (categories IS NULL OR qb.category = ANY(categories))
    ORDER BY RANDOM()
    LIMIT hard_count
  );
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION get_random_questions_for_practice TO authenticated;
```

---

## Integración con IA (Groq)

### Configuración

```javascript
// lib/groq.js
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export async function callGroq(messages, options = {}) {
  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages,
      temperature: options.temperature || 0.3,
      max_tokens: options.maxTokens || 2000,
      response_format: options.responseFormat || { type: "json_object" }
    })
  });

  if (!response.ok) {
    throw new Error(`Groq API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}
```

### Caso de Uso 1: Generación de Preguntas desde Material

```javascript
// services/aiService.js

export async function generateQuestionsFromMaterial(pdfContent, config) {
  const { numQuestions, questionTypes, difficulty, category, subcategory } = config;
  
  const prompt = `Genera ${numQuestions} preguntas de examen basadas en este material educativo.

MATERIAL:
${pdfContent.substring(0, 8000)}

CONFIGURACIÓN:
- Número de preguntas: ${numQuestions}
- Tipos permitidos: ${questionTypes.join(', ')}
- Dificultad: ${difficulty}
- Categoría: ${category}
- Subcategoría: ${subcategory || 'General'}

REQUISITOS:
1. Distribuir equitativamente los tipos de preguntas
2. Cubrir diferentes secciones del material
3. Progresión de dificultad adecuada
4. Incluir explicaciones claras
5. Preguntas de calidad universitaria

DEVUELVE SOLO JSON válido (sin markdown):
{
  "questions": [
    {
      "type": "multiple_choice",
      "question_text": "¿Cuál es el concepto principal de X?",
      "options": ["opción 1", "opción 2", "opción 3", "opción 4"],
      "correct_answer": 1,
      "explanation": "La respuesta correcta es... porque...",
      "points": 10,
      "difficulty": "medium",
      "reference_material": "${category}",
      "reference_page": "Sección 2"
    },
    {
      "type": "open_ended",
      "question_text": "Explica el proceso de...",
      "correct_answer": "Respuesta modelo completa y detallada",
      "explanation": "Esta pregunta evalúa...",
      "points": 15,
      "difficulty": "hard",
      "reference_material": "${category}",
      "reference_page": "Capítulo 3"
    }
  ]
}`;

  const messages = [
    {
      role: 'system',
      content: 'Eres un experto en diseño de evaluaciones educativas. Generas preguntas de alta calidad académica. Respondes SOLO con JSON válido.'
    },
    {
      role: 'user',
      content: prompt
    }
  ];

  try {
    const response = await callGroq(messages, {
      temperature: 0.7,
      maxTokens: 4000,
      responseFormat: { type: "json_object" }
    });
    
    const result = JSON.parse(response);
    return result.questions || [];
    
  } catch (error) {
    console.error('Error generating questions:', error);
    throw error;
  }
}
```

### Caso de Uso 2: Calificación de Respuestas Abiertas

```javascript
// services/grading.js

export async function gradeOpenEndedWithGroq(question, userAnswer, modelAnswer, materialContext, maxPoints) {
  
  const prompt = `Evalúa esta respuesta de estudiante de manera justa y constructiva.

PREGUNTA:
${question.question_text}

RESPUESTA DEL ESTUDIANTE:
${userAnswer}

RESPUESTA MODELO:
${modelAnswer}

PUNTOS MÁXIMOS: ${maxPoints}

MATERIAL DE REFERENCIA:
${materialContext.substring(0, 2000)}

INSTRUCCIONES:
1. Compara la respuesta del estudiante con la respuesta modelo
2. Identifica conceptos correctos (acepta sinónimos y paráfrasis)
3. Identifica errores conceptuales
4. Identifica conceptos importantes que faltan
5. Asigna puntuación proporcional (puede ser parcial)

DEVUELVE SOLO JSON:
{
  "score": número entre 0 y ${maxPoints},
  "correct_aspects": ["concepto1", "concepto2"],
  "incorrect_aspects": ["error1"],
  "missing_concepts": ["concepto_faltante1", "concepto_faltante2"],
  "reasoning": "Explicación breve del por qué del score"
}`;

  const messages = [
    {
      role: 'system',
      content: 'Eres un evaluador educativo experto y justo. Evalúas respuestas de estudiantes con criterio académico. Respondes SOLO con JSON válido.'
    },
    {
      role: 'user',
      content: prompt
    }
  ];

  try {
    const response = await callGroq(messages, {
      temperature: 0.3,
      maxTokens: 1000
    });
    
    const result = JSON.parse(response);
    return result;
    
  } catch (error) {
    console.error('Error grading with AI:', error);
    // Fallback a calificación manual
    return {
      score: 0,
      correct_aspects: [],
      incorrect_aspects: [],
      missing_concepts: [],
      reasoning: 'Error en calificación automática. Requiere revisión manual.'
    };
  }
}
```

### Caso de Uso 3: Generación de Feedback Personalizado

```javascript
// services/aiService.js

export async function generateFeedback(gradeResult, question, materialReferences) {
  const { score, correct_aspects, incorrect_aspects, missing_concepts } = gradeResult;
  const maxPoints = question.points;
  const percentage = (score / maxPoints) * 100;

  const prompt = `Genera feedback educativo constructivo para un estudiante.

CONTEXTO:
- Pregunta: ${question.question_text}
- Puntuación obtenida: ${score}/${maxPoints} (${percentage.toFixed(1)}%)

ANÁLISIS DE LA RESPUESTA:
Aspectos correctos:
${correct_aspects.map(a => `- ${a}`).join('\n')}

Aspectos a mejorar:
${incorrect_aspects.map(a => `- ${a}`).join('\n')}

Conceptos que faltaron:
${missing_concepts.map(c => `- ${c}`).join('\n')}

INSTRUCCIONES:
Genera feedback en 2-3 párrafos con este formato:

Párrafo 1: POSITIVO
- Empieza reconociendo lo que hizo bien
- Sé específico sobre los conceptos correctos
- Tono alentador y motivacional

Párrafo 2: CONSTRUCTIVO
- Explica qué puede mejorar
- Sé específico y claro
- Proporciona orientación, no solo crítica
- Menciona los conceptos que faltaron

Párrafo 3: ACCIÓN (si score < 80%)
- Sugiere próximos pasos concretos
- Recomienda material específico para revisar

TONO:
- Constructivo y motivador
- Como un tutor paciente y experto
- Específico y accionable
- Apropiado para nivel universitario

Máximo 250 palabras. Solo devuelve el feedback en texto plano, sin formato JSON.`;

  const messages = [
    {
      role: 'system',
      content: 'Eres un tutor educativo experto que genera feedback constructivo y motivador para estudiantes universitarios.'
    },
    {
      role: 'user',
      content: prompt
    }
  ];

  try {
    const feedback = await callGroq(messages, {
      temperature: 0.7,
      maxTokens: 800,
      responseFormat: { type: "text" }
    });
    
    return feedback.trim();
    
  } catch (error) {
    console.error('Error generating feedback:', error);
    return 'Feedback no disponible. Por favor contacta al profesor.';
  }
}
```

### Caso de Uso 4: Generación de Referencias al Material

```javascript
// services/aiService.js

export async function generateMaterialReferences(missingConcepts, materials) {
  if (!missingConcepts || missingConcepts.length === 0) {
    return [];
  }

  const prompt = `Identifica las secciones más relevantes del material para que el estudiante repase.

CONCEPTOS QUE EL ESTUDIANTE DEBE REPASAR:
${missingConcepts.map(c => `- ${c}`).join('\n')}

MATERIAL DISPONIBLE:
${materials.map((m, idx) => `
Material ${idx + 1}: ${m.title}
Contenido: ${m.content.substring(0, 2000)}...
`).join('\n\n')}

INSTRUCCIONES:
Identifica las 2-3 secciones más relevantes que el estudiante debería revisar.

DEVUELVE JSON:
{
  "references": [
    {
      "material_title": "Nombre del documento",
      "section": "Capítulo o sección específica",
      "reason": "Por qué debe revisar esta sección (1 oración específica)"
    }
  ]
}`;

  const messages = [
    {
      role: 'system',
      content: 'Eres un asistente educativo que ayuda a identificar material de estudio relevante. Respondes SOLO con JSON válido.'
    },
    {
      role: 'user',
      content: prompt
    }
  ];

  try {
    const response = await callGroq(messages, {
      temperature: 0.3,
      maxTokens: 1000
    });
    
    const result = JSON.parse(response);
    return result.references || [];
    
  } catch (error) {
    console.error('Error generating material references:', error);
    return [];
  }
}
```

---

## Servicios Backend

### `adminService.js` (NUEVO)

```javascript
// services/adminService.js
import { supabase } from '../lib/supabase';

// ===== Gestión de Preguntas Pendientes =====

export async function getPendingQuestions(filters = {}) {
  let query = supabase
    .from('question_bank')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false });
  
  if (filters.category) {
    query = query.eq('category', filters.category);
  }
  
  if (filters.type) {
    query = query.eq('type', filters.type);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  return data;
}

export async function approveQuestion(questionId, adminNotes = null) {
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from('question_bank')
    .update({
      status: 'approved',
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString()
    })
    .eq('id', questionId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function rejectQuestion(questionId, reason) {
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from('question_bank')
    .update({
      status: 'rejected',
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      rejection_reason: reason
    })
    .eq('id', questionId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function modifyAndApproveQuestion(questionId, modifications) {
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from('question_bank')
    .update({
      ...modifications,
      status: 'approved',
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString()
    })
    .eq('id', questionId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// ===== Generación de Preguntas con IA =====

export async function generateQuestionsWithAI(config) {
  // Implementado en aiService.js
  // Este método es un wrapper que también guarda en BD
  const { generateQuestionsFromMaterial } = await import('./aiService');
  
  const questions = await generateQuestionsFromMaterial(
    config.pdfContent,
    config
  );
  
  // Guardar preguntas generadas con estado 'pending'
  const { data: { user } } = await supabase.auth.getUser();
  
  const questionsToInsert = questions.map(q => ({
    created_by: user.id,
    status: 'pending',
    source: 'ai_generated',
    ai_generation_metadata: {
      model: 'llama-3.3-70b',
      prompt_length: config.pdfContent.length,
      generated_at: new Date().toISOString()
    },
    category: config.category,
    subcategory: config.subcategory,
    tags: config.tags || [],
    difficulty: q.difficulty,
    type: q.type,
    question_text: q.question_text,
    options: q.options,
    correct_answer: q.correct_answer,
    explanation: q.explanation,
    points: q.points,
    reference_material: q.reference_material,
    reference_page: q.reference_page
  }));
  
  const { data, error } = await supabase
    .from('question_bank')
    .insert(questionsToInsert)
    .select();
  
  if (error) throw error;
  return data;
}

// ===== Importación Masiva =====

export async function bulkImportQuestions(file, category, subcategory) {
  // Parsear CSV/Excel
  const questions = await parseQuestionsFile(file);
  
  const { data: { user } } = await supabase.auth.getUser();
  
  const questionsToInsert = questions.map(q => ({
    created_by: user.id,
    status: 'approved', // Importadas son aprobadas automáticamente
    source: 'imported',
    category,
    subcategory,
    ...q
  }));
  
  const { data, error } = await supabase
    .from('question_bank')
    .insert(questionsToInsert)
    .select();
  
  if (error) throw error;
  return data;
}

async function parseQuestionsFile(file) {
  // Implementar parsing de CSV/Excel
  // Usar librería como PapaParse para CSV
  // Retornar array de preguntas
}

// ===== Configuración de Práctica =====

export async function getPracticeConfig() {
  const { data, error } = await supabase
    .from('practice_config')
    .select('*')
    .single();
  
  if (error) throw error;
  return data;
}

export async function updatePracticeConfig(config) {
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from('practice_config')
    .update({
      ...config,
      updated_by: user.id,
      updated_at: new Date().toISOString()
    })
    .eq('id', config.id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// ===== Analytics =====

export async function getQuestionBankStats() {
  // Total de preguntas por estado
  const { data: stats, error } = await supabase
    .rpc('get_question_bank_stats');
  
  if (error) throw error;
  return stats;
}

export async function getUsageAnalytics() {
  // Preguntas más usadas, scores promedios, etc.
  const { data, error } = await supabase
    .from('question_bank')
    .select('id, question_text, category, usage_count, avg_score')
    .eq('status', 'approved')
    .order('usage_count', { ascending: false })
    .limit(20);
  
  if (error) throw error;
  return data;
}

// ===== Revisión de Feedback de IA =====

export async function getPendingFeedbackReviews() {
  const { data, error } = await supabase
    .from('exam_answers')
    .select(`
      *,
      question:question_bank(*),
      attempt:exam_attempts(*)
    `)
    .eq('feedback_status', 'pending_review')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
}

export async function reviewFeedback(examAnswerId, decision, modifications = {}) {
  const { data: { user } } = await supabase.auth.getUser();
  
  // Obtener feedback original
  const { data: answer } = await supabase
    .from('exam_answers')
    .select('*')
    .eq('id', examAnswerId)
    .single();
  
  // Crear registro de revisión
  const { error: reviewError } = await supabase
    .from('ai_feedback_reviews')
    .insert({
      exam_answer_id: examAnswerId,
      original_feedback: answer.feedback,
      original_score: answer.score,
      original_ai_analysis: answer.ai_analysis,
      reviewed_by: user.id,
      admin_decision: decision,
      modified_feedback: modifications.feedback,
      modified_score: modifications.score,
      admin_notes: modifications.notes
    });
  
  if (reviewError) throw reviewError;
  
  // Actualizar respuesta con feedback final
  const finalFeedback = decision === 'modified' 
    ? modifications.feedback 
    : (decision === 'approved' ? answer.feedback : null);
    
  const finalScore = decision === 'modified'
    ? modifications.score
    : (decision === 'approved' ? answer.score : 0);
  
  const { error: updateError } = await supabase
    .from('exam_answers')
    .update({
      feedback: finalFeedback,
      score: finalScore,
      feedback_status: 'reviewed'
    })
    .eq('id', examAnswerId);
  
  if (updateError) throw updateError;
  
  return { success: true };
}
```

### `questionBankService.js` (NUEVO)

```javascript
// services/questionBankService.js
import { supabase } from '../lib/supabase';

// ===== Para Profesores =====

export async function getApprovedQuestions(filters = {}) {
  let query = supabase
    .from('question_bank')
    .select('*')
    .eq('status', 'approved')
    .order('created_at', { ascending: false });
  
  if (filters.category) {
    query = query.eq('category', filters.category);
  }
  
  if (filters.subcategory) {
    query = query.eq('subcategory', filters.subcategory);
  }
  
  if (filters.type) {
    query = query.eq('type', filters.type);
  }
  
  if (filters.difficulty) {
    query = query.eq('difficulty', filters.difficulty);
  }
  
  if (filters.tags && filters.tags.length > 0) {
    query = query.contains('tags', filters.tags);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  return data;
}

export async function searchQuestions(searchQuery) {
  const { data, error } = await supabase
    .from('question_bank')
    .select('*')
    .eq('status', 'approved')
    .textSearch('question_text', searchQuery);
  
  if (error) throw error;
  return data;
}

export async function getQuestionsByCategory(category) {
  const { data, error } = await supabase
    .from('question_bank')
    .select('*')
    .eq('status', 'approved')
    .eq('category', category)
    .order('subcategory');
  
  if (error) throw error;
  return data;
}

export async function getQuestionById(id) {
  const { data, error } = await supabase
    .from('question_bank')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data;
}

// ===== Para Estudiantes (Práctica) =====

export async function getRandomQuestionsForPractice(config = {}) {
  const { numQuestions, categories } = config;
  
  // Llamar a la función de Supabase
  const { data, error } = await supabase
    .rpc('get_random_questions_for_practice', {
      num_questions: numQuestions || 10,
      categories: categories || null
    });
  
  if (error) throw error;
  return data;
}

// ===== Categorías =====

export async function getAllCategories() {
  const { data, error } = await supabase
    .from('question_bank')
    .select('category, subcategory')
    .eq('status', 'approved');
  
  if (error) throw error;
  
  // Agrupar por categoría
  const categories = {};
  data.forEach(item => {
    if (!categories[item.category]) {
      categories[item.category] = new Set();
    }
    if (item.subcategory) {
      categories[item.category].add(item.subcategory);
    }
  });
  
  // Convertir Sets a arrays
  Object.keys(categories).forEach(cat => {
    categories[cat] = Array.from(categories[cat]);
  });
  
  return categories;
}
```

### `examService.js` (MODIFICADO)

```javascript
// services/examService.js
import { supabase } from '../lib/supabase';

// ===== CRUD de Exámenes =====

export async function createExam(examData) {
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from('exams')
    .insert({
      ...examData,
      created_by: user.id
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function getExamsByTeacher(teacherId) {
  const { data, error } = await supabase
    .from('exams')
    .select('*')
    .eq('created_by', teacherId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
}

export async function updateExam(examId, updates) {
  const { data, error } = await supabase
    .from('exams')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', examId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function deleteExam(examId) {
  const { error } = await supabase
    .from('exams')
    .delete()
    .eq('id', examId);
  
  if (error) throw error;
}

// ===== Gestión de Preguntas en Examen =====

// NUEVO: Agregar pregunta del banco al examen (referencia, no copia)
export async function addQuestionToExam(examId, questionBankId, orderIndex) {
  const { data, error } = await supabase
    .from('exam_questions')
    .insert({
      exam_id: examId,
      question_bank_id: questionBankId,
      order_index: orderIndex
    })
    .select()
    .single();
  
  if (error) throw error;
  
  // Actualizar contador de preguntas en examen
  await updateQuestionCount(examId);
  
  // Incrementar usage_count en question_bank
  await incrementQuestionUsage(questionBankId);
  
  return data;
}

export async function removeQuestionFromExam(examId, questionBankId) {
  const { error } = await supabase
    .from('exam_questions')
    .delete()
    .eq('exam_id', examId)
    .eq('question_bank_id', questionBankId);
  
  if (error) throw error;
  
  // Actualizar contador
  await updateQuestionCount(examId);
}

export async function reorderQuestionsInExam(examId, questionOrders) {
  // questionOrders = [{question_bank_id, order_index}, ...]
  
  for (const { question_bank_id, order_index } of questionOrders) {
    await supabase
      .from('exam_questions')
      .update({ order_index })
      .eq('exam_id', examId)
      .eq('question_bank_id', question_bank_id);
  }
}

async function updateQuestionCount(examId) {
  const { count } = await supabase
    .from('exam_questions')
    .select('*', { count: 'exact', head: true })
    .eq('exam_id', examId);
  
  await supabase
    .from('exams')
    .update({ question_count: count })
    .eq('id', examId);
}

async function incrementQuestionUsage(questionBankId) {
  const { data } = await supabase
    .from('question_bank')
    .select('usage_count')
    .eq('id', questionBankId)
    .single();
  
  await supabase
    .from('question_bank')
    .update({ usage_count: (data.usage_count || 0) + 1 })
    .eq('id', questionBankId);
}

// ===== Obtener Preguntas de un Examen =====

export async function getExamQuestions(examId) {
  const { data, error } = await supabase
    .from('exam_questions')
    .select(`
      *,
      question:question_bank(*)
    `)
    .eq('exam_id', examId)
    .order('order_index');
  
  if (error) throw error;
  return data.map(eq => eq.question);
}

// ===== Para Estudiantes =====

export async function getPublishedExams() {
  const { data, error } = await supabase
    .from('exams')
    .select('*')
    .eq('status', 'published')
    .eq('is_public', true)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
}
```

---

## Flujos de Usuario Detallados

### Flujo 1: Admin Genera y Aprueba Preguntas con IA

```
1. Login como admin
2. Dashboard Admin → "Generar Preguntas con IA"
3. Subir PDF (ej: "Lectura 5 - TOGAF ADM.pdf")
4. Configurar generación:
   - # preguntas: 15
   - Tipos: Multiple Choice (60%), Open Ended (40%)
   - Dificultad: Mixta (30% easy, 50% medium, 20% hard)
   - Categoría: "Arquitectura Empresarial"
   - Subcategoría: "TOGAF"
   - Tags: ["adm", "fase-a", "fase-b", "togaf"]
5. Click "Generar" → IA procesa (20-30 seg)
6. Preguntas generadas (15 preguntas, estado: 'pending')
7. Admin revisa una por una:
   - Pregunta 1: Multiple Choice sobre Fase A
     * Preview completo
     * Editar texto si es necesario
     * Editar opciones
     * ✅ Aprobar
   - Pregunta 2: Open Ended sobre stakeholders
     * Revisar respuesta modelo
     * ✏️ Editar respuesta modelo para ser más específica
     * ✅ Aprobar
   - Pregunta 3: Multiple Choice incorrecta
     * ❌ Rechazar (razón: "Pregunta ambigua")
8. Resultado: 14 preguntas aprobadas → Estado: 'approved'
9. Ahora disponibles en banco para profesores
```

### Flujo 2: Profesor Crea Examen del Banco

```
1. Login como profesor
2. Dashboard → "Crear Examen"
3. Información del examen:
   - Título: "Quiz 1 - TOGAF ADM"
   - Descripción: "Evaluación sobre las fases A y B del ADM"
   - Tiempo límite: 30 minutos
   - Aleatorizar orden: Sí
   - Visibilidad: Público
4. "Agregar Preguntas"
5. Navegador del Banco:
   - Filtrar:
     * Categoría: "Arquitectura Empresarial"
     * Subcategoría: "TOGAF"
     * Tags: Seleccionar "adm", "fase-a", "fase-b"
     * Tipo: Todos
     * Dificultad: Medio
   - Resultados: 25 preguntas
6. Revisar preguntas:
   - Preview pregunta → "¿Cuál es el objetivo de la Fase A?"
   - Click "Agregar a Examen"
   - (Repetir para 10 preguntas)
7. Lista de preguntas seleccionadas (10 preguntas)
8. Reordenar con drag & drop si es necesario
9. Guardar como borrador
10. Revisar examen completo
11. Publicar examen
12. Copiar enlace → Compartir con estudiantes
```

### Flujo 3: Estudiante Toma Examen

```
1. Login como estudiante
2. Dashboard → "Exámenes Disponibles"
3. Ver lista:
   - Quiz 1 - TOGAF ADM (10 preguntas, 30 min)
   - Parcial 1 - Diseño de Software (20 preguntas, 90 min)
4. Click en "Quiz 1 - TOGAF ADM"
5. Ver detalles:
   - Descripción
   - 10 preguntas
   - 30 minutos
   - Aleatorizado
6. "Comenzar Examen"
7. Pantalla de examen:
   - Timer: 30:00 (cuenta regresiva)
   - Barra de progreso: 0/10
   - Pregunta 1 (Multiple Choice):
     * Leer pregunta
     * Seleccionar opción
     * "Siguiente"
   - Pregunta 2 (Open Ended):
     * Leer pregunta
     * Escribir respuesta en textarea
     * Auto-save (cada 10 seg)
     * "Siguiente"
   - (Continuar hasta pregunta 10)
8. Revisar respuestas (navegación)
9. "Enviar Examen"
10. Confirmación: "¿Estás seguro?"
11. Procesamiento:
    - Calificación automática (Multiple Choice, Fill Blank, Matching)
    - IA califica respuestas abiertas (5-10 seg)
    - IA genera feedback personalizado
12. Resultados:
    - Score: 85/100 (85%)
    - "¡Buen trabajo!"
    - Desglose por pregunta:
      * Pregunta 1: ✅ Correcta (10/10)
      * Pregunta 2: ⚠️ Parcial (12/15)
        - Feedback IA: "Identificaste correctamente el concepto de..."
        - Material de referencia: "Revisa Capítulo 3, págs 12-15"
13. "Ver Historial" o "Reintentar"
```

### Flujo 4: Estudiante Modo Práctica

```
1. Dashboard → "Modo Práctica"
2. Sistema muestra configuración actual:
   - "10 preguntas aleatorias"
   - "15 minutos"
   - Distribución: 30% fácil, 50% medio, 20% difícil
3. Seleccionar categorías (opcional):
   [ ] Arquitectura Empresarial
   [ ] Diseño de Software
   [x] Patrones de Diseño
   [x] TOGAF
4. "Comenzar Práctica"
5. Sistema selecciona 10 preguntas aleatorias:
   - 3 fáciles
   - 5 medias
   - 2 difíciles
   - De categorías seleccionadas
   - Estado: 'approved'
6. Estudiante responde (igual que examen)
7. Al enviar:
   - Calificación inmediata
   - Score: 70/100
   - MOSTRAR respuestas correctas (diferencia clave con examen)
   - Para cada pregunta:
     * Tu respuesta
     * Respuesta correcta
     * Explicación
     * Feedback de IA (si aplica)
8. Estadísticas:
   - Preguntas correctas: 7/10
   - Por dificultad:
     * Fácil: 3/3 (100%)
     * Medio: 3/5 (60%)
     * Difícil: 1/2 (50%)
9. "Repetir Práctica" (nuevas preguntas aleatorias)
```

### Flujo 5: Admin Revisa Feedback de IA

```
1. Login como admin
2. Dashboard → "Cola de Revisión de Feedback"
3. Lista de feedback pendientes (10 items):
   - Intento: Juan Pérez - Parcial 1
   - Pregunta: "Explica el patrón Strategy"
   - Fecha: Hace 2 horas
4. Click en item para revisar
5. Modal de revisión:
   - Pregunta completa
   - Respuesta del estudiante:
     "El patrón strategy se usa cuando quieres cambiar algoritmos..."
   - Respuesta modelo:
     "El patrón Strategy define una familia de algoritmos..."
   - Score asignado por IA: 12/15 (80%)
   - Feedback generado por IA:
     "Tu respuesta captura la idea principal del patrón Strategy.
      Mencionaste correctamente que permite cambiar algoritmos.
      Para mejorar, deberías incluir: el concepto de encapsulación,
      la interfaz común, y un ejemplo concreto. Revisa la
      Sección 4.2 del libro para profundizar."
6. Admin evalúa:
   - Opciones:
     [ ] ✅ Aprobar (mantener como está)
     [ ] ❌ Rechazar (ocultar feedback, asignar score manual)
     [x] ✏️ Modificar
7. Si modifica:
   - Editar score: 12 → 13 (ser más generoso)
   - Editar feedback: Agregar "También considera revisar..."
   - Notas internas: "Estudiante entendió concepto base"
8. Guardar decisión
9. Estudiante ve feedback final modificado
10. Siguiente item en cola
```

---

## Roadmap de Desarrollo (Actualizado)

### Fase 1: Setup y Base (1 semana)
- [ ] Setup inicial del proyecto (Vite + React + Tailwind)
- [ ] Configurar Supabase + ejecutar schema completo
- [ ] Sistema de autenticación con 3 roles
- [ ] Rutas y navegación según rol
- [ ] Componentes UI base (Button, Input, Modal, etc.)
- [ ] Layout diferenciado por rol

### Fase 2: Admin - Banco de Preguntas (2 semanas)
- [ ] Dashboard de admin
- [ ] CRUD de preguntas manual
- [ ] Formularios para 4 tipos de preguntas
- [ ] Sistema de categorías y tags
- [ ] Generación de preguntas con IA (Groq)
- [ ] Cola de aprobación de preguntas
- [ ] Configuración de modo práctica
- [ ] Analytics del banco

### Fase 3: Profesor - Exámenes (1 semana)
- [ ] Dashboard de profesor
- [ ] Navegador del banco de preguntas
- [ ] Selector de preguntas con filtros
- [ ] Creación de exámenes
- [ ] Agregar/quitar preguntas del banco
- [ ] Configuración de examen
- [ ] Vista de resultados

### Fase 4: Estudiante - Tomar Exámenes (1 semana)
- [ ] Dashboard de estudiante
- [ ] Vista de exámenes disponibles
- [ ] Interfaz de tomar examen
- [ ] Renderizado de 4 tipos de preguntas
- [ ] Timer y auto-save
- [ ] Sistema de calificación (manual + IA)
- [ ] Vista de resultados con feedback IA

### Fase 5: Features Adicionales (1 semana)
- [ ] Historial de intentos
- [ ] Modo práctica para estudiantes
- [ ] Revisión de feedback IA por admin
- [ ] Analytics para profesores
- [ ] Exportación de datos

### Fase 6: Polish y Deploy (1 semana)
- [ ] Validación Zod en todos los formularios
- [ ] Error handling comprehensivo
- [ ] Toast notifications
- [ ] Loading states everywhere
- [ ] Testing E2E de flujos críticos
- [ ] Deploy a Vercel
- [ ] Configurar variables de entorno
- [ ] Documentación final

---

## Variables de Entorno

```bash
# .env.example

# Supabase
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Groq (IA - GRATIS)
VITE_GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Opcional: Node version para Vercel
NODE_VERSION=18
```

---

## Comandos Útiles

### Development

```bash
# Instalar dependencias
npm install

# Desarrollo local
npm run dev

# Build para producción
npm run build

# Preview del build
npm run preview

# Linting
npm run lint
```

### Supabase

```bash
# Ejecutar schema
# (Copiar contenido de database/schema.sql y ejecutar en SQL Editor)

# Ejecutar migraciones
# (Copiar contenido de database/migrations/*.sql)
```

---

## Librerías Recomendadas

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "@supabase/supabase-js": "^2.39.3",
    "@tanstack/react-query": "^5.17.0",
    "react-hook-form": "^7.48.0",
    "zod": "^3.22.0",
    "zustand": "^4.4.0",
    "react-hot-toast": "^2.4.0",
    "@headlessui/react": "^1.7.17",
    "@heroicons/react": "^2.1.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.42",
    "@vitejs/plugin-react": "^4.2.0",
    "vite": "^5.0.0",
    "tailwindcss": "^3.3.0",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32",
    "eslint": "^8.55.0"
  }
}
```

---

## Conclusión

Este documento describe la especificación completa de **ExamSpot** con sistema de 3 roles:

1. **Admin**: Gestiona banco de preguntas, genera con IA, aprueba/rechaza
2. **Profesor**: Crea exámenes seleccionando del banco aprobado
3. **Estudiante**: Toma exámenes y practica, recibe feedback de IA

**Diferencias Clave del Sistema Anterior:**
- ✅ Banco centralizado de preguntas gestionado por admin
- ✅ Proceso de aprobación de preguntas generadas por IA
- ✅ Profesores no crean preguntas, solo seleccionan del banco
- ✅ Modo práctica para estudiantes con configuración global
- ✅ Revisión de feedback de IA por parte del admin
- ✅ Uso de Groq (100% gratis) en lugar de Anthropic

**Prioridad de Implementación:**
1. Fase 1: Base y autenticación
2. Fase 2: Admin y banco de preguntas
3. Fase 3: Profesores y exámenes
4. Fase 4: Estudiantes y calificación IA
5. Fases 5-6: Features adicionales y polish

**Claude Code debe usar esta especificación como guía maestra para generar todo el código del proyecto.**