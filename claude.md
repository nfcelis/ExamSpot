# ExamPro - Plataforma de Exámenes en Línea con IA

## Descripción del Proyecto

Aplicación web para la creación, publicación y realización de exámenes tipo cuestionario en línea. Los profesores crean exámenes que los estudiantes pueden responder, recibiendo retroalimentación inteligente generada por IA para entrenarse en los temas.

## Stack Tecnológico

### Frontend
- **React 18** con Vite
- **Tailwind CSS** para estilos
- **React Router** para navegación (opcional, se puede usar estado)
- Framework UI: Headless UI o Radix UI (para componentes accesibles)

### Backend y Base de Datos
- **Supabase** (PostgreSQL con Row Level Security)
  - Authentication (JWT)
  - Database (PostgreSQL)
  - Storage (para PDFs y material)
  - Realtime (opcional para notificaciones)

### IA
- **Anthropic Claude Sonnet 4** (API)
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
│   │   │   └── LoadingSpinner.jsx
│   │   ├── auth/             # Autenticación
│   │   │   ├── LoginForm.jsx
│   │   │   ├── RegisterForm.jsx
│   │   │   └── ProtectedRoute.jsx
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
│   │   │   └── QuestionPreview.jsx
│   │   ├── student/          # Vista estudiante
│   │   │   ├── ExamTaker.jsx
│   │   │   ├── QuestionDisplay.jsx
│   │   │   ├── ProgressBar.jsx
│   │   │   └── ResultsView.jsx
│   │   └── teacher/          # Vista profesor
│   │       ├── Dashboard.jsx
│   │       ├── ExamCreator.jsx
│   │       ├── QuestionGenerator.jsx
│   │       └── Analytics.jsx
│   ├── hooks/                # Custom hooks
│   │   ├── useAuth.js
│   │   ├── useExams.js
│   │   ├── useQuestions.js
│   │   ├── useAI.js
│   │   └── useToast.js
│   ├── lib/                  # Utilidades y configuración
│   │   ├── supabase.js
│   │   ├── anthropic.js
│   │   ├── validators.js
│   │   └── utils.js
│   ├── services/             # Servicios API
│   │   ├── examService.js
│   │   ├── questionService.js
│   │   ├── aiService.js
│   │   └── grading.js
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
│   └── schema.sql            # Schema de Supabase
├── .env.example
├── package.json
├── vite.config.js
├── tailwind.config.js
└── README.md
```

## Modelo de Base de Datos

### Tablas Principales

```sql
-- Usuarios (extends Supabase auth.users)
profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('student', 'teacher', 'admin')),
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)

-- Exámenes
exams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES profiles(id),
  status TEXT NOT NULL CHECK (status IN ('draft', 'published', 'archived')),
  is_public BOOLEAN DEFAULT true,
  access_link TEXT UNIQUE,
  link_expiration TIMESTAMP WITH TIME ZONE,
  randomize_order BOOLEAN DEFAULT false,
  time_limit INTEGER, -- minutos (NULL = sin límite)
  question_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)

-- Preguntas
questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('multiple_choice', 'open_ended', 'fill_blank', 'matching')),
  question_text TEXT NOT NULL,
  options JSONB, -- Para multiple choice: ["opt1", "opt2", ...]
  correct_answer JSONB, -- Flexible: índice, texto, array, objeto
  terms JSONB, -- Para matching: [{"term": "X", "definition": "Y"}]
  points INTEGER DEFAULT 10,
  explanation TEXT,
  material_reference TEXT, -- URL o path al material
  order_index INTEGER DEFAULT 0,
  allow_partial_credit BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)

-- Material complementario
materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  file_path TEXT NOT NULL, -- Path en Supabase Storage
  file_type TEXT NOT NULL, -- 'pdf', 'pptx', 'docx', etc.
  uploaded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)

-- Intentos de examen
exam_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  score NUMERIC DEFAULT 0,
  max_score NUMERIC DEFAULT 0,
  percentage NUMERIC DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  time_spent INTEGER, -- segundos
  is_completed BOOLEAN DEFAULT false
)

-- Respuestas individuales
exam_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attempt_id UUID NOT NULL REFERENCES exam_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  user_answer JSONB, -- Flexible para todos los tipos
  is_correct BOOLEAN DEFAULT false,
  score NUMERIC DEFAULT 0,
  feedback TEXT,
  ai_analysis JSONB, -- Metadata del análisis de IA
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)

-- Banco de preguntas (preguntas reutilizables)
question_bank (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_by UUID NOT NULL REFERENCES profiles(id),
  category TEXT,
  tags TEXT[],
  type TEXT NOT NULL,
  question_text TEXT NOT NULL,
  options JSONB,
  correct_answer JSONB,
  points INTEGER DEFAULT 10,
  explanation TEXT,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
```

### Índices para Performance

```sql
CREATE INDEX idx_exams_created_by ON exams(created_by);
CREATE INDEX idx_exams_status ON exams(status);
CREATE INDEX idx_questions_exam_id ON questions(exam_id);
CREATE INDEX idx_exam_attempts_user_id ON exam_attempts(user_id);
CREATE INDEX idx_exam_attempts_exam_id ON exam_attempts(exam_id);
CREATE INDEX idx_exam_answers_attempt_id ON exam_answers(attempt_id);
CREATE INDEX idx_question_bank_created_by ON question_bank(created_by);
CREATE INDEX idx_question_bank_category ON question_bank(category);
```

### Row Level Security (RLS)

```sql
-- Los profesores solo ven sus propios exámenes en modo edición
-- Los estudiantes solo ven exámenes publicados y públicos
-- Los usuarios solo ven sus propios intentos
-- etc.
```

## Funcionalidades Detalladas

### 1. Autenticación y Roles

**Registro:**
- Email + contraseña
- Selección de rol (estudiante/profesor)
- Confirmación por email (Supabase Auth)

**Login:**
- Email + contraseña
- Sesión con JWT
- Redirección según rol

**Roles:**
- `student`: Puede tomar exámenes, ver resultados, historial
- `teacher`: Puede crear/editar exámenes, ver analytics
- `admin`: Todos los permisos (gestión de usuarios, moderación)

### 2. Creación de Exámenes (Profesores)

**Formulario de Examen:**
- Título (obligatorio)
- Descripción
- Estado: draft/published/archived
- Visibilidad: público/privado
- Enlace de acceso (si privado)
- Expiración del enlace (fecha/hora)
- Aleatorizar orden de preguntas
- Límite de tiempo (opcional)
- Material complementario (subir PDFs, presentaciones)

**Agregar Preguntas - Modo Manual:**
- Seleccionar tipo de pregunta
- Formulario específico por tipo
- Asignar puntos
- Agregar explicación
- Vincular con material de referencia

**Tipos de Preguntas:**

1. **Opción Múltiple**
   - 2-6 opciones
   - Una o múltiples respuestas correctas
   - Configurar si permite selección múltiple

2. **Respuesta Abierta**
   - Texto libre
   - Respuesta modelo (para calificación IA)
   - Palabras clave importantes

3. **Rellenar Espacios**
   - Texto con espacios en blanco (marcados con ___)
   - Respuesta correcta por cada espacio
   - Opción: aceptar sinónimos

4. **Emparejar (Matching)**
   - Lista de términos
   - Lista de definiciones
   - Respuestas correctas emparejadas

**Agregar Preguntas - Generación con IA:**

Flujo:
1. Subir PDF/material
2. Seleccionar número de preguntas a generar
3. Seleccionar tipos de preguntas
4. Seleccionar nivel de dificultad (fácil/medio/difícil)
5. IA procesa el material y genera preguntas
6. Profesor revisa y edita preguntas generadas
7. Guardar en el examen

**Banco de Preguntas:**
- Ver preguntas previamente creadas
- Filtrar por categoría/tipo
- Agregar preguntas del banco al examen
- Duplicar y modificar preguntas

### 3. Tomar Exámenes (Estudiantes)

**Vista de Exámenes Disponibles:**
- Lista de exámenes publicados
- Filtros: búsqueda, categoría, dificultad
- Vista previa: título, descripción, # preguntas, tiempo estimado

**Durante el Examen:**
- Mostrar pregunta por pregunta (navegación con botones)
- O mostrar todas en scroll (configurable)
- Barra de progreso
- Timer si hay límite de tiempo
- Marcar preguntas para revisar
- Guardar respuestas automáticamente (cada X segundos)
- Botón "Enviar Examen" (confirmar antes de enviar)

**Renderizado por Tipo de Pregunta:**
- Multiple Choice: Radio buttons o checkboxes
- Open Ended: Textarea grande
- Fill Blank: Inputs inline en el texto
- Matching: Dropdowns o drag & drop

### 4. Calificación y Feedback

**Calificación Automática:**

1. **Preguntas de Opción Múltiple:**
   - Comparación directa con respuesta correcta
   - Puntuación: todo o nada (o partial credit si configurado)

2. **Rellenar Espacios:**
   - Comparación case-insensitive
   - Trim de espacios
   - Opcional: análisis IA para sinónimos

3. **Emparejar:**
   - Contar emparejamientos correctos
   - Puntuación proporcional

4. **Respuestas Abiertas (con IA):**
   - Enviar a Claude API:
     - Pregunta
     - Respuesta del estudiante
     - Respuesta modelo
     - Material de referencia (context)
   - IA retorna:
     - Score (0-100)
     - Feedback detallado
     - Aspectos correctos/incorrectos
     - Sugerencias de mejora
     - Citas del material relevante

**Generación de Feedback:**

Prompt para IA:
```
Evalúa esta respuesta de estudiante:

Pregunta: {question_text}
Respuesta del estudiante: {user_answer}
Respuesta modelo: {model_answer}
Puntos máximos: {max_points}

Material de referencia disponible:
{material_context}

Proporciona:
1. Puntuación (0-{max_points})
2. Feedback constructivo (2-3 párrafos)
3. Aspectos correctos y a mejorar
4. Cita secciones específicas del material que el estudiante debería revisar

Formato JSON:
{
  "score": number,
  "feedback": string,
  "strengths": string[],
  "improvements": string[],
  "references": [
    {"material": string, "section": string, "reason": string}
  ]
}
```

**Pantalla de Resultados:**
- Puntuación total (score/max_score)
- Porcentaje
- Mensaje motivacional según el score
- Desglose por pregunta:
  - Pregunta
  - Tu respuesta
  - Respuesta correcta (si no abierta)
  - Feedback personalizado
  - Links a material de referencia
- Botón "Reintentar Examen"
- Botón "Ver Historial"

### 5. Historial de Intentos

**Vista de Historial:**
- Lista de todos los exámenes tomados
- Por cada examen:
  - Todos los intentos ordenados por fecha
  - Score de cada intento
  - Fecha y hora
  - Tiempo tomado
  - Botón para ver detalles
- Gráfica de progreso (opcional)
- Estadísticas:
  - Promedio general
  - Mejor score
  - Total de intentos
  - Tiempo total estudiando

### 6. Dashboard de Profesor

**Vista General:**
- Lista de mis exámenes
- Filtros: estado, fecha, título
- Estadísticas por examen:
  - # estudiantes que lo han tomado
  - Score promedio
  - Tasa de completitud

**Analytics por Examen:**
- Distribución de calificaciones (histograma)
- Preguntas más difíciles (menor tasa de acierto)
- Tiempo promedio
- Progreso de estudiantes individuales
- Exportar datos a CSV

**Gestión de Exámenes:**
- Crear nuevo
- Editar existente
- Duplicar examen
- Cambiar estado (draft → published → archived)
- Eliminar

## Flujos de Usuario Principales

### Flujo 1: Profesor Crea Examen con IA

```
1. Login como profesor
2. Dashboard → "Crear Examen"
3. Completar información del examen
4. Subir PDF con material
5. Click "Generar Preguntas con IA"
6. Esperar procesamiento (10-30 seg)
7. Revisar preguntas generadas
8. Editar/eliminar preguntas según necesite
9. Agregar preguntas manuales adicionales
10. Guardar como borrador
11. Revisar y publicar
12. Copiar enlace o marcar como público
```

### Flujo 2: Estudiante Toma Examen

```
1. Login como estudiante
2. Dashboard → Ver exámenes disponibles
3. Seleccionar examen
4. Ver descripción y detalles
5. Click "Comenzar Examen"
6. Responder preguntas una por una
7. Click "Enviar Examen"
8. Confirmación → Procesando
9. Ver resultados con feedback IA
10. Revisar cada pregunta con explicación
11. Click "Reintentar" o "Volver"
```

### Flujo 3: Estudiante Revisa Historial

```
1. Dashboard → "Mi Historial"
2. Ver lista de exámenes tomados
3. Seleccionar examen
4. Ver todos los intentos
5. Comparar scores
6. Click en un intento específico
7. Ver detalles completos de ese intento
8. Revisar feedback y material de referencia
```

## Integración con IA (Anthropic Claude)

### Casos de Uso de IA

1. **Generación de Preguntas desde Material**
2. **Calificación de Respuestas Abiertas**
3. **Generación de Feedback Personalizado**
4. **Detección de Similitud Semántica**
5. **Análisis de Progreso del Estudiante** (opcional)

### Manejo de API

**Configuración:**
```javascript
// lib/anthropic.js
const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;

async function callClaude(prompt, options = {}) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: options.maxTokens || 2000,
      messages: [
        { role: 'user', content: prompt }
      ],
      ...options
    })
  });
  
  const data = await response.json();
  return data.content[0].text;
}
```

**Rate Limiting:**
- Implementar cola de requests
- Caché de respuestas frecuentes
- Debounce en generación de feedback
- Mostrar loading states

**Manejo de Errores:**
- Retry con exponential backoff
- Fallback a calificación manual si falla IA
- Mensajes claros al usuario

## Características Avanzadas (Opcionales)

### Nivel 1 (MVP+)
- [ ] Toast notifications (react-hot-toast)
- [ ] Validación con Zod
- [ ] React Query para data fetching
- [ ] Drag & drop para reordenar preguntas
- [ ] Editor de texto rico (Tiptap) para preguntas

### Nivel 2 (Mejorado)
- [ ] Timer con advertencias visuales
- [ ] Sistema de comentarios profesor-estudiante
- [ ] Exportar exámenes a PDF
- [ ] Importar preguntas desde Excel/CSV
- [ ] Modo práctica (ver respuestas inmediatamente)

### Nivel 3 (Avanzado)
- [ ] Analytics dashboard con gráficas (Recharts)
- [ ] Notificaciones push (Supabase Realtime)
- [ ] Gamificación (badges, leaderboard)
- [ ] PWA (modo offline, installable)
- [ ] Tests automatizados (Vitest)

## Mejores Prácticas

### Performance
- Lazy loading de componentes pesados
- Virtualización para listas largas
- Optimistic updates con React Query
- Caché agresivo de preguntas y exámenes
- Code splitting por ruta

### Seguridad
- RLS en todas las tablas
- Validación en frontend y backend
- Sanitización de inputs
- Rate limiting en API calls
- CORS configurado correctamente

### UX
- Loading states en todas las acciones
- Error boundaries
- Feedback visual inmediato
- Confirmaciones para acciones destructivas
- Breadcrumbs para navegación

### Accesibilidad
- Roles ARIA apropiados
- Navegación por teclado
- Contraste WCAG 2.1 AA
- Screen reader friendly
- Focus management

## Testing

### Tests Unitarios
- Funciones de utilidad
- Validadores
- Servicios de grading

### Tests de Integración
- Flujo de creación de examen
- Flujo de tomar examen
- Flujo de calificación

### Tests E2E (opcional)
- Playwright o Cypress
- Flujos críticos de usuario

## Deploy

### Opciones Recomendadas
1. **Vercel** (frontend) + Supabase (backend)
2. **Netlify** (frontend) + Supabase (backend)
3. **Cloudflare Pages** (frontend) + Supabase (backend)

### Variables de Entorno
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_ANTHROPIC_API_KEY=
```

### Build
```bash
npm run build
# Output en dist/
```

## Roadmap de Desarrollo

### Fase 1: Setup y Base (1 semana)
- [ ] Setup inicial del proyecto
- [ ] Configurar Supabase + schema
- [ ] Sistema de autenticación
- [ ] Rutas y navegación básica
- [ ] Componentes UI base

### Fase 2: Core Features (2 semanas)
- [ ] CRUD de exámenes
- [ ] Formularios de preguntas (4 tipos)
- [ ] Vista de tomar examen
- [ ] Sistema de calificación básico
- [ ] Integración con Claude API

### Fase 3: Calificación IA (1 semana)
- [ ] Grading de respuestas abiertas
- [ ] Generación de feedback
- [ ] Citación de material
- [ ] Análisis de similitud

### Fase 4: Features Adicionales (1 semana)
- [ ] Historial de intentos
- [ ] Generación de preguntas con IA
- [ ] Banco de preguntas
- [ ] Analytics básico

### Fase 5: Polish y Deploy (1 semana)
- [ ] Validación completa
- [ ] Error handling
- [ ] Toast notifications
- [ ] Loading states
- [ ] Deploy a producción

## Recursos y Referencias

### Documentación
- React: https://react.dev/
- Supabase: https://supabase.com/docs
- Anthropic API: https://docs.anthropic.com/
- Tailwind: https://tailwindcss.com/docs

### Librerías Útiles
```json
{
  "@supabase/supabase-js": "^2.39.3",
  "@tanstack/react-query": "^5.0.0",
  "react-hook-form": "^7.48.0",
  "zod": "^3.22.0",
  "react-hot-toast": "^2.4.0",
  "zustand": "^4.4.0"
}
```

## Conclusión

Este documento describe un MVP funcional de ExamPro. Claude Code debe usar esta especificación como guía para:

1. Generar el código base del proyecto
2. Implementar componentes según la arquitectura descrita
3. Configurar la base de datos con el schema proporcionado
4. Integrar las APIs de Supabase y Anthropic
5. Implementar los flujos de usuario principales

**Prioridad:** Empezar con el MVP (Fase 1-3) y luego iterar con features adicionales según necesidad.

**Enfoque:** Código limpio, componentes reutilizables, TypeScript types claros, y buena documentación inline.
