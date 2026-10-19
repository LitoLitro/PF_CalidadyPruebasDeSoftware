// test/ruta.test.js
const { dijkstra } = require('../control/RutaService');

describe('Pruebas Unitarias - Lógica de Dijkstra (HU01)', () => {
  
  // Datos simulados (Mock) para no depender de la Base de Datos
  const nodosMock = [
    { id: 1, nombre: 'Origen', x: 0, y: 0 },
    { id: 2, nombre: 'Intermedio', x: 0, y: 10 },
    { id: 3, nombre: 'Destino', x: 0, y: 20 }
  ];

  const aristasMock = [
    { origenId: 1, destinoId: 2, peso: 10 }, // Distancia de 10 metros
    { origenId: 2, destinoId: 3, peso: 15 }, // Distancia de 15 metros
  ];

  test('Debe encontrar la ruta más corta entre el nodo 1 y el nodo 3', () => {
    const resultado = dijkstra(nodosMock, aristasMock, 1, 3);
    
    // Esperamos que haya una ruta
    expect(resultado).not.toBeNull();
    // Esperamos que la ruta pase por los nodos 1 -> 2 -> 3
    expect(resultado.ruta).toEqual([1, 2, 3]);
    // Esperamos que la distancia total sea 10 + 15 = 25
    expect(resultado.distanciaTotal).toBe(25);
  });

  test('Debe retornar null si no hay camino hacia el destino', () => {
    // Supongamos que el nodo 3 está aislado (sin aristas hacia él)
    const aristasAisladas = [
      { origenId: 1, destinoId: 2, peso: 10 }
    ];
    
    const resultado = dijkstra(nodosMock, aristasAisladas, 1, 3);
    
    // Como no hay camino, debe devolver null
    expect(resultado).toBeNull();
  });
});