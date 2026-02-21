import type { Challenge, ChallengeDifficulty, ChallengeKind, LearningLevel } from '../types';

interface LessonSeed {
  unit: number;
  title: string;
  objective: string;
  theory: string[];
  example: string;
  realWorldUse: string;
  microTheory: string;
  starterCode?: string;
  codes: string[];
}

const kindPattern: ChallengeKind[] = [
  'code',
  'choice',
  'arrange',
  'debug',
  'code',
  'arrange',
  'choice',
  'code',
  'debug',
  'choice',
  'arrange',
  'code',
  'arrange',
  'choice',
  'code'
];

const uniq = (items: string[]) => [...new Set(items)];

const buildChoiceOptions = (target: string) => {
  const fallback = `${target} #`;
  const variants = uniq([
    target,
    target.replace(' = ', ' == '),
    target.replace(/True/g, 'true').replace(/False/g, 'false'),
    target.replace(':', ''),
    target.replace(/'/g, '"'),
    fallback
  ]).filter((v) => v.trim().length > 0);

  return uniq([variants[0], variants[2] ?? fallback, variants[1] ?? fallback, variants[3] ?? fallback]).slice(0, 4);
};

const buildFragments = (target: string) => {
  const tokens = target.split(' ');
  if (tokens.length < 2) return [target];
  return [tokens[1], tokens[0], ...tokens.slice(2)];
};

const buildBuggySnippet = (target: string) => {
  if (/^(if|for|while|def|class)\b.*:$/.test(target)) {
    return target.replace(/:\s*$/, '');
  }

  if (target.includes(' = ') && !target.includes('==')) {
    return target.replace(' = ', ' == ');
  }

  if (target.includes("'")) {
    return target.replace(/'([^']*)'$/, "'$1");
  }

  if (target.includes('"')) {
    return target.replace(/"([^"]*)"$/, '"$1');
  }

  return `${target})`;
};

const contextBaseSnippet: Record<string, string[]> = {
  Ecommerce: ['pedido_id = 1201', 'estado_pedido = "pendiente"'],
  Login: ['usuario = "ana"', 'intentos = 1'],
  Inventario: ['sku = "A-100"', 'stock_actual = 15'],
  Analitica: ['visitas_dia = 380', 'conversion = 0.045'],
  Soporte: ['ticket_id = 902', 'prioridad = "media"'],
  Finanzas: ['saldo = 1250.0', 'impuesto = 0.18'],
  Automatizacion: ['proceso = "backup_nocturno"', 'ejecuciones = 3']
};

const buildCodeTemplate = (target: string, context: string, topic: string) => {
  const base = contextBaseSnippet[context] ?? ['dato_base = 1', 'estado = "ok"'];
  return [
    `# Caso real: ${context}`,
    `# Tema: ${topic}`,
    base[0],
    base[1],
    '__TARGET_LINE__'
  ].join('\n').replace('__TARGET_LINE__', target);
};

const buildCodeStarter = (context: string, topic: string) => {
  const base = contextBaseSnippet[context] ?? ['dato_base = 1', 'estado = "ok"'];
  return [
    `# Caso real: ${context}`,
    `# Tema: ${topic}`,
    base[0],
    base[1],
    '# TODO: completa la linea objetivo'
  ].join('\n');
};

const buildHint = (kind: ChallengeKind, topic: string, context: string, targetCode: string) => {
  if (kind === 'debug') {
    return `Pista 1: revisa la sintaxis de ${topic.toLowerCase()}. Pista 2: compara con la forma valida: ${targetCode}`;
  }
  if (kind === 'arrange') {
    return `Pista: empieza por la palabra clave y luego ordena el resto como en Python real (${context}).`;
  }
  if (kind === 'choice') {
    return `Pista: elige la opcion que respeta exactamente la sintaxis Python para ${topic.toLowerCase()}.`;
  }
  return `Pista 1: usa el contexto ${context}. Pista 2: reemplaza TODO por una linea valida como: ${targetCode}`;
};

const makeChallenges = (seed: LessonSeed): Challenge[] => {
  const contexts = ['Ecommerce', 'Login', 'Inventario', 'Analitica', 'Soporte', 'Finanzas', 'Automatizacion'];
  return seed.codes.slice(0, 14).map((targetCode, idx) => {
    const kind = kindPattern[idx % kindPattern.length];
    const difficulty: ChallengeDifficulty = idx < 4 ? 'basico' : idx < 9 ? 'intermedio' : 'avanzado';
    const realContext = contexts[idx % contexts.length];
    const xpReward =
      difficulty === 'basico'
        ? kind === 'choice'
          ? 4
          : 5
        : difficulty === 'intermedio'
          ? kind === 'debug'
            ? 8
            : 7
          : kind === 'debug'
            ? 11
            : 9;
    const kindPrompt =
      kind === 'choice'
        ? 'Selecciona la opcion correcta para cumplir el requisito.'
        : kind === 'arrange'
          ? 'Ordena los fragmentos para construir una solucion valida.'
          : kind === 'debug'
            ? 'Corrige el error y entrega una version funcional.'
            : 'Escribe el codigo que resuelve el caso.';

    const codeStarter = kind === 'code' ? buildCodeStarter(realContext, seed.title) : seed.starterCode;
    const effectiveTarget = kind === 'code' ? buildCodeTemplate(targetCode, realContext, seed.title) : targetCode;

    return {
      id: idx + 1,
      kind,
      difficulty,
      skillTag: seed.title,
      realContext,
      xpReward,
      microTheory: seed.microTheory,
      prompt: kind === 'debug'
        ? `[${realContext}] ${seed.title}: corrige el error y escribe la version correcta.`
        : kind === 'code'
          ? `[${realContext}] ${seed.title}: modifica el bloque real y reemplaza el TODO con codigo valido.`
          : `[${realContext}] ${seed.title}: ${kindPrompt}`,
      targetCode: effectiveTarget,
      hint: buildHint(kind, seed.title, realContext, targetCode),
      starterCode: kind === 'debug' ? undefined : codeStarter,
      choices: kind === 'choice' ? buildChoiceOptions(targetCode) : undefined,
      fragments: kind === 'arrange' ? buildFragments(targetCode) : undefined,
      buggyCode: kind === 'debug' ? buildBuggySnippet(targetCode) : undefined
    };
  });
};

const commentsCodes = [
  '# comentario simple',
  '# objetivo del bloque',
  '# variable principal',
  '# TODO: validar entrada',
  '# integracion de api',
  '# regla de seguridad',
  '# optimizar bucle',
  '# modulo auth',
  '# caso de prueba',
  '# datos de ejemplo',
  '# bug corregido',
  '# feature premium',
  '# estado de despliegue',
  '# fin del bloque'
];

const variablesCodes = [
  'edad = 25',
  'precio = 19.99',
  "nombre = 'Ana'",
  'activo = True',
  'stock = 40',
  "ciudad = 'Lima'",
  'temperatura = 23.5',
  'usuario_premium = False',
  'puntos = 150',
  "moneda = 'USD'",
  'envio_gratis = True',
  'codigo_postal = 28001',
  "pais = 'Peru'",
  'intento = 1'
];

const stringsCodes = [
  "lenguaje = 'Python'",
  "mensaje = 'Hola Mundo'",
  "saludo = 'Hola'",
  "inicial = 'A'",
  "email = 'ana@email.com'",
  "estado = 'Activo'",
  "rol = 'Admin'",
  "ciudad = 'Quito'",
  "producto = 'Laptop'",
  "idioma = 'Espanol'",
  "etiqueta = 'Oferta'",
  "categoria = 'Basico'",
  "moneda = 'EUR'",
  "titulo = 'Curso Python'"
];

const numbersCodes = [
  'total = 100 + 25',
  'resta = 90 - 40',
  'producto = 7 * 8',
  'division = 20 / 4',
  'entero = 20 // 3',
  'residuo = 20 % 3',
  'potencia = 2 ** 5',
  'promedio = (10 + 20) / 2',
  'impuesto = 200 * 0.18',
  'neto = 500 - 125',
  'doble = 45 * 2',
  'mitad = 90 / 2',
  'saldo = 1000 - 230',
  'total_final = 150 + 35 - 20'
];

const booleansCodes = [
  'activo = True',
  'bloqueado = False',
  'es_mayor = 20 >= 18',
  'tiene_stock = 5 > 0',
  'login_ok = True and True',
  'acceso = True or False',
  'negar = not False',
  'igualdad = 10 == 10',
  'distinto = 10 != 5',
  'premium = True and not False',
  'visible = False or True',
  'valido = 100 >= 0',
  'abierto = 9 < 18',
  'seguro = True and True and True'
];

const listCodes = [
  'numeros = [1, 2, 3]',
  "vocales = ['a', 'e', 'i']",
  'precios = [9.9, 15.0]',
  "estados = ['ok', 'pendiente']",
  'ids = [101, 102, 103]',
  "colores = ['rojo', 'azul']",
  'notas = [18, 15, 20]',
  "meses = ['ene', 'feb', 'mar']",
  'booleans = [True, False]',
  'vacia = []',
  "usuarios = ['ana', 'luis']",
  'niveles = [1, 2, 3, 4]',
  "tags = ['python', 'web']",
  'carritos = [2, 0, 5]'
];

const tupleCodes = [
  'punto = (10, 20)',
  'rgb = (255, 120, 0)',
  'fecha = (2026, 2, 21)',
  "usuario_id = ('ana', 101)",
  'coordenada = (4.5, 2.1)',
  'version = (1, 0, 3)',
  "par = ('clave', 'valor')",
  'size = (1920, 1080)',
  'rango = (1, 10)',
  'vacia = ()',
  'punto3d = (1, 2, 3)',
  "credencial = ('admin', '***')",
  'limites = (0, 100)',
  "endpoint = ('api', 443)"
];

const dictCodes = [
  "usuario = {'nombre': 'Ana'}",
  "config = {'modo': 'dark'}",
  "producto = {'id': 101}",
  "estado = {'activo': True}",
  "precios = {'usd': 20, 'eur': 18}",
  "perfil = {'edad': 25}",
  "stock = {'teclado': 9}",
  "permisos = {'admin': True}",
  'data = {}',
  "alumno = {'nombre': 'Luis', 'nota': 18}",
  "api = {'status': 200}",
  "flags = {'beta': False}",
  "envio = {'gratis': True, 'dias': 2}",
  "cuenta = {'saldo': 1000}"
];

const setCodes = [
  'tags = set(["python", "web"])',
  'ids = set([1, 2, 3])',
  'letras = set(["a", "b"])',
  'activos = set(["ana", "luis"])',
  'vacio = set()',
  'permisos = set(["read", "write"])',
  'colores = set(["rojo", "azul"])',
  'codigos = set([100, 200])',
  'vowels = set(["a","e","i"])',
  'roles = set(["admin","editor"])',
  'online = set([1,4,9])',
  'paises = set(["PE","MX"])',
  'flags = set(["beta","new-ui"])',
  'prioridad = set(["alta","media"])'
];

const ifCodes = [
  'if edad >= 18:',
  'if saldo > 0:',
  "if rol == 'admin':",
  'if stock == 0:',
  'if total >= 50:',
  'if descuento == True:',
  'if len(password) < 8:',
  'if edad < 0:',
  "if plan == 'premium':",
  'if len(items) == 0:',
  'if aprobado == True:',
  'if status != 200:',
  'if cupo > inscritos:',
  'if terminado == False:'
];

const forCodes = [
  'for n in numeros:',
  'for usuario in usuarios:',
  'for i in range(5):',
  'for producto in productos:',
  'for precio in precios:',
  'for letra in nombre:',
  'for item in carrito:',
  'for i in range(1, 5):',
  'for fila in filas:',
  'for email in emails:',
  'for tag in tags:',
  'for pais in paises:',
  'for nota in notas:',
  'for rol in roles:'
];

const whileCodes = [
  'while contador < 10:',
  'while saldo > 0:',
  'while not terminado:',
  'while intentos < max_intentos:',
  'while total < meta:',
  'while activo == True:',
  'while indice < len(items):',
  'while nivel <= 5:',
  'while estado != "done":',
  'while conexion == True:',
  'while retry < 3:',
  'while carga < 100:',
  'while disponible == False:',
  'while cola > 0:'
];

const functionCodes = [
  'def verificar_password(password):',
  'if len(password) < 8:',
  'return False, "Debe tener al menos 8 caracteres."',
  'if password.islower():',
  'return False, "Incluye al menos una mayuscula."',
  'if password.isalpha():',
  'return False, "Incluye al menos un numero."',
  'return True, "Password valida."',
  'def calcular_total_con_iva(subtotal, iva=0.18):',
  'return subtotal + (subtotal * iva)',
  'def normalizar_email(email):',
  'return email.strip().lower()',
  'def crear_usuario(username, password):',
  'return {"username": username, "password_ok": verificar_password(password)[0]}'
];

const functionAdvancedCodes = [
  'def validar_registro(user):',
  "if user.get('email', '').strip() == '':",
  "return False, 'Email requerido'",
  "if '@' not in user['email']:",
  "return False, 'Email invalido'",
  "if len(user.get('password', '')) < 8:",
  "return False, 'Password muy corto'",
  'return True, "Registro valido"',
  'def calcular_descuento(total, cupon=None):',
  "if cupon == 'PROMO10':",
  'return total * 0.90',
  "if cupon == 'PROMO20' and total > 200:",
  'return total * 0.80',
  'return total'
];

const exceptionAdvancedCodes = [
  'try:',
  'cantidad = int(input_cantidad)',
  'precio = float(input_precio)',
  'total = cantidad * precio',
  'except ValueError:',
  'raise ValueError("Cantidad o precio invalidos")',
  'except TypeError:',
  'raise TypeError("Tipo de dato inesperado")',
  'except ZeroDivisionError:',
  'raise ZeroDivisionError("Division por cero detectada")',
  'except KeyError:',
  'raise KeyError("Falta una clave requerida")',
  'finally:',
  'print("Validacion finalizada")'
];

const fileCodes = [
  'archivo = open("datos.txt", "r")',
  'archivo = open("log.txt", "w")',
  'archivo = open("log.txt", "a")',
  'contenido = archivo.read()',
  'archivo.write("hola")',
  'archivo.close()',
  'linea = archivo.readline()',
  'lineas = archivo.readlines()',
  'with open("datos.txt", "r") as f:',
  'archivo = open("foto.png", "rb")',
  'archivo = open("copia.bin", "wb")',
  'archivo.write("linea\\n")',
  'archivo = open("config.ini", "r")',
  'archivo.flush()'
];

const moduleCodes = [
  'import math',
  'import random',
  'import os',
  'import sys',
  'import datetime',
  'import json',
  'import pathlib',
  'import collections',
  'import decimal',
  'import statistics',
  'import typing',
  'import re',
  'import csv',
  'import hashlib'
];

const datetimeCodes = [
  'from datetime import datetime',
  'ahora = datetime.now()',
  'anio = ahora.year',
  'mes = ahora.month',
  'dia = ahora.day',
  'texto = ahora.strftime("%Y-%m-%d")',
  'from datetime import timedelta',
  'manana = ahora + timedelta(days=1)',
  'pasado = ahora - timedelta(days=7)',
  'hora = ahora.hour',
  'minuto = ahora.minute',
  'segundo = ahora.second',
  'iso = ahora.isoformat()',
  'solo_fecha = ahora.date()'
];

const jsonCodes = [
  'import json',
  'texto = json.dumps({"ok": True})',
  'obj = json.loads("{\\"ok\\": true}")',
  'lista_json = json.dumps([1, 2, 3])',
  'usuario_json = json.dumps({"nombre": "Ana"})',
  'estado = json.loads("{\\"status\\": 200}")',
  'bonito = json.dumps({"a": 1}, indent=2)',
  'salida = json.dumps({"pais": "Peru"}, ensure_ascii=False)',
  'ordenado = json.dumps({"b": 1, "a": 2}, sort_keys=True)',
  'items = json.loads("[1,2,3]")',
  'codigo = json.loads("{\\"code\\": 7}")["code"]',
  'bandera = json.dumps({"activo": False})',
  'monto = json.dumps({"total": 99.5})',
  'nested = json.loads("{\\"user\\": {\\"id\\": 1}}")'
];

const testingCodes = [
  'assert 2 + 2 == 4',
  "assert 'py'.upper() == 'PY'",
  'assert len([1, 2, 3]) == 3',
  'assert (5 > 3) is True',
  "assert {'a': 1}['a'] == 1",
  "assert 'x' not in 'python'",
  'assert 10 % 2 == 0',
  'assert round(3.1415, 2) == 3.14',
  "assert 'a,b'.split(',') == ['a', 'b']",
  "assert 'python'.startswith('py')",
  'assert sorted([3, 1, 2]) == [1, 2, 3]',
  'assert min([5, 2, 9]) == 2',
  'assert max([5, 2, 9]) == 9',
  'assert sum([1, 2, 3]) == 6'
];

const testingAdvancedCodes = [
  'assert verificar_password("abc") == (False, "Debe tener al menos 8 caracteres.")',
  'assert verificar_password("password") == (False, "Incluye al menos una mayuscula.")',
  'assert verificar_password("Password") == (False, "Incluye al menos un numero.")',
  'assert verificar_password("Password9")[0] is True',
  'assert calcular_total_con_iva(100) == 118',
  'assert calcular_total_con_iva(200, 0.1) == 220',
  "assert normalizar_email('  ANA@MAIL.COM ') == 'ana@mail.com'",
  "assert validar_registro({'email': ''})[0] is False",
  "assert validar_registro({'email': 'ana@mail.com', 'password': 'Password9'})[0] is True",
  "assert calcular_descuento(100, 'PROMO10') == 90",
  "assert calcular_descuento(300, 'PROMO20') == 240",
  'assert calcular_descuento(80) == 80',
  'assert crear_usuario("ana", "Password9")["password_ok"] is True',
  'assert crear_usuario("ana", "abc")["password_ok"] is False'
];

const finalProjectCodes = [
  'def verificar_password(password):',
  'if len(password) < 8:',
  'return False, "Debe tener al menos 8 caracteres."',
  'if password.islower():',
  'return False, "Incluye al menos una mayuscula."',
  'if password.isalpha():',
  'return False, "Incluye al menos un numero."',
  'return True, "Password valida."',
  'def registrar_usuario(user):',
  'ok, mensaje = verificar_password(user.get("password", ""))',
  'if not ok:',
  'return {"ok": False, "error": mensaje}',
  'return {"ok": True, "username": user.get("username", "").strip().lower()}',
  'assert registrar_usuario({"username":"Ana","password":"Password9"})["ok"] is True'
];

const crudCodes = [
  'def crear_usuario(nombre):',
  'return {"nombre": nombre}',
  'usuarios = []',
  'usuarios.append({"nombre": "Ana"})',
  'total = len(usuarios)',
  'encontrado = [u for u in usuarios if u["nombre"] == "Ana"]',
  'usuarios[0]["activo"] = True',
  'usuarios.pop()',
  'def listar_usuarios():',
  'return usuarios',
  'if nombre == "":',
  'raise ValueError("nombre requerido")',
  'payload = json.dumps(usuarios)',
  'print("CRUD listo")'
];

const oopCodes = [
  'class Usuario:',
  'def __init__(self):',
  'def saludar(self):',
  'self.nombre = nombre',
  'u = Usuario()',
  'u.saludar()',
  'class Producto:',
  'def __init__(self, precio):',
  'self.precio = precio',
  'def total(self, qty):',
  'return self.precio * qty',
  'class Perro(Animal):',
  'super().__init__()',
  'def __str__(self):'
];

const lessonSeeds: LessonSeed[] = [
  { unit: 1, title: 'Comentarios', objective: 'Documentar codigo de forma profesional.', theory: ['Comentario inicia con #.', 'No se ejecuta.', 'Explica decisiones clave.'], example: '# valida login', realWorldUse: 'Mantenimiento en equipo.', microTheory: 'Comentar bien acelera comprensión del código en equipos grandes.', starterCode: '# ', codes: commentsCodes },
  { unit: 1, title: 'Variables', objective: 'Guardar datos en memoria.', theory: ['Nombre + valor.', 'Tipos basicos.', 'Usa nombres claros.'], example: "edad = 25", realWorldUse: 'Perfiles y estados.', microTheory: 'Variables modelan información real del negocio.', starterCode: '', codes: variablesCodes },
  { unit: 1, title: 'Cadenas de Texto', objective: 'Trabajar datos textuales.', theory: ['String entre comillas.', 'Puede tener espacios.', 'Sirve para mensajes.'], example: "saludo = 'Hola'", realWorldUse: 'Chats y formularios.', microTheory: 'Texto bien modelado evita errores de presentación.', starterCode: '', codes: stringsCodes },
  { unit: 1, title: 'Numeros y Operadores', objective: 'Resolver calculos esenciales.', theory: ['+ - * /', '// % **', 'Prioridad con paréntesis.'], example: 'total = precio * cantidad', realWorldUse: 'Facturas y métricas.', microTheory: 'Operaciones numericas son base de lógica financiera.', starterCode: '', codes: numbersCodes },
  { unit: 1, title: 'Booleanos', objective: 'Representar estados verdadero/falso.', theory: ['True/False.', 'and/or/not.', 'Comparaciones devuelven bool.'], example: 'activo = True', realWorldUse: 'Permisos y reglas.', microTheory: 'Booleanos controlan decisiones del flujo.', starterCode: '', codes: booleansCodes },
  { unit: 1, title: 'Listas', objective: 'Agrupar datos ordenados.', theory: ['Usa [].', 'Permite iterar.', 'Acepta tipos mixtos.'], example: 'ids = [1,2,3]', realWorldUse: 'Colecciones de datos.', microTheory: 'Listas son estructura central en Python aplicado.', starterCode: '', codes: listCodes },
  { unit: 2, title: 'Tuplas', objective: 'Usar datos inmutables.', theory: ['Usa ().', 'No cambia.', 'Ideal para pares fijos.'], example: 'punto = (10,20)', realWorldUse: 'Coordenadas y versiones.', microTheory: 'Tuplas ofrecen estabilidad cuando no debe cambiar un valor.', starterCode: '', codes: tupleCodes },
  { unit: 2, title: 'Diccionarios', objective: 'Modelar objetos con clave-valor.', theory: ['Usa {}.', 'Acceso por clave.', 'Muy usado en APIs.'], example: "user = {'name':'Ana'}", realWorldUse: 'Payloads JSON.', microTheory: 'Dict es la estructura más usada para entidades.', starterCode: '', codes: dictCodes },
  { unit: 2, title: 'Sets', objective: 'Gestionar valores unicos.', theory: ['Sin duplicados.', 'Sin orden fijo.', 'Búsqueda rápida.'], example: 'roles = set(["admin"])', realWorldUse: 'Permisos y tags.', microTheory: 'Sets simplifican lógica de pertenencia.', starterCode: '', codes: setCodes },
  { unit: 2, title: 'Condicional if', objective: 'Aplicar decisiones básicas.', theory: ['if evalúa.', 'Comparadores.', 'Control de flujo.'], example: 'if total > 0:', realWorldUse: 'Validaciones.', microTheory: 'if decide si una acción debe ejecutarse.', starterCode: 'if ', codes: ifCodes },
  { unit: 2, title: 'Condicionales Avanzadas', objective: 'Combinar reglas complejas.', theory: ['Múltiples condiciones.', 'Claridad en reglas.', 'Evita lógica ambigua.'], example: 'if premium and total > 50:', realWorldUse: 'Promociones y acceso.', microTheory: 'Reglas compuestas reflejan negocio real.', starterCode: 'if ', codes: ifCodes },
  { unit: 2, title: 'Bucles for', objective: 'Recorrer colecciones.', theory: ['for item in ...', 'range().', 'Iteración controlada.'], example: 'for i in range(5):', realWorldUse: 'Procesamiento masivo.', microTheory: 'for permite automatizar tareas repetitivas.', starterCode: 'for ', codes: forCodes },
  { unit: 3, title: 'Bucles while', objective: 'Repetir con condición.', theory: ['while cond.', 'Actualizar estado.', 'Evitar loops infinitos.'], example: 'while intentos < 3:', realWorldUse: 'Reintentos y polling.', microTheory: 'while depende del estado dinámico del programa.', starterCode: 'while ', codes: whileCodes },
  { unit: 3, title: 'Funciones', objective: 'Reutilizar lógica.', theory: ['Define funciones con `def`.', 'Valida entradas antes de procesar.', 'Devuelve resultados claros con `return`.'], example: 'def verificar_password(password):', realWorldUse: 'Autenticación y seguridad de cuentas.', microTheory: 'Una función bien diseñada resuelve un problema concreto y es fácil de probar.', starterCode: 'def ', codes: functionCodes },
  { unit: 3, title: 'Parametros y Return', objective: 'Diseñar APIs de función.', theory: ['Parámetros de entrada consistentes.', 'Mensajes de error útiles para usuario.', 'Retornos tuple o dict para contexto real.'], example: 'return False, "Debe tener al menos 8 caracteres."', realWorldUse: 'Validaciones en formularios reales.', microTheory: 'Parámetros + retornos correctos permiten reutilizar lógica en frontend y backend.', starterCode: 'def ', codes: functionAdvancedCodes },
  { unit: 3, title: 'Scope de Variables', objective: 'Controlar visibilidad.', theory: ['Ámbito local.', 'Ámbito global.', 'Evita side effects.'], example: 'def fn():', realWorldUse: 'Código escalable.', microTheory: 'Comprender scope evita bugs difíciles.', starterCode: 'def ', codes: functionCodes },
  { unit: 3, title: 'Manejo de Excepciones', objective: 'Hacer apps robustas.', theory: ['Usa `try` para código riesgoso.', 'Captura errores específicos con `except`.', 'Explica el error para poder solucionarlo.'], example: 'except ValueError:', realWorldUse: 'APIs y formularios tolerantes a errores.', microTheory: 'Entender el traceback acelera la depuración y evita fallos en producción.', starterCode: 'try', codes: exceptionAdvancedCodes },
  { unit: 3, title: 'Archivos', objective: 'Leer/escribir persistencia.', theory: ['open.', 'read/write.', 'with open.'], example: 'with open("log.txt", "a") as f:', realWorldUse: 'Logs y reportes.', microTheory: 'Persistir datos es parte central de aplicaciones reales.', starterCode: '', codes: fileCodes },
  { unit: 4, title: 'Modulos e Imports', objective: 'Separar responsabilidades.', theory: ['import.', 'from import.', 'Código modular.'], example: 'import math', realWorldUse: 'Arquitectura mantenible.', microTheory: 'Modularizar reduce acoplamiento y mejora escalabilidad.', starterCode: 'import ', codes: moduleCodes },
  { unit: 4, title: 'Fechas y Tiempo', objective: 'Gestionar tiempo real.', theory: ['datetime.now.', 'strftime.', 'timedelta.'], example: 'ahora = datetime.now()', realWorldUse: 'Reportes y rachas.', microTheory: 'Fecha/hora es esencial en casi todo producto digital.', starterCode: '', codes: datetimeCodes },
  { unit: 4, title: 'Comprensiones', objective: 'Sintaxis compacta profesional.', theory: ['List comprehension.', 'Readable first.', 'Evita exceso de loops.'], example: '[x for x in items]', realWorldUse: 'Transformación de datos.', microTheory: 'Comprensiones hacen código limpio cuando se usan bien.', starterCode: '', codes: listCodes },
  { unit: 4, title: 'Lambda y Funcional', objective: 'Expresiones compactas.', theory: ['lambda rápida.', 'map/filter.', 'Uso moderado.'], example: 'lambda x: x * 2', realWorldUse: 'Pipelines de datos.', microTheory: 'Programación funcional simplifica ciertas transformaciones.', starterCode: '', codes: functionCodes },
  { unit: 4, title: 'POO: Clases', objective: 'Modelar dominio por objetos.', theory: ['class.', '__init__.', 'métodos.'], example: 'class Usuario:', realWorldUse: 'Backends complejos.', microTheory: 'POO ayuda a estructurar sistemas extensos.', starterCode: 'class ', codes: oopCodes },
  { unit: 4, title: 'POO: Herencia', objective: 'Reutilizar comportamiento.', theory: ['Clase base/hija.', 'super().', 'Extensión controlada.'], example: 'class Perro(Animal):', realWorldUse: 'Jerarquías de modelos.', microTheory: 'Herencia evita duplicación en entidades relacionadas.', starterCode: 'class ', codes: oopCodes },
  { unit: 5, title: 'POO: Encapsulacion', objective: 'Proteger estado interno.', theory: ['API pública.', 'Estado interno.', 'Responsabilidad clara.'], example: 'self._saldo = 0', realWorldUse: 'Dominios críticos.', microTheory: 'Encapsular previene usos incorrectos del objeto.', starterCode: 'self.', codes: oopCodes },
  { unit: 5, title: 'JSON y APIs', objective: 'Intercambiar datos entre sistemas.', theory: ['dumps/loads.', 'Estructuras anidadas.', 'Formato estándar.'], example: 'json.dumps(payload)', realWorldUse: 'Frontend/backend.', microTheory: 'JSON es idioma común entre servicios web.', starterCode: '', codes: jsonCodes },
  { unit: 5, title: 'Testing Basico', objective: 'Validar comportamiento.', theory: ['assert.', 'Casos base.', 'Prevención de regresión.'], example: 'assert total > 0', realWorldUse: 'Entrega confiable.', microTheory: 'Sin pruebas, la calidad cae con cada cambio.', starterCode: 'assert ', codes: testingCodes },
  { unit: 5, title: 'Testing Intermedio', objective: 'Aumentar cobertura.', theory: ['Prueba casos felices y de error.', 'Valida mensajes de negocio.', 'Asegura regresión con asserts concretos.'], example: 'assert verificar_password("abc")[0] is False', realWorldUse: 'Integración continua confiable.', microTheory: 'Tests sobre validaciones reales previenen bugs de seguridad y registro.', starterCode: 'assert ', codes: testingAdvancedCodes },
  { unit: 5, title: 'Mini Proyecto CRUD', objective: 'Integrar create/read/update/delete.', theory: ['CRUD completo.', 'Validaciones.', 'Salida serializable.'], example: 'usuarios.append({...})', realWorldUse: 'Sistemas administrativos.', microTheory: 'Un CRUD resume fundamentos de backend.', starterCode: '', codes: crudCodes },
  { unit: 5, title: 'Automatizacion', objective: 'Crear scripts repetibles.', theory: ['Entrada.', 'Proceso.', 'Salida.'], example: 'for fila in filas:', realWorldUse: 'Tareas diarias de negocio.', microTheory: 'Automatizar ahorra tiempo y reduce errores humanos.', starterCode: '', codes: fileCodes },
  { unit: 5, title: 'Proyecto Final', objective: 'Consolidar todo en un caso profesional.', theory: ['Diseña funciones de validación.', 'Maneja errores con mensajes accionables.', 'Cierra con pruebas sobre casos reales.'], example: 'def registrar_usuario(user):', realWorldUse: 'Portafolio orientado a backend real.', microTheory: 'Aquí unes validación, excepciones y pruebas como en un sistema real.', starterCode: 'def ', codes: finalProjectCodes }
];

export const pythonLevels: LearningLevel[] = lessonSeeds.map((seed, idx) => ({
  id: idx + 1,
  unit: seed.unit,
  title: seed.title,
  lesson: {
    objective: seed.objective,
    theory: seed.theory,
    example: seed.example,
    realWorldUse: seed.realWorldUse
  },
  challenges: makeChallenges(seed)
}));
