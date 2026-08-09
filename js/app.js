// Datos simulados (Mock Data) que más adelante vendrán de una API
const accountData = {
    balance: 18500.50,
    cards: [
        { id: 1, type: "Débito", brand: "Visa", last4: "4098", status: "Activa" },
        { id: 2, type: "Crédito", brand: "Mastercard", last4: "8821", status: "Activa" }
    ],
    transactions: [
        { id: 1, date: "2026-08-08", description: "Transferencia SPEI - Juan Pérez", amount: -1500.00, status: "Completado" },
        { id: 2, date: "2026-08-07", description: "Depósito Nómina", amount: 20000.00, status: "Completado" },
        { id: 3, date: "2026-08-05", description: "Pago de Servicios - CFE", amount: -450.00, status: "Procesando" },
        { id: 4, date: "2026-08-02", description: "Compra - Amazon México", amount: -1250.00, status: "Completado" }
    ]
};

// Función para formatear números a moneda (Pesos MXN)
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', { 
        style: 'currency', 
        currency: 'MXN' 
    }).format(amount);
};

// Función principal para renderizar el Dashboard
const renderDashboard = () => {
    // 1. Inyectar el saldo dinámicamente
    const balanceElement = document.getElementById('current-balance');
    balanceElement.textContent = formatCurrency(accountData.balance);

    // 2. Inyectar las tarjetas
    const cardsContainer = document.getElementById('cards-container');
    cardsContainer.innerHTML = ''; // Limpiar el contenedor
    
    accountData.cards.forEach(card => {
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

    // 3. Inyectar los movimientos en la tabla
    const tbody = document.getElementById('transactions-body');
    tbody.innerHTML = ''; 

    accountData.transactions.forEach(tx => {
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

// Ejecutar todo cuando la página termine de cargar
document.addEventListener('DOMContentLoaded', renderDashboard);