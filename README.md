# 💧 Hydraflow Backend
<p align="center">
  <img width="1200" height="400" alt="HydraBanner" src="https://github.com/user-attachments/assets/3ea6c8ba-238d-485c-bd86-dae82c1d92d0" />
</p>

> **El motor detrás de tu hidratación diaria. Una API robusta y de código abierto para el registro de agua y gamificación.**

Este repositorio contiene exclusivamente el **Backend** del proyecto Hydraflow. Se encarga de gestionar la lógica de negocio, la base de datos, la autenticación de usuarios, el registro de consumo de agua y el sistema de logros (gamificación). 

⚠️ **Nota:** Este proyecto se encuentra actualmente en **fase de pruebas (Testing)**. 
👉 *El código del Frontend se encuentra en un repositorio separado [[Repositorio Frontend](https://github.com/JBDev23/hydraflow-app)].*

---

## 📩 Solicitud de Acceso Beta

Si quieres probar la aplicación antes que nadie y ayudarnos a testear su estabilidad, ¡puedes solicitar tu acceso a la beta privada! 

Para unirte, envía un correo electrónico a:
📬 **[jordibarrachinam@gmail.com](mailto:jordibarrachinam@gmail.com)**

*Te agradecemos que indiques en el asunto **"Solicitud Beta Hydraflow"** para que podamos procesar tu petición lo más rápido posible.*

---

## 🚀 Características Principales

* **🔒 Autenticación Segura:** Registro e inicio de sesión de usuarios con tokens de seguridad (JWT).
* **🚰 Registro de Agua:** Endpoints dedicados para añadir, editar y consultar el historial de hidratación diario.
* **🏆 Sistema de Gamificación:** Lógica integrada para desbloquear logros y ganar experiencia conforme cumples tus metas de hidratación.
* **🛍️ Gestión de Ítems:** Sistema de recompensas e inventario para los usuarios.
* **🧪 Cobertura de Pruebas:** Amplia batería de tests utilizando Jest para asegurar la estabilidad de la API durante esta fase beta.

---

## 💻 Tecnologías Utilizadas

Hydraflow Backend está construido bajo un entorno moderno y tipado:

* **Entorno & Lenguaje:** Node.js, TypeScript
* **Base de Datos & ORM:** Prisma
* **Testing:** Jest
* **Despliegue & Contenedores:** Docker, Docker Compose

---

## 📖 Estructura del Proyecto

El código fuente está organizado de la siguiente manera:
* `src/controllers/`: Lógica principal de cada ruta (auth, water, achievements, items, users).
* `src/routes/`: Definición de los endpoints de la API.
* `src/middleware/`: Middlewares de Express (ej. `auth.middleware.ts` para proteger rutas).
* `src/lib/`: Lógica compartida, gamificación y la instancia del cliente Prisma.
* `src/tests/`: Pruebas unitarias y de integración (Jest).
* `prisma/`: Esquema de la base de datos y scripts de seed (datos iniciales).

---

## 🤝 Contribución

¡El proyecto es de código abierto y me encanta recibir ayuda! 

1. Haz un *Fork* del proyecto.
2. Crea tu rama (`git checkout -b feature/NuevaRuta`).
3. Haz *Commit* de tus cambios (`git commit -m 'Añadir nueva ruta para X'`).
4. Asegúrate de que los tests pasen (`npm test`).
5. Haz *Push* a la rama (`git push origin feature/NuevaRuta`).
6. Abre un *Pull Request*.

---

## 📄 Licencia

Este proyecto es de Código Abierto. Consulta el archivo `LICENSE` (si aplica) para más detalles.
