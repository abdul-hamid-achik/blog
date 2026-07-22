import type { Project } from "./projects";

type ProjectTranslation = Pick<Project, "description" | "longDescription"> &
  Partial<Pick<Project, "features" | "proof" | "stage">>;
type ProjectLocale = "es" | "ru";

export const projectTranslations: Record<
  ProjectLocale,
  Record<string, ProjectTranslation>
> = {
  es: {
    cortex: {
      description:
        "Núcleo de agentes guiado por evidencia para trabajos de software de larga duración",
      longDescription:
        "Un plano de control con prioridad local para agentes de ingeniería de software. Cortex conserva objetivos, evidencia, cambios acotados, resultados de verificación y memoria duradera para que las sesiones prolongadas que usan herramientas sigan siendo inspeccionables y recuperables.",
      proof:
        "Perfil MCP compacto de 17 herramientas · perfil de operador de 24 herramientas",
      features: [
        "Objetivos duraderos, estado de tareas y memoria estructurada",
        "Verificación respaldada por evidencia y cambios acotados",
        "CLI, servidor MCP y Studio interactivo",
        "Operación local con artefactos auditables",
      ],
    },
    bob: {
      description:
        "Fábrica determinista de repositorios para herramientas nativas de agentes",
      longDescription:
        "Convierte un pequeño contrato de producto bob.yaml en un plan de repositorio revisable y después aplica únicamente los archivos cuya propiedad puede demostrar. Bob no utiliza modelos, detecta desviaciones y está diseñado para que las bases generadas sean seguras de revisar y mantener.",
      stage: "Alfa temprana",
      proof:
        "Comprobaciones atómicas de propiedad · 6 herramientas MCP tipadas",
      features: [
        "Planificación del repositorio a partir del contrato bob.yaml",
        "Aplicación atómica bloqueada ante cualquier conflicto de propiedad",
        "Detección de desviaciones en bases generadas dentro de CI",
        "Studio de solo lectura e interfaz MCP tipada",
      ],
    },
    mcphub: {
      description:
        "Una única puerta de enlace local para todos los servidores MCP y entornos de agentes",
      longDescription:
        "Define los servidores MCP una sola vez, expone sus herramientas a través de una única puerta de enlace con espacios de nombres y sincroniza de forma segura la misma configuración con todos los entornos de agentes de programación compatibles. La inteligencia de uso local hace observable la capa invisible de herramientas.",
      stage: "Activo",
      proof:
        "12 entornos de agentes · superficie de gestión diferida con 7 herramientas",
      features: [
        "Una única fuente de verdad para la configuración de servidores MCP",
        "Puerta de enlace con espacios de nombres y descubrimiento diferido",
        "Sincronización segura entre 12 entornos de agentes",
        "Historial de uso, estado y diagnósticos locales",
      ],
    },
    LinkGlow: {
      description:
        "Extensión de navegador para auditoría de enlaces y análisis SEO",
      longDescription:
        "Extensión para Chrome + Firefox que resalta visualmente y clasifica los enlaces internos y externos de cualquier página. Prioriza la privacidad con procesamiento local, sincronización opcional en la nube y funciones impulsadas por IA.",
    },
    hitspec: {
      description: "Herramienta de pruebas de API HTTP basada en archivos",
      longDescription:
        "Escribe pruebas de API como archivos .http sencillos, con 26 operadores de aserción, pruebas de estrés integradas y una interfaz web. Un único binario, listo para CI/CD.",
    },
    "Vue Native": {
      description: "Crea aplicaciones nativas para iOS y Android con Vue 3",
      longDescription:
        "Escribe componentes de Vue 3 que renderizan vistas nativas reales, sin WebView ni concesiones. Compatible con Composition API, más de 20 componentes integrados, módulos nativos, recarga en caliente y desarrollo multiplataforma desde una sola base de código.",
    },
    Blueprint: {
      description: "Lenguaje declarativo para escribir servicios web",
      longDescription:
        "Un lenguaje de programación declarativo que compila archivos .bp en proyectos TypeScript ejecutables. Escribe una especificación y obtén una API funcional basada en Hono, Drizzle y Zod. Sin código repetitivo ni dependencia del proveedor.",
    },
    "Tarot Agent": {
      description: "Lecturas gratuitas de cartas del tarot con IA y Claude",
      longDescription:
        "Obtén lecturas gratuitas de tarot con IA y 6 tipos de tirada: una carta, sí/no, tres cartas, amor, carrera y cruz celta. Incluye ilustraciones personalizadas en pixel art de los Arcanos Mayores e interpretaciones en streaming impulsadas por Claude AI.",
    },
    noted: {
      description: "Base de conocimiento CLI y servidor MCP",
      longDescription:
        "CLI rápida para capturar y organizar notas con etiquetas, búsqueda de texto completo y semántica, y un sistema de memoria para agentes de IA mediante MCP.",
    },
    "noted.nvim": {
      description: "Toma de notas contextual para Neovim",
      longDescription:
        "Plugin para tomar notas con enlaces wiki, notas diarias, captura rápida e integración con Telescope. Las notas viven en una bóveda centralizada accesible desde cualquier proyecto.",
    },
    "haiku.nvim": {
      description: "Autocompletado de código con IA mediante Claude Haiku",
      longDescription:
        "Autocompletado de código inline con texto fantasma impulsado por Claude Haiku. Aceptación progresiva, conocimiento del contexto de LSP/Treesitter y latencia mínima.",
    },
    vecai: {
      description: "Asistente de bases de código impulsado por IA",
      longDescription:
        "Combina la búsqueda semántica de código con la inteligencia de un LLM local mediante Ollama. Haz preguntas sobre tu base de código y recibe respuestas contextuales.",
    },
    veclite: {
      description:
        "Base de datos vectorial integrable con HNSW y búsqueda híbrida",
      longDescription:
        "Base de datos vectorial integrable para Go. Persistencia en un solo archivo, indexación HNSW, búsqueda híbrida (vector + BM25), resultados en streaming, filtrado de metadatos y 55 herramientas MCP. Diseñada para integrarse en otras aplicaciones Go sin dependencias externas en tiempo de ejecución.",
    },
    vecgrep: {
      description: "Búsqueda semántica de código con embeddings vectoriales",
      longDescription:
        "Búsqueda semántica de código con prioridad local, impulsada por embeddings. Indexa tu base de código y busca por significado, no solo por palabras clave. Usa embeddings locales de Ollama de forma predeterminada y admite proveedores en la nube opcionales. Incluye modo híbrido, servidor MCP, interfaz Studio y buscador de código similar.",
    },
    "file.cheap": {
      description:
        "Almacén local de evidencias para archivos generados por agentes",
      longDescription:
        "Guarda, restaura, comprime, indexa, busca y conecta con el código los archivos y carpetas generados por agentes. Un único binario local mantiene accesibles las evidencias voluminosas sin convertir los repositorios en vertederos de artefactos.",
      stage: "Activo",
      proof: "14 herramientas MCP · compresión automática por encima de 10 MB",
      features: [
        "Almacenes locales direccionados por contenido para archivos y carpetas",
        "Compresión, indexación, restauración y búsqueda de evidencia",
        "Vincula los artefactos generados con el código que los produjo",
        "Distribución mediante Homebrew, Debian y go install",
      ],
    },
    tinyvault: {
      description: "Gestión local de secretos con AES-256-GCM y MCP",
      longDescription:
        "Gestor local de secretos extremadamente sencillo para desarrolladores y agentes de IA. Un único binario Go con cifrado AES-256-GCM, derivación de claves Argon2id, secretos versionados con historial y reversión, uso compartido con destinatarios X25519, archivos .env.encrypted seguros para confirmar en Git, interpolación transparente mediante git-filter, agente Unix local para el uso diario sin frase de contraseña, búsqueda relacional, Studio interactivo de terminal, políticas de acceso YAML y 49 herramientas MCP.",
      stage: "Activo",
      proof:
        "49 herramientas MCP · seis objetivos de sistema operativo y arquitectura",
      features: [
        "AES-256-GCM + Argon2id con jerarquía de claves de dos niveles",
        "Secretos versionados, destinatarios X25519 e integración con git-filter",
        "Studio interactivo de terminal (Bubble Tea v2)",
        "49 herramientas MCP con políticas YAML de permisos para agentes de IA",
      ],
    },
    vidtrace: {
      description:
        "Convierte videos de errores en paquetes de evidencia con marcas de tiempo",
      longDescription:
        "CLI Go con prioridad local que toma una grabación de pantalla de un error y produce fotogramas, texto OCR, transcripciones, metadatos y una línea de tiempo que conecta lo visible con lo dicho. Diseñada para ingenieros de QA, desarrolladores y agentes de programación que no pueden ver directamente un video, pero sí inspeccionar archivos y JSON.",
    },
    cairntrace: {
      description:
        "Ejecutor de especificaciones de comportamiento del navegador para agentes de programación",
      longDescription:
        "Capa local de especificaciones de comportamiento del navegador para agentes de programación. Las especificaciones definen intención + resultados como contrato de comportamiento y los pasos como indicaciones reparables. La misma especificación puede ejecutarse desde la CLI, a través del servidor MCP o exportarse a Playwright. Captura instantáneas del DOM, capturas de pantalla, consola, red y evidencia de resultados en un único paquete de artefactos legible por agentes.",
      proof:
        "Paquetes de evidencia del navegador · reparación de cambios en localizadores",
      features: [
        "Especificaciones de comportamiento YAML con contratos de intención y resultados",
        "Capturas del DOM, pantalla, consola y red",
        "Servidor MCP y exportación a Playwright desde la misma especificación",
        "Reparación de cambios en localizadores sin alterar el contrato de comportamiento",
      ],
    },
    glyphrun: {
      description:
        "Ejecutor del comportamiento de aplicaciones de terminal con PTY y paquetes de artefactos",
      longDescription:
        "Ejecutor de comportamiento con prioridad local para aplicaciones de terminal. Inicia un comando de destino dentro de una PTY real, lo controla mediante pasos YAML/JSON, evalúa los resultados contra una pantalla de terminal virtual determinista y escribe paquetes de artefactos autocontenidos. Compatibilidad completa con el conjunto de controles xterm, incluidos colores SGR, hipervínculos OSC 8 y entrada de ratón. Se ejecuta en PTY de Unix y Windows ConPTY.",
      stage: "Interfaz v0.1 completa",
      proof: "PTY de Unix + ConPTY de Windows · intercambio con JUnit y BATS",
      features: [
        "Ejecución PTY de caja negra: si funciona en una terminal, glyphrun puede controlarlo",
        "Especificaciones YAML/JSON con hashes de contrato e instantáneas",
        "Grabación, repetición, diferencias entre ejecuciones, importación y exportación BATS y salida JUnit",
        "Servidor MCP por stdio para integrarse con agentes de programación",
      ],
    },
    termina: {
      description:
        "MOBA estratégico por turnos para batallas como las del ajedrez",
      longDescription:
        "Campo de batalla multijugador en línea basado en texto donde la estrategia importa más que los reflejos. Combate 5 contra 5 por turnos en intervalos de 4 segundos, con 18 héroes inspirados en la programación, más de 40 objetos, árboles de talentos, fase de draft, sistema de denegación, recompra, juego de visión y medidas antitrampas con detección de abandonos y cola de baja prioridad.",
    },
    "ClipIt.now": {
      description: "Plataforma de creación de clips de video impulsada por IA",
      longDescription:
        "Transforma videos largos en clips compartibles mediante IA. Sube el material, describe en lenguaje natural qué clips necesitas y recibe segmentos editados profesionalmente en cuestión de minutos. Creada para creadores de contenido, profesionales de marketing y equipos de medios que necesitan producir clips a escala sin edición manual.",
    },
    musicpractice: {
      description:
        "Aplicación de aprendizaje musical con tablatura y reproducción de audio",
      longDescription:
        "Ayuda a los músicos a estructurar su práctica con tablatura interactiva, reproducción de audio y seguimiento del progreso. Creada con Nuxt 4 y potenciada por AlphaTab para renderizar tablaturas con alta fidelidad y Tone.js para la síntesis de audio.",
    },
    reservadoc: {
      description:
        "Plataforma de reserva de documentos con acceso basado en roles",
      longDescription:
        "Plataforma de reserva de documentos para gestionar flujos de trabajo documentales con acceso basado en roles y seguimiento del estado en tiempo real. Creada con Bun, Turborepo, TypeScript y PostgreSQL.",
    },
    blankcode: {
      description:
        "Ejercicios interactivos de programación para rellenar espacios en blanco",
      longDescription:
        "Plataforma de aprendizaje interactiva que enseña programación mediante práctica dirigida. En lugar de ejercicios abiertos, los estudiantes completan fragmentos de código con espacios estratégicamente ocultos, desarrollando memoria muscular para la sintaxis y los patrones. Admite varios lenguajes y cuenta con una biblioteca de ejercicios en crecimiento.",
    },
    "tarot-tcg": {
      description:
        "Juego de cartas táctico que combina el tarot y las mecánicas TCG",
      longDescription:
        "Juego de cartas táctico que combina el simbolismo del tarot con las mecánicas de los juegos de cartas coleccionables. Creado con Next.js 15 y React 19.",
    },
    gpeek: {
      description: "Herramienta de visualización de Git para personas y LLM",
      longDescription:
        "Herramienta de visualización de Git diseñada tanto para personas como para LLM. Salida limpia y analizable del estado y el historial del repositorio.",
    },
    rosewood: {
      description:
        "Editor de código nativo para macOS en Swift y SwiftUI (documentación próximamente)",
      longDescription:
        "Editor de código nativo, ligero, para macOS, creado con Swift y SwiftUI/AppKit. Experiencia de edición similar a VS Code con edición en múltiples pestañas, resaltado de sintaxis para más de 20 lenguajes, integración LSP, depurador DAP, búsqueda en todo el proyecto, paleta de comandos, integración con Git, plegado de código, minimapa y persistencia de sesión. Incluye varios temas, como Nord, GitHub Light y Dracula.",
    },
    "local-agent": {
      description:
        "Agente local de programación para terminal impulsado por Ollama",
      longDescription:
        "Agente de programación para terminal con herramientas sujetas a aprobación, integraciones MCP, objetivos duraderos, consulta a expertos y memoria opcional limitada al espacio de trabajo. Funciona con modelos locales de Ollama y conserva sesiones reanudables en SQLite.",
      stage: "Alfa",
      proof: "Modos NORMAL, PLAN y AUTO · reanudación íntegra desde SQLite",
      features: [
        "100 % local: sin claves API, nube ni datos que salgan del dispositivo",
        "Herramientas sujetas a aprobación y objetivos duraderos y reanudables",
        "Compatibilidad MCP mediante STDIO, SSE y Streamable HTTP",
        "Consulta de expertos Team, Swarm y MoE en modo de solo lectura",
      ],
    },
    teak: {
      description:
        "Editor de código para terminal creado con Go (documentación próximamente)",
      longDescription:
        "Editor de código moderno para terminal con una experiencia similar a VS Code. Edición en múltiples pestañas, resaltado de sintaxis para más de 40 lenguajes mediante Chroma, compatibilidad LSP, barra lateral con árbol de archivos, panel de Git, búsqueda textual y semántica, plugins de Lua, vigilancia de archivos en vivo, deshacer/rehacer inmutable basado en ropes, compatibilidad total con el ratón y tema Nord con más de 30 estilos.",
    },
    monitor: {
      description:
        "Monitor del sistema compatible con agentes para macOS y Linux",
      longDescription:
        "Los mismos datos de ejecución en tiempo real mediante una interfaz de terminal pulida, comandos JSON estables y un servidor MCP. Monitor abarca CPU, memoria, discos, red, sensores, servicios, contenedores y procesos en macOS y Linux.",
      stage: "Activo",
      proof:
        "9 pestañas de Studio · 8 herramientas MCP sensibles a confirmación",
      features: [
        "Datos del sistema en tiempo real mediante interfaces TUI, JSON y MCP",
        "Nueve vistas de Studio con pestañas y minigráficas históricas",
        "Cuatro consultas de solo lectura y cuatro cambios MCP sujetos a confirmación",
        "Control seguro de procesos con protección para procesos del sistema",
      ],
    },
    audeck: {
      description:
        "Gestor TUI de dispositivos de audio para macOS (documentación próximamente)",
      longDescription:
        "Interfaz de terminal para gestionar dispositivos de audio de macOS, creada con Bubble Tea y CoreAudio. Cambia los dispositivos predeterminados, ajusta el volumen y activa o desactiva el silencio, todo desde la terminal. Actualizaciones en tiempo real controladas por eventos, compatibilidad con conexión en caliente, alternativa de volumen por canal para interfaces USB y tema Catppuccin Mocha.",
    },
    manuscrypt: {
      description:
        "Plataforma de escritura de libros con IA para ficción literaria (documentación próximamente)",
      longDescription:
        "Plataforma de escritura de libros impulsada por IA y creada con Nuxt 3. Asistente de escritura consciente del contexto, impulsado por Claude API y con dos niveles de modelo; herramientas colaborativas para personajes y construcción de mundos; editor de texto enriquecido TipTap; gestión de manuscritos con exportación; streaming de IA mediante H3 EventStream; Drizzle ORM con SQLite; y validación Zod.",
    },
    dahdit: {
      description:
        "Aplicación para aprender código Morse al estilo Duolingo (documentación próximamente)",
      longDescription:
        "Aplicación para aprender código Morse con una app nativa para iOS en Swift 6 y SwiftUI, un backend de API Bun/Hono/GraphQL y una aplicación web complementaria en Nuxt. La lógica de dominio compartida en paquetes TypeScript y Swift se mantiene en paridad. Incluye SRS, gamificación con XP/rachas/corazones/desbloqueos, más de 15 logros, modos de desafío, rutas de aprendizaje seleccionadas, Core Haptics y reproducción Morse con CoreAudio.",
    },
    minerva: {
      description:
        "Operador de biblioteca de agentes y CLI/MCP de preparación de stack — minervacli.dev",
      longDescription:
        "Operador de biblioteca y CLI/MCP de preparación de stack para el árbol compartido ~/.agents, creado con Go y Cobra. Gestiona skills y perfiles de agentes en disco (la misma estructura que carga local-agent), genera perfiles a partir de plantillas y sondea herramientas compañeras (bob, cortex, mcphub, codemap, vecgrep) usando nombres binarios reales con verificaciones de salud por niveles. Motor de sugerencias clasificadas, registro de analítica de solo adición, diagnósticos profundos de preparación y un servidor MCP stdio completo.",
    },
  },
  ru: {
    cortex: {
      description:
        "Агентное ядро с опорой на доказательства для длительной работы над ПО",
      longDescription:
        "Локальная система управления агентами для разработки ПО. Cortex сохраняет цели, доказательства, ограниченные изменения, результаты проверок и долговременную память, чтобы продолжительные сессии с использованием инструментов оставались прозрачными и восстанавливаемыми.",
      proof:
        "Компактный MCP-профиль на 17 инструментов · операторский профиль на 24 инструмента",
      features: [
        "Долговременные цели, состояние задач и структурированная память",
        "Проверка на основе доказательств и ограниченные изменения",
        "CLI, MCP-сервер и интерактивная Studio",
        "Локальная работа с проверяемыми артефактами",
      ],
    },
    bob: {
      description:
        "Детерминированная фабрика репозиториев для агентно-ориентированных инструментов",
      longDescription:
        "Преобразует небольшой продуктовый контракт bob.yaml в проверяемый план репозитория, а затем применяет только те файлы, которыми он доказуемо владеет. Bob не зависит от моделей, отслеживает расхождения и помогает создавать сгенерированные основы, которые безопасно проверять и сопровождать.",
      stage: "Ранняя альфа",
      proof: "Атомарная проверка владения · 6 типизированных MCP-инструментов",
      features: [
        "Планирование репозитория на основе контракта bob.yaml",
        "Атомарное применение блокируется при любом конфликте владения",
        "Обнаружение расхождений в сгенерированной основе через CI",
        "Studio только для чтения и типизированный MCP-интерфейс",
      ],
    },
    mcphub: {
      description:
        "Единый локальный шлюз для всех MCP-серверов и агентных сред",
      longDescription:
        "Опишите MCP-серверы один раз, предоставьте их инструменты через единый шлюз с пространствами имён и безопасно синхронизируйте одну и ту же конфигурацию со всеми поддерживаемыми средами программирующих агентов. Локальная аналитика использования делает невидимый инструментальный слой наблюдаемым.",
      stage: "Активен",
      proof:
        "12 агентных сред · отложенная управляющая поверхность из 7 инструментов",
      features: [
        "Единый источник конфигурации MCP-серверов",
        "Шлюз с пространствами имён и отложенным обнаружением инструментов",
        "Безопасная синхронизация между 12 агентными средами",
        "Локальная история использования, состояние и диагностика",
      ],
    },
    LinkGlow: {
      description: "Расширение браузера для аудита ссылок и SEO-анализа",
      longDescription:
        "Расширение для Chrome + Firefox, которое наглядно выделяет и классифицирует внутренние и внешние ссылки на любой странице. Конфиденциальность прежде всего: локальная обработка, необязательная облачная синхронизация и функции на базе ИИ.",
    },
    hitspec: {
      description: "Фреймворк тестирования HTTP API на основе файлов",
      longDescription:
        "Пишите тесты API в виде обычных файлов .http с 26 операторами утверждений, встроенным нагрузочным тестированием и веб-интерфейсом. Один бинарный файл, готовый к CI/CD.",
    },
    "Vue Native": {
      description: "Создавайте нативные приложения для iOS и Android с Vue 3",
      longDescription:
        "Пишите компоненты Vue 3, которые отображают настоящие нативные представления — без WebView и компромиссов. Поддерживает Composition API, более 20 встроенных компонентов, нативные модули, горячую перезагрузку и кроссплатформенную разработку из единой кодовой базы.",
    },
    Blueprint: {
      description: "Декларативный язык для создания веб-сервисов",
      longDescription:
        "Декларативный язык программирования, который компилирует файлы .bp в запускаемые проекты TypeScript. Напишите спецификацию и получите работающий API на базе Hono, Drizzle и Zod. Без шаблонного кода и привязки к поставщику.",
    },
    "Tarot Agent": {
      description: "Бесплатные расклады Таро на базе Claude и ИИ",
      longDescription:
        "Получайте бесплатные расклады Таро с ИИ в 6 форматах: одна карта, да/нет, три карты, любовь, карьера и Кельтский крест. Включает авторские пиксельные иллюстрации Старших Арканов и потоковые толкования на базе Claude AI.",
    },
    noted: {
      description: "База знаний в CLI и MCP-сервер",
      longDescription:
        "Быстрый CLI для сохранения и организации заметок с тегами, полнотекстовым и семантическим поиском, а также системой памяти для ИИ-агентов через MCP.",
    },
    "noted.nvim": {
      description: "Контекстные заметки для Neovim",
      longDescription:
        "Плагин для заметок с вики-ссылками, ежедневными записями, быстрым сохранением и интеграцией с Telescope. Заметки хранятся в централизованном хранилище, доступном из любого проекта.",
    },
    "haiku.nvim": {
      description: "Дополнение кода с ИИ на базе Claude Haiku",
      longDescription:
        "Встроенное дополнение кода в виде текста-подсказки на базе Claude Haiku. Поэтапное принятие, учёт контекста LSP/Treesitter и минимальная задержка.",
    },
    vecai: {
      description: "ИИ-ассистент для кодовой базы",
      longDescription:
        "Объединяет семантический поиск по коду с локальным LLM через Ollama. Задавайте вопросы о своей кодовой базе и получайте ответы с учётом контекста.",
    },
    veclite: {
      description:
        "Встраиваемая векторная база данных с HNSW и гибридным поиском",
      longDescription:
        "Встраиваемая векторная база данных для Go. Хранение в одном файле, индексация HNSW, гибридный поиск (векторы + BM25), потоковая выдача результатов, фильтрация метаданных и 55 инструментов MCP. Предназначена для встраивания в другие приложения Go без внешних зависимостей среды выполнения.",
    },
    vecgrep: {
      description: "Семантический поиск по коду с векторными эмбеддингами",
      longDescription:
        "Локальный семантический поиск по коду на базе эмбеддингов. Индексируйте кодовую базу и ищите по смыслу, а не только по ключевым словам. По умолчанию использует локальные эмбеддинги Ollama, но поддерживает необязательных облачных провайдеров. Включает гибридный режим, MCP-сервер, интерфейс Studio и поиск похожего кода.",
    },
    "file.cheap": {
      description:
        "Локальное хранилище доказательств для файлов, созданных агентами",
      longDescription:
        "Сохраняйте, восстанавливайте, сжимайте, индексируйте, ищите и связывайте с кодом файлы и папки, созданные агентами. Один локальный бинарный файл сохраняет доступность объёмных доказательств, не превращая репозитории в свалки артефактов.",
      stage: "Активен",
      proof: "14 MCP-инструментов · автоматическое сжатие свыше 10 МБ",
      features: [
        "Локальные хранилища файлов и папок с адресацией по содержимому",
        "Сжатие, индексация, восстановление и поиск доказательств",
        "Связь созданных артефактов с породившим их кодом",
        "Распространение через Homebrew, Debian и go install",
      ],
    },
    tinyvault: {
      description: "Локальное управление секретами с AES-256-GCM и MCP",
      longDescription:
        "Предельно простой локальный менеджер секретов для разработчиков и ИИ-агентов. Один бинарный файл Go с шифрованием AES-256-GCM, выводом ключей Argon2id, версионированием секретов с историей и откатом, передачей получателям X25519, безопасными для коммита файлами .env.encrypted, прозрачной интерполяцией через git-filter, локальным Unix-агентом для повседневной работы без парольной фразы, реляционным поиском, интерактивной терминальной Studio, политиками доступа YAML и 49 инструментами MCP.",
      stage: "Активен",
      proof: "49 MCP-инструментов · шесть целевых сочетаний ОС и архитектуры",
      features: [
        "AES-256-GCM + Argon2id с двухуровневой иерархией ключей",
        "Версионирование секретов, получатели X25519 и интеграция git-filter",
        "Интерактивная терминальная Studio (Bubble Tea v2)",
        "49 MCP-инструментов с YAML-политиками доступа для ИИ-агентов",
      ],
    },
    vidtrace: {
      description:
        "Преобразует видео с ошибками в пакеты доказательств с временными метками",
      longDescription:
        "Локальный CLI на Go, который принимает запись экрана с ошибкой и создаёт кадры, распознанный OCR-текст, транскрипции, метаданные и временную шкалу, связывающую увиденное со сказанным. Предназначен для QA-инженеров, разработчиков и программирующих агентов, которые не могут просмотреть видео напрямую, но могут изучать файлы и JSON.",
    },
    cairntrace: {
      description:
        "Средство запуска спецификаций поведения браузера для программирующих агентов",
      longDescription:
        "Локальный слой поведенческих спецификаций браузера для программирующих агентов. Спецификации задают намерение + результаты как контракт поведения, а шаги — как исправляемые подсказки. Одну спецификацию можно запустить из CLI или через MCP-сервер либо экспортировать в Playwright. Снимки DOM, скриншоты, данные консоли и сети, а также доказательства результатов собираются в единый пакет артефактов, понятный агентам.",
      proof:
        "Пакеты браузерных доказательств · восстановление после изменений локаторов",
      features: [
        "Поведенческие YAML-спецификации с контрактами намерений и результатов",
        "Снимки DOM, экрана, консоли и сетевого обмена",
        "MCP-сервер и экспорт в Playwright из одной спецификации",
        "Восстановление после изменений локаторов без изменения контракта поведения",
      ],
    },
    glyphrun: {
      description:
        "Средство запуска поведения терминальных приложений с PTY и пакетами артефактов",
      longDescription:
        "Локальный исполнитель поведенческих сценариев для терминальных приложений. Запускает целевую команду в настоящем PTY, управляет ею с помощью шагов YAML/JSON, сверяет результаты с детерминированным экраном виртуального терминала и создаёт самодостаточные пакеты артефактов. Полностью поддерживает набор управляющих последовательностей xterm, включая цвета SGR, гиперссылки OSC 8 и ввод мышью. Работает с Unix PTY и Windows ConPTY.",
      stage: "Интерфейс v0.1 готов",
      proof: "Unix PTY + Windows ConPTY · обмен с JUnit и BATS",
      features: [
        "Запуск через PTY как чёрный ящик: если приложение работает в терминале, glyphrun может им управлять",
        "Поведенческие спецификации YAML/JSON с хешами контрактов и снимками",
        "Запись, повтор, сравнение запусков, импорт и экспорт BATS и вывод JUnit",
        "MCP-сервер через stdio для интеграции с программирующими агентами",
      ],
    },
    termina: {
      description: "Стратегическая пошаговая MOBA для сражений как в шахматах",
      longDescription:
        "Текстовая многопользовательская онлайновая боевая арена, где стратегия важнее реакции. Пошаговые бои 5 на 5 с четырёхсекундными тактами, 18 героями на тему программирования, более чем 40 предметами, деревьями талантов, фазой драфта, системой добивания своих, выкупом, механикой обзора и защитой от читеров с выявлением покинувших игру и очередью низкого приоритета.",
    },
    "ClipIt.now": {
      description: "Платформа для нарезки видео с помощью ИИ",
      longDescription:
        "Превращайте длинные видео в клипы, которыми удобно делиться, с помощью ИИ. Загрузите материал, опишите нужные фрагменты естественным языком и через несколько минут получите профессионально смонтированные отрезки. Создана для авторов контента, маркетологов и медиакоманд, которым нужно массово выпускать клипы без ручного монтажа.",
    },
    musicpractice: {
      description:
        "Приложение для обучения музыке с табулатурой и воспроизведением аудио",
      longDescription:
        "Помогает музыкантам структурировать занятия с помощью интерактивной табулатуры, воспроизведения аудио и отслеживания прогресса. Создано на Nuxt 4 и использует AlphaTab для высокоточного отображения табулатур и Tone.js для синтеза звука.",
    },
    reservadoc: {
      description: "Платформа резервирования документов с ролевым доступом",
      longDescription:
        "Платформа резервирования документов для управления документооборотом с ролевым доступом и отслеживанием состояния в реальном времени. Создана с использованием Bun, Turborepo, TypeScript и PostgreSQL.",
    },
    blankcode: {
      description:
        "Интерактивные упражнения по программированию с заполнением пропусков",
      longDescription:
        "Интерактивная учебная платформа, которая обучает программированию посредством целенаправленной практики. Вместо открытых заданий учащиеся заполняют специально оставленные пропуски в коде, развивая мышечную память для синтаксиса и паттернов. Поддерживает несколько языков и постоянно пополняемую библиотеку упражнений.",
    },
    "tarot-tcg": {
      description:
        "Тактическая карточная игра, объединяющая Таро и механику TCG",
      longDescription:
        "Тактическая карточная игра, объединяющая символику Таро с механиками коллекционных карточных игр. Создана на Next.js 15 и React 19.",
    },
    gpeek: {
      description: "Инструмент визуализации Git для людей и LLM",
      longDescription:
        "Инструмент визуализации Git, разработанный как для людей, так и для LLM. Чистое, пригодное для разбора представление состояния и истории репозитория.",
    },
    rosewood: {
      description:
        "Нативный редактор кода для macOS на Swift и SwiftUI (документация готовится)",
      longDescription:
        "Лёгкий нативный редактор кода для macOS на Swift и SwiftUI/AppKit. Опыт редактирования в стиле VS Code: несколько вкладок, подсветка синтаксиса для более чем 20 языков, интеграция LSP, отладчик DAP, поиск по всему проекту, палитра команд, интеграция с Git, сворачивание кода, мини-карта и сохранение сессий. Доступно несколько тем, включая Nord, GitHub Light и Dracula.",
    },
    "local-agent": {
      description:
        "Локальный терминальный агент для программирования на базе Ollama",
      longDescription:
        "Терминальный агент для программирования с инструментами, требующими подтверждения, интеграциями MCP, долговременными целями, консультациями экспертов и необязательной памятью в пределах рабочего пространства. Работает с локальными моделями Ollama и хранит возобновляемые сессии в SQLite.",
      stage: "Альфа",
      proof: "Режимы NORMAL, PLAN и AUTO · полное возобновление из SQLite",
      features: [
        "Полностью локально: без API-ключей, облака и передачи данных с устройства",
        "Инструменты с подтверждением и долговременные возобновляемые цели",
        "Поддержка MCP через STDIO, SSE и Streamable HTTP",
        "Консультации экспертов Team, Swarm и MoE только для чтения",
      ],
    },
    teak: {
      description: "Терминальный редактор кода на Go (документация готовится)",
      longDescription:
        "Современный терминальный редактор кода с возможностями в стиле VS Code. Редактирование во вкладках, подсветка синтаксиса для более чем 40 языков через Chroma, поддержка LSP, боковая панель дерева файлов, панель Git, текстовый и семантический поиск, плагины Lua, отслеживание файлов в реальном времени, неизменяемая отмена и повтор на основе rope-структуры, полная поддержка мыши и тема Nord с более чем 30 стилями.",
    },
    monitor: {
      description:
        "Системный монитор для macOS и Linux с интерфейсами для агентов",
      longDescription:
        "Одни и те же данные среды выполнения в реальном времени доступны через продуманный терминальный интерфейс, стабильные JSON-команды и MCP-сервер. Monitor охватывает процессор, память, диски, сеть, датчики, службы, контейнеры и процессы в macOS и Linux.",
      stage: "Активен",
      proof: "9 вкладок Studio · 8 MCP-инструментов с учётом подтверждений",
      features: [
        "Системные данные в реальном времени через интерфейсы TUI, JSON и MCP",
        "Девять вкладок Studio с историческими мини-графиками",
        "Четыре запроса только для чтения и четыре MCP-изменения с подтверждением",
        "Безопасное управление процессами с защитой системных процессов",
      ],
    },
    audeck: {
      description:
        "TUI-менеджер аудиоустройств для macOS (документация готовится)",
      longDescription:
        "Терминальный интерфейс для управления аудиоустройствами macOS, созданный с Bubble Tea и CoreAudio. Переключайте устройства по умолчанию, регулируйте громкость и включайте или выключайте звук прямо из терминала. Обновления в реальном времени по событиям, поддержка горячего подключения, поканальная регулировка громкости для USB-интерфейсов и тема Catppuccin Mocha.",
    },
    manuscrypt: {
      description:
        "Платформа для написания художественных книг с помощью ИИ (документация готовится)",
      longDescription:
        "Платформа для написания книг с ИИ на базе Nuxt 3. Учитывающий контекст ассистент на базе Claude API с двумя уровнями моделей, инструменты совместной разработки персонажей и мира, редактор форматированного текста TipTap, управление рукописями с экспортом, потоковая генерация ИИ через H3 EventStream, Drizzle ORM с SQLite и валидация Zod.",
    },
    dahdit: {
      description:
        "Приложение для изучения азбуки Морзе в стиле Duolingo (документация готовится)",
      longDescription:
        "Приложение для изучения азбуки Морзе с нативным iOS-приложением на Swift 6 и SwiftUI, серверной частью API на Bun/Hono/GraphQL и сопутствующим веб-приложением Nuxt. Общая доменная логика в пакетах TypeScript и Swift поддерживается синхронно. Включает интервальные повторения (SRS), геймификацию с XP, сериями, жизнями и разблокировками, более 15 достижений, режимы испытаний, продуманные учебные маршруты, Core Haptics и воспроизведение азбуки Морзе через CoreAudio.",
    },
    minerva: {
      description:
        "Оператор агентной библиотеки и CLI/MCP проверки готовности стека — minervacli.dev",
      longDescription:
        "Оператор библиотеки и CLI/MCP проверки готовности стека для общего дерева ~/.agents, созданный на Go и Cobra. Управляет навыками и профилями агентов на диске (та же структура, что загружает local-agent), создаёт профили из шаблонов и проверяет сопутствующие инструменты (bob, cortex, mcphub, codemap, vecgrep) по реальным именам бинарников с многоуровневыми проверками состояния. Ранжированный движок рекомендаций, журнал аналитики только на добавление, глубокая диагностика готовности и полноценный MCP-сервер через stdio.",
    },
  },
};

const projectFeatureTranslations: Record<
  ProjectLocale,
  Record<string, string[]>
> = {
  es: {
    LinkGlow: [
      "Clasificación visual de enlaces con resaltados personalizables",
      "Agrupación por dominio y sugerencias impulsadas por IA",
      "Privacidad ante todo, con todo el procesamiento en local",
    ],
    hitspec: [
      "26 operadores de aserción con pruebas de instantáneas",
      "Pruebas de estrés integradas y panel de métricas",
      "Integración CI/CD con GitHub Actions",
    ],
    "Vue Native": [
      "Interfaz nativa real: sin DOM ni WebView",
      "Más de 20 componentes, módulos nativos y navegación",
      "iOS y Android multiplataforma desde una sola base de código",
    ],
    Blueprint: [
      "La sintaxis .bp, centrada en la intención, compila a TypeScript",
      "Genera proyectos con Hono + Drizzle + Zod",
      "Validación, paginación y gestión de errores integradas",
    ],
    "Tarot Agent": [
      "6 tipos de tirada, incluida la cruz celta",
      "Interpretaciones de IA en streaming mediante Claude",
      "Ilustraciones personalizadas en pixel art de los Arcanos Mayores",
    ],
    noted: [
      "Etiquetas y búsqueda semántica y de texto completo",
      "Sistema de memoria con categorías y TTL",
      "12 herramientas MCP para integración con IA",
    ],
    "noted.nvim": [
      "[[enlaces]] estilo wiki con autocompletado",
      "Notas diarias y ventana de captura rápida",
      "Integración con Telescope y nvim-cmp",
    ],
    "haiku.nvim": [
      "Sugerencias inline mediante texto fantasma",
      "Aceptación progresiva por palabra, línea o bloque",
      "Conocimiento del contexto de LSP y Treesitter",
    ],
    vecai: [
      "Búsqueda semántica de código + LLM local",
      "Preguntas y respuestas contextuales sobre la base de código",
      "Funciona sin conexión con modelos de Ollama",
    ],
    veclite: [
      "Indexación HNSW para búsquedas rápidas aproximadas de vecinos cercanos",
      "Búsqueda híbrida que combina similitud vectorial y texto BM25",
      "55 herramientas MCP para integración con agentes de IA",
      "Persistencia en un solo archivo sin dependencias externas en ejecución",
    ],
    vecgrep: [
      "Búsqueda híbrida que combina semántica y palabras clave",
      "Prioridad local mediante Ollama, con proveedores de nube opcionales",
      "Servidor MCP para integrar asistentes de IA",
      "Interfaz Studio, buscador de código similar y diagnósticos de búsqueda",
    ],
    vidtrace: [
      "Extracción de fotogramas, OCR por fotograma y timeline.json unificado",
      "Transcripciones en formatos SRT, VTT, JSON y TSV",
      "Búsqueda de evidencia BM25 de VecLite entre paquetes",
      "Distribución mediante Homebrew y contratos JSON estables para automatización",
    ],
    termina: [
      "18 héroes inspirados en la programación con habilidades distintas",
      "Más de 40 objetos, árboles de talentos y fase de draft serpiente",
      "Antitrampas: detección de abandonos, cola de baja prioridad y validación de estadísticas",
      "Persistencia de estado en Redis con recuperación automática tras reinicios",
    ],
    "ClipIt.now": [
      "Descripción de clips en lenguaje natural",
      "Carga de hasta 2 GB de video",
      "Extracción de segmentos con IA en cuestión de minutos",
    ],
    musicpractice: [
      "Renderizado interactivo de tablatura con AlphaTab",
      "Reproducción y síntesis de audio con Tone.js",
      "Sesiones de práctica estructuradas con seguimiento del progreso",
    ],
    reservadoc: [
      "Control de acceso por roles para flujos documentales",
      "Seguimiento del estado en tiempo real",
      "Arquitectura monorepo con Turborepo",
    ],
    blankcode: [
      "Retos de programación para completar espacios en blanco",
      "Compatibilidad con varios lenguajes",
      "Biblioteca de ejercicios en crecimiento",
    ],
    "tarot-tcg": [
      "El simbolismo del tarot se encuentra con la mecánica TCG",
      "Combate táctico basado en cartas",
    ],
    gpeek: [
      "Salida de Git limpia y fácil de analizar",
      "Diseñado para el uso tanto de personas como de LLM",
    ],
    rosewood: [
      "Edición en varias pestañas con autocompletado y diagnósticos LSP",
      "Depurador DAP con puntos de interrupción y consola de depuración",
      "Integración con Git, estado de rama y vista previa de diferencias",
      "Minimapa interactivo y plegado de código",
    ],
    teak: [
      "Editor con pestañas, LSP, árbol de archivos y panel de Git",
      "Resaltado de sintaxis para más de 40 lenguajes mediante Chroma",
      "Plugins Lua con comandos, atajos y autocmds",
      "Búsqueda semántica mediante integración con vecgrep",
    ],
    audeck: [
      "Cambio de dispositivos de entrada y salida desde la terminal",
      "Actualizaciones en tiempo real mediante listeners de CoreAudio",
      "Conexión en caliente de dispositivos que aparecen y desaparecen",
      "Ajuste de volumen por canal para interfaces de audio USB",
    ],
    manuscrypt: [
      "Asistente de escritura con contexto y streaming en niveles Haiku + Sonnet",
      "Herramientas colaborativas para personajes y construcción de mundos",
      "Editor de texto enriquecido TipTap con gestión de manuscritos",
      "Exportación y recuperación de borradores desde localStorage",
    ],
    dahdit: [
      "Aplicación nativa para iOS en Swift 6 con SwiftUI y SwiftData",
      "API GraphQL con Bun, Hono, Pothos y Drizzle",
      "SRS, XP, rachas, vidas, desbloqueos y más de 15 logros",
      "Reproducción de código Morse mediante Core Haptics y CoreAudio",
    ],
    minerva: [
      "Gestión de skills y perfiles para el árbol compartido ~/.agents",
      "Sondeo de preparación del stack con salud por niveles para bob, cortex y mcphub",
      "Motor de sugerencias clasificadas compartido entre CLI y MCP",
      "Servidor MCP stdio completo para harnesses y MCPHub",
    ],
  },
  ru: {
    LinkGlow: [
      "Наглядная классификация ссылок с настраиваемым выделением",
      "Группировка по доменам и рекомендации на базе ИИ",
      "Конфиденциальность прежде всего: вся обработка выполняется локально",
    ],
    hitspec: [
      "26 операторов утверждений и тестирование снимками",
      "Встроенное нагрузочное тестирование и панель метрик",
      "Интеграция CI/CD через GitHub Actions",
    ],
    "Vue Native": [
      "Настоящий нативный интерфейс — без DOM и WebView",
      "Более 20 компонентов, нативные модули и навигация",
      "iOS и Android из единой кроссплатформенной кодовой базы",
    ],
    Blueprint: [
      "Ориентированный на намерение синтаксис .bp компилируется в TypeScript",
      "Генерация проектов на Hono + Drizzle + Zod",
      "Встроенные валидация, пагинация и обработка ошибок",
    ],
    "Tarot Agent": [
      "6 видов раскладов, включая Кельтский крест",
      "Потоковые ИИ-интерпретации от Claude",
      "Авторские пиксельные иллюстрации Старших Арканов",
    ],
    noted: [
      "Теги, полнотекстовый и семантический поиск",
      "Система памяти с категориями и TTL",
      "12 MCP-инструментов для интеграции с ИИ",
    ],
    "noted.nvim": [
      "[[Ссылки]] в стиле wiki с автодополнением",
      "Ежедневные заметки и окно быстрой записи",
      "Интеграция с Telescope и nvim-cmp",
    ],
    "haiku.nvim": [
      "Встроенные предложения в виде полупрозрачного текста",
      "Поэтапное принятие по слову, строке или блоку",
      "Учёт контекста LSP и Treesitter",
    ],
    vecai: [
      "Семантический поиск по коду + локальная LLM",
      "Контекстные вопросы и ответы о кодовой базе",
      "Автономная работа с моделями Ollama",
    ],
    veclite: [
      "Индексация HNSW для быстрого приближённого поиска ближайших соседей",
      "Гибридный поиск по векторной близости и тексту BM25",
      "55 MCP-инструментов для интеграции с ИИ-агентами",
      "Хранение в одном файле без внешних зависимостей среды выполнения",
    ],
    vecgrep: [
      "Гибридный поиск по смыслу и ключевым словам",
      "Локальная работа через Ollama и необязательные облачные провайдеры",
      "MCP-сервер для интеграции с ИИ-ассистентами",
      "Интерфейс Studio, поиск похожего кода и диагностика поиска",
    ],
    vidtrace: [
      "Извлечение кадров, OCR каждого кадра и единый timeline.json",
      "Транскрипции в форматах SRT, VTT, JSON и TSV",
      "Поиск доказательств BM25 от VecLite по пакетам",
      "Распространение через Homebrew и стабильные JSON-контракты для автоматизации",
    ],
    termina: [
      "18 героев на тему программирования с разными способностями",
      "Более 40 предметов, деревья талантов и змеиный драфт",
      "Защита от читеров: выявление вышедших игроков, очередь низкого приоритета и проверка статистики",
      "Хранение состояния в Redis с автоматическим восстановлением после перезапуска",
    ],
    "ClipIt.now": [
      "Описание нужных клипов на естественном языке",
      "Загрузка видео объёмом до 2 ГБ",
      "Извлечение фрагментов с помощью ИИ за считаные минуты",
    ],
    musicpractice: [
      "Интерактивное отображение табулатуры через AlphaTab",
      "Воспроизведение и синтез звука через Tone.js",
      "Структурированные занятия с отслеживанием прогресса",
    ],
    reservadoc: [
      "Ролевое управление доступом к документообороту",
      "Отслеживание состояния в реальном времени",
      "Архитектура монорепозитория на Turborepo",
    ],
    blankcode: [
      "Задачи по программированию с заполнением пропусков",
      "Поддержка нескольких языков",
      "Растущая библиотека упражнений",
    ],
    "tarot-tcg": [
      "Символика Таро встречается с механикой TCG",
      "Тактические карточные сражения",
    ],
    gpeek: [
      "Чистый и пригодный для разбора вывод Git",
      "Спроектирован и для людей, и для LLM",
    ],
    rosewood: [
      "Редактирование во вкладках с автодополнением и диагностикой LSP",
      "Отладчик DAP с точками останова и консолью",
      "Интеграция с Git, состояние ветки и предпросмотр различий",
      "Интерактивная мини-карта и сворачивание кода",
    ],
    teak: [
      "Редактор с вкладками, LSP, деревом файлов и панелью Git",
      "Подсветка синтаксиса для более чем 40 языков через Chroma",
      "Плагины Lua с командами, сочетаниями клавиш и autocmd",
      "Семантический поиск через интеграцию с vecgrep",
    ],
    audeck: [
      "Переключение устройств ввода и вывода из терминала",
      "Обновления в реальном времени через наблюдатели CoreAudio",
      "Горячее подключение появляющихся и исчезающих устройств",
      "Поканальная регулировка громкости для USB-аудиоинтерфейсов",
    ],
    manuscrypt: [
      "Контекстный потоковый ИИ-помощник с уровнями Haiku + Sonnet",
      "Совместные инструменты для персонажей и построения мира",
      "Редактор форматированного текста TipTap с управлением рукописью",
      "Экспорт и восстановление черновиков из localStorage",
    ],
    dahdit: [
      "Нативное iOS-приложение на Swift 6 с SwiftUI и SwiftData",
      "GraphQL API на Bun, Hono, Pothos и Drizzle",
      "Интервальные повторения, XP, серии, жизни, разблокировки и более 15 достижений",
      "Воспроизведение азбуки Морзе через Core Haptics и CoreAudio",
    ],
    minerva: [
      "Управление навыками и профилями в общем дереве ~/.agents",
      "Проверка готовности стека с многоуровневым состоянием для bob, cortex и mcphub",
      "Ранжированный движок рекомендаций, общий для CLI и MCP",
      "Полноценный MCP-сервер через stdio для сред и MCPHub",
    ],
  },
};

export function localizeProjects(
  projects: Project[],
  locale: string,
): Project[] {
  const language = locale.toLowerCase().split(/[-_]/, 1)[0];

  if (language !== "es" && language !== "ru") {
    return projects;
  }

  const translations = projectTranslations[language];

  return projects.map((project) => {
    const translation = translations[project.name];
    const features =
      projectFeatureTranslations[language][project.name] ??
      translation?.features;

    if (!translation && !features) return project;

    return {
      ...project,
      ...translation,
      ...(features ? { features } : {}),
    };
  });
}
