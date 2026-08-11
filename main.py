import os
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pyodbc
import bcrypt
from pydantic import BaseModel

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

# ==========================================
# MODELOS DE DATOS (Contratos para el Front-End)
# ==========================================

# Defino la estructura exacta que mi Front-End me tiene que mandar cuando alguien intente iniciar sesión.
# Uso BaseModel de pydantic para que FastAPI valide automáticamente que sí me mandaron un string en ambos campos.
class LoginRequest(BaseModel):
    email: str
    password: str

# ==========================================
# RUTAS DE LA API (Endpoints)
# ==========================================

@app.post("/api/login")
def iniciar_sesion(credenciales: LoginRequest):
    try:
        # Abro conexión a mi bóveda de datos
        conexion = pyodbc.connect(DB_CONNECTION_STRING)
        cursor = conexion.cursor()

        # 1. Busco si existe un usuario con el correo que me mandaron
        cursor.execute('''
            SELECT UsuarioID, PasswordHash 
            FROM Usuarios 
            WHERE Correo = ?
        ''', credenciales.email)
        
        usuario = cursor.fetchone()
        conexion.close()

        # Si el correo no existe en mi tabla, detengo todo y lanzo error 401 (No Autorizado)
        if not usuario:
            raise HTTPException(status_code=401, detail="Correo o contraseña incorrectos")

        # 2. Extraigo el ID y el hash (el candado) que encontré en la base de datos
        usuario_id = usuario[0]
        hash_guardado = usuario[1]

        # 3. La prueba: Uso bcrypt para comparar la contraseña en texto plano que mandó el front-end, 
        # contra el hash criptográfico guardado.
        # (Es necesario convertir los textos a formato de 'bytes' usando .encode('utf-8') para que bcrypt funcione).
        password_coincide = bcrypt.checkpw(
            credenciales.password.encode('utf-8'), 
            hash_guardado.encode('utf-8')
        )

        # Si la llave no abre el candado, lanzo exactamente el mismo error. 
        # (Por seguridad no digo si falló el correo o falló la contraseña).
        if not password_coincide:
            raise HTTPException(status_code=401, detail="Correo o contraseña incorrectos")

        # Si todo coincide a la perfección, le regreso un mensaje de éxito y, MUY IMPORTANTE, el ID del usuario
        # para que el Front-End sepa qué datos pedir en el dashboard.
        return {
            "mensaje": "Login exitoso",
            "usuario_id": usuario_id
        }

    except HTTPException:
        # Si es un error 401 que yo mismo lancé, lo dejo pasar tal cual hacia el Front-End
        raise
    except Exception as e:
        print("Error en el login:", e)
        raise HTTPException(status_code=500, detail="Error interno del servidor")


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