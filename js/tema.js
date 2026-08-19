// js/tema.js

// 1. Buscamos el botón de cambiar tema en la pantalla actual
const botonTema = document.getElementById('btn-tema');

// 2. Revisamos en la memoria si el usuario ya había elegido el modo oscuro antes
const temaGuardado = localStorage.getItem('modo_oscuro');

// 3. Si en la memoria dice que sí, le ponemos la clase "dark-theme" al body inmediatamente
if (temaGuardado === 'activado') {
    document.body.classList.add('dark-theme');
    if (botonTema) botonTema.innerHTML = '☀️ Modo Claro';
}

// 4. Lógica para cuando el usuario hace clic en el botón
if (botonTema) {
    botonTema.addEventListener('click', () => {
        // Ponemos o quitamos la clase oscura
        document.body.classList.toggle('dark-theme');
        
        // Revisamos si la clase se quedó puesta o no, y guardamos la decisión
        if (document.body.classList.contains('dark-theme')) {
            localStorage.setItem('modo_oscuro', 'activado');
            botonTema.innerHTML = '☀️ Modo Claro';
        } else {
            localStorage.setItem('modo_oscuro', 'desactivado');
            botonTema.innerHTML = '🌙 Modo Oscuro';
        }
    });
}