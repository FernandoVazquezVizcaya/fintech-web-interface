import os
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pyodbc

# 1. Cargo las variables secretas de mi archivo .env a la memoria de mi computadora
load_dotenv()

# Inicializo mi API
app = FastAPI(title="Fintech API")

# 2. traigo el origen del .env
origen_permitido = os.getenv("ALLOWED_ORIGIN","")

# Configuro los CORS usando la variable segura
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origen_permitido], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Leo mi cadena de conexión desde el .env sin exponer contraseñas ni servidores en el repo
DB_CONNECTION_STRING = os.getenv("DB_CONNECTION_STRING")

@app.get("/api/dashboard/{usuario_id}")
def obtener_datos_dashboard(usuario_id: int):
    try:
        # Abro la conexión usando la variable que traje del .env
        conexion = pyodbc.connect(DB_CONNECTION_STRING)
        cursor = conexion.cursor()

        # Consulto el saldo
        cursor.execute('''
            SELECT c.Saldo 
            FROM Cuentas c 
            WHERE c.UsuarioID = ?
        ''', usuario_id)
        
        fila_cuenta = cursor.fetchone()
        if not fila_cuenta:
            raise HTTPException(status_code=404, detail="Usuario o cuenta no encontrada")
            
        saldo_actual = float(fila_cuenta[0])

        # Consulto las tarjetas
        cursor.execute('''
            SELECT TarjetaID, Tipo, Marca, Ultimos4, Estado 
            FROM Tarjetas 
            WHERE CuentaID = (SELECT CuentaID FROM Cuentas WHERE UsuarioID = ?)
        ''', usuario_id)
        
        tarjetas = []
        for fila in cursor.fetchall():
            tarjetas.append({
                "id": fila[0],
                "type": fila[1],
                "brand": fila[2],
                "last4": fila[3],
                "status": fila[4]
            })

        # Consulto las transacciones
        cursor.execute('''
            SELECT TransaccionID, Fecha, Descripcion, Monto, Estado 
            FROM Transacciones 
            WHERE CuentaID = (SELECT CuentaID FROM Cuentas WHERE UsuarioID = ?)
            ORDER BY Fecha DESC
        ''', usuario_id)
        
        transacciones = []
        for fila in cursor.fetchall():
            transacciones.append({
                "id": fila[0],
                "date": fila[1].strftime("%Y-%m-%d"), 
                "description": fila[2],
                "amount": float(fila[3]),
                "status": fila[4]
            })

        conexion.close()

        # Devuelvo la información a mi Front-End
        return {
            "balance": saldo_actual,
            "cards": tarjetas,
            "transactions": transacciones
        }

    except Exception as e:
        print("Error en mi conexión a SQL Server:", e)
        raise HTTPException(status_code=500, detail="Error interno del servidor")