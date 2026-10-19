
const { dijkstra, nodoMasCercano } = require('../control/RutaService');
const Nodo = require('../entity/Nodo');
const Arista = require('../entity/Arista');


// Pruebas sobre el Algoritmo Dijkstra

describe('Algoritmo de Dijkstra', () => {
  // Nodos y arista de ejemplo
  const nodos = [
    new Nodo(1, 'A', 0, 0, 'test'),
    new Nodo(2, 'B', 0, 10, 'test'),
    new Nodo(3, 'C', 0, 20, 'test'),
  ];
  const aristas = [
    new Arista(1, 2, 10),
    new Arista(2, 3, 15),
    new Arista(1, 3, 30), 
  ];

  // Camino más corto
  test('Camino más corto desde nodo 1 a nodo 3', () => {
    const resultado = dijkstra(nodos, aristas, 1, 3);
    expect(resultado).not.toBeNull();
    expect(resultado.ruta).toEqual([1, 2, 3]);
    expect(resultado.distanciaTotal).toBe(25); 
  });

  // No hay camino recorrible
  test('No existe un camino entre el nodo 1 y nodo 3 que cumpla los requisitos de peso', () => {
    const aristasAisladas = [new Arista(1, 2, 10)];
    const resultado = dijkstra(nodos, aristasAisladas, 1, 3);
    expect(resultado).toBeNull();
  });

  //Distancia 0
  test('El origen es el mismo que el destino', () => {
    const resultado = dijkstra(nodos, aristas, 2, 2);
    expect(resultado).not.toBeNull();
    expect(resultado.ruta).toEqual([2]);
    expect(resultado.distanciaTotal).toBe(0);
  });

  //No hay nodos
  test('Caso donde no hay nodos', () => {
    const resultado = dijkstra([], [], 1, 2);
    expect(resultado).toBeNull();
  });
});

//Pruebas sobre función nodoMasCecano()
describe('Nodo más cercano', () => {
    
    //Nodos de ejemplo
  const nodos = [
    new Nodo(1, 'A', 0, 0, 'test'),
    new Nodo(2, 'B', 10, 10, 'test'),
    new Nodo(3, 'C', 20, 20, 'test'),
  ];

  //Nodo más cercano
  test('El nodo más cercano al nodo 1', () => {
    const { nodo, distancia } = nodoMasCercano(nodos, 1, 1);
    expect(nodo.id).toBe(1);
    expect(distancia).toBeCloseTo(Math.sqrt(2), 5);
  });

  //Mismo Nodo
  test('El nodo donde se ha seleccionado', () => {
    const { nodo, distancia } = nodoMasCercano(nodos, 10, 10);
    expect(nodo.id).toBe(2);
    expect(distancia).toBe(0);
  });

  // No hay nodos
  test('No se ha seleccionado ningun nodo', () => {
    const resultado = nodoMasCercano([], 5, 5);
    expect(resultado.nodo).toBeNull(); 
  });
});