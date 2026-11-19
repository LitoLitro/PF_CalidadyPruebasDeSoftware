/*
  MiMundoUPN - Cambios de base de datos (rama JorgeLuis)
  - Tabla ARISTA: conexiones del grafo con su peso (metros) para Dijkstra.
  - Distribucion del campus: Patio al centro, pabellones al norte/este/oeste,
    Entrada Principal al sur. (x = longitud, y = latitud; y crece hacia el sur)
  - Horarios de atencion de ejemplo (HORA_ATENCION).
  - Usuario administrador de prueba (admin@upn.edu.pe / Admin1234, bcrypt).
  Script idempotente: se puede ejecutar varias veces.
*/
USE [BDGeolo]
GO

/* ---------- 1. Tabla ARISTA ---------- */
IF OBJECT_ID('dbo.ARISTA', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.ARISTA (
        aristaId  INT NOT NULL CONSTRAINT PK_ARISTA PRIMARY KEY,
        origenId  INT NOT NULL CONSTRAINT FK_ARISTA_ORIGEN  REFERENCES dbo.ESPACIO(espacioId),
        destinoId INT NOT NULL CONSTRAINT FK_ARISTA_DESTINO REFERENCES dbo.ESPACIO(espacioId),
        peso      INT NOT NULL CONSTRAINT CK_ARISTA_PESO CHECK (peso > 0),
        estado    BIT NOT NULL CONSTRAINT DF_ARISTA_ESTADO DEFAULT (1),
        CONSTRAINT CK_ARISTA_DISTINTOS CHECK (origenId <> destinoId)
    );
END
GO

/* ---------- 2. Distribucion del campus ---------- */
-- Pabellones: A oeste, B y C norte, D y E este
UPDATE dbo.PABELLON SET longitud = 14, latitud = 35 WHERE pabellonId = 1; -- A
UPDATE dbo.PABELLON SET longitud = 37, latitud =  9 WHERE pabellonId = 2; -- B
UPDATE dbo.PABELLON SET longitud = 64, latitud =  9 WHERE pabellonId = 3; -- C
UPDATE dbo.PABELLON SET longitud = 86, latitud = 17 WHERE pabellonId = 4; -- D
UPDATE dbo.PABELLON SET longitud = 86, latitud = 47 WHERE pabellonId = 5; -- E

UPDATE dbo.ESPACIO SET longitud = 14, latitud = 28 WHERE espacioId = 1;  -- A101
UPDATE dbo.ESPACIO SET longitud = 14, latitud = 42 WHERE espacioId = 2;  -- A102
UPDATE dbo.ESPACIO SET longitud = 29, latitud = 10 WHERE espacioId = 3;  -- B101
UPDATE dbo.ESPACIO SET longitud = 37, latitud = 10 WHERE espacioId = 4;  -- B102
UPDATE dbo.ESPACIO SET longitud = 45, latitud = 10 WHERE espacioId = 5;  -- B103
UPDATE dbo.ESPACIO SET longitud = 64, latitud = 10 WHERE espacioId = 6;  -- C101
UPDATE dbo.ESPACIO SET longitud = 81, latitud = 15 WHERE espacioId = 7;  -- D101
UPDATE dbo.ESPACIO SET longitud = 91, latitud = 15 WHERE espacioId = 8;  -- D102
UPDATE dbo.ESPACIO SET longitud = 81, latitud = 40 WHERE espacioId = 9;  -- E101
UPDATE dbo.ESPACIO SET longitud = 91, latitud = 40 WHERE espacioId = 10; -- E102
UPDATE dbo.ESPACIO SET longitud = 81, latitud = 53 WHERE espacioId = 11; -- E103
UPDATE dbo.ESPACIO SET longitud = 91, latitud = 53 WHERE espacioId = 12; -- E104
UPDATE dbo.ESPACIO SET longitud = 50, latitud = 35 WHERE espacioId = 13; -- Patio Central
UPDATE dbo.ESPACIO SET longitud = 50, latitud = 68 WHERE espacioId = 14; -- Entrada Principal
GO

/* ---------- 3. Aristas iniciales ----------
   Mismo grafo que antes generaba el codigo: cada ambiente conectado al Patio
   Central (la Entrada tambien). Peso = distancia euclidiana * 2 m/unidad. */
IF NOT EXISTS (SELECT 1 FROM dbo.ARISTA)
BEGIN
    INSERT INTO dbo.ARISTA (aristaId, origenId, destinoId, peso, estado)
    SELECT
        ROW_NUMBER() OVER (ORDER BY e.espacioId),
        p.espacioId,
        e.espacioId,
        CAST(ROUND(SQRT(SQUARE(e.longitud - p.longitud) + SQUARE(e.latitud - p.latitud)) * 2, 0) AS INT),
        1
    FROM dbo.ESPACIO e
    CROSS JOIN (SELECT espacioId, longitud, latitud FROM dbo.ESPACIO WHERE codigo = 'PATIO') p
    WHERE e.espacioId <> p.espacioId AND e.estado = 1;
END
ELSE
BEGIN
    -- Si ya existian, se recalculan los pesos con las coordenadas nuevas
    UPDATE a
    SET peso = CAST(ROUND(SQRT(SQUARE(d.longitud - o.longitud) + SQUARE(d.latitud - o.latitud)) * 2, 0) AS INT)
    FROM dbo.ARISTA a
    INNER JOIN dbo.ESPACIO o ON o.espacioId = a.origenId
    INNER JOIN dbo.ESPACIO d ON d.espacioId = a.destinoId
    WHERE a.origenId <= 14 AND a.destinoId <= 14;
END
GO

/* ---------- 4. Horarios de atencion (diaSem: 1 = lunes ... 7 = domingo) ---------- */
IF NOT EXISTS (SELECT 1 FROM dbo.HORA_ATENCION)
BEGIN
    DECLARE @id INT = 0;
    DECLARE @dia INT = 1;
    WHILE @dia <= 6
    BEGIN
        -- Cafeteria: L-S 07:00-21:00
        SET @id += 1; INSERT INTO dbo.HORA_ATENCION VALUES (@id, 1, @dia, '07:00', '21:00', 1);
        -- Biblioteca: L-V 08:00-22:00, S 09:00-13:00
        SET @id += 1; INSERT INTO dbo.HORA_ATENCION VALUES (@id, 2, @dia,
            CASE WHEN @dia = 6 THEN '09:00' ELSE '08:00' END,
            CASE WHEN @dia = 6 THEN '13:00' ELSE '22:00' END, 1);
        IF @dia <= 5
        BEGIN
            -- Atencion al Publico: L-V 09:00-18:00
            SET @id += 1; INSERT INTO dbo.HORA_ATENCION VALUES (@id, 6, @dia, '09:00', '18:00', 1);
            -- Libreria: L-V 08:00-20:00
            SET @id += 1; INSERT INTO dbo.HORA_ATENCION VALUES (@id, 9, @dia, '08:00', '20:00', 1);
        END
        SET @dia += 1;
    END
END
GO

/* ---------- 5. Administrador de prueba ---------- */
IF NOT EXISTS (SELECT 1 FROM dbo.USUARIO WHERE correo = 'admin@upn.edu.pe')
BEGIN
    INSERT INTO dbo.USUARIO (usuarioID, nombres, apellidos, correo, [contraseña], rolId, registro, estado, correoPersonal, correoPersonalVerificado)
    SELECT ISNULL(MAX(usuarioID), 0) + 1, 'Administrador', 'Sistema', 'admin@upn.edu.pe',
           '$2b$12$brRsbtR6mPwRG7yNs84Sguxwz2Kj5oIqyLCQOCLap3L9CEPeHMdii', 4, GETDATE(), 1, NULL, 0
    FROM dbo.USUARIO;
END
GO
