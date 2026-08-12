/* =========================================
   1. BARRERA DE SEGURIDAD Y CERRAR SESIÓN
========================================= */
// Reviso si hay un usuario logueado en la memoria
const usuarioActual = localStorage.getItem('usuario_id');

// Si no hay sesión, lo pateo de regreso al login
if (!usuarioActual) {
    window.location.href = 'login.html';
}

// Configuro el botón de cerrar sesión
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('usuario_id');
        window.location.href = 'login.html';
    });
}


//Lo comento por el momento no pondre el saludo en la barra
/* =========================================
   2. CARGAR EL NOMBRE EN LA BARRA SUPERIOR
========================================= */
// Reutilizo la ruta del dashboard solo para extraer el nombre y pintarlo arriba
/*
const cargarPerfil = async () => {
    try {
        const response = await fetch(`http://127.0.0.1:8000/api/dashboard/${usuarioActual}`);
        if (response.ok) {
            const datos = await response.json();
            const saludoDiv = document.getElementById('user-greeting');
            if (saludoDiv && datos.user_name) {
                const primerNombre = datos.user_name.split(" ")[0];
                saludoDiv.textContent = `Hola, ${primerNombre}`;
            }
        }
    } catch (error) {
        console.error("No se pudo cargar el perfil:", error);
    }
};
// Ejecuto la función inmediatamente
cargarPerfil();
*/


/* =========================================
   3. LÓGICA DE TRANSFERENCIA SPEI
========================================= */
// Atapo los elementos de mi HTML
const transferForm = document.getElementById('transfer-form');
const errorBox = document.getElementById('transfer-error');
const successBox = document.getElementById('transfer-success');
const submitBtn = document.getElementById('submit-transfer-btn');

transferForm.addEventListener('submit', async (evento) => {
    // Evito que la página se recargue al enviar el formulario
    evento.preventDefault();

    // Limpio cualquier mensaje anterior (rojo o verde)
    errorBox.style.display = 'none';
    successBox.style.display = 'none';
    
    // Bloqueo el botón temporalmente para que el usuario no le dé doble clic por accidente
    const textoOriginal = submitBtn.textContent;
    submitBtn.textContent = 'Procesando...';
    submitBtn.disabled = true;

    // Extraigo lo que escribió el usuario. (Convierto el monto a número flotante)
    const clabeInput = document.getElementById('clabe').value;
    const montoInput = parseFloat(document.getElementById('amount').value);
    const conceptoInput = document.getElementById('concept').value;

    try {
        // Hago la petición POST a mi API de Python
        const response = await fetch('http://127.0.0.1:8000/api/transferencia', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                // Aseguro que el ID se mande como número entero (int)
                usuario_id: parseInt(usuarioActual),
                clabe: clabeInput,
                monto: montoInput,
                concepto: conceptoInput
            })
        });

        const datos = await response.json();

        // Si el servidor me rechaza (ej. Fondos insuficientes)
        if (!response.ok) {
            // Lanzo el error específico que programé en FastAPI
            throw new Error(datos.detail || 'Ocurrió un error al transferir');
        }

        // ¡ÉXITO! Muestro la caja verde con el nuevo saldo
        successBox.textContent = `¡Transferencia exitosa! Tu nuevo saldo es de $${datos.nuevo_saldo.toFixed(2)} MXN`;
        successBox.style.display = 'block';
        
        // Limpio el formulario para que quede en blanco otra vez
        transferForm.reset();

    } catch (error) {
        // Si hay error, lo muestro en la caja roja
        errorBox.textContent = error.message;
        errorBox.style.display = 'block';
    } finally {
        // Pase lo que pase (éxito o error), devuelvo el botón a la normalidad
        submitBtn.textContent = textoOriginal;
        submitBtn.disabled = false;
    }
});