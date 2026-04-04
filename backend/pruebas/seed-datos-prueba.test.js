/**
 * Tests para el Script de Seed
 * Verifica que los datos de prueba se inserten correctamente
 */

const { pool, ejecutarQuery } = require('../src/configuracion/baseDatos');
const { verificarPassword } = require('../src/servicios/servicioAuth');
const { main: ejecutarSeed } = require('../scripts/seed-datos-prueba');

describe('Seed de Datos de Prueba', () => {
  beforeAll(async () => {
    await ejecutarSeed({ cerrarPool: false });
  });

  afterAll(async () => {
    await pool.end();
  });
  
  describe('Verificación de Administrador', () => {
    test('debe existir el usuario administrador de prueba', async () => {
      const resultado = await ejecutarQuery(
        'SELECT username, nombre_completo FROM administradores WHERE username = $1',
        ['admin@nsg.com']
      );
      
      expect(resultado.rows.length).toBe(1);
      expect(resultado.rows[0].username).toBe('admin@nsg.com');
      expect(resultado.rows[0].nombre_completo).toBe('Administrador NSG');
    });
    
    test('la contraseña del administrador debe ser válida', async () => {
      const resultado = await ejecutarQuery(
        'SELECT password_hash FROM administradores WHERE username = $1',
        ['admin@nsg.com']
      );
      
      expect(resultado.rows.length).toBe(1);
      
      const passwordValido = await verificarPassword(
        'admin123',
        resultado.rows[0].password_hash
      );
      
      expect(passwordValido).toBe(true);
    });
  });
  
  describe('Verificación de Productos', () => {
    test('debe haber productos en todas las categorías requeridas', async () => {
      const categorias = [
        'procesador',
        'placa_madre',
        'ram',
        'almacenamiento',
        'gpu',
        'fuente',
        'case'
      ];
      
      for (const categoria of categorias) {
        const resultado = await ejecutarQuery(
          'SELECT COUNT(*) as total FROM productos WHERE categoria = $1',
          [categoria]
        );
        
        expect(parseInt(resultado.rows[0].total)).toBeGreaterThan(0);
      }
    });
    
    test('debe haber al menos 30 productos en total', async () => {
      const resultado = await ejecutarQuery('SELECT COUNT(*) as total FROM productos');
      
      expect(parseInt(resultado.rows[0].total)).toBeGreaterThanOrEqual(30);
    });
    
    test('los procesadores deben tener socket definido', async () => {
      const resultado = await ejecutarQuery(
        'SELECT nombre, socket FROM productos WHERE categoria = $1',
        ['procesador']
      );
      
      expect(resultado.rows.length).toBeGreaterThan(0);
      
      resultado.rows.forEach(proc => {
        expect(proc.socket).toBeTruthy();
        expect(['LGA1700', 'AM5']).toContain(proc.socket);
      });
    });
    
    test('las placas madre deben tener socket y ram_type definidos', async () => {
      const resultado = await ejecutarQuery(
        'SELECT nombre, socket, ram_type FROM productos WHERE categoria = $1',
        ['placa_madre']
      );
      
      expect(resultado.rows.length).toBeGreaterThan(0);
      
      resultado.rows.forEach(placa => {
        expect(placa.socket).toBeTruthy();
        expect(placa.ram_type).toBeTruthy();
        expect(['LGA1700', 'AM5']).toContain(placa.socket);
        expect(['DDR4', 'DDR5']).toContain(placa.ram_type);
      });
    });
    
    test('la memoria RAM debe tener ram_type definido', async () => {
      const resultado = await ejecutarQuery(
        'SELECT nombre, ram_type FROM productos WHERE categoria = $1',
        ['ram']
      );
      
      expect(resultado.rows.length).toBeGreaterThan(0);
      
      resultado.rows.forEach(ram => {
        expect(ram.ram_type).toBeTruthy();
        expect(['DDR4', 'DDR5']).toContain(ram.ram_type);
      });
    });
    
    test('las GPUs deben tener wattage definido', async () => {
      const resultado = await ejecutarQuery(
        'SELECT nombre, wattage FROM productos WHERE categoria = $1',
        ['gpu']
      );
      
      expect(resultado.rows.length).toBeGreaterThan(0);
      
      resultado.rows.forEach(gpu => {
        expect(gpu.wattage).toBeTruthy();
        expect(gpu.wattage).toBeGreaterThan(0);
      });
    });
    
    test('las fuentes deben tener wattage definido', async () => {
      const resultado = await ejecutarQuery(
        'SELECT nombre, wattage FROM productos WHERE categoria = $1',
        ['fuente']
      );
      
      expect(resultado.rows.length).toBeGreaterThan(0);
      
      resultado.rows.forEach(fuente => {
        expect(fuente.wattage).toBeTruthy();
        expect(fuente.wattage).toBeGreaterThanOrEqual(650);
      });
    });
    
    test('los gabinetes deben tener form_factor definido', async () => {
      const resultado = await ejecutarQuery(
        'SELECT nombre, form_factor FROM productos WHERE categoria = $1',
        ['case']
      );
      
      expect(resultado.rows.length).toBeGreaterThan(0);
      
      resultado.rows.forEach(gabinete => {
        expect(gabinete.form_factor).toBeTruthy();
        expect(['ATX', 'mATX']).toContain(gabinete.form_factor);
      });
    });
  });
  
  describe('Verificación de Stock y Disponibilidad', () => {
    test('todos los productos deben tener precio positivo', async () => {
      const resultado = await ejecutarQuery(
        'SELECT nombre, precio_base FROM productos WHERE precio_base <= 0'
      );
      
      expect(resultado.rows.length).toBe(0);
    });
    
    test('todos los productos deben tener stock no negativo', async () => {
      const resultado = await ejecutarQuery(
        'SELECT nombre, stock FROM productos WHERE stock < 0'
      );
      
      expect(resultado.rows.length).toBe(0);
    });
    
    test('debe haber productos con stock 0 pero disponibles a pedido', async () => {
      const resultado = await ejecutarQuery(
        'SELECT nombre, stock, disponible_a_pedido, tiempo_entrega_dias FROM productos WHERE stock = 0'
      );
      
      expect(resultado.rows.length).toBeGreaterThan(0);
      
      resultado.rows.forEach(prod => {
        expect(prod.disponible_a_pedido).toBe(true);
        expect(prod.tiempo_entrega_dias).toBeGreaterThan(0);
      });
    });
    
    test('productos disponibles a pedido deben tener tiempo de entrega', async () => {
      const resultado = await ejecutarQuery(
        'SELECT nombre, disponible_a_pedido, tiempo_entrega_dias FROM productos WHERE disponible_a_pedido = true'
      );
      
      expect(resultado.rows.length).toBeGreaterThan(0);
      
      resultado.rows.forEach(prod => {
        expect(prod.tiempo_entrega_dias).toBeGreaterThan(0);
      });
    });
  });
  
  describe('Verificación de Compatibilidad', () => {
    test('debe haber procesadores y placas madre con sockets compatibles', async () => {
      // Obtener sockets de procesadores
      const procesadores = await ejecutarQuery(
        'SELECT DISTINCT socket FROM productos WHERE categoria = $1',
        ['procesador']
      );
      
      // Obtener sockets de placas madre
      const placasMadre = await ejecutarQuery(
        'SELECT DISTINCT socket FROM productos WHERE categoria = $1',
        ['placa_madre']
      );
      
      const socketsProcesadores = procesadores.rows.map(r => r.socket);
      const socketsPlacas = placasMadre.rows.map(r => r.socket);
      
      // Verificar que hay al menos un socket en común
      const socketsComunes = socketsProcesadores.filter(s => socketsPlacas.includes(s));
      expect(socketsComunes.length).toBeGreaterThan(0);
    });
    
    test('debe haber RAM y placas madre con tipos compatibles', async () => {
      // Obtener tipos de RAM
      const ram = await ejecutarQuery(
        'SELECT DISTINCT ram_type FROM productos WHERE categoria = $1',
        ['ram']
      );
      
      // Obtener tipos de RAM soportados por placas madre
      const placasMadre = await ejecutarQuery(
        'SELECT DISTINCT ram_type FROM productos WHERE categoria = $1',
        ['placa_madre']
      );
      
      const tiposRAM = ram.rows.map(r => r.ram_type);
      const tiposPlacas = placasMadre.rows.map(r => r.ram_type);
      
      // Verificar que hay al menos un tipo en común
      const tiposComunes = tiposRAM.filter(t => tiposPlacas.includes(t));
      expect(tiposComunes.length).toBeGreaterThan(0);
    });
    
    test('debe haber fuentes con suficiente potencia para las GPUs', async () => {
      // Obtener GPU con mayor consumo
      const gpuMaxima = await ejecutarQuery(
        'SELECT MAX(wattage) as max_wattage FROM productos WHERE categoria = $1',
        ['gpu']
      );
      
      // Obtener fuente con mayor potencia
      const fuenteMaxima = await ejecutarQuery(
        'SELECT MAX(wattage) as max_wattage FROM productos WHERE categoria = $1',
        ['fuente']
      );
      
      const maxGPU = parseInt(gpuMaxima.rows[0].max_wattage);
      const maxFuente = parseInt(fuenteMaxima.rows[0].max_wattage);
      
      // La fuente más potente debe poder alimentar la GPU más potente + sistema
      expect(maxFuente).toBeGreaterThan(maxGPU);
    });
  });
  
  describe('Verificación de Datos Técnicos', () => {
    test('todos los productos deben tener descripción técnica', async () => {
      const resultado = await ejecutarQuery(
        'SELECT nombre FROM productos WHERE descripcion_tecnica IS NULL OR descripcion_tecnica = \'\''
      );
      
      expect(resultado.rows.length).toBe(0);
    });
    
    test('las descripciones técnicas deben ser informativas', async () => {
      const resultado = await ejecutarQuery(
        'SELECT nombre, descripcion_tecnica FROM productos'
      );
      
      resultado.rows.forEach(prod => {
        expect(prod.descripcion_tecnica.length).toBeGreaterThan(20);
      });
    });
  });
});
