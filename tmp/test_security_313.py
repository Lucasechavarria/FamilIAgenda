import sys
import os

# Añadir el directorio raíz al path para importar app.security
sys.path.append(os.getcwd())

try:
    from app.security import get_password_hash, verify_password
    
    test_pass = "familia2025!"
    print(f"Probando hashing con pwdlib en Python {sys.version}...")
    
    hashed = get_password_hash(test_pass)
    print(f"Hash generado: {hashed[:30]}...")
    
    matches = verify_password(test_pass, hashed)
    print(f"¿Coincide la contraseña?: {'SÍ ✅' if matches else 'NO ❌'}")
    
    # Probar con contraseña incorrecta
    wrong_matches = verify_password("incorrecta", hashed)
    print(f"¿Rechaza contraseña incorrecta?: {'SÍ ✅' if not wrong_matches else 'NO ❌'}")
    
    if matches and not wrong_matches:
        print("\n¡Migración de seguridad EXITOSA! 🚀")
    else:
        print("\nHubo un problema con la validación de hashes.")
        
except Exception as e:
    print(f"Error durante la prueba: {e}")
