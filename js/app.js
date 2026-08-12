/* =========================================
   1. BARRERA DE SEGURIDAD Y CERRAR SESIÓN
========================================= */
// Reviso si el navegador tiene guardado el "gafete" (usuario_id)
const usuarioActual = localStorage.getItem('usuario_id');

// Si no hay gafete, significa que es un intruso o ya cerró sesión.
if (!usuarioActual) {
    window.location.href = 'login.html'; // Lo pateo inmediatamente al login
}

const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        // Destruyo el gafete de seguridad y lo mando al login
        localStorage.removeItem('usuario_id');
        window.location.href = 'login.html';
    });
}

/* =========================================
   2. LÓGICA DEL DASHBOARD
========================================= */
// Borro el objeto estático accountData y creo un estado inicial vacío
let currentAccountData = {};

// Función para formatear números a moneda (Pesos MXN)
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', { 
        style: 'currency', 
        currency: 'MXN' 
    }).format(amount);
};

// Defino mi función asíncrona para consumir mi API real en internet
const fetchBankingData = async () => {
    try {
        // Hago la petición HTTP usando fetch a la URL de mi API
        // ¡OJO AQUÍ! Cambié el '1' por la variable usuarioActual para que sea dinámico
        const response = await fetch(`http://127.0.0.1:8000/api/dashboard/${usuarioActual}`);
        
        // Verifico que el servidor haya respondido bien (Código HTTP 200)
        if (!response.ok) {
            throw new Error('No se pudo conectar con el servidor bancario');
        }

        // Convierto la respuesta de texto a un objeto JSON de JavaScript
        const datosReales = await response.json();
        
        // Guardo los datos que descargué en mi variable de estado
        currentAccountData = datosReales;
        
        // Oculto mi indicador de carga porque ya tengo la información lista
        document.getElementById('loader').style.display = 'none';
        
        // Llamo a mi función para pintar todo en el HTML
        renderDashboard();

    } catch (error) {
        // Si el internet falla o la URL está mal, el código no se rompe, lo atrapo aquí
        console.error("Error al obtener los datos:", error);
        
        // Le aviso al usuario que hubo un problema
        document.getElementById('loader').innerHTML = '<span style="color: red;">Error al cargar tus datos financieros. Intenta más tarde.</span>';
    }
};

// Defino mi función principal para renderizar el Dashboard con los datos descargados
const renderDashboard = () => {
    
    // ==========================================
    // AQUÍ ES DONDE METÍ LA LÓGICA DEL NOMBRE
    // ==========================================
    const saludoDiv = document.getElementById('user-greeting');
    if (saludoDiv && currentAccountData.user_name) {
        // Separo el nombre completo por espacios y agarro solo la primera palabra
        const primerNombre = currentAccountData.user_name.split(" ")[0]; 
        saludoDiv.textContent = `Hola, ${primerNombre}`;
    }
    // ==========================================

    // Inyecto el saldo
    const balanceElement = document.getElementById('current-balance');
    balanceElement.textContent = formatCurrency(currentAccountData.balance);

    // Inyecto las tarjetas
    const cardsContainer = document.getElementById('cards-container');
    cardsContainer.innerHTML = ''; 
    
    currentAccountData.cards.forEach(card => {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'credit-card-item';
        cardDiv.innerHTML = `
            <div class="card-header">
                <span>Tarjeta de ${card.type}</span>
                <strong>${card.brand}</strong>
            </div>
            <div class="card-body">
                <span>**** **** **** ${card.last4}</span>
            </div>
            <div class="card-footer">
                <small>Estado: ${card.status}</small>
            </div>
        `;
        cardsContainer.appendChild(cardDiv);
    });

    // Inyecto los movimientos
    const tbody = document.getElementById('transactions-body');
    tbody.innerHTML = ''; 

    currentAccountData.transactions.forEach(tx => {
        const tr = document.createElement('tr');
        const amountColor = tx.amount < 0 ? '#d32f2f' : '#2e7d32';

        tr.innerHTML = `
            <td>${tx.date}</td>
            <td>${tx.description}</td>
            <td style="color: ${amountColor}; font-weight: bold;">
                ${formatCurrency(tx.amount)}
            </td>
            <td><span style="font-size: 0.9em; padding: 4px 8px; background: #e0e0e0; border-radius: 4px;">${tx.status}</span></td>
        `;
        tbody.appendChild(tr);
    });
    
};

// Cuando la página cargue, en lugar de pintar directo, primero llamo a mi API
document.addEventListener('DOMContentLoaded', fetchBankingData);