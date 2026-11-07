// Vocabulario común de la plataforma: etapas de la metodología, niveles de
// dificultad, habilidades y procedencia de los ejercicios. El esquema del
// contenido (content.config.ts) y la interfaz leen de aquí, así que para
// añadir una habilidad nueva basta con añadirla en este archivo.

/** Las seis etapas de la metodología. Todos los temas siguen este orden. */
export const STAGES = [
	{
		id: 'fenomeno',
		titulo: 'Entiende el fenómeno',
		corto: 'Fenómeno',
		pregunta: '¿Qué está pasando?',
		descripcion: 'Antes de cualquier fórmula: qué ocurre físicamente, con situaciones reales y animaciones.',
	},
	{
		id: 'variables',
		titulo: 'Conoce las variables',
		corto: 'Variables',
		pregunta: '¿Qué medimos?',
		descripcion: 'Qué representa cada magnitud, en qué unidades se mide y qué cambia si la modificas.',
	},
	{
		id: 'ecuaciones',
		titulo: 'Comprende las ecuaciones',
		corto: 'Ecuaciones',
		pregunta: '¿De dónde salen?',
		descripcion: 'Cómo se deducen, qué suponen, cuándo usarlas y, sobre todo, cuándo no.',
	},
	{
		id: 'visualiza',
		titulo: 'Visualiza y experimenta',
		corto: 'Laboratorio',
		pregunta: '¿Qué pasa si…?',
		descripcion: 'Cambia las variables en la simulación y comprueba lo que predicen las ecuaciones.',
	},
	{
		id: 'aplica',
		titulo: 'Aplica: ejemplos guiados',
		corto: 'Ejemplos',
		pregunta: '¿Cómo se plantea?',
		descripcion: 'Problemas típicos resueltos paso a paso, explicando el porqué de cada paso.',
	},
	{
		id: 'practica',
		titulo: 'Practica por tu cuenta',
		corto: 'Práctica',
		pregunta: '¿Sé hacerlo solo?',
		descripcion: 'Ejercicios de dificultad creciente con pistas, corrección y solución explicada.',
	},
] as const;

export type StageId = (typeof STAGES)[number]['id'];
export const STAGE_IDS = STAGES.map((s) => s.id) as [StageId, ...StageId[]];
export const LESSON_STAGE_IDS = STAGE_IDS.filter((s) => s !== 'practica') as [StageId, ...StageId[]];

export const DIFFICULTIES = {
	basico: { label: 'Básico', nivel: 1, descripcion: 'Entender los conceptos y aplicar una ecuación de forma directa.' },
	intermedio: { label: 'Intermedio', nivel: 2, descripcion: 'Combinar conceptos e interpretar la situación física.' },
	avanzado: { label: 'Avanzado', nivel: 3, descripcion: 'Problemas de varios pasos que exigen razonar el planteamiento.' },
	examen: { label: 'Tipo examen', nivel: 4, descripcion: 'Problemas completos como los de los exámenes de 1.º de Bachillerato.' },
} as const;
export type DifficultyId = keyof typeof DIFFICULTIES;
export const DIFFICULTY_IDS = Object.keys(DIFFICULTIES) as [DifficultyId, ...DifficultyId[]];

export const SKILLS = {
	conceptual: { label: 'Comprensión conceptual', corto: 'Conceptos' },
	matematicas: { label: 'Manipulación matemática', corto: 'Matemáticas' },
	unidades: { label: 'Cambio de unidades', corto: 'Unidades' },
	vectores: { label: 'Descomposición vectorial', corto: 'Vectores' },
	graficas: { label: 'Interpretación de gráficas', corto: 'Gráficas' },
	planteamiento: { label: 'Planteamiento del problema', corto: 'Planteamiento' },
	multipaso: { label: 'Razonamiento en varios pasos', corto: 'Varios pasos' },
} as const;
export type SkillId = keyof typeof SKILLS;
export const SKILL_IDS = Object.keys(SKILLS) as [SkillId, ...SkillId[]];

export const ORIGINS = {
	alumno: { label: 'Del cuaderno de clase', descripcion: 'Ejercicio del material del alumno.' },
	original: { label: 'Original', descripcion: 'Creado para esta plataforma.' },
	externo: { label: 'Fuente externa', descripcion: 'Adaptado de un recurso con licencia abierta.' },
} as const;
export type OriginId = keyof typeof ORIGINS;
export const ORIGIN_IDS = Object.keys(ORIGINS) as [OriginId, ...OriginId[]];

export const TOPIC_STATUS = {
	disponible: { label: 'Disponible' },
	proximamente: { label: 'Próximamente' },
} as const;
export type TopicStatus = keyof typeof TOPIC_STATUS;
