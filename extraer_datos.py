import re
import os

input_file = r'c:\Users\ASUS\Desktop\Proyecto_Final\NSG_Cotizador\base-datos\respaldo_antiguo\respaldo_completo.sql'
output_file = r'c:\Users\ASUS\Desktop\Proyecto_Final\NSG_Cotizador\base-datos\respaldo_antiguo\solo_datos.sql'

with open(input_file, 'r', encoding='utf-8') as f:
    lines = f.readlines()

output_lines = []
in_copy_block = False

# Basic configuration needed for PostgreSQL data import
config_patterns = [
    r'^SET statement_timeout',
    r'^SET lock_timeout',
    r'^SET idle_in_transaction_session_timeout',
    r'^SET transaction_timeout',
    r'^SET client_encoding',
    r'^SET standard_conforming_strings',
    r'^SELECT pg_catalog.set_config\(\'search_path\'',
    r'^SET check_function_bodies',
    r'^SET xmloption',
    r'^SET client_min_messages',
    r'^SET row_security',
    r'^SET default_tablespace',
    r'^SET default_table_access_method'
]

for line in lines:
    # Check for configuration lines
    is_config = any(re.match(pattern, line) for pattern in config_patterns)
    if is_config:
        output_lines.append(line)
        continue

    # Check for COPY blocks
    if line.startswith('COPY '):
        in_copy_block = True
        output_lines.append('\n' + line)
        continue
    
    if in_copy_block:
        output_lines.append(line)
        if line.strip() == r'\.':
            in_copy_block = False
        continue

with open(output_file, 'w', encoding='utf-8') as f:
    f.writelines(output_lines)

print(f"Extracción completada. Archivo guardado en: {output_file}")
