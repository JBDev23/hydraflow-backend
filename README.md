# 🚨 REPOSITORIO ARCHIVADO / DEPRECADO 🚨

> **⚠️ ATENCIÓN:** Este repositorio ya no recibe mantenimiento y ha sido **archivado**. 
> Todo el desarrollo de HydraFlow (tanto el Backend como la App móvil) se ha unificado y movido a un nuevo **monorepo**.
> 
> 👉 **Descubre el código actualizado, aporta y abre issues en el nuevo repositorio principal:** 
> ### [🔗 github.com/JBDev23/hydraflow](https://github.com/JBDev23/hydraflow)

---

# 💧 Hydraflow Backend

<p align="center">
  <img width="1200" height="400" alt="HydraBanner" src="https://github.com/user-attachments/assets/3ea6c8ba-238d-485c-bd86-dae82c1d92d0" />
</p>

> **El motor detrás de tu hidratación diaria. Una API robusta y de código abierto para el registro de agua y gamificación.**

Este proyecto contiene el **Backend** de Hydraflow. Se encarga de gestionar la lógica de negocio, la base de datos, la autenticación de usuarios, el registro de consumo de agua y el sistema de logros (gamificación).

⚠️ **Nota:** El proyecto se encuentra en **fase de pruebas (Testing)**.  
👉 _Actualmente el código forma parte del monorepo principal: [JBDev23/hydraflow](https://github.com/JBDev23/hydraflow)._

---

## 📩 Solicitud de Acceso Beta

Si quieres probar la aplicación antes que nadie y ayudarnos a testear su estabilidad, ¡puedes solicitar tu acceso a la beta privada!

Para unirte, envía un correo electrónico a:
📬 **[jordibarrachinam@gmail.com](mailto:jordibarrachinam@gmail.com)**

_Te agradecemos que indiques en el asunto **"Solicitud Beta Hydraflow"** para que podamos procesar tu petición lo más rápido posible._

---

## 🚀 Características Principales

- **🔒 Autenticación Segura:** Login social con Google (verificación de ID token) + JWT. Login de prueba disponible fuera de producción.
- **🚰 Registro de Agua:** Endpoints para añadir, editar y consultar el historial de hidratación diario.
- **🏆 Sistema de Gamificación:** Logros, experiencia y recompensas al cumplir metas de hidratación.
- **🛍️ Gestión de Ítems:** Inventario y recompensas para personalizar la mascota.
- **🧪 Cobertura de Pruebas:** Tests con Jest y Supertest.

---

## 💻 Tecnologías Utilizadas

- **Entorno & Lenguaje:** Node.js 22+, TypeScript, Express
- **Base de Datos & ORM:** PostgreSQL, Prisma 7 (`@prisma/adapter-pg`)
- **Auth:** `google-auth-library`, JWT
- **Testing:** Jest, Supertest
- **Despliegue & Contenedores:** Docker, Docker Compose
- **Gestor de paquetes:** pnpm

La estructura de `modules/` está preparada para una migración futura a Nest (ver `NEST_MIGRATION.md`).

---

## 📖 Estructura del Proyecto

- `src/modules/`: Lógica de dominio (auth, water, achievements, items, user).
- `src/controllers/`: Adaptadores HTTP delgados sobre los modules.
- `src/routes/`: Definición de los endpoints de la API.
- `src/middleware/`: Middlewares de Express (auth, rate limit, etc.).
- `src/prisma/`: Cliente Prisma y `PrismaService`.
- `src/lib/`: Utilidades compartidas (JWT, gamificación, preferencias, rangos de día).
- `src/tests/`: Pruebas de integración (Jest).
- `prisma/`: Esquema, migraciones y seed.

---

## 🤝 Contribución (Migrado)

¡El proyecto es de código abierto y nos encanta recibir ayuda! Sin embargo, **todo el desarrollo activo ocurre en el monorepo**.

1. Ve al nuevo repositorio: [**JBDev23/hydraflow**](https://github.com/JBDev23/hydraflow).
2. Haz un _Fork_ de ese proyecto.
3. Crea tu rama (`git checkout -b feature/NuevaRuta`).
4. Haz _Commit_ de tus cambios y abre tu _Pull Request_ allí.

*(Por favor, no abras Pull Requests en este repositorio archivado, ya que no serán revisados).*

---

## Checks de CI (local)

Si estás trabajando desde el [nuevo monorepo](https://github.com/JBDev23/hydraflow), puedes ejecutar los checks locales para el backend. Usa las variables de `.env.example` (Postgres local con Docker; no uses `.env.production` ni credenciales de Neon):

```bash
cd hydraflow-backend
docker compose up -d
pnpm install
pnpm prisma:migrate:deploy   # en desarrollo puedes usar prisma:migrate
pnpm format:check && pnpm lint && pnpm build && pnpm test
```

## 📄 Licencia

Este proyecto es de Código Abierto. Consulta el archivo LICENSE en el monorepo principal para más detalles.
