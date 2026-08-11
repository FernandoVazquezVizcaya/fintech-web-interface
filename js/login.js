/* =========================================
        INICIO DE SESIÓN (LOGIN)
========================================= */

// 1. Atajo el formulario de login y la caja de errores usando los ID de mi HTML
const loginForm = document.getElementById('login-form');
const errorMessageDiv = document.getElementById('error-message');

// 2. Escucho cuando el usuario presione el botón de "Iniciar Sesión" (o dé Enter)
loginForm.addEventListener('submit', async function (evento) {
    // Evito que la página se recargue por defecto (comportamiento clásico de HTML)
    evento.preventDefault();

    // Limpio cualquier error viejo que estuviera parpadeando en la pantalla
    errorMessageDiv.style.display = 'none';
    errorMessageDiv.textContent = '';

    // 3. Traigo lo que el usuario escribió en las cajas de texto
    const emailInput = document.getElementById('email').value;
    const passwordInput = document.getElementById('password').value;

    try {
        // 4. Hago una petición HTTP (POST) hacia mi API de Python (FastAPI)
        const respuesta = await fetch('http://127.0.0.1:8000/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            // Convierto los datos a formato JSON plano para mandarlos por la red
            body: JSON.stringify({
                email: emailInput,
                password: passwordInput
            })
        });

        const datos = await respuesta.json();

        // 5. Si el servidor me regresa un error (ej. contraseña incorrecta o 401)
        if (!respuesta.ok) {
            throw new Error(datos.detail || 'Error al iniciar sesión');
        }

        // 6. ¡ÉXITO! El servidor me devolvió el código 200 y el ID del usuario
        // Guardo temporalmente el usuario_id en la memoria del navegador (localStorage) 
        // para que mi dashboard sepa de quién es la cuenta que acaba de entrar
        localStorage.setItem('usuario_id', datos.usuario_id);

        // Redirijo mágicamente al usuario hacia mi página principal (el dashboard)
        window.location.href = 'index.html';

    } catch (error) {
        // Si algo falló, pego el mensaje de error dentro de mi caja roja y la hago visible
        errorMessageDiv.textContent = error.message;
        errorMessageDiv.style.display = 'block';
    }
});