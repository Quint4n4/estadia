-- =============================================================================
--  MotoQFox — Dump de datos
--  Generado : 2026-04-08 13:05:17
--  Base     : motoqfox_db @ localhost:5432
--
--  INSTRUCCIONES DE CARGA:
--  1. Asegúrate de que la base de datos destino ya tiene el schema aplicado:
--       python manage.py migrate
--  2. Ejecuta este script:
--       psql -U postgres -d motoqfox_db -f motoqfox_data_20260408_130516.sql
--  3. Actualiza las secuencias (ver sección al final del archivo).
-- =============================================================================

SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;
SET row_security = off;

-- Desactivar constraints temporalmente para evitar errores de orden
SET session_replication_role = replica;


-- -----------------------------------------------------------------------------
-- Tabla: django_content_type  (39 filas)
-- -----------------------------------------------------------------------------
--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: django_content_type; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.django_content_type VALUES (1, 'admin', 'logentry');
INSERT INTO public.django_content_type VALUES (2, 'auth', 'permission');
INSERT INTO public.django_content_type VALUES (3, 'auth', 'group');
INSERT INTO public.django_content_type VALUES (4, 'contenttypes', 'contenttype');
INSERT INTO public.django_content_type VALUES (5, 'sessions', 'session');
INSERT INTO public.django_content_type VALUES (6, 'users', 'customuser');
INSERT INTO public.django_content_type VALUES (7, 'branches', 'sede');
INSERT INTO public.django_content_type VALUES (8, 'inventory', 'entradainventario');
INSERT INTO public.django_content_type VALUES (9, 'inventory', 'producto');
INSERT INTO public.django_content_type VALUES (10, 'inventory', 'categoria');
INSERT INTO public.django_content_type VALUES (11, 'inventory', 'stock');
INSERT INTO public.django_content_type VALUES (12, 'inventory', 'auditoriaitem');
INSERT INTO public.django_content_type VALUES (13, 'inventory', 'auditoriainventario');
INSERT INTO public.django_content_type VALUES (14, 'users', 'turno');
INSERT INTO public.django_content_type VALUES (15, 'users', 'passwordresettoken');
INSERT INTO public.django_content_type VALUES (16, 'users', 'loginauditlog');
INSERT INTO public.django_content_type VALUES (17, 'inventory', 'marcafabricante');
INSERT INTO public.django_content_type VALUES (18, 'inventory', 'marcamoto');
INSERT INTO public.django_content_type VALUES (19, 'inventory', 'modelomoto');
INSERT INTO public.django_content_type VALUES (20, 'inventory', 'compatibilidadpieza');
INSERT INTO public.django_content_type VALUES (21, 'inventory', 'subcategoria');
INSERT INTO public.django_content_type VALUES (22, 'sales', 'ventaitem');
INSERT INTO public.django_content_type VALUES (23, 'sales', 'venta');
INSERT INTO public.django_content_type VALUES (24, 'sales', 'codigoapertura');
INSERT INTO public.django_content_type VALUES (25, 'sales', 'aperturacaja');
INSERT INTO public.django_content_type VALUES (26, 'billing', 'configuracionfiscalsede');
INSERT INTO public.django_content_type VALUES (27, 'customers', 'clienteprofile');
INSERT INTO public.django_content_type VALUES (28, 'pedidos', 'pedidobodegaitem');
INSERT INTO public.django_content_type VALUES (29, 'pedidos', 'pedidobodega');
INSERT INTO public.django_content_type VALUES (30, 'sales', 'reportecaja');
INSERT INTO public.django_content_type VALUES (31, 'taller', 'serviciomoto');
INSERT INTO public.django_content_type VALUES (32, 'taller', 'solicitudrefaccionextra');
INSERT INTO public.django_content_type VALUES (33, 'taller', 'servicioitem');
INSERT INTO public.django_content_type VALUES (34, 'taller', 'motocliente');
INSERT INTO public.django_content_type VALUES (35, 'catalogo_servicios', 'categoriaservicio');
INSERT INTO public.django_content_type VALUES (36, 'catalogo_servicios', 'catalogoservicio');
INSERT INTO public.django_content_type VALUES (37, 'catalogo_servicios', 'catalogoserviciorefaccion');
INSERT INTO public.django_content_type VALUES (38, 'catalogo_servicios', 'precioserviciosede');
INSERT INTO public.django_content_type VALUES (39, 'taller', 'servicioimagen');


--
-- Name: django_content_type_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.django_content_type_id_seq', 39, true);


--
-- PostgreSQL database dump complete
--


-- -----------------------------------------------------------------------------
-- Tabla: auth_permission  (156 filas)
-- -----------------------------------------------------------------------------
--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: auth_permission; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.auth_permission VALUES (1, 'Can add log entry', 1, 'add_logentry');
INSERT INTO public.auth_permission VALUES (2, 'Can change log entry', 1, 'change_logentry');
INSERT INTO public.auth_permission VALUES (3, 'Can delete log entry', 1, 'delete_logentry');
INSERT INTO public.auth_permission VALUES (4, 'Can view log entry', 1, 'view_logentry');
INSERT INTO public.auth_permission VALUES (5, 'Can add permission', 2, 'add_permission');
INSERT INTO public.auth_permission VALUES (6, 'Can change permission', 2, 'change_permission');
INSERT INTO public.auth_permission VALUES (7, 'Can delete permission', 2, 'delete_permission');
INSERT INTO public.auth_permission VALUES (8, 'Can view permission', 2, 'view_permission');
INSERT INTO public.auth_permission VALUES (9, 'Can add group', 3, 'add_group');
INSERT INTO public.auth_permission VALUES (10, 'Can change group', 3, 'change_group');
INSERT INTO public.auth_permission VALUES (11, 'Can delete group', 3, 'delete_group');
INSERT INTO public.auth_permission VALUES (12, 'Can view group', 3, 'view_group');
INSERT INTO public.auth_permission VALUES (13, 'Can add content type', 4, 'add_contenttype');
INSERT INTO public.auth_permission VALUES (14, 'Can change content type', 4, 'change_contenttype');
INSERT INTO public.auth_permission VALUES (15, 'Can delete content type', 4, 'delete_contenttype');
INSERT INTO public.auth_permission VALUES (16, 'Can view content type', 4, 'view_contenttype');
INSERT INTO public.auth_permission VALUES (17, 'Can add session', 5, 'add_session');
INSERT INTO public.auth_permission VALUES (18, 'Can change session', 5, 'change_session');
INSERT INTO public.auth_permission VALUES (19, 'Can delete session', 5, 'delete_session');
INSERT INTO public.auth_permission VALUES (20, 'Can view session', 5, 'view_session');
INSERT INTO public.auth_permission VALUES (21, 'Can add Usuario', 6, 'add_customuser');
INSERT INTO public.auth_permission VALUES (22, 'Can change Usuario', 6, 'change_customuser');
INSERT INTO public.auth_permission VALUES (23, 'Can delete Usuario', 6, 'delete_customuser');
INSERT INTO public.auth_permission VALUES (24, 'Can view Usuario', 6, 'view_customuser');
INSERT INTO public.auth_permission VALUES (25, 'Can add Sede', 7, 'add_sede');
INSERT INTO public.auth_permission VALUES (26, 'Can change Sede', 7, 'change_sede');
INSERT INTO public.auth_permission VALUES (27, 'Can delete Sede', 7, 'delete_sede');
INSERT INTO public.auth_permission VALUES (28, 'Can view Sede', 7, 'view_sede');
INSERT INTO public.auth_permission VALUES (29, 'Can add Entrada de Inventario', 8, 'add_entradainventario');
INSERT INTO public.auth_permission VALUES (30, 'Can change Entrada de Inventario', 8, 'change_entradainventario');
INSERT INTO public.auth_permission VALUES (31, 'Can delete Entrada de Inventario', 8, 'delete_entradainventario');
INSERT INTO public.auth_permission VALUES (32, 'Can view Entrada de Inventario', 8, 'view_entradainventario');
INSERT INTO public.auth_permission VALUES (33, 'Can add Producto', 9, 'add_producto');
INSERT INTO public.auth_permission VALUES (34, 'Can change Producto', 9, 'change_producto');
INSERT INTO public.auth_permission VALUES (35, 'Can delete Producto', 9, 'delete_producto');
INSERT INTO public.auth_permission VALUES (36, 'Can view Producto', 9, 'view_producto');
INSERT INTO public.auth_permission VALUES (37, 'Can add Categoría', 10, 'add_categoria');
INSERT INTO public.auth_permission VALUES (38, 'Can change Categoría', 10, 'change_categoria');
INSERT INTO public.auth_permission VALUES (39, 'Can delete Categoría', 10, 'delete_categoria');
INSERT INTO public.auth_permission VALUES (40, 'Can view Categoría', 10, 'view_categoria');
INSERT INTO public.auth_permission VALUES (41, 'Can add Stock', 11, 'add_stock');
INSERT INTO public.auth_permission VALUES (42, 'Can change Stock', 11, 'change_stock');
INSERT INTO public.auth_permission VALUES (43, 'Can delete Stock', 11, 'delete_stock');
INSERT INTO public.auth_permission VALUES (44, 'Can view Stock', 11, 'view_stock');
INSERT INTO public.auth_permission VALUES (45, 'Can add Ítem de Auditoría', 12, 'add_auditoriaitem');
INSERT INTO public.auth_permission VALUES (46, 'Can change Ítem de Auditoría', 12, 'change_auditoriaitem');
INSERT INTO public.auth_permission VALUES (47, 'Can delete Ítem de Auditoría', 12, 'delete_auditoriaitem');
INSERT INTO public.auth_permission VALUES (48, 'Can view Ítem de Auditoría', 12, 'view_auditoriaitem');
INSERT INTO public.auth_permission VALUES (49, 'Can add Auditoría de Inventario', 13, 'add_auditoriainventario');
INSERT INTO public.auth_permission VALUES (50, 'Can change Auditoría de Inventario', 13, 'change_auditoriainventario');
INSERT INTO public.auth_permission VALUES (51, 'Can delete Auditoría de Inventario', 13, 'delete_auditoriainventario');
INSERT INTO public.auth_permission VALUES (52, 'Can view Auditoría de Inventario', 13, 'view_auditoriainventario');
INSERT INTO public.auth_permission VALUES (53, 'Can add Turno', 14, 'add_turno');
INSERT INTO public.auth_permission VALUES (54, 'Can change Turno', 14, 'change_turno');
INSERT INTO public.auth_permission VALUES (55, 'Can delete Turno', 14, 'delete_turno');
INSERT INTO public.auth_permission VALUES (56, 'Can view Turno', 14, 'view_turno');
INSERT INTO public.auth_permission VALUES (57, 'Can add Token de restablecimiento', 15, 'add_passwordresettoken');
INSERT INTO public.auth_permission VALUES (58, 'Can change Token de restablecimiento', 15, 'change_passwordresettoken');
INSERT INTO public.auth_permission VALUES (59, 'Can delete Token de restablecimiento', 15, 'delete_passwordresettoken');
INSERT INTO public.auth_permission VALUES (60, 'Can view Token de restablecimiento', 15, 'view_passwordresettoken');
INSERT INTO public.auth_permission VALUES (61, 'Can add Registro de acceso', 16, 'add_loginauditlog');
INSERT INTO public.auth_permission VALUES (62, 'Can change Registro de acceso', 16, 'change_loginauditlog');
INSERT INTO public.auth_permission VALUES (63, 'Can delete Registro de acceso', 16, 'delete_loginauditlog');
INSERT INTO public.auth_permission VALUES (64, 'Can view Registro de acceso', 16, 'view_loginauditlog');
INSERT INTO public.auth_permission VALUES (65, 'Can add Marca Fabricante', 17, 'add_marcafabricante');
INSERT INTO public.auth_permission VALUES (66, 'Can change Marca Fabricante', 17, 'change_marcafabricante');
INSERT INTO public.auth_permission VALUES (67, 'Can delete Marca Fabricante', 17, 'delete_marcafabricante');
INSERT INTO public.auth_permission VALUES (68, 'Can view Marca Fabricante', 17, 'view_marcafabricante');
INSERT INTO public.auth_permission VALUES (69, 'Can add Marca de Moto', 18, 'add_marcamoto');
INSERT INTO public.auth_permission VALUES (70, 'Can change Marca de Moto', 18, 'change_marcamoto');
INSERT INTO public.auth_permission VALUES (71, 'Can delete Marca de Moto', 18, 'delete_marcamoto');
INSERT INTO public.auth_permission VALUES (72, 'Can view Marca de Moto', 18, 'view_marcamoto');
INSERT INTO public.auth_permission VALUES (73, 'Can add Modelo de Moto', 19, 'add_modelomoto');
INSERT INTO public.auth_permission VALUES (74, 'Can change Modelo de Moto', 19, 'change_modelomoto');
INSERT INTO public.auth_permission VALUES (75, 'Can delete Modelo de Moto', 19, 'delete_modelomoto');
INSERT INTO public.auth_permission VALUES (76, 'Can view Modelo de Moto', 19, 'view_modelomoto');
INSERT INTO public.auth_permission VALUES (77, 'Can add Compatibilidad', 20, 'add_compatibilidadpieza');
INSERT INTO public.auth_permission VALUES (78, 'Can change Compatibilidad', 20, 'change_compatibilidadpieza');
INSERT INTO public.auth_permission VALUES (79, 'Can delete Compatibilidad', 20, 'delete_compatibilidadpieza');
INSERT INTO public.auth_permission VALUES (80, 'Can view Compatibilidad', 20, 'view_compatibilidadpieza');
INSERT INTO public.auth_permission VALUES (81, 'Can add Subcategoría', 21, 'add_subcategoria');
INSERT INTO public.auth_permission VALUES (82, 'Can change Subcategoría', 21, 'change_subcategoria');
INSERT INTO public.auth_permission VALUES (83, 'Can delete Subcategoría', 21, 'delete_subcategoria');
INSERT INTO public.auth_permission VALUES (84, 'Can view Subcategoría', 21, 'view_subcategoria');
INSERT INTO public.auth_permission VALUES (85, 'Can add Ítem de Venta', 22, 'add_ventaitem');
INSERT INTO public.auth_permission VALUES (86, 'Can change Ítem de Venta', 22, 'change_ventaitem');
INSERT INTO public.auth_permission VALUES (87, 'Can delete Ítem de Venta', 22, 'delete_ventaitem');
INSERT INTO public.auth_permission VALUES (88, 'Can view Ítem de Venta', 22, 'view_ventaitem');
INSERT INTO public.auth_permission VALUES (89, 'Can add Venta', 23, 'add_venta');
INSERT INTO public.auth_permission VALUES (90, 'Can change Venta', 23, 'change_venta');
INSERT INTO public.auth_permission VALUES (91, 'Can delete Venta', 23, 'delete_venta');
INSERT INTO public.auth_permission VALUES (92, 'Can view Venta', 23, 'view_venta');
INSERT INTO public.auth_permission VALUES (93, 'Can add Código de apertura', 24, 'add_codigoapertura');
INSERT INTO public.auth_permission VALUES (94, 'Can change Código de apertura', 24, 'change_codigoapertura');
INSERT INTO public.auth_permission VALUES (95, 'Can delete Código de apertura', 24, 'delete_codigoapertura');
INSERT INTO public.auth_permission VALUES (96, 'Can view Código de apertura', 24, 'view_codigoapertura');
INSERT INTO public.auth_permission VALUES (97, 'Can add Apertura de caja', 25, 'add_aperturacaja');
INSERT INTO public.auth_permission VALUES (98, 'Can change Apertura de caja', 25, 'change_aperturacaja');
INSERT INTO public.auth_permission VALUES (99, 'Can delete Apertura de caja', 25, 'delete_aperturacaja');
INSERT INTO public.auth_permission VALUES (100, 'Can view Apertura de caja', 25, 'view_aperturacaja');
INSERT INTO public.auth_permission VALUES (101, 'Can add Configuración fiscal de sede', 26, 'add_configuracionfiscalsede');
INSERT INTO public.auth_permission VALUES (102, 'Can change Configuración fiscal de sede', 26, 'change_configuracionfiscalsede');
INSERT INTO public.auth_permission VALUES (103, 'Can delete Configuración fiscal de sede', 26, 'delete_configuracionfiscalsede');
INSERT INTO public.auth_permission VALUES (104, 'Can view Configuración fiscal de sede', 26, 'view_configuracionfiscalsede');
INSERT INTO public.auth_permission VALUES (105, 'Can add Perfil de cliente', 27, 'add_clienteprofile');
INSERT INTO public.auth_permission VALUES (106, 'Can change Perfil de cliente', 27, 'change_clienteprofile');
INSERT INTO public.auth_permission VALUES (107, 'Can delete Perfil de cliente', 27, 'delete_clienteprofile');
INSERT INTO public.auth_permission VALUES (108, 'Can view Perfil de cliente', 27, 'view_clienteprofile');
INSERT INTO public.auth_permission VALUES (109, 'Can add Ítem de Pedido', 28, 'add_pedidobodegaitem');
INSERT INTO public.auth_permission VALUES (110, 'Can change Ítem de Pedido', 28, 'change_pedidobodegaitem');
INSERT INTO public.auth_permission VALUES (111, 'Can delete Ítem de Pedido', 28, 'delete_pedidobodegaitem');
INSERT INTO public.auth_permission VALUES (112, 'Can view Ítem de Pedido', 28, 'view_pedidobodegaitem');
INSERT INTO public.auth_permission VALUES (113, 'Can add Pedido de Bodega', 29, 'add_pedidobodega');
INSERT INTO public.auth_permission VALUES (114, 'Can change Pedido de Bodega', 29, 'change_pedidobodega');
INSERT INTO public.auth_permission VALUES (115, 'Can delete Pedido de Bodega', 29, 'delete_pedidobodega');
INSERT INTO public.auth_permission VALUES (116, 'Can view Pedido de Bodega', 29, 'view_pedidobodega');
INSERT INTO public.auth_permission VALUES (117, 'Can add Reporte de caja', 30, 'add_reportecaja');
INSERT INTO public.auth_permission VALUES (118, 'Can change Reporte de caja', 30, 'change_reportecaja');
INSERT INTO public.auth_permission VALUES (119, 'Can delete Reporte de caja', 30, 'delete_reportecaja');
INSERT INTO public.auth_permission VALUES (120, 'Can view Reporte de caja', 30, 'view_reportecaja');
INSERT INTO public.auth_permission VALUES (121, 'Can add Servicio', 31, 'add_serviciomoto');
INSERT INTO public.auth_permission VALUES (122, 'Can change Servicio', 31, 'change_serviciomoto');
INSERT INTO public.auth_permission VALUES (123, 'Can delete Servicio', 31, 'delete_serviciomoto');
INSERT INTO public.auth_permission VALUES (124, 'Can view Servicio', 31, 'view_serviciomoto');
INSERT INTO public.auth_permission VALUES (125, 'Can add Solicitud de refacción extra', 32, 'add_solicitudrefaccionextra');
INSERT INTO public.auth_permission VALUES (126, 'Can change Solicitud de refacción extra', 32, 'change_solicitudrefaccionextra');
INSERT INTO public.auth_permission VALUES (127, 'Can delete Solicitud de refacción extra', 32, 'delete_solicitudrefaccionextra');
INSERT INTO public.auth_permission VALUES (128, 'Can view Solicitud de refacción extra', 32, 'view_solicitudrefaccionextra');
INSERT INTO public.auth_permission VALUES (129, 'Can add Ítem de servicio', 33, 'add_servicioitem');
INSERT INTO public.auth_permission VALUES (130, 'Can change Ítem de servicio', 33, 'change_servicioitem');
INSERT INTO public.auth_permission VALUES (131, 'Can delete Ítem de servicio', 33, 'delete_servicioitem');
INSERT INTO public.auth_permission VALUES (132, 'Can view Ítem de servicio', 33, 'view_servicioitem');
INSERT INTO public.auth_permission VALUES (133, 'Can add Moto del cliente', 34, 'add_motocliente');
INSERT INTO public.auth_permission VALUES (134, 'Can change Moto del cliente', 34, 'change_motocliente');
INSERT INTO public.auth_permission VALUES (135, 'Can delete Moto del cliente', 34, 'delete_motocliente');
INSERT INTO public.auth_permission VALUES (136, 'Can view Moto del cliente', 34, 'view_motocliente');
INSERT INTO public.auth_permission VALUES (137, 'Can add Categoría de Servicio', 35, 'add_categoriaservicio');
INSERT INTO public.auth_permission VALUES (138, 'Can change Categoría de Servicio', 35, 'change_categoriaservicio');
INSERT INTO public.auth_permission VALUES (139, 'Can delete Categoría de Servicio', 35, 'delete_categoriaservicio');
INSERT INTO public.auth_permission VALUES (140, 'Can view Categoría de Servicio', 35, 'view_categoriaservicio');
INSERT INTO public.auth_permission VALUES (141, 'Can add Servicio del Catálogo', 36, 'add_catalogoservicio');
INSERT INTO public.auth_permission VALUES (142, 'Can change Servicio del Catálogo', 36, 'change_catalogoservicio');
INSERT INTO public.auth_permission VALUES (143, 'Can delete Servicio del Catálogo', 36, 'delete_catalogoservicio');
INSERT INTO public.auth_permission VALUES (144, 'Can view Servicio del Catálogo', 36, 'view_catalogoservicio');
INSERT INTO public.auth_permission VALUES (145, 'Can add Refacción del Servicio', 37, 'add_catalogoserviciorefaccion');
INSERT INTO public.auth_permission VALUES (146, 'Can change Refacción del Servicio', 37, 'change_catalogoserviciorefaccion');
INSERT INTO public.auth_permission VALUES (147, 'Can delete Refacción del Servicio', 37, 'delete_catalogoserviciorefaccion');
INSERT INTO public.auth_permission VALUES (148, 'Can view Refacción del Servicio', 37, 'view_catalogoserviciorefaccion');
INSERT INTO public.auth_permission VALUES (149, 'Can add Precio de Servicio por Sede', 38, 'add_precioserviciosede');
INSERT INTO public.auth_permission VALUES (150, 'Can change Precio de Servicio por Sede', 38, 'change_precioserviciosede');
INSERT INTO public.auth_permission VALUES (151, 'Can delete Precio de Servicio por Sede', 38, 'delete_precioserviciosede');
INSERT INTO public.auth_permission VALUES (152, 'Can view Precio de Servicio por Sede', 38, 'view_precioserviciosede');
INSERT INTO public.auth_permission VALUES (153, 'Can add Imagen de servicio', 39, 'add_servicioimagen');
INSERT INTO public.auth_permission VALUES (154, 'Can change Imagen de servicio', 39, 'change_servicioimagen');
INSERT INTO public.auth_permission VALUES (155, 'Can delete Imagen de servicio', 39, 'delete_servicioimagen');
INSERT INTO public.auth_permission VALUES (156, 'Can view Imagen de servicio', 39, 'view_servicioimagen');


--
-- Name: auth_permission_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.auth_permission_id_seq', 156, true);


--
-- PostgreSQL database dump complete
--

-- Tabla auth_group: sin datos


-- -----------------------------------------------------------------------------
-- Tabla: branches_sedes  (2 filas)
-- -----------------------------------------------------------------------------
--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: branches_sedes; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.branches_sedes VALUES (2, 'Sucursal Norte', 'Av. Ejido, Colonia Hoogar moderno', '7445514025', true, '2026-02-25 23:01:21.149501-06', '2026-02-26 10:40:42.332354-06');
INSERT INTO public.branches_sedes VALUES (1, 'Sucursal Central', 'Av. Moto 100, Col. Centro', '555-0001', true, '2026-02-25 22:50:05.758274-06', '2026-02-27 10:55:34.688121-06');


--
-- Name: branches_sedes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.branches_sedes_id_seq', 2, true);


--
-- PostgreSQL database dump complete
--


-- -----------------------------------------------------------------------------
-- Tabla: users  (29 filas)
-- -----------------------------------------------------------------------------
--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.users VALUES ('pbkdf2_sha256$720000$2RBpnHQPVZD51hAlSHBTe1$ZAhpd90fZSq9lTsZMpoHH95N4LcHKMOSK3hJF/S6HVU=', NULL, 4, 'cashier@motoqfox.com', 'María', 'Cajera', 'CASHIER', true, false, false, '2026-02-25 22:50:36.241716-06', '2026-02-25 22:50:37.026511-06', 1, '', NULL, 0, false);
INSERT INTO public.users VALUES ('pbkdf2_sha256$720000$P0Ga7N5bwmHZdkPhAFwu4t$ggv9Qx+QALLZhng7wubEH0dwME8zrJ0seAJ5tLOe844=', NULL, 3, 'worker@motoqfox.com', 'Carlos', 'Mecánico', 'WORKER', true, false, false, '2026-02-25 22:50:35.434819-06', '2026-02-25 22:50:36.220179-06', 1, '', NULL, 0, false);
INSERT INTO public.users VALUES ('pbkdf2_sha256$720000$J69Z7ALPLPmE0AzWtIOM3c$58c25djiAu/UFc/z1X5YA3HMs3u1GjC6UP7bo47BNfY=', NULL, 10, 'emanuelrealgamboa@gmail.com', 'Emanuel', 'Real Gamboa', 'CASHIER', true, false, false, '2026-03-02 13:38:14.813364-06', '2026-03-02 13:42:26.598834-06', 2, '7445514025', NULL, 0, false);
INSERT INTO public.users VALUES ('pbkdf2_sha256$720000$MoMnMFvCFDWX45UQxt4aUV$CgEWY1yKjZZHIc6aIvn4904jC1d+1h2vSNm/DfWuauU=', NULL, 23, 'rito@gmail.com', 'rito', 'rito', 'CUSTOMER', true, false, false, '2026-04-06 11:45:53.246302-06', '2026-04-06 11:45:54.322112-06', 1, '', NULL, 0, false);
INSERT INTO public.users VALUES ('pbkdf2_sha256$720000$6Y2BzsxdVcmqnZQkLghamL$N8ovUp+ffVxs3zzIxv6bQjaCZYalSyzCGHpkyKEcUv4=', NULL, 13, 'jona@gmail.com', 'Jona', 'Gatica', 'CUSTOMER', true, false, false, '2026-03-12 12:29:30.695212-06', '2026-03-12 12:29:31.682739-06', 1, '', NULL, 0, false);
INSERT INTO public.users VALUES ('pbkdf2_sha256$720000$PN2fjJOjidNOdjN56b23dX$Ns1UFHMOkwOv1q+dlat9S+HGRVGQBj7AloXq4ydprIg=', NULL, 18, 'elias@gmail.com', 'Elias', 'Real', 'CUSTOMER', true, false, false, '2026-03-28 16:25:55.33261-06', '2026-03-28 16:25:56.388986-06', 1, '', NULL, 0, false);
INSERT INTO public.users VALUES ('pbkdf2_sha256$720000$5pK4CvDtUCxt3XcdertaEn$ysZphSlP/RP3NoP5VHDYBxCyDrqadDA10FYu6crREtw=', NULL, 24, 'chapo@gmail.com', 'chapo', 'guzman', 'CUSTOMER', true, false, false, '2026-04-06 16:05:17.948542-06', '2026-04-06 16:05:18.568018-06', 1, '', NULL, 0, false);
INSERT INTO public.users VALUES ('pbkdf2_sha256$720000$QWRVlVzJ8hIrzICkYGaUQ0$+N0mO2r3J4qVo/l0ofCo+88IU++96gtWeujYXlGNeFo=', NULL, 21, 'jose@gmail.com', 'jose', 'antonio', 'CUSTOMER', true, false, false, '2026-04-01 11:46:05.900277-06', '2026-04-01 11:46:06.807024-06', 1, '', NULL, 0, false);
INSERT INTO public.users VALUES ('pbkdf2_sha256$720000$DOi8JRrE3uYK6mSMrlMF9e$9m1/dy1/QPG8y0DjJ4wDNnW4TTo0N+1EKXijrINVf08=', NULL, 32, 'encargado.norte@motoqfox.com', 'Roberto', 'Gonzalez', 'ENCARGADO', true, false, false, '2026-04-08 12:32:18.435975-06', '2026-04-08 12:32:18.436965-06', 2, '7440000001', NULL, 0, false);
INSERT INTO public.users VALUES ('pbkdf2_sha256$1000000$3z89GAIJXmIPr7sEfr5xxe$yDFt4wvwigi6Fm9n5lyhEoCFzehGgq9ZiankH//meyQ=', NULL, 5, 'customer@motoqfox.com', 'Luis', 'Cliente', 'CUSTOMER', true, false, false, '2026-02-25 22:50:37.035973-06', '2026-02-25 22:59:37.665035-06', 1, '', NULL, 0, false);
INSERT INTO public.users VALUES ('pbkdf2_sha256$720000$O9VgzxLxP6vZFjl4uxFVbJ$UcGQS4JvOzKERfC+mmWS5YGIx5xaPsZIMCP1AgC3lXU=', '2026-03-31 15:33:16.405596-06', 1, 'admin@gmail.com', 'admin', 'admin', 'ADMINISTRATOR', true, true, true, '2026-01-05 23:20:29.880887-06', '2026-01-05 23:20:30.538786-06', NULL, '', NULL, 0, false);
INSERT INTO public.users VALUES ('pbkdf2_sha256$720000$40bBkmeBPbpmIieY3V5rPW$frg9LEm6O34PBKxcHyuWJQFGxEdtfBc+UT0yU10tXLE=', NULL, 22, 'julio@gmail.com', 'julio', 'perez', 'CUSTOMER', true, false, false, '2026-04-01 11:52:02.423973-06', '2026-04-01 11:52:03.340443-06', 1, '', NULL, 0, false);
INSERT INTO public.users VALUES ('pbkdf2_sha256$720000$0dLOZqpFGC8JpO0quuujTm$2lGwYVyQbptuPBbjJ+o61qIiSqGz1Bkj67ks3hQrfLM=', NULL, 6, 'emanuel@gmail.com', 'Emanuel', 'Real Gamboa', 'WORKER', true, false, false, '2026-02-25 23:00:16.367931-06', '2026-02-25 23:00:17.389392-06', 1, '', NULL, 1, false);
INSERT INTO public.users VALUES ('pbkdf2_sha256$720000$APCgrxnUb59VRW1HeTdt0m$eemwHTzl9/UUQ36DZcw7om9nc1bHEfTVUQXHq2HSqIk=', NULL, 25, 'hector@gmail.com', 'hector', 'astudillo', 'CUSTOMER', true, false, false, '2026-04-06 16:16:41.562747-06', '2026-04-06 16:16:42.159686-06', 1, '', NULL, 0, false);
INSERT INTO public.users VALUES ('pbkdf2_sha256$720000$lIsPPpOabQvauU9OgYOmlj$OXiGFYdVj588Ole5CUJP4BGfjRWC3UqYfJKGdDlfngM=', NULL, 16, 'juan@gmail.com', 'juan', 'perez', 'CUSTOMER', true, false, false, '2026-03-26 12:01:50.538907-06', '2026-03-26 12:01:51.515317-06', 1, '', NULL, 0, false);
INSERT INTO public.users VALUES ('pbkdf2_sha256$720000$Fh13DIZivHIVgQ7dFzfwb8$7bUjXvkrDardCOlOMGnKHhQrubKcoY5sFZ2Jotg17eU=', NULL, 19, 'pablo@gmail.com', 'pablo', 'perez', 'CUSTOMER', true, false, false, '2026-03-30 10:34:28.570181-06', '2026-03-30 10:34:29.608943-06', 1, '', NULL, 0, false);
INSERT INTO public.users VALUES ('pbkdf2_sha256$720000$BXdf1lky0YrKUJqeIjPOWI$e/+b3l6oeBtVILDKoCzm4b1Ddek0ZvAmL3cseZANuWw=', NULL, 11, 'emanuelrealgamboa1@gmail.com', 'Emanuel', 'Real', 'CUSTOMER', true, false, false, '2026-03-11 09:50:08.732622-06', '2026-03-11 09:50:09.790654-06', 1, '', NULL, 0, false);
INSERT INTO public.users VALUES ('pbkdf2_sha256$720000$c0EDpikg9bDuKGO2pd1wFY$PpQlUjV8pxcbSoE7OESaRtm/wns76bAMvYyobNh4vNA=', NULL, 12, 'betza1@gmail.com', 'betza', 'alvarado velasco', 'CUSTOMER', true, false, false, '2026-03-11 22:39:10.20818-06', '2026-03-11 22:39:11.233936-06', 1, '', NULL, 0, false);
INSERT INTO public.users VALUES ('pbkdf2_sha256$720000$iPNrFTmegA5ViHi3H5WU7E$TrnxRsDizHNEI53VrwDfBPuHuBs8U8X/Q0zLKiM4xZs=', NULL, 14, 'jefemecanico@gmail.com', 'Jefe', 'mecanico', 'JEFE_MECANICO', true, false, false, '2026-03-16 15:25:21.888991-06', '2026-03-16 15:25:22.802704-06', 1, '1234567890', NULL, 0, false);
INSERT INTO public.users VALUES ('pbkdf2_sha256$720000$V53R1Jm9Iy0H1tAg2R2Ui8$8qkntXleHuqMOxv7WnmXlBRmzZe5BnzxM1+WMZqQgnc=', NULL, 17, 'yahirsalanueva@gamil.com', 'Jonathan', 'Gatica', 'CUSTOMER', true, false, false, '2026-03-26 14:09:01.151915-06', '2026-03-26 14:09:02.112189-06', 1, '', NULL, 0, false);
INSERT INTO public.users VALUES ('pbkdf2_sha256$720000$vkYGI269wZDEIPJv9fDJWa$tWmEaPaoEd/mNyaWo1yvfWbTxM3DYxpZmF9KZS0Zpdk=', NULL, 20, 'samuel@gmail.com', 'samuel', 'astudillo', 'CUSTOMER', true, false, false, '2026-04-01 10:35:22.405089-06', '2026-04-01 10:35:23.345948-06', 1, '', NULL, 0, false);
INSERT INTO public.users VALUES ('pbkdf2_sha256$720000$2AcQWCKHTtNXN3eJvPJ2xJ$2t7/K9B1ZUrP6o+eVSl4K1WuOyWOM1OIFvhNJoL9ths=', NULL, 2, 'admin@motoqfox.com', 'Admin', 'Sistema', 'ADMINISTRATOR', true, false, false, '2026-02-25 22:50:05.781276-06', '2026-02-25 22:50:06.585172-06', NULL, '', NULL, 0, false);
INSERT INTO public.users VALUES ('pbkdf2_sha256$720000$RjoLHTyIDkPA5Hmz7WMWeH$CghjADscurxb2YaLFYs1Yk1cYv+G3gLvwjPsVCVTkyk=', NULL, 7, 'antonio@gmail.com', 'Antonio', 'Texta', 'ENCARGADO', true, false, false, '2026-02-26 10:37:20.471252-06', '2026-02-26 10:40:23.260191-06', 1, '', NULL, 0, false);
INSERT INTO public.users VALUES ('pbkdf2_sha256$720000$UkGEilZG6W6anjbeXVzLVa$UnZyMxP0B3Aamk85pm6U/fqAcYtVWyxtQkTcldQGnG8=', NULL, 15, 'mecanico@gmail.com', 'mecanico', 'mecanico', 'MECANICO', true, false, false, '2026-03-16 15:27:32.617148-06', '2026-03-16 15:27:33.54895-06', 1, '1234567890', NULL, 0, false);
INSERT INTO public.users VALUES ('pbkdf2_sha256$720000$OUSAL1gWRjryCLTyQ3wXF8$77Q2PCHHZQZb7yJx7UK6qlAUX7WiYHaS+YSthHsupNs=', NULL, 33, 'cajero.norte@motoqfox.com', 'Laura', 'Perez', 'CASHIER', true, false, false, '2026-04-08 12:32:19.074053-06', '2026-04-08 12:32:19.074053-06', 2, '7440000002', NULL, 0, false);
INSERT INTO public.users VALUES ('pbkdf2_sha256$720000$PEPSxgoO7jLWGnfh2a7gz2$VlOB19zILYOTWhgA64vUP6CutHxMT4JXHNp+xkQbTL0=', NULL, 34, 'jefemecanico.norte@motoqfox.com', 'Miguel', 'Ruiz', 'JEFE_MECANICO', true, false, false, '2026-04-08 12:32:19.663001-06', '2026-04-08 12:32:19.663999-06', 2, '7440000003', NULL, 0, false);
INSERT INTO public.users VALUES ('pbkdf2_sha256$720000$WooRzK5QEIcWS5QAAuuyjV$Hb1lHV+H7CJ1ojKw5iTF2qvJ4sZBcfoMVUb5Ek3CVEM=', NULL, 35, 'mecanico1.norte@motoqfox.com', 'Andres', 'Lopez', 'MECANICO', true, false, false, '2026-04-08 12:32:20.251203-06', '2026-04-08 12:32:20.25178-06', 2, '7440000004', NULL, 0, false);
INSERT INTO public.users VALUES ('pbkdf2_sha256$720000$vR2GKCHBgHCFrMQHuKP6h2$ONYuRGK0aTlzR3x/N26/tEmppFqPUW3uM9979qUCj08=', NULL, 36, 'mecanico2.norte@motoqfox.com', 'Hector', 'Martinez', 'MECANICO', true, false, false, '2026-04-08 12:32:20.861965-06', '2026-04-08 12:32:20.861965-06', 2, '7440000005', NULL, 0, false);
INSERT INTO public.users VALUES ('pbkdf2_sha256$720000$RLvAfVoq29PHiEGTC8mRIB$6G3aNxMHpDJ6ihfzy9NchQEOmP27Y6znfCUsvfpz8zk=', NULL, 37, 'worker.norte@motoqfox.com', 'Sofia', 'Torres', 'WORKER', true, false, false, '2026-04-08 12:32:21.47536-06', '2026-04-08 12:32:21.47536-06', 2, '7440000006', NULL, 0, false);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 37, true);


--
-- PostgreSQL database dump complete
--

-- Tabla users_turnos: sin datos


-- -----------------------------------------------------------------------------
-- Tabla: users_login_audit_log  (106 filas)
-- -----------------------------------------------------------------------------
--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: users_login_audit_log; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.users_login_audit_log VALUES (1, 'LOGIN_SUCCESS', 'admin@motoqfox.com', '127.0.0.1', '2026-02-26 22:59:53.072035-06', '', 2);
INSERT INTO public.users_login_audit_log VALUES (8, 'LOGIN_FAILED', 'motoqfox@gmail.com', '127.0.0.1', '2026-02-27 10:39:24.67332-06', 'Email no registrado.', NULL);
INSERT INTO public.users_login_audit_log VALUES (9, 'LOGIN_SUCCESS', 'admin@motoqfox.com', '127.0.0.1', '2026-02-27 10:39:45.19611-06', '', 2);
INSERT INTO public.users_login_audit_log VALUES (10, 'LOGIN_SUCCESS', 'admin@motoqfox.com', '127.0.0.1', '2026-02-27 10:54:51.308665-06', '', 2);
INSERT INTO public.users_login_audit_log VALUES (11, 'LOGIN_SUCCESS', 'admin@motoqfox.com', '127.0.0.1', '2026-02-27 13:35:02.865368-06', '', 2);
INSERT INTO public.users_login_audit_log VALUES (12, 'LOGIN_SUCCESS', 'admin@motoqfox.com', '127.0.0.1', '2026-03-01 21:00:34.835367-06', '', 2);
INSERT INTO public.users_login_audit_log VALUES (13, 'LOGIN_SUCCESS', 'admin@motoqfox.com', '127.0.0.1', '2026-03-02 08:00:18.964195-06', '', 2);
INSERT INTO public.users_login_audit_log VALUES (14, 'LOGIN_SUCCESS', 'cashier@motoqfox.com', '127.0.0.1', '2026-03-02 09:21:07.257909-06', '', 4);
INSERT INTO public.users_login_audit_log VALUES (15, 'LOGIN_SUCCESS', 'admin@motoqfox.com', '127.0.0.1', '2026-03-02 13:22:58.541481-06', '', 2);
INSERT INTO public.users_login_audit_log VALUES (2, 'LOGIN_FAILED', 'emanuelrealgamboa@gmail.com', '127.0.0.1', '2026-02-26 23:00:38.808874-06', 'Intento 2/5. Quedan 3.', NULL);
INSERT INTO public.users_login_audit_log VALUES (3, 'LOGIN_FAILED', 'emanuelrealgamboa@gmail.com', '127.0.0.1', '2026-02-26 23:00:44.564608-06', 'Intento 3/5. Quedan 2.', NULL);
INSERT INTO public.users_login_audit_log VALUES (4, 'LOGIN_FAILED', 'emanuelrealgamboa@gmail.com', '127.0.0.1', '2026-02-26 23:00:46.851641-06', 'Intento 4/5. Quedan 1.', NULL);
INSERT INTO public.users_login_audit_log VALUES (5, 'ACCOUNT_LOCKED', 'emanuelrealgamboa@gmail.com', '127.0.0.1', '2026-02-26 23:00:49.799349-06', 'Bloqueada por 5 intentos fallidos.', NULL);
INSERT INTO public.users_login_audit_log VALUES (6, 'ACCOUNT_UNLOCKED', 'emanuelrealgamboa@gmail.com', '127.0.0.1', '2026-02-26 23:01:01.803976-06', 'Desbloqueada por administrador: admin@motoqfox.com', NULL);
INSERT INTO public.users_login_audit_log VALUES (7, 'LOGIN_SUCCESS', 'emanuelrealgamboa@gmail.com', '127.0.0.1', '2026-02-26 23:01:37.04806-06', '', NULL);
INSERT INTO public.users_login_audit_log VALUES (16, 'LOGIN_SUCCESS', 'emanuelrealgamboa@gmail.com', '127.0.0.1', '2026-03-02 13:39:27.871104-06', '', 10);
INSERT INTO public.users_login_audit_log VALUES (17, 'LOGIN_FAILED', 'emanuelrealgamboa@gmail.com', '127.0.0.1', '2026-03-02 13:39:51.595769-06', 'Intento 1/5. Quedan 4.', 10);
INSERT INTO public.users_login_audit_log VALUES (18, 'LOGIN_FAILED', 'emanuelrealgamboa@gmail.com', '127.0.0.1', '2026-03-02 13:39:54.622192-06', 'Intento 2/5. Quedan 3.', 10);
INSERT INTO public.users_login_audit_log VALUES (19, 'LOGIN_FAILED', 'emanuelrealgamboa@gmail.com', '127.0.0.1', '2026-03-02 13:39:57.036331-06', 'Intento 3/5. Quedan 2.', 10);
INSERT INTO public.users_login_audit_log VALUES (20, 'LOGIN_FAILED', 'emanuelrealgamboa@gmail.com', '127.0.0.1', '2026-03-02 13:39:58.997661-06', 'Intento 4/5. Quedan 1.', 10);
INSERT INTO public.users_login_audit_log VALUES (21, 'ACCOUNT_LOCKED', 'emanuelrealgamboa@gmail.com', '127.0.0.1', '2026-03-02 13:40:17.267029-06', 'Bloqueada por 5 intentos fallidos.', 10);
INSERT INTO public.users_login_audit_log VALUES (22, 'ACCOUNT_UNLOCKED', 'emanuelrealgamboa@gmail.com', '127.0.0.1', '2026-03-02 13:40:48.753454-06', 'Desbloqueada por administrador: admin@motoqfox.com', 10);
INSERT INTO public.users_login_audit_log VALUES (23, 'PASSWORD_RESET_REQ', 'emanuelrealgamboa@gmail.com', '127.0.0.1', '2026-03-02 13:41:10.526868-06', '', 10);
INSERT INTO public.users_login_audit_log VALUES (24, 'PASSWORD_RESET_DONE', 'emanuelrealgamboa@gmail.com', '127.0.0.1', '2026-03-02 13:41:40.682316-06', '', 10);
INSERT INTO public.users_login_audit_log VALUES (25, 'LOGIN_SUCCESS', 'emanuelrealgamboa@gmail.com', '127.0.0.1', '2026-03-02 13:42:03.731017-06', '', 10);
INSERT INTO public.users_login_audit_log VALUES (26, 'LOGIN_SUCCESS', 'admin@motoqfox.com', '127.0.0.1', '2026-03-03 21:01:39.845128-06', '', 2);
INSERT INTO public.users_login_audit_log VALUES (27, 'LOGIN_FAILED', 'emanuelrealgamboa@gmail.com', '127.0.0.1', '2026-03-03 21:02:12.887542-06', 'Intento 1/5. Quedan 4.', 10);
INSERT INTO public.users_login_audit_log VALUES (28, 'LOGIN_FAILED', 'emanuelrealgamboa@gmail.com', '127.0.0.1', '2026-03-03 21:02:28.242668-06', 'Intento 2/5. Quedan 3.', 10);
INSERT INTO public.users_login_audit_log VALUES (29, 'LOGIN_SUCCESS', 'emanuelrealgamboa@gmail.com', '127.0.0.1', '2026-03-03 21:02:33.421524-06', '', 10);
INSERT INTO public.users_login_audit_log VALUES (30, 'LOGIN_FAILED', 'antonio@gmail.com', '127.0.0.1', '2026-03-03 21:40:22.473582-06', 'Intento 1/5. Quedan 4.', 7);
INSERT INTO public.users_login_audit_log VALUES (31, 'LOGIN_FAILED', 'antonio@gmail.com', '127.0.0.1', '2026-03-03 21:40:28.492339-06', 'Intento 2/5. Quedan 3.', 7);
INSERT INTO public.users_login_audit_log VALUES (32, 'LOGIN_SUCCESS', 'antonio@gmail.com', '127.0.0.1', '2026-03-03 21:40:37.577544-06', '', 7);
INSERT INTO public.users_login_audit_log VALUES (33, 'LOGIN_SUCCESS', 'admin@motoqfox.com', '127.0.0.1', '2026-03-09 12:23:55.462079-06', '', 2);
INSERT INTO public.users_login_audit_log VALUES (34, 'LOGIN_SUCCESS', 'antonio@gmail.com', '127.0.0.1', '2026-03-09 12:27:45.684984-06', '', 7);
INSERT INTO public.users_login_audit_log VALUES (35, 'LOGIN_SUCCESS', 'cashier@motoqfox.com', '127.0.0.1', '2026-03-09 12:48:35.792337-06', '', 4);
INSERT INTO public.users_login_audit_log VALUES (36, 'LOGIN_SUCCESS', 'admin@motoqfox.com', '127.0.0.1', '2026-03-09 13:12:21.61255-06', '', 2);
INSERT INTO public.users_login_audit_log VALUES (37, 'LOGIN_SUCCESS', 'admin@motoqfox.com', '127.0.0.1', '2026-03-10 08:29:59.242378-06', '', 2);
INSERT INTO public.users_login_audit_log VALUES (38, 'LOGIN_SUCCESS', 'antonio@gmail.com', '127.0.0.1', '2026-03-10 08:31:34.872826-06', '', 7);
INSERT INTO public.users_login_audit_log VALUES (39, 'LOGIN_SUCCESS', 'cashier@motoqfox.com', '127.0.0.1', '2026-03-10 08:32:16.746465-06', '', 4);
INSERT INTO public.users_login_audit_log VALUES (40, 'LOGIN_SUCCESS', 'cashier@motoqfox.com', '127.0.0.1', '2026-03-11 10:18:15.360396-06', '', 4);
INSERT INTO public.users_login_audit_log VALUES (41, 'LOGIN_FAILED', 'antonio@gmail.com', '127.0.0.1', '2026-03-11 22:30:55.571435-06', 'Intento 1/5. Quedan 4.', 7);
INSERT INTO public.users_login_audit_log VALUES (42, 'LOGIN_SUCCESS', 'antonio@gmail.com', '127.0.0.1', '2026-03-11 22:31:02.936583-06', '', 7);
INSERT INTO public.users_login_audit_log VALUES (43, 'LOGIN_FAILED', 'emanuel@gmail.com', '127.0.0.1', '2026-03-11 23:11:29.068916-06', 'Intento 1/5. Quedan 4.', 6);
INSERT INTO public.users_login_audit_log VALUES (44, 'LOGIN_SUCCESS', 'worker@motoqfox.com', '127.0.0.1', '2026-03-11 23:12:04.147728-06', '', 3);
INSERT INTO public.users_login_audit_log VALUES (45, 'LOGIN_SUCCESS', 'admin@motoqfox.com', '127.0.0.1', '2026-03-12 12:24:51.235757-06', '', 2);
INSERT INTO public.users_login_audit_log VALUES (46, 'LOGIN_SUCCESS', 'worker@motoqfox.com', '127.0.0.1', '2026-03-12 12:25:21.557826-06', '', 3);
INSERT INTO public.users_login_audit_log VALUES (47, 'LOGIN_SUCCESS', 'cashier@motoqfox.com', '127.0.0.1', '2026-03-12 12:25:57.118335-06', '', 4);
INSERT INTO public.users_login_audit_log VALUES (48, 'LOGIN_SUCCESS', 'antonio@gmail.com', '127.0.0.1', '2026-03-12 14:11:39.542879-06', '', 7);
INSERT INTO public.users_login_audit_log VALUES (49, 'LOGIN_SUCCESS', 'cashier@motoqfox.com', '127.0.0.1', '2026-03-12 14:25:24.227793-06', '', 4);
INSERT INTO public.users_login_audit_log VALUES (50, 'LOGIN_SUCCESS', 'admin@motoqfox.com', '127.0.0.1', '2026-03-16 14:43:02.833218-06', '', 2);
INSERT INTO public.users_login_audit_log VALUES (51, 'LOGIN_SUCCESS', 'jefemecanico@gmail.com', '127.0.0.1', '2026-03-16 15:26:06.052197-06', '', 14);
INSERT INTO public.users_login_audit_log VALUES (52, 'LOGIN_SUCCESS', 'mecanico@gmail.com', '127.0.0.1', '2026-03-16 15:27:56.923026-06', '', 15);
INSERT INTO public.users_login_audit_log VALUES (53, 'LOGIN_SUCCESS', 'jefemecanico@gmail.com', '127.0.0.1', '2026-03-16 15:29:59.56634-06', '', 14);
INSERT INTO public.users_login_audit_log VALUES (54, 'LOGIN_SUCCESS', 'cashier@motoqfox.com', '127.0.0.1', '2026-03-16 15:41:33.252883-06', '', 4);
INSERT INTO public.users_login_audit_log VALUES (55, 'LOGIN_FAILED', 'antonio@gmail.com', '127.0.0.1', '2026-03-16 15:42:09.704587-06', 'Intento 1/5. Quedan 4.', 7);
INSERT INTO public.users_login_audit_log VALUES (56, 'LOGIN_SUCCESS', 'antonio@gmail.com', '127.0.0.1', '2026-03-16 15:42:16.801742-06', '', 7);
INSERT INTO public.users_login_audit_log VALUES (57, 'LOGIN_SUCCESS', 'admin@motoqfox.com', '127.0.0.1', '2026-03-20 11:31:13.492234-06', '', 2);
INSERT INTO public.users_login_audit_log VALUES (58, 'LOGIN_SUCCESS', 'cashier@motoqfox.com', '127.0.0.1', '2026-03-20 12:18:09.805745-06', '', 4);
INSERT INTO public.users_login_audit_log VALUES (59, 'LOGIN_SUCCESS', 'admin@motoqfox.com', '127.0.0.1', '2026-03-20 15:24:16.778315-06', '', 2);
INSERT INTO public.users_login_audit_log VALUES (60, 'LOGIN_SUCCESS', 'cashier@motoqfox.com', '127.0.0.1', '2026-03-20 15:48:44.498908-06', '', 4);
INSERT INTO public.users_login_audit_log VALUES (61, 'LOGIN_SUCCESS', 'antonio@gmail.com', '127.0.0.1', '2026-03-20 16:01:07.486939-06', '', 7);
INSERT INTO public.users_login_audit_log VALUES (62, 'LOGIN_SUCCESS', 'admin@motoqfox.com', '127.0.0.1', '2026-03-24 11:33:18.65124-06', '', 2);
INSERT INTO public.users_login_audit_log VALUES (63, 'LOGIN_SUCCESS', 'antonio@gmail.com', '127.0.0.1', '2026-03-24 11:35:49.151358-06', '', 7);
INSERT INTO public.users_login_audit_log VALUES (64, 'LOGIN_SUCCESS', 'cashier@motoqfox.com', '127.0.0.1', '2026-03-24 11:37:33.785623-06', '', 4);
INSERT INTO public.users_login_audit_log VALUES (65, 'LOGIN_SUCCESS', 'cashier@motoqfox.com', '127.0.0.1', '2026-03-24 22:33:34.377055-06', '', 4);
INSERT INTO public.users_login_audit_log VALUES (66, 'LOGIN_SUCCESS', 'cashier@motoqfox.com', '127.0.0.1', '2026-03-24 22:46:08.660359-06', '', 4);
INSERT INTO public.users_login_audit_log VALUES (67, 'LOGIN_SUCCESS', 'admin@motoqfox.com', '127.0.0.1', '2026-03-25 10:50:16.405876-06', '', 2);
INSERT INTO public.users_login_audit_log VALUES (68, 'LOGIN_SUCCESS', 'cashier@motoqfox.com', '127.0.0.1', '2026-03-25 11:01:37.63944-06', '', 4);
INSERT INTO public.users_login_audit_log VALUES (69, 'LOGIN_SUCCESS', 'admin@motoqfox.com', '127.0.0.1', '2026-03-26 11:54:09.461414-06', '', 2);
INSERT INTO public.users_login_audit_log VALUES (70, 'LOGIN_SUCCESS', 'cashier@motoqfox.com', '127.0.0.1', '2026-03-26 11:57:23.448782-06', '', 4);
INSERT INTO public.users_login_audit_log VALUES (71, 'LOGIN_SUCCESS', 'jefemecanico@gmail.com', '127.0.0.1', '2026-03-26 12:04:12.774291-06', '', 14);
INSERT INTO public.users_login_audit_log VALUES (72, 'LOGIN_SUCCESS', 'mecanico@gmail.com', '127.0.0.1', '2026-03-26 12:05:20.789722-06', '', 15);
INSERT INTO public.users_login_audit_log VALUES (73, 'LOGIN_SUCCESS', 'antonio@gmail.com', '127.0.0.1', '2026-03-26 12:26:46.850876-06', '', 7);
INSERT INTO public.users_login_audit_log VALUES (74, 'LOGIN_SUCCESS', 'admin@motoqfox.com', '127.0.0.1', '2026-03-26 13:42:05.740804-06', '', 2);
INSERT INTO public.users_login_audit_log VALUES (75, 'LOGIN_SUCCESS', 'antonio@gmail.com', '127.0.0.1', '2026-03-26 13:42:50.417426-06', '', 7);
INSERT INTO public.users_login_audit_log VALUES (76, 'LOGIN_SUCCESS', 'jefemecanico@gmail.com', '127.0.0.1', '2026-03-26 13:43:16.466202-06', '', 14);
INSERT INTO public.users_login_audit_log VALUES (77, 'LOGIN_SUCCESS', 'mecanico@gmail.com', '127.0.0.1', '2026-03-26 13:43:31.70345-06', '', 15);
INSERT INTO public.users_login_audit_log VALUES (78, 'LOGIN_SUCCESS', 'cashier@motoqfox.com', '127.0.0.1', '2026-03-26 13:44:07.296629-06', '', 4);
INSERT INTO public.users_login_audit_log VALUES (79, 'LOGIN_SUCCESS', 'mecanico@gmail.com', '127.0.0.1', '2026-03-26 14:05:33.705708-06', '', 15);
INSERT INTO public.users_login_audit_log VALUES (80, 'LOGIN_SUCCESS', 'admin@motoqfox.com', '127.0.0.1', '2026-03-28 15:47:46.368556-06', '', 2);
INSERT INTO public.users_login_audit_log VALUES (81, 'LOGIN_SUCCESS', 'antonio@gmail.com', '127.0.0.1', '2026-03-28 15:49:53.631784-06', '', 7);
INSERT INTO public.users_login_audit_log VALUES (82, 'LOGIN_SUCCESS', 'cashier@motoqfox.com', '127.0.0.1', '2026-03-28 15:50:28.754236-06', '', 4);
INSERT INTO public.users_login_audit_log VALUES (83, 'LOGIN_SUCCESS', 'jefemecanico@gmail.com', '127.0.0.1', '2026-03-28 15:50:56.952025-06', '', 14);
INSERT INTO public.users_login_audit_log VALUES (84, 'LOGIN_SUCCESS', 'mecanico@gmail.com', '127.0.0.1', '2026-03-28 16:43:24.338738-06', '', 15);
INSERT INTO public.users_login_audit_log VALUES (85, 'LOGIN_SUCCESS', 'cashier@motoqfox.com', '127.0.0.1', '2026-03-28 16:57:20.342653-06', '', 4);
INSERT INTO public.users_login_audit_log VALUES (86, 'LOGIN_SUCCESS', 'admin@motoqfox.com', '127.0.0.1', '2026-03-30 10:23:50.951772-06', '', 2);
INSERT INTO public.users_login_audit_log VALUES (87, 'LOGIN_SUCCESS', 'antonio@gmail.com', '127.0.0.1', '2026-03-30 10:24:24.910942-06', '', 7);
INSERT INTO public.users_login_audit_log VALUES (88, 'LOGIN_SUCCESS', 'cashier@motoqfox.com', '127.0.0.1', '2026-03-30 10:24:58.603669-06', '', 4);
INSERT INTO public.users_login_audit_log VALUES (89, 'LOGIN_SUCCESS', 'jefemecanico@gmail.com', '127.0.0.1', '2026-03-30 10:25:34.874251-06', '', 14);
INSERT INTO public.users_login_audit_log VALUES (90, 'LOGIN_SUCCESS', 'mecanico@gmail.com', '127.0.0.1', '2026-03-30 10:36:51.51093-06', '', 15);
INSERT INTO public.users_login_audit_log VALUES (91, 'LOGIN_SUCCESS', 'admin@motoqfox.com', '127.0.0.1', '2026-03-31 13:06:31.802516-06', '', 2);
INSERT INTO public.users_login_audit_log VALUES (92, 'LOGIN_SUCCESS', 'cashier@motoqfox.com', '127.0.0.1', '2026-03-31 13:13:15.198826-06', '', 4);
INSERT INTO public.users_login_audit_log VALUES (93, 'LOGIN_SUCCESS', 'admin@motoqfox.com', '127.0.0.1', '2026-04-01 10:29:24.554125-06', '', 2);
INSERT INTO public.users_login_audit_log VALUES (94, 'LOGIN_SUCCESS', 'antonio@gmail.com', '127.0.0.1', '2026-04-01 10:30:42.74205-06', '', 7);
INSERT INTO public.users_login_audit_log VALUES (95, 'LOGIN_SUCCESS', 'cashier@motoqfox.com', '127.0.0.1', '2026-04-01 10:31:04.260067-06', '', 4);
INSERT INTO public.users_login_audit_log VALUES (96, 'LOGIN_SUCCESS', 'admin@motoqfox.com', '127.0.0.1', '2026-04-06 11:01:05.042626-06', '', 2);
INSERT INTO public.users_login_audit_log VALUES (97, 'LOGIN_SUCCESS', 'antonio@gmail.com', '127.0.0.1', '2026-04-06 11:01:30.79341-06', '', 7);
INSERT INTO public.users_login_audit_log VALUES (98, 'LOGIN_SUCCESS', 'cashier@motoqfox.com', '127.0.0.1', '2026-04-06 11:01:57.512612-06', '', 4);
INSERT INTO public.users_login_audit_log VALUES (99, 'LOGIN_SUCCESS', 'worker@motoqfox.com', '127.0.0.1', '2026-04-06 11:02:31.863514-06', '', 3);
INSERT INTO public.users_login_audit_log VALUES (100, 'LOGIN_SUCCESS', 'jefemecanico@gmail.com', '127.0.0.1', '2026-04-06 11:11:55.361988-06', '', 14);
INSERT INTO public.users_login_audit_log VALUES (101, 'LOGIN_SUCCESS', 'mecanico@gmail.com', '127.0.0.1', '2026-04-06 16:07:34.930507-06', '', 15);
INSERT INTO public.users_login_audit_log VALUES (102, 'LOGIN_SUCCESS', 'mecanico@gmail.com', '127.0.0.1', '2026-04-06 16:15:46.420224-06', '', 15);
INSERT INTO public.users_login_audit_log VALUES (103, 'LOGIN_SUCCESS', 'cashier@motoqfox.com', '127.0.0.1', '2026-04-08 11:36:10.245812-06', '', 4);
INSERT INTO public.users_login_audit_log VALUES (104, 'LOGIN_SUCCESS', 'jefemecanico@gmail.com', '127.0.0.1', '2026-04-08 11:37:47.471785-06', '', 14);
INSERT INTO public.users_login_audit_log VALUES (105, 'LOGIN_SUCCESS', 'mecanico@gmail.com', '127.0.0.1', '2026-04-08 11:38:14.156955-06', '', 15);
INSERT INTO public.users_login_audit_log VALUES (106, 'LOGIN_SUCCESS', 'cashier@motoqfox.com', '127.0.0.1', '2026-04-08 12:01:59.284765-06', '', 4);


--
-- Name: users_login_audit_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_login_audit_log_id_seq', 106, true);


--
-- PostgreSQL database dump complete
--


-- -----------------------------------------------------------------------------
-- Tabla: users_password_reset_tokens  (1 filas)
-- -----------------------------------------------------------------------------
--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: users_password_reset_tokens; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.users_password_reset_tokens VALUES (2, 'e33cc13a-00f7-449c-9112-f0bd42c2631c', '2026-03-02 13:41:08.013131-06', '2026-03-02 14:41:08.013131-06', true, 10);


--
-- Name: users_password_reset_tokens_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_password_reset_tokens_id_seq', 2, true);


--
-- PostgreSQL database dump complete
--


-- -----------------------------------------------------------------------------
-- Tabla: inventory_marcas_fabricante  (11 filas)
-- -----------------------------------------------------------------------------
--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: inventory_marcas_fabricante; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.inventory_marcas_fabricante VALUES (1, 'NGK', 'AFTERMARKET', 'Japón', true);
INSERT INTO public.inventory_marcas_fabricante VALUES (2, 'AHL', 'AFTERMARKET', 'China', true);
INSERT INTO public.inventory_marcas_fabricante VALUES (3, 'BREMBO', 'AFTERMARKET', 'Italia', true);
INSERT INTO public.inventory_marcas_fabricante VALUES (4, 'EBC', 'AFTERMARKET', 'Reino Unido', true);
INSERT INTO public.inventory_marcas_fabricante VALUES (5, 'Motul', 'AFTERMARKET', 'Francia', true);
INSERT INTO public.inventory_marcas_fabricante VALUES (6, 'Bardahl', 'AFTERMARKET', 'México', true);
INSERT INTO public.inventory_marcas_fabricante VALUES (7, 'Mobil', 'AFTERMARKET', 'EUA', true);
INSERT INTO public.inventory_marcas_fabricante VALUES (8, 'OEM Honda', 'OEM', 'Japón', true);
INSERT INTO public.inventory_marcas_fabricante VALUES (9, 'OEM Yamaha', 'OEM', 'Japón', true);
INSERT INTO public.inventory_marcas_fabricante VALUES (10, 'OEM Italika', 'OEM', 'México', true);
INSERT INTO public.inventory_marcas_fabricante VALUES (11, 'Genérico', 'GENERICO', '', true);


--
-- Name: inventory_marcas_fabricante_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.inventory_marcas_fabricante_id_seq', 11, true);


--
-- PostgreSQL database dump complete
--


-- -----------------------------------------------------------------------------
-- Tabla: inventory_categorias  (12 filas)
-- -----------------------------------------------------------------------------
--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: inventory_categorias; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.inventory_categorias VALUES (1, 'Motor', 'Categoría: Motor', true, '2026-02-27 13:32:56.471964-06');
INSERT INTO public.inventory_categorias VALUES (2, 'Transmisión', 'Categoría: Transmisión', true, '2026-02-27 13:32:56.510554-06');
INSERT INTO public.inventory_categorias VALUES (3, 'Frenos', 'Categoría: Frenos', true, '2026-02-27 13:32:56.531554-06');
INSERT INTO public.inventory_categorias VALUES (4, 'Suspensión', 'Categoría: Suspensión', true, '2026-02-27 13:32:56.557554-06');
INSERT INTO public.inventory_categorias VALUES (5, 'Sistema Eléctrico', 'Categoría: Sistema Eléctrico', true, '2026-02-27 13:32:56.577553-06');
INSERT INTO public.inventory_categorias VALUES (6, 'Sistema de Combustible', 'Categoría: Sistema de Combustible', true, '2026-02-27 13:32:56.60986-06');
INSERT INTO public.inventory_categorias VALUES (7, 'Carrocería y Plásticos', 'Categoría: Carrocería y Plásticos', true, '2026-02-27 13:32:56.63086-06');
INSERT INTO public.inventory_categorias VALUES (8, 'Ruedas y Llantas', 'Categoría: Ruedas y Llantas', true, '2026-02-27 13:32:56.653861-06');
INSERT INTO public.inventory_categorias VALUES (9, 'Escape', 'Categoría: Escape', true, '2026-02-27 13:32:56.675264-06');
INSERT INTO public.inventory_categorias VALUES (10, 'Lubricantes y Fluidos', 'Categoría: Lubricantes y Fluidos', true, '2026-02-27 13:32:56.686347-06');
INSERT INTO public.inventory_categorias VALUES (11, 'Accesorios y Ergonomía', 'Categoría: Accesorios y Ergonomía', true, '2026-02-27 13:32:56.705896-06');
INSERT INTO public.inventory_categorias VALUES (12, 'Kits y Mantenimiento', 'Categoría: Kits y Mantenimiento', true, '2026-02-27 13:32:56.722898-06');


--
-- Name: inventory_categorias_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.inventory_categorias_id_seq', 12, true);


--
-- PostgreSQL database dump complete
--


-- -----------------------------------------------------------------------------
-- Tabla: inventory_subcategorias  (80 filas)
-- -----------------------------------------------------------------------------
--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: inventory_subcategorias; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.inventory_subcategorias VALUES (1, 'Pistón y Segmentos', 'Motor › Pistón y Segmentos', true, '2026-02-27 13:32:56.484001-06', 1);
INSERT INTO public.inventory_subcategorias VALUES (2, 'Cilindro y Cabeza', 'Motor › Cilindro y Cabeza', true, '2026-02-27 13:32:56.488001-06', 1);
INSERT INTO public.inventory_subcategorias VALUES (3, 'Válvulas y Muelles', 'Motor › Válvulas y Muelles', true, '2026-02-27 13:32:56.491001-06', 1);
INSERT INTO public.inventory_subcategorias VALUES (4, 'Cigüeñal y Biela', 'Motor › Cigüeñal y Biela', true, '2026-02-27 13:32:56.494001-06', 1);
INSERT INTO public.inventory_subcategorias VALUES (5, 'Árbol de Levas', 'Motor › Árbol de Levas', true, '2026-02-27 13:32:56.496515-06', 1);
INSERT INTO public.inventory_subcategorias VALUES (6, 'Empaques y Retenes', 'Motor › Empaques y Retenes', true, '2026-02-27 13:32:56.498554-06', 1);
INSERT INTO public.inventory_subcategorias VALUES (7, 'Filtro de Aceite', 'Motor › Filtro de Aceite', true, '2026-02-27 13:32:56.501554-06', 1);
INSERT INTO public.inventory_subcategorias VALUES (8, 'Tapón de Aceite', 'Motor › Tapón de Aceite', true, '2026-02-27 13:32:56.504554-06', 1);
INSERT INTO public.inventory_subcategorias VALUES (9, 'Kit de Motor Completo', 'Motor › Kit de Motor Completo', true, '2026-02-27 13:32:56.507554-06', 1);
INSERT INTO public.inventory_subcategorias VALUES (10, 'Cadena de Transmisión', 'Transmisión › Cadena de Transmisión', true, '2026-02-27 13:32:56.513554-06', 2);
INSERT INTO public.inventory_subcategorias VALUES (11, 'Piñón Delantero', 'Transmisión › Piñón Delantero', true, '2026-02-27 13:32:56.515554-06', 2);
INSERT INTO public.inventory_subcategorias VALUES (12, 'Corona Trasera', 'Transmisión › Corona Trasera', true, '2026-02-27 13:32:56.518554-06', 2);
INSERT INTO public.inventory_subcategorias VALUES (13, 'Kit Cadena + Piñones', 'Transmisión › Kit Cadena + Piñones', true, '2026-02-27 13:32:56.521553-06', 2);
INSERT INTO public.inventory_subcategorias VALUES (14, 'Clutch (Discos, Plato, Resortes)', 'Transmisión › Clutch (Discos, Plato, Resortes)', true, '2026-02-27 13:32:56.523554-06', 2);
INSERT INTO public.inventory_subcategorias VALUES (15, 'Cable de Clutch', 'Transmisión › Cable de Clutch', true, '2026-02-27 13:32:56.526554-06', 2);
INSERT INTO public.inventory_subcategorias VALUES (16, 'CVT / Correa (automáticas)', 'Transmisión › CVT / Correa (automáticas)', true, '2026-02-27 13:32:56.529554-06', 2);
INSERT INTO public.inventory_subcategorias VALUES (17, 'Balatas / Pastillas Delanteras', 'Frenos › Balatas / Pastillas Delanteras', true, '2026-02-27 13:32:56.534554-06', 3);
INSERT INTO public.inventory_subcategorias VALUES (18, 'Balatas / Pastillas Traseras', 'Frenos › Balatas / Pastillas Traseras', true, '2026-02-27 13:32:56.537553-06', 3);
INSERT INTO public.inventory_subcategorias VALUES (19, 'Disco de Freno Delantero', 'Frenos › Disco de Freno Delantero', true, '2026-02-27 13:32:56.540554-06', 3);
INSERT INTO public.inventory_subcategorias VALUES (20, 'Disco de Freno Trasero', 'Frenos › Disco de Freno Trasero', true, '2026-02-27 13:32:56.543556-06', 3);
INSERT INTO public.inventory_subcategorias VALUES (21, 'Zapatas de Tambor', 'Frenos › Zapatas de Tambor', true, '2026-02-27 13:32:56.546554-06', 3);
INSERT INTO public.inventory_subcategorias VALUES (22, 'Cilindro Maestro', 'Frenos › Cilindro Maestro', true, '2026-02-27 13:32:56.549554-06', 3);
INSERT INTO public.inventory_subcategorias VALUES (23, 'Manguera de Freno', 'Frenos › Manguera de Freno', true, '2026-02-27 13:32:56.552554-06', 3);
INSERT INTO public.inventory_subcategorias VALUES (24, 'Líquido de Frenos', 'Frenos › Líquido de Frenos', true, '2026-02-27 13:32:56.555554-06', 3);
INSERT INTO public.inventory_subcategorias VALUES (25, 'Horquilla Delantera (par)', 'Suspensión › Horquilla Delantera (par)', true, '2026-02-27 13:32:56.560554-06', 4);
INSERT INTO public.inventory_subcategorias VALUES (26, 'Amortiguador Trasero (par)', 'Suspensión › Amortiguador Trasero (par)', true, '2026-02-27 13:32:56.563554-06', 4);
INSERT INTO public.inventory_subcategorias VALUES (27, 'Resorte de Horquilla', 'Suspensión › Resorte de Horquilla', true, '2026-02-27 13:32:56.565554-06', 4);
INSERT INTO public.inventory_subcategorias VALUES (28, 'Aceite de Horquilla', 'Suspensión › Aceite de Horquilla', true, '2026-02-27 13:32:56.568554-06', 4);
INSERT INTO public.inventory_subcategorias VALUES (29, 'Buje / Bocín', 'Suspensión › Buje / Bocín', true, '2026-02-27 13:32:56.571554-06', 4);
INSERT INTO public.inventory_subcategorias VALUES (30, 'Brazo Oscilante', 'Suspensión › Brazo Oscilante', true, '2026-02-27 13:32:56.574554-06', 4);
INSERT INTO public.inventory_subcategorias VALUES (31, 'Batería', 'Sistema Eléctrico › Batería', true, '2026-02-27 13:32:56.582307-06', 5);
INSERT INTO public.inventory_subcategorias VALUES (32, 'Bujía', 'Sistema Eléctrico › Bujía', true, '2026-02-27 13:32:56.584307-06', 5);
INSERT INTO public.inventory_subcategorias VALUES (33, 'Bobina de Encendido', 'Sistema Eléctrico › Bobina de Encendido', true, '2026-02-27 13:32:56.587307-06', 5);
INSERT INTO public.inventory_subcategorias VALUES (34, 'CDI / Módulo de Encendido', 'Sistema Eléctrico › CDI / Módulo de Encendido', true, '2026-02-27 13:32:56.589307-06', 5);
INSERT INTO public.inventory_subcategorias VALUES (35, 'Regulador / Rectificador', 'Sistema Eléctrico › Regulador / Rectificador', true, '2026-02-27 13:32:56.592308-06', 5);
INSERT INTO public.inventory_subcategorias VALUES (36, 'Faros y Ópticas', 'Sistema Eléctrico › Faros y Ópticas', true, '2026-02-27 13:32:56.596307-06', 5);
INSERT INTO public.inventory_subcategorias VALUES (37, 'Interruptores / Switchera', 'Sistema Eléctrico › Interruptores / Switchera', true, '2026-02-27 13:32:56.59886-06', 5);
INSERT INTO public.inventory_subcategorias VALUES (38, 'Arnés de Cableado', 'Sistema Eléctrico › Arnés de Cableado', true, '2026-02-27 13:32:56.60186-06', 5);
INSERT INTO public.inventory_subcategorias VALUES (39, 'Relay y Fusibles', 'Sistema Eléctrico › Relay y Fusibles', true, '2026-02-27 13:32:56.604861-06', 5);
INSERT INTO public.inventory_subcategorias VALUES (40, 'Sensores', 'Sistema Eléctrico › Sensores', true, '2026-02-27 13:32:56.60686-06', 5);
INSERT INTO public.inventory_subcategorias VALUES (41, 'Carburador Completo', 'Sistema de Combustible › Carburador Completo', true, '2026-02-27 13:32:56.61286-06', 6);
INSERT INTO public.inventory_subcategorias VALUES (42, 'Kit de Reparación Carburador', 'Sistema de Combustible › Kit de Reparación Carburador', true, '2026-02-27 13:32:56.61586-06', 6);
INSERT INTO public.inventory_subcategorias VALUES (43, 'Filtro de Gasolina', 'Sistema de Combustible › Filtro de Gasolina', true, '2026-02-27 13:32:56.61886-06', 6);
INSERT INTO public.inventory_subcategorias VALUES (44, 'Llave de Paso', 'Sistema de Combustible › Llave de Paso', true, '2026-02-27 13:32:56.62086-06', 6);
INSERT INTO public.inventory_subcategorias VALUES (45, 'Bomba de Gasolina', 'Sistema de Combustible › Bomba de Gasolina', true, '2026-02-27 13:32:56.62386-06', 6);
INSERT INTO public.inventory_subcategorias VALUES (46, 'Depósito / Tanque', 'Sistema de Combustible › Depósito / Tanque', true, '2026-02-27 13:32:56.62686-06', 6);
INSERT INTO public.inventory_subcategorias VALUES (47, 'Carenado Frontal', 'Carrocería y Plásticos › Carenado Frontal', true, '2026-02-27 13:32:56.63386-06', 7);
INSERT INTO public.inventory_subcategorias VALUES (48, 'Carenado Lateral', 'Carrocería y Plásticos › Carenado Lateral', true, '2026-02-27 13:32:56.63686-06', 7);
INSERT INTO public.inventory_subcategorias VALUES (49, 'Cubrecadena', 'Carrocería y Plásticos › Cubrecadena', true, '2026-02-27 13:32:56.63886-06', 7);
INSERT INTO public.inventory_subcategorias VALUES (50, 'Guardafango Delantero', 'Carrocería y Plásticos › Guardafango Delantero', true, '2026-02-27 13:32:56.64186-06', 7);
INSERT INTO public.inventory_subcategorias VALUES (51, 'Guardafango Trasero', 'Carrocería y Plásticos › Guardafango Trasero', true, '2026-02-27 13:32:56.64486-06', 7);
INSERT INTO public.inventory_subcategorias VALUES (52, 'Asiento / Cojín', 'Carrocería y Plásticos › Asiento / Cojín', true, '2026-02-27 13:32:56.64686-06', 7);
INSERT INTO public.inventory_subcategorias VALUES (53, 'Portabultos / Parrilla', 'Carrocería y Plásticos › Portabultos / Parrilla', true, '2026-02-27 13:32:56.64986-06', 7);
INSERT INTO public.inventory_subcategorias VALUES (54, 'Espejo Retrovisor', 'Carrocería y Plásticos › Espejo Retrovisor', true, '2026-02-27 13:32:56.65186-06', 7);
INSERT INTO public.inventory_subcategorias VALUES (55, 'Rin Delantero', 'Ruedas y Llantas › Rin Delantero', true, '2026-02-27 13:32:56.656884-06', 8);
INSERT INTO public.inventory_subcategorias VALUES (56, 'Rin Trasero', 'Ruedas y Llantas › Rin Trasero', true, '2026-02-27 13:32:56.65986-06', 8);
INSERT INTO public.inventory_subcategorias VALUES (57, 'Llanta Delantera', 'Ruedas y Llantas › Llanta Delantera', true, '2026-02-27 13:32:56.66286-06', 8);
INSERT INTO public.inventory_subcategorias VALUES (58, 'Llanta Trasera', 'Ruedas y Llantas › Llanta Trasera', true, '2026-02-27 13:32:56.66486-06', 8);
INSERT INTO public.inventory_subcategorias VALUES (59, 'Cámara Delantera', 'Ruedas y Llantas › Cámara Delantera', true, '2026-02-27 13:32:56.66786-06', 8);
INSERT INTO public.inventory_subcategorias VALUES (60, 'Cámara Trasera', 'Ruedas y Llantas › Cámara Trasera', true, '2026-02-27 13:32:56.66986-06', 8);
INSERT INTO public.inventory_subcategorias VALUES (61, 'Rayos y Niples', 'Ruedas y Llantas › Rayos y Niples', true, '2026-02-27 13:32:56.67286-06', 8);
INSERT INTO public.inventory_subcategorias VALUES (62, 'Tubo de Escape', 'Escape › Tubo de Escape', true, '2026-02-27 13:32:56.678304-06', 9);
INSERT INTO public.inventory_subcategorias VALUES (63, 'Silenciador / Muffler', 'Escape › Silenciador / Muffler', true, '2026-02-27 13:32:56.681304-06', 9);
INSERT INTO public.inventory_subcategorias VALUES (64, 'Empaque de Escape', 'Escape › Empaque de Escape', true, '2026-02-27 13:32:56.684343-06', 9);
INSERT INTO public.inventory_subcategorias VALUES (65, 'Aceite Motor 4T', 'Lubricantes y Fluidos › Aceite Motor 4T', true, '2026-02-27 13:32:56.690346-06', 10);
INSERT INTO public.inventory_subcategorias VALUES (66, 'Aceite Motor 2T', 'Lubricantes y Fluidos › Aceite Motor 2T', true, '2026-02-27 13:32:56.696343-06', 10);
INSERT INTO public.inventory_subcategorias VALUES (67, 'Filtro de Aceite', 'Lubricantes y Fluidos › Filtro de Aceite', true, '2026-02-27 13:32:56.698896-06', 10);
INSERT INTO public.inventory_subcategorias VALUES (68, 'Filtro de Aire', 'Lubricantes y Fluidos › Filtro de Aire', true, '2026-02-27 13:32:56.701896-06', 10);
INSERT INTO public.inventory_subcategorias VALUES (69, 'Refrigerante / Anticongelante', 'Lubricantes y Fluidos › Refrigerante / Anticongelante', true, '2026-02-27 13:32:56.703897-06', 10);
INSERT INTO public.inventory_subcategorias VALUES (70, 'Manubrio / Manillar', 'Accesorios y Ergonomía › Manubrio / Manillar', true, '2026-02-27 13:32:56.708896-06', 11);
INSERT INTO public.inventory_subcategorias VALUES (71, 'Puños / Grips', 'Accesorios y Ergonomía › Puños / Grips', true, '2026-02-27 13:32:56.711897-06', 11);
INSERT INTO public.inventory_subcategorias VALUES (72, 'Pedal de Freno', 'Accesorios y Ergonomía › Pedal de Freno', true, '2026-02-27 13:32:56.714896-06', 11);
INSERT INTO public.inventory_subcategorias VALUES (73, 'Pedal de Cambio', 'Accesorios y Ergonomía › Pedal de Cambio', true, '2026-02-27 13:32:56.717896-06', 11);
INSERT INTO public.inventory_subcategorias VALUES (74, 'Palancas', 'Accesorios y Ergonomía › Palancas', true, '2026-02-27 13:32:56.720897-06', 11);
INSERT INTO public.inventory_subcategorias VALUES (75, 'Kit de Carburación', 'Kits y Mantenimiento › Kit de Carburación', true, '2026-02-27 13:32:56.725899-06', 12);
INSERT INTO public.inventory_subcategorias VALUES (76, 'Kit de Empaques', 'Kits y Mantenimiento › Kit de Empaques', true, '2026-02-27 13:32:56.728901-06', 12);
INSERT INTO public.inventory_subcategorias VALUES (77, 'Kit de Filtros', 'Kits y Mantenimiento › Kit de Filtros', true, '2026-02-27 13:32:56.730896-06', 12);
INSERT INTO public.inventory_subcategorias VALUES (78, 'Kit de Frenos', 'Kits y Mantenimiento › Kit de Frenos', true, '2026-02-27 13:32:56.733897-06', 12);
INSERT INTO public.inventory_subcategorias VALUES (79, 'Kit de Cadena', 'Kits y Mantenimiento › Kit de Cadena', true, '2026-02-27 13:32:56.736906-06', 12);
INSERT INTO public.inventory_subcategorias VALUES (80, 'Kit de Servicio', 'Kits y Mantenimiento › Kit de Servicio', true, '2026-02-27 13:32:56.738897-06', 12);


--
-- Name: inventory_subcategorias_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.inventory_subcategorias_id_seq', 80, true);


--
-- PostgreSQL database dump complete
--


-- -----------------------------------------------------------------------------
-- Tabla: inventory_marcas_moto  (8 filas)
-- -----------------------------------------------------------------------------
--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: inventory_marcas_moto; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.inventory_marcas_moto VALUES (1, 'Italika', true);
INSERT INTO public.inventory_marcas_moto VALUES (2, 'Honda', true);
INSERT INTO public.inventory_marcas_moto VALUES (3, 'Yamaha', true);
INSERT INTO public.inventory_marcas_moto VALUES (4, 'Suzuki', true);
INSERT INTO public.inventory_marcas_moto VALUES (5, 'Carabela', true);
INSERT INTO public.inventory_marcas_moto VALUES (6, 'Vento', true);
INSERT INTO public.inventory_marcas_moto VALUES (7, 'Benelli', true);
INSERT INTO public.inventory_marcas_moto VALUES (8, 'Bajaj', true);


--
-- Name: inventory_marcas_moto_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.inventory_marcas_moto_id_seq', 8, true);


--
-- PostgreSQL database dump complete
--


-- -----------------------------------------------------------------------------
-- Tabla: inventory_modelos_moto  (26 filas)
-- -----------------------------------------------------------------------------
--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: inventory_modelos_moto; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.inventory_modelos_moto VALUES (1, 'FT125', 2015, NULL, 125, '4T', 'CARGO', true, 1);
INSERT INTO public.inventory_modelos_moto VALUES (2, 'FT150', 2018, NULL, 150, '4T', 'CARGO', true, 1);
INSERT INTO public.inventory_modelos_moto VALUES (3, 'DT125', 2015, NULL, 125, '4T', 'CARGO', true, 1);
INSERT INTO public.inventory_modelos_moto VALUES (4, 'WS150', 2018, NULL, 150, '4T', 'NAKED', true, 1);
INSERT INTO public.inventory_modelos_moto VALUES (5, 'TC200', 2020, NULL, 200, '4T', 'NAKED', true, 1);
INSERT INTO public.inventory_modelos_moto VALUES (6, 'X150', 2018, NULL, 150, '4T', 'DEPORTIVA', true, 1);
INSERT INTO public.inventory_modelos_moto VALUES (7, 'AT110', 2016, NULL, 110, '4T', 'SCOOTER', true, 1);
INSERT INTO public.inventory_modelos_moto VALUES (8, 'CB125F', 2019, NULL, 125, '4T', 'NAKED', true, 2);
INSERT INTO public.inventory_modelos_moto VALUES (9, 'CB190R', 2018, NULL, 190, '4T', 'NAKED', true, 2);
INSERT INTO public.inventory_modelos_moto VALUES (10, 'XR125L', 2016, NULL, 125, '4T', 'OFF_ROAD', true, 2);
INSERT INTO public.inventory_modelos_moto VALUES (11, 'Wave 110', 2017, NULL, 110, '4T', 'CARGO', true, 2);
INSERT INTO public.inventory_modelos_moto VALUES (12, 'PCX150', 2018, NULL, 150, '4T', 'SCOOTER', true, 2);
INSERT INTO public.inventory_modelos_moto VALUES (13, 'YBR125', 2015, NULL, 125, '4T', 'NAKED', true, 3);
INSERT INTO public.inventory_modelos_moto VALUES (14, 'FZ15', 2018, NULL, 150, '4T', 'NAKED', true, 3);
INSERT INTO public.inventory_modelos_moto VALUES (15, 'XT125X', 2016, NULL, 125, '4T', 'OFF_ROAD', true, 3);
INSERT INTO public.inventory_modelos_moto VALUES (16, 'FZ25', 2019, NULL, 250, '4T', 'NAKED', true, 3);
INSERT INTO public.inventory_modelos_moto VALUES (17, 'GN125', 2015, NULL, 125, '4T', 'NAKED', true, 4);
INSERT INTO public.inventory_modelos_moto VALUES (18, 'GS150', 2018, NULL, 150, '4T', 'NAKED', true, 4);
INSERT INTO public.inventory_modelos_moto VALUES (19, 'TT125', 2016, NULL, 125, '4T', 'CARGO', true, 5);
INSERT INTO public.inventory_modelos_moto VALUES (20, 'Runner200', 2019, NULL, 200, '4T', 'NAKED', true, 5);
INSERT INTO public.inventory_modelos_moto VALUES (21, 'Crossmax125', 2017, NULL, 125, '4T', 'NAKED', true, 6);
INSERT INTO public.inventory_modelos_moto VALUES (22, 'TNT15N', 2019, NULL, 150, '4T', 'NAKED', true, 7);
INSERT INTO public.inventory_modelos_moto VALUES (23, 'TRK251', 2020, NULL, 250, '4T', 'NAKED', true, 7);
INSERT INTO public.inventory_modelos_moto VALUES (24, 'Pulsar NS125', 2019, NULL, 125, '4T', 'DEPORTIVA', true, 8);
INSERT INTO public.inventory_modelos_moto VALUES (25, 'Pulsar NS200', 2018, NULL, 200, '4T', 'DEPORTIVA', true, 8);
INSERT INTO public.inventory_modelos_moto VALUES (26, 'CT100', 2016, NULL, 100, '4T', 'CARGO', true, 8);


--
-- Name: inventory_modelos_moto_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.inventory_modelos_moto_id_seq', 26, true);


--
-- PostgreSQL database dump complete
--


-- -----------------------------------------------------------------------------
-- Tabla: inventory_productos  (20 filas)
-- -----------------------------------------------------------------------------
--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: inventory_productos; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.inventory_productos VALUES (8, 'ACEITE-BARDAHL-4T-20W50-1L', 'Aceite Motor Bardahl 4T 20W-50 1 Litro', 'Aceite mineral para motores 4T. Ideal para clima cálido. Protección antidesgaste.', 95.00, 38.00, true, '2026-02-27 13:32:57.073567-06', '2026-03-26 12:17:49.866742-06', 10, '7501017600011', false, false, '', '', NULL, 76.00, 'AFTERMARKET', 'C-01-1-B', 'LITRO', 6, NULL, 'media/products/Bardahl_Aceite_para_Motos_Recreativas_y_de_Trabajo_4T_z2dhl3');
INSERT INTO public.inventory_productos VALUES (10, 'DISCO-DEL-ITALIKA-WS150', 'Disco de Freno Delantero Italika WS150', 'Disco ventilado de 220mm. Acero inoxidable. Para modelos WS150 y TC200.', 250.00, 100.00, true, '2026-02-27 13:32:57.101949-06', '2026-03-26 12:18:33.718187-06', 3, '7501234567899', false, false, '', '45251-GBY-901', NULL, 200.00, 'AFTERMARKET', 'A-01-3-A', 'PIEZA', 2, NULL, 'media/products/Disco_de_Freno_Delantero_Italika_WS150_v80etp');
INSERT INTO public.inventory_productos VALUES (14, 'FILT-AIRE-ITALIKA-FT125', 'Filtro de Aire Italika FT125', 'Filtro de espuma para caja de filtro original. Evita la entrada de polvo al carburador.', 55.00, 22.00, true, '2026-02-27 13:32:57.19074-06', '2026-03-26 12:20:27.804894-06', 1, '7501234567903', false, false, '', 'ITA-FT125-AIR-FILTER', NULL, 44.00, 'OEM', 'A-02-1-B', 'PIEZA', 10, NULL, 'media/products/Filtro_de_Aire_Italika_FT125_bk7ihr');
INSERT INTO public.inventory_productos VALUES (4, 'FILT-ACE-ITALIKA-FT125', 'Filtro de Aceite Italika FT125/DT125', 'Filtro de aceite OEM para motores Italika de 125cc. Reemplazos cada 2,000 km.', 65.00, 28.00, true, '2026-02-27 13:32:56.998568-06', '2026-03-26 12:15:19.189427-06', 1, '7501234567894', false, false, '', 'ITA-FT125-OIL-FILTER', NULL, 52.00, 'OEM', 'A-02-1-A', 'PIEZA', 10, NULL, 'media/products/Filtro_de_Aceite_Italika_FT125-DT125_git10e');
INSERT INTO public.inventory_productos VALUES (13, 'BATERIA-YTX5L-BS', 'Batería YTX5L-BS 12V 5Ah', 'Batería sellada libre de mantenimiento. 12V 5Ah. Para motos de 110-150cc.', 380.00, 152.00, true, '2026-02-27 13:32:57.160668-06', '2026-03-26 12:19:56.173861-06', 5, '7501234567902', false, false, '', 'YTX5L-BS', NULL, 304.00, 'AFTERMARKET', 'B-01-1-A', 'PIEZA', 11, NULL, 'media/products/Batería_YTX5L-BS_12V_5Ah_b55uxq');
INSERT INTO public.inventory_productos VALUES (6, 'KIT-CADEN-ITALIKA-FT125', 'Kit Cadena + Piñones Italika FT125', 'Kit completo: cadena 428H 120E + piñón delantero 15T + corona trasera 39T.', 380.00, 152.00, true, '2026-02-27 13:32:57.044568-06', '2026-03-26 12:16:15.353499-06', 2, '7501234567896', false, false, '', '', NULL, 304.00, 'AFTERMARKET', 'A-03-1-B', 'KIT', 2, NULL, 'media/products/Kit_Cadena__Piñones_Italika_FT125_aigmw9');
INSERT INTO public.inventory_productos VALUES (12, 'CABLE-CLUTCH-ITALIKA', 'Chicote de Clutch Universal Italika', 'Cable de embrague para modelos FT125, DT125 y WT150. Longitud 120cm.', 85.00, 34.00, true, '2026-02-27 13:32:57.135668-06', '2026-03-26 12:19:25.201174-06', 2, '7501234567901', false, false, '', '', NULL, 68.00, 'AFTERMARKET', 'A-03-2-A', 'PIEZA', 11, NULL, 'media/products/Cable_de_Clutch_Universal_Italika_vtpwkd');
INSERT INTO public.inventory_productos VALUES (19, 'CDI-ITALIKA-FT125', 'CDI / Módulo de Encendido Italika FT125', 'Unidad CDI de repuesto para Italika FT125 y DT125. Equivalente al original.', 180.00, 72.00, true, '2026-02-27 13:32:57.27008-06', '2026-03-26 12:23:23.348565-06', 5, '7501234567908', false, false, '', '30400-GGY-901', NULL, 144.00, 'AFTERMARKET', 'B-01-2-A', 'PIEZA', 11, NULL, 'media/products/CDI_Módulo_de_Encendido_Italika_FT125_u2pkaq');
INSERT INTO public.inventory_productos VALUES (11, 'CARB-KEIHIN-PB16', 'Carburador PB16 tipo Keihin', 'Carburador de 16mm compatible con la mayoría de scooters y motos 50-110cc automáticas.', 350.00, 140.00, true, '2026-02-27 13:32:57.121668-06', '2026-03-26 12:18:52.805976-06', 6, '7501234567900', false, false, '', '', NULL, 280.00, 'AFTERMARKET', 'B-03-1-A', 'PIEZA', 11, NULL, 'media/products/Carburador_PB16_tipo_Keihin_xgedhe');
INSERT INTO public.inventory_productos VALUES (5, 'CADENA-428H-120E', 'Cadena de Transmisión 428H 120 Eslabones', 'Cadena reforzada 428H para motos de trabajo y cargo. Incluye remache.', 180.00, 72.00, true, '2026-02-27 13:32:57.018584-06', '2026-03-26 12:15:42.124422-06', 2, '7501234567895', false, false, '', '40530-GGY-901', NULL, 144.00, 'AFTERMARKET', 'A-03-1-A', 'PIEZA', 2, NULL, 'media/products/cadena_de_transmisión__crut5i');
INSERT INTO public.inventory_productos VALUES (15, 'EMPAQUE-MOTOR-ITALIKA-FT125', 'Kit Empaques Motor Italika FT125', 'Juego completo de empaques: cabeza, cilindro, carter y tapa. Para overhaul de motor.', 220.00, 88.00, true, '2026-02-27 13:32:57.212094-06', '2026-03-26 12:21:02.549063-06', 1, '7501234567904', false, false, '', '', NULL, 176.00, 'AFTERMARKET', 'A-02-2-A', 'KIT', 11, NULL, 'media/products/Kit_Empaques_Motor_Italika_FT125_hi0n5r');
INSERT INTO public.inventory_productos VALUES (7, 'ACEITE-MOTUL-4T-10W40-1L', 'Aceite Motor Motul 4T 10W-40 1 Litro', 'Aceite semisintético para motores 4T. Viscosidad 10W-40. Protección máxima.', 145.00, 58.00, true, '2026-02-27 13:32:57.064567-06', '2026-03-26 12:16:48.877963-06', 10, '3374650229117', false, true, '', '', NULL, 116.00, 'AFTERMARKET', 'C-01-1-A', 'LITRO', 5, NULL, 'media/products/Aceite_Motor_Motul_4T_10W-40_1_Litro_xtrd2g');
INSERT INTO public.inventory_productos VALUES (20, 'KIT-FRENOS-ITALIKA-FT125', 'Kit de Frenos Completo Italika FT125', 'Kit: pastillas delanteras + pastillas traseras + líquido DOT3. Para mantenimiento preventivo.', 280.00, 112.00, true, '2026-02-27 13:32:57.290166-06', '2026-03-26 12:23:42.600513-06', 12, '7501234567909', false, false, '', '', NULL, 224.00, 'AFTERMARKET', 'A-01-4-A', 'KIT', 2, NULL, 'media/products/Kit_de_Frenos_Completo_Italika_FT125_erfvek');
INSERT INTO public.inventory_productos VALUES (16, 'PISTON-STD-ITALIKA-FT125', 'Pistón con Segmentos STD Italika FT125', 'Pistón diámetro 52.4mm STD con anillos de compresión y aceite. Material: aluminio forjado.', 450.00, 180.00, true, '2026-02-27 13:32:57.232079-06', '2026-03-26 12:22:03.697978-06', 1, '7501234567905', false, false, '', '13101-GGY-901', NULL, 360.00, 'AFTERMARKET', 'A-02-3-A', 'KIT', 11, NULL, 'media/products/Pistón_con_Segmentos_STD_Italika_FT125_k13eju');
INSERT INTO public.inventory_productos VALUES (17, 'LLANTA-DEL-275-17', 'Llanta Delantera 2.75-17 Tubo', 'Llanta con tubo para rin de 17". Diseño multiuso. Compatible con la mayoría de cargo 125-150cc.', 280.00, 112.00, true, '2026-02-27 13:32:57.252079-06', '2026-03-26 12:22:30.976482-06', 8, '7501234567906', false, true, '', '', NULL, 224.00, 'AFTERMARKET', 'D-01-1-A', 'PIEZA', 11, NULL, 'media/products/Llanta_Delantera_2.75-17_Tubo_qgevbe');
INSERT INTO public.inventory_productos VALUES (18, 'LLANTA-TRA-300-17', 'Llanta Trasera 3.00-17 Tubo', 'Llanta con tubo para rin trasero de 17". Para motos de carga y trabajo.', 320.00, 128.00, true, '2026-02-27 13:32:57.261079-06', '2026-03-26 12:22:49.867085-06', 8, '7501234567907', false, true, '', '', NULL, 256.00, 'AFTERMARKET', 'D-01-1-B', 'PIEZA', 11, NULL, 'media/products/Llanta_Trasera_3.00-17_Tubo_cqwpcq');
INSERT INTO public.inventory_productos VALUES (2, 'PAST-TRA-AHL-001', 'Pastilla de Freno Trasera AHL', 'Par de pastillas para freno de disco trasero. Compatible con modelos de 125cc a 150cc.', 110.00, 44.00, true, '2026-02-27 13:32:56.971294-06', '2026-03-26 12:14:32.730276-06', 3, '7501234567892', false, false, '', '43105-GBY-901', NULL, 88.00, 'AFTERMARKET', 'A-01-2-B', 'PAR', 2, NULL, 'media/products/Pastilla_de_Freno_Trasera_AHL_lxuo0x');
INSERT INTO public.inventory_productos VALUES (3, 'BUJIA-NGK-CR7HSA', 'Bujía NGK CR7HSA', 'Bujía original NGK para motores 4T de 110cc a 150cc. Electrodo de níquel.', 85.00, 32.00, true, '2026-02-27 13:32:56.990334-06', '2026-03-26 12:14:51.23799-06', 5, '7501234567893', false, true, '', 'CR7HSA', NULL, 68.00, 'AFTERMARKET', 'B-02-1-A', 'PIEZA', 1, NULL, 'media/products/Bujía_NGK_CR7HSA_qtt9v9');
INSERT INTO public.inventory_productos VALUES (9, 'AMORT-TRA-ITALIKA-FT125', 'Amortiguador Trasero Italika FT125 (par)', 'Par de amortiguadores traseros. Longitud 330mm. Compatible FT125 y DT125 2015+.', 320.00, 128.00, true, '2026-02-27 13:32:57.082621-06', '2026-03-26 12:18:10.021717-06', 4, '7501234567898', false, false, '', '52400-GGY-901', NULL, 256.00, 'AFTERMARKET', 'A-04-2-A', 'PAR', 2, NULL, 'media/products/Amortiguador_Trasero_Italika_FT125_par_zpevab');
INSERT INTO public.inventory_productos VALUES (1, 'PAST-DEL-AHL-001', 'Pastilla de Freno Delantera AHL', 'Par de pastillas semimetálicas para freno de disco hidráulico. Alta resistencia al calor.', 120.00, 48.00, true, '2026-02-27 13:32:56.939294-06', '2026-03-26 12:13:41.250813-06', 3, '7501234567891', false, false, '', '45105-GBY-901', NULL, 95.00, 'AFTERMARKET', 'A-01-2-A', 'PAR', 2, NULL, 'media/products/Pastilla_de_Freno_Delantera_AHL_essuwz');


--
-- Name: inventory_productos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.inventory_productos_id_seq', 20, true);


--
-- PostgreSQL database dump complete
--


-- -----------------------------------------------------------------------------
-- Tabla: inventory_compatibilidad_pieza  (37 filas)
-- -----------------------------------------------------------------------------
--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: inventory_compatibilidad_pieza; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.inventory_compatibilidad_pieza VALUES (1, NULL, NULL, '', 1, 1);
INSERT INTO public.inventory_compatibilidad_pieza VALUES (2, NULL, NULL, '', 1, 4);
INSERT INTO public.inventory_compatibilidad_pieza VALUES (3, NULL, NULL, '', 1, 8);
INSERT INTO public.inventory_compatibilidad_pieza VALUES (4, NULL, NULL, '', 2, 1);
INSERT INTO public.inventory_compatibilidad_pieza VALUES (5, NULL, NULL, '', 2, 4);
INSERT INTO public.inventory_compatibilidad_pieza VALUES (6, NULL, NULL, '', 4, 1);
INSERT INTO public.inventory_compatibilidad_pieza VALUES (7, NULL, NULL, '', 4, 3);
INSERT INTO public.inventory_compatibilidad_pieza VALUES (8, NULL, NULL, '', 5, 1);
INSERT INTO public.inventory_compatibilidad_pieza VALUES (9, NULL, NULL, '', 5, 3);
INSERT INTO public.inventory_compatibilidad_pieza VALUES (10, NULL, NULL, '', 5, 11);
INSERT INTO public.inventory_compatibilidad_pieza VALUES (11, NULL, NULL, '', 6, 1);
INSERT INTO public.inventory_compatibilidad_pieza VALUES (12, NULL, NULL, '', 6, 3);
INSERT INTO public.inventory_compatibilidad_pieza VALUES (13, NULL, NULL, '', 9, 1);
INSERT INTO public.inventory_compatibilidad_pieza VALUES (14, NULL, NULL, '', 9, 3);
INSERT INTO public.inventory_compatibilidad_pieza VALUES (15, NULL, NULL, '', 10, 4);
INSERT INTO public.inventory_compatibilidad_pieza VALUES (16, NULL, NULL, '', 10, 5);
INSERT INTO public.inventory_compatibilidad_pieza VALUES (17, NULL, NULL, '', 11, 7);
INSERT INTO public.inventory_compatibilidad_pieza VALUES (18, NULL, NULL, '', 12, 1);
INSERT INTO public.inventory_compatibilidad_pieza VALUES (19, NULL, NULL, '', 12, 3);
INSERT INTO public.inventory_compatibilidad_pieza VALUES (20, NULL, NULL, '', 12, 4);
INSERT INTO public.inventory_compatibilidad_pieza VALUES (21, NULL, NULL, '', 13, 1);
INSERT INTO public.inventory_compatibilidad_pieza VALUES (22, NULL, NULL, '', 13, 4);
INSERT INTO public.inventory_compatibilidad_pieza VALUES (23, NULL, NULL, '', 13, 8);
INSERT INTO public.inventory_compatibilidad_pieza VALUES (24, NULL, NULL, '', 13, 13);
INSERT INTO public.inventory_compatibilidad_pieza VALUES (25, NULL, NULL, '', 14, 1);
INSERT INTO public.inventory_compatibilidad_pieza VALUES (26, NULL, NULL, '', 14, 3);
INSERT INTO public.inventory_compatibilidad_pieza VALUES (27, NULL, NULL, '', 15, 1);
INSERT INTO public.inventory_compatibilidad_pieza VALUES (28, NULL, NULL, '', 15, 3);
INSERT INTO public.inventory_compatibilidad_pieza VALUES (29, NULL, NULL, '', 16, 1);
INSERT INTO public.inventory_compatibilidad_pieza VALUES (30, NULL, NULL, '', 16, 3);
INSERT INTO public.inventory_compatibilidad_pieza VALUES (31, NULL, NULL, '', 19, 1);
INSERT INTO public.inventory_compatibilidad_pieza VALUES (32, NULL, NULL, '', 19, 3);
INSERT INTO public.inventory_compatibilidad_pieza VALUES (33, NULL, NULL, '', 20, 1);
INSERT INTO public.inventory_compatibilidad_pieza VALUES (34, NULL, NULL, '', 20, 3);
INSERT INTO public.inventory_compatibilidad_pieza VALUES (35, NULL, NULL, '', 8, 8);
INSERT INTO public.inventory_compatibilidad_pieza VALUES (36, NULL, NULL, '', 8, 22);
INSERT INTO public.inventory_compatibilidad_pieza VALUES (37, NULL, NULL, '', 8, 24);


--
-- Name: inventory_compatibilidad_pieza_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.inventory_compatibilidad_pieza_id_seq', 37, true);


--
-- PostgreSQL database dump complete
--


-- -----------------------------------------------------------------------------
-- Tabla: inventory_stock  (23 filas)
-- -----------------------------------------------------------------------------
--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: inventory_stock; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.inventory_stock VALUES (2, 80, 5, '2026-03-02 13:47:54.060172-06', 3, 2);
INSERT INTO public.inventory_stock VALUES (4, 100, 5, '2026-03-03 21:15:54.346251-06', 9, 2);
INSERT INTO public.inventory_stock VALUES (5, 50, 5, '2026-03-03 21:16:15.736139-06', 13, 2);
INSERT INTO public.inventory_stock VALUES (6, 100, 5, '2026-03-03 21:16:36.491872-06', 12, 2);
INSERT INTO public.inventory_stock VALUES (7, 70, 5, '2026-03-03 21:16:57.633569-06', 5, 2);
INSERT INTO public.inventory_stock VALUES (8, 100, 5, '2026-03-03 21:17:16.278855-06', 11, 2);
INSERT INTO public.inventory_stock VALUES (9, 100, 5, '2026-03-03 21:17:37.911198-06', 19, 2);
INSERT INTO public.inventory_stock VALUES (3, 99, 5, '2026-03-03 21:04:51.558367-06', 7, 2);
INSERT INTO public.inventory_stock VALUES (1, 98, 5, '2026-03-01 21:30:30.859516-06', 8, 2);
INSERT INTO public.inventory_stock VALUES (12, 98, 5, '2026-03-12 14:12:36.240906-06', 3, 1);
INSERT INTO public.inventory_stock VALUES (11, 42, 5, '2026-03-09 12:46:07.180632-06', 9, 1);
INSERT INTO public.inventory_stock VALUES (10, 143, 5, '2026-03-26 12:27:19.631714-06', 8, 1);
INSERT INTO public.inventory_stock VALUES (24, 50, 5, '2026-04-08 12:32:18.39961-06', 1, 2);
INSERT INTO public.inventory_stock VALUES (25, 50, 5, '2026-04-08 12:32:18.402617-06', 2, 2);
INSERT INTO public.inventory_stock VALUES (26, 40, 5, '2026-04-08 12:32:18.405729-06', 4, 2);
INSERT INTO public.inventory_stock VALUES (27, 25, 3, '2026-04-08 12:32:18.408727-06', 6, 2);
INSERT INTO public.inventory_stock VALUES (28, 20, 3, '2026-04-08 12:32:18.41232-06', 10, 2);
INSERT INTO public.inventory_stock VALUES (29, 30, 5, '2026-04-08 12:32:18.41884-06', 14, 2);
INSERT INTO public.inventory_stock VALUES (30, 15, 2, '2026-04-08 12:32:18.42084-06', 15, 2);
INSERT INTO public.inventory_stock VALUES (31, 10, 2, '2026-04-08 12:32:18.421841-06', 16, 2);
INSERT INTO public.inventory_stock VALUES (32, 20, 3, '2026-04-08 12:32:18.424367-06', 17, 2);
INSERT INTO public.inventory_stock VALUES (33, 20, 3, '2026-04-08 12:32:18.426966-06', 18, 2);
INSERT INTO public.inventory_stock VALUES (34, 15, 2, '2026-04-08 12:32:18.429966-06', 20, 2);


--
-- Name: inventory_stock_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.inventory_stock_id_seq', 34, true);


--
-- PostgreSQL database dump complete
--


-- -----------------------------------------------------------------------------
-- Tabla: inventory_entradas  (16 filas)
-- -----------------------------------------------------------------------------
--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: inventory_entradas; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.inventory_entradas VALUES (1, 100, 95.00, '', '2026-03-01 21:30:30.840999-06', 2, 2, 8);
INSERT INTO public.inventory_entradas VALUES (2, 80, 60.00, '', '2026-03-02 13:47:54.041617-06', 2, 2, 3);
INSERT INTO public.inventory_entradas VALUES (3, 100, 145.00, '', '2026-03-03 21:04:51.547352-06', 2, 2, 7);
INSERT INTO public.inventory_entradas VALUES (4, 100, 120.00, '', '2026-03-03 21:15:54.336249-06', 2, 2, 9);
INSERT INTO public.inventory_entradas VALUES (5, 50, 380.00, '', '2026-03-03 21:16:15.728144-06', 2, 2, 13);
INSERT INTO public.inventory_entradas VALUES (6, 100, 85.00, '', '2026-03-03 21:16:36.48187-06', 2, 2, 12);
INSERT INTO public.inventory_entradas VALUES (7, 70, 180.00, '', '2026-03-03 21:16:57.624564-06', 2, 2, 5);
INSERT INTO public.inventory_entradas VALUES (8, 100, 350.00, '', '2026-03-03 21:17:16.271279-06', 2, 2, 11);
INSERT INTO public.inventory_entradas VALUES (9, 100, 125.00, '', '2026-03-03 21:17:37.904198-06', 2, 2, 19);
INSERT INTO public.inventory_entradas VALUES (10, 50, 100.00, '', '2026-03-09 12:42:05.898934-06', 7, 1, 8);
INSERT INTO public.inventory_entradas VALUES (11, 50, 320.00, '', '2026-03-09 12:46:07.168715-06', 7, 1, 9);
INSERT INTO public.inventory_entradas VALUES (12, 100, 85.00, '', '2026-03-12 14:12:36.215105-06', 7, 1, 3);
INSERT INTO public.inventory_entradas VALUES (13, 20, 95.00, '', '2026-03-25 10:53:09.200376-06', 7, 1, 8);
INSERT INTO public.inventory_entradas VALUES (14, 20, 95.00, '', '2026-03-25 10:53:26.061627-06', 7, 1, 8);
INSERT INTO public.inventory_entradas VALUES (15, 20, 95.00, '', '2026-03-25 10:53:53.272731-06', 7, 1, 8);
INSERT INTO public.inventory_entradas VALUES (16, 50, 95.00, '', '2026-03-26 12:27:19.618733-06', 7, 1, 8);


--
-- Name: inventory_entradas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.inventory_entradas_id_seq', 16, true);


--
-- PostgreSQL database dump complete
--


-- -----------------------------------------------------------------------------
-- Tabla: inventory_auditorias  (3 filas)
-- -----------------------------------------------------------------------------
--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: inventory_auditorias; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.inventory_auditorias VALUES (1, '2026-03-27', 'DRAFT', '2026-03-25 10:55:02.837249-06', '2026-03-25 10:55:02.837249-06', 2, 1, '');
INSERT INTO public.inventory_auditorias VALUES (2, '2026-03-25', 'DRAFT', '2026-03-25 11:13:27.506496-06', '2026-03-25 11:13:27.506496-06', 2, 1, 'revision de mes');
INSERT INTO public.inventory_auditorias VALUES (3, '2026-03-28', 'DRAFT', '2026-03-26 13:54:44.067256-06', '2026-03-26 13:54:44.067256-06', 2, 1, '');


--
-- Name: inventory_auditorias_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.inventory_auditorias_id_seq', 3, true);


--
-- PostgreSQL database dump complete
--


-- -----------------------------------------------------------------------------
-- Tabla: inventory_auditoria_items  (9 filas)
-- -----------------------------------------------------------------------------
--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: inventory_auditoria_items; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.inventory_auditoria_items VALUES (1, 49, NULL, 1, 9);
INSERT INTO public.inventory_auditoria_items VALUES (2, 100, NULL, 1, 3);
INSERT INTO public.inventory_auditoria_items VALUES (3, 105, NULL, 1, 8);
INSERT INTO public.inventory_auditoria_items VALUES (4, 49, NULL, 2, 9);
INSERT INTO public.inventory_auditoria_items VALUES (5, 100, NULL, 2, 3);
INSERT INTO public.inventory_auditoria_items VALUES (6, 105, NULL, 2, 8);
INSERT INTO public.inventory_auditoria_items VALUES (7, 152, NULL, 3, 8);
INSERT INTO public.inventory_auditoria_items VALUES (8, 100, NULL, 3, 3);
INSERT INTO public.inventory_auditoria_items VALUES (9, 47, NULL, 3, 9);


--
-- Name: inventory_auditoria_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.inventory_auditoria_items_id_seq', 9, true);


--
-- PostgreSQL database dump complete
--


-- -----------------------------------------------------------------------------
-- Tabla: customers_perfiles  (13 filas)
-- -----------------------------------------------------------------------------
--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: customers_perfiles; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.customers_perfiles VALUES (1, '7445514025', '2004-07-09', 'b4c82e8a-7ffc-42e3-ac65-6ce299eae845', '', 0, '2026-03-11 09:50:09.837913-06', 11);
INSERT INTO public.customers_perfiles VALUES (2, '1234567890', '2000-01-05', '746b1936-09f9-4b1e-bf80-75141a6367a7', '', 0, '2026-03-11 22:39:11.274878-06', 12);
INSERT INTO public.customers_perfiles VALUES (3, '7445514025', '2003-12-02', 'eeb4cb2d-5c70-4b53-88d5-00007fb44015', '', 0, '2026-03-12 12:29:31.739004-06', 13);
INSERT INTO public.customers_perfiles VALUES (4, '7445514026', NULL, '818b6995-f16d-40a3-95c2-f372a32d5509', '', 0, '2026-03-26 12:01:51.582316-06', 16);
INSERT INTO public.customers_perfiles VALUES (5, '7441050215', NULL, '6bc21bd0-0a9a-4bad-b119-5aed93214be8', '', 0, '2026-03-26 14:09:02.142156-06', 17);
INSERT INTO public.customers_perfiles VALUES (6, '7446789876', NULL, 'd2656c63-c3d4-4f84-9c17-dbfef7e2111a', '', 0, '2026-03-28 16:25:56.429994-06', 18);
INSERT INTO public.customers_perfiles VALUES (7, '7447855645', NULL, '0f056d5d-1917-44fe-a582-9ec31baa23ef', '', 0, '2026-03-30 10:34:29.662602-06', 19);
INSERT INTO public.customers_perfiles VALUES (8, '7446756789', NULL, 'd459d577-e17d-46b0-886d-9e60ebc33524', '', 0, '2026-04-01 10:35:23.393103-06', 20);
INSERT INTO public.customers_perfiles VALUES (9, '7445672321', NULL, 'ed970656-a4ec-46eb-9153-d6d957347588', '', 0, '2026-04-01 11:46:06.815033-06', 21);
INSERT INTO public.customers_perfiles VALUES (10, '7446789090', NULL, '246bdb83-e973-4374-9e8b-e526a04b480d', '', 0, '2026-04-01 11:52:03.345444-06', 22);
INSERT INTO public.customers_perfiles VALUES (11, '7446754312', NULL, '8a3ab6d9-0077-444b-b632-8325f22a9a2c', '', 0, '2026-04-06 11:45:54.371958-06', 23);
INSERT INTO public.customers_perfiles VALUES (12, '7440909876', NULL, 'b222b503-2478-4312-8c58-d2aa07db07c4', '', 0, '2026-04-06 16:05:18.599234-06', 24);
INSERT INTO public.customers_perfiles VALUES (13, '7446325432', NULL, 'aa21a60f-b9ef-4f97-9a5d-43b59e5ac41b', '', 0, '2026-04-06 16:16:42.162657-06', 25);


--
-- Name: customers_perfiles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.customers_perfiles_id_seq', 13, true);


--
-- PostgreSQL database dump complete
--


-- -----------------------------------------------------------------------------
-- Tabla: sales_codigos_apertura  (6 filas)
-- -----------------------------------------------------------------------------
--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: sales_codigos_apertura; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.sales_codigos_apertura VALUES (1, '979123', '2026-03-09 13:43:54.194075-06', '2026-03-09 13:13:54.19525-06', 7, 1);
INSERT INTO public.sales_codigos_apertura VALUES (2, '285973', '2026-03-10 09:02:27.084131-06', '2026-03-10 08:32:27.084131-06', 7, 1);
INSERT INTO public.sales_codigos_apertura VALUES (3, '342620', '2026-03-12 14:55:40.139381-06', '2026-03-12 14:25:40.139381-06', 7, 1);
INSERT INTO public.sales_codigos_apertura VALUES (4, '818529', '2026-03-16 16:12:19.428219-06', '2026-03-16 15:42:19.430642-06', 7, 1);
INSERT INTO public.sales_codigos_apertura VALUES (5, '283557', '2026-03-24 23:16:17.958369-06', '2026-03-24 22:46:17.958369-06', 7, 1);
INSERT INTO public.sales_codigos_apertura VALUES (6, '976925', '2026-03-25 11:31:43.438225-06', '2026-03-25 11:01:43.439224-06', 7, 1);


--
-- Name: sales_codigos_apertura_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.sales_codigos_apertura_id_seq', 6, true);


--
-- PostgreSQL database dump complete
--


-- -----------------------------------------------------------------------------
-- Tabla: sales_aperturas_caja  (6 filas)
-- -----------------------------------------------------------------------------
--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: sales_aperturas_caja; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.sales_aperturas_caja VALUES (1, '2026-03-09 13:14:06.513423-06', '2026-03-09 13:15:41.414789-06', 'CERRADA', 7, 4, 1, 1);
INSERT INTO public.sales_aperturas_caja VALUES (2, '2026-03-10 08:32:55.676465-06', '2026-03-12 14:25:03.430579-06', 'CERRADA', 7, 4, 1, 2);
INSERT INTO public.sales_aperturas_caja VALUES (3, '2026-03-12 14:26:08.422313-06', '2026-03-13 09:36:07.460169-06', 'CERRADA', 7, 4, 1, 3);
INSERT INTO public.sales_aperturas_caja VALUES (4, '2026-03-16 15:42:40.337347-06', '2026-03-24 22:43:34.042138-06', 'CERRADA', 7, 4, 1, 4);
INSERT INTO public.sales_aperturas_caja VALUES (5, '2026-03-24 22:46:28.57273-06', '2026-03-25 10:51:46.015639-06', 'CERRADA', 7, 4, 1, 5);
INSERT INTO public.sales_aperturas_caja VALUES (6, '2026-03-25 11:01:54.589262-06', NULL, 'ABIERTA', 7, 4, 1, 6);


--
-- Name: sales_aperturas_caja_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.sales_aperturas_caja_id_seq', 6, true);


--
-- PostgreSQL database dump complete
--


-- -----------------------------------------------------------------------------
-- Tabla: sales_ventas  (18 filas)
-- -----------------------------------------------------------------------------
--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: sales_ventas; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.sales_ventas VALUES (1, 240.00, 0.00, 240.00, 'EFECTIVO', 300.00, 60.00, 'COMPLETADA', '', '2026-03-03 21:19:25.185145-06', 10, 2, NULL, 0);
INSERT INTO public.sales_ventas VALUES (2, 95.00, 0.00, 95.00, 'TARJETA', 95.00, 0.00, 'COMPLETADA', '', '2026-03-03 21:20:41.70939-06', 10, 2, NULL, 0);
INSERT INTO public.sales_ventas VALUES (3, 95.00, 0.00, 95.00, 'EFECTIVO', 100.00, 5.00, 'COMPLETADA', '', '2026-03-09 13:14:40.732772-06', 4, 1, NULL, 0);
INSERT INTO public.sales_ventas VALUES (4, 95.00, 0.00, 95.00, 'EFECTIVO', 100.00, 5.00, 'COMPLETADA', '', '2026-03-10 09:17:26.188018-06', 4, 1, NULL, 0);
INSERT INTO public.sales_ventas VALUES (5, 95.00, 0.00, 95.00, 'EFECTIVO', 200.00, 105.00, 'COMPLETADA', '', '2026-03-12 14:14:54.76586-06', 4, 1, NULL, 0);
INSERT INTO public.sales_ventas VALUES (6, 95.00, 0.00, 95.00, 'EFECTIVO', 100.00, 5.00, 'COMPLETADA', '', '2026-03-13 09:35:22.648511-06', 4, 1, NULL, 0);
INSERT INTO public.sales_ventas VALUES (7, 320.00, 0.00, 320.00, 'EFECTIVO', 400.00, 80.00, 'COMPLETADA', '', '2026-03-13 09:35:37.216425-06', 4, 1, NULL, 0);
INSERT INTO public.sales_ventas VALUES (8, 95.00, 0.00, 95.00, 'EFECTIVO', 300.00, 205.00, 'COMPLETADA', '', '2026-03-13 09:35:53.396033-06', 4, 1, NULL, 0);
INSERT INTO public.sales_ventas VALUES (9, 95.00, 0.00, 95.00, 'EFECTIVO', 100.00, 5.00, 'COMPLETADA', '', '2026-03-25 11:23:37.529735-06', 4, 1, NULL, 0);
INSERT INTO public.sales_ventas VALUES (10, 95.00, 0.00, 95.00, 'TARJETA', 95.00, 0.00, 'COMPLETADA', '', '2026-03-25 11:43:28.442035-06', 4, 1, NULL, 0);
INSERT INTO public.sales_ventas VALUES (11, 915.00, 0.00, 915.00, 'EFECTIVO', 1000.00, 85.00, 'COMPLETADA', 'Servicio de taller — SVC-20260326-0001', '2026-03-26 12:11:26.153062-06', 4, 1, 4, 0);
INSERT INTO public.sales_ventas VALUES (12, 510.00, 0.00, 510.00, 'EFECTIVO', 600.00, 90.00, 'COMPLETADA', '', '2026-03-26 14:00:36.117594-06', 4, 1, NULL, 0);
INSERT INTO public.sales_ventas VALUES (13, 925.06, 0.00, 925.06, 'EFECTIVO', 1000.00, 74.94, 'COMPLETADA', 'Servicio de taller — SVC-20260326-0002', '2026-03-26 14:14:18.186811-06', 4, 1, 5, 0);
INSERT INTO public.sales_ventas VALUES (14, 415.00, 0.00, 415.00, 'EFECTIVO', 450.00, 35.00, 'COMPLETADA', '', '2026-03-28 16:13:45.054209-06', 4, 1, NULL, 0);
INSERT INTO public.sales_ventas VALUES (15, 320.00, 0.00, 320.00, 'EFECTIVO', 340.00, 20.00, 'COMPLETADA', '', '2026-03-28 16:15:02.124983-06', 4, 1, NULL, 0);
INSERT INTO public.sales_ventas VALUES (16, 595.00, 0.00, 595.00, 'EFECTIVO', 600.00, 5.00, 'COMPLETADA', 'Servicio de taller — SVC-20260328-0001', '2026-03-28 16:29:22.186697-06', 4, 1, 6, 0);
INSERT INTO public.sales_ventas VALUES (17, 95.00, 0.00, 95.00, 'EFECTIVO', 100.00, 5.00, 'COMPLETADA', 'Servicio de taller — SVC-20260328-0002', '2026-03-28 16:46:05.03904-06', 4, 1, 3, 0);
INSERT INTO public.sales_ventas VALUES (18, 595.00, 0.00, 595.00, 'EFECTIVO', 600.00, 5.00, 'COMPLETADA', 'Servicio de taller — SVC-20260330-0001', '2026-03-30 10:37:25.911399-06', 4, 1, 7, 0);


--
-- Name: sales_ventas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.sales_ventas_id_seq', 19, true);


--
-- PostgreSQL database dump complete
--


-- -----------------------------------------------------------------------------
-- Tabla: sales_venta_items  (16 filas)
-- -----------------------------------------------------------------------------
--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: sales_venta_items; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.sales_venta_items VALUES (1, 1, 95.00, 95.00, 8, 1, NULL, 'PRODUCTO');
INSERT INTO public.sales_venta_items VALUES (2, 1, 145.00, 145.00, 7, 1, NULL, 'PRODUCTO');
INSERT INTO public.sales_venta_items VALUES (3, 1, 95.00, 95.00, 8, 2, NULL, 'PRODUCTO');
INSERT INTO public.sales_venta_items VALUES (4, 1, 95.00, 95.00, 8, 3, NULL, 'PRODUCTO');
INSERT INTO public.sales_venta_items VALUES (5, 1, 95.00, 95.00, 8, 4, NULL, 'PRODUCTO');
INSERT INTO public.sales_venta_items VALUES (6, 1, 95.00, 95.00, 8, 5, NULL, 'PRODUCTO');
INSERT INTO public.sales_venta_items VALUES (7, 1, 95.00, 95.00, 8, 6, NULL, 'PRODUCTO');
INSERT INTO public.sales_venta_items VALUES (8, 1, 320.00, 320.00, 9, 7, NULL, 'PRODUCTO');
INSERT INTO public.sales_venta_items VALUES (9, 1, 95.00, 95.00, 8, 8, NULL, 'PRODUCTO');
INSERT INTO public.sales_venta_items VALUES (10, 1, 95.00, 95.00, 8, 9, NULL, 'PRODUCTO');
INSERT INTO public.sales_venta_items VALUES (11, 1, 95.00, 95.00, 8, 10, NULL, 'PRODUCTO');
INSERT INTO public.sales_venta_items VALUES (12, 2, 95.00, 190.00, 8, 12, NULL, 'PRODUCTO');
INSERT INTO public.sales_venta_items VALUES (13, 1, 320.00, 320.00, 9, 12, NULL, 'PRODUCTO');
INSERT INTO public.sales_venta_items VALUES (14, 1, 95.00, 95.00, 8, 14, NULL, 'PRODUCTO');
INSERT INTO public.sales_venta_items VALUES (15, 1, 320.00, 320.00, 9, 14, NULL, 'PRODUCTO');
INSERT INTO public.sales_venta_items VALUES (16, 1, 320.00, 320.00, 9, 15, NULL, 'PRODUCTO');


--
-- Name: sales_venta_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.sales_venta_items_id_seq', 16, true);


--
-- PostgreSQL database dump complete
--


-- -----------------------------------------------------------------------------
-- Tabla: sales_reportes_caja  (3 filas)
-- -----------------------------------------------------------------------------
--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: sales_reportes_caja; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.sales_reportes_caja VALUES (1, 'reportes_caja/2026/03/reporte_1_4_20260313_0936.pdf', 3, 0, 510.00, 510.00, 0.00, 0.00, 0.00, '2026-03-13 09:36:07.716709-06', 3);
INSERT INTO public.sales_reportes_caja VALUES (2, 'reportes_caja/2026/03/reporte_1_4_20260324_2243.pdf', 0, 0, 0.00, 0.00, 0.00, 0.00, 0.00, '2026-03-24 22:43:34.695814-06', 4);
INSERT INTO public.sales_reportes_caja VALUES (3, 'reportes_caja/2026/03/reporte_1_4_20260325_1051.pdf', 0, 0, 0.00, 0.00, 0.00, 0.00, 0.00, '2026-03-25 10:51:46.499088-06', 5);


--
-- Name: sales_reportes_caja_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.sales_reportes_caja_id_seq', 3, true);


--
-- PostgreSQL database dump complete
--


-- -----------------------------------------------------------------------------
-- Tabla: pedidos_bodega  (2 filas)
-- -----------------------------------------------------------------------------
--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: pedidos_bodega; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.pedidos_bodega VALUES (1, 'rapido porfis', 'ENTREGADO', '2026-03-11 23:12:57.350933-06', '2026-03-11 23:13:14.025985-06', 4, 1);
INSERT INTO public.pedidos_bodega VALUES (2, '', 'ENTREGADO', '2026-03-12 14:17:37.131716-06', '2026-03-12 14:18:06.449848-06', 4, 1);


--
-- Name: pedidos_bodega_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.pedidos_bodega_id_seq', 2, true);


--
-- PostgreSQL database dump complete
--


-- -----------------------------------------------------------------------------
-- Tabla: pedidos_bodega_items  (2 filas)
-- -----------------------------------------------------------------------------
--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: pedidos_bodega_items; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.pedidos_bodega_items VALUES (1, 1, 'C-01-1-B', 1, 8);
INSERT INTO public.pedidos_bodega_items VALUES (2, 1, 'C-01-1-B', 2, 8);


--
-- Name: pedidos_bodega_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.pedidos_bodega_items_id_seq', 2, true);


--
-- PostgreSQL database dump complete
--


-- -----------------------------------------------------------------------------
-- Tabla: taller_motos_cliente  (8 filas)
-- -----------------------------------------------------------------------------
--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: taller_motos_cliente; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.taller_motos_cliente VALUES (1, 'Yamaha', 'YZF-R3', 2025, 'ABD-8272', 'azul', '', '2026-03-26 12:03:27.515156-06', 4, '18278127812787128712');
INSERT INTO public.taller_motos_cliente VALUES (2, 'Yamaha', 'YZF-R3', 2020, '', 'azul', '', '2026-03-26 14:11:15.919775-06', 5, 'JSBSVSVT3');
INSERT INTO public.taller_motos_cliente VALUES (3, 'Italika', 'FT150', 2020, 'ADDRD7', 'rojo', '', '2026-03-28 16:27:30.817565-06', 6, 'YGYUGGGUYGUGU6G');
INSERT INTO public.taller_motos_cliente VALUES (4, 'Italika', 'FT150', 2020, 'HBKHBH', 'hkbhbkh', '', '2026-03-28 16:41:57.405715-06', 3, '7Y8G8G6GG6G6G');
INSERT INTO public.taller_motos_cliente VALUES (5, 'Italika', 'FT150', 2015, '87971UGH', 'azul', '', '2026-03-30 10:36:11.482016-06', 7, 'KHBGYGYGYGG');
INSERT INTO public.taller_motos_cliente VALUES (6, 'Italika', 'FT150', 2020, '1111111111', 'azul', '', '2026-04-01 11:59:52.585719-06', 10, '11111111111111111');
INSERT INTO public.taller_motos_cliente VALUES (7, 'Italika', 'WS175', 2020, 'ASUGHUAHSU', 'Azul', '', '2026-04-06 16:06:17.459921-06', 12, 'NABJSJAJASHJHJJHA');
INSERT INTO public.taller_motos_cliente VALUES (8, 'Yamaha', 'YZF-R3', 2020, '2332232323', 'Negra', '', '2026-04-06 16:18:00.774491-06', 13, '22323232322322323');


--
-- Name: taller_motos_cliente_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.taller_motos_cliente_id_seq', 8, true);


--
-- PostgreSQL database dump complete
--


-- -----------------------------------------------------------------------------
-- Tabla: taller_servicios  (8 filas)
-- -----------------------------------------------------------------------------
--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: taller_servicios; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.taller_servicios VALUES (1, 'SVC-20260326-0001', 'Mantenimiento', 'ENTREGADO', 'PAGADO', 500.00, 415.00, 915.00, 'EFECTIVO', 1000.00, 85.00, true, '2026-03-26 12:03:27.538107-06', '2026-03-26 12:04:39.399731-06', '2026-03-26 12:11:15.377421-06', '2026-03-26 12:11:26.115036-06', 14, 4, 4, 15, 1, 1, '["Casco incluido", "Llave de repuesto"]', '2026-03-27', 'ahi chequenle', false, '', '', true, 4, '2026-03-26 12:12:13.486272-06', '77099ba5-1e08-41e3-9851-1591d7193dc1', false, NULL);
INSERT INTO public.taller_servicios VALUES (2, 'SVC-20260326-0002', 'cambio de amortiguadores', 'ENTREGADO', 'PAGADO', 200.00, 725.06, 925.06, 'EFECTIVO', 1000.00, 74.94, true, '2026-03-26 14:11:15.941333-06', NULL, '2026-03-26 14:13:59.434819-06', '2026-03-26 14:14:18.151056-06', 14, 4, 5, 15, 2, 1, '["Casco incluido", "Llave de repuesto", "Kilometraje registrado"]', '2026-03-26', '', true, '', '', true, 4, '2026-03-26 14:15:10.723233-06', '269e4717-e37c-48a7-80a9-07399309d96b', false, NULL);
INSERT INTO public.taller_servicios VALUES (4, 'SVC-20260328-0002', 'Reparaciones', 'ENTREGADO', 'PAGADO', 0.00, 95.00, 95.00, 'EFECTIVO', 100.00, 5.00, true, '2026-03-28 16:41:57.421722-06', '2026-03-28 16:42:08.153086-06', '2026-03-28 16:45:27.887274-06', '2026-03-28 16:46:05.010499-06', 14, 4, 3, 15, 4, 1, '[]', NULL, '', false, '', '', true, 4, '2026-04-01 10:32:32.163162-06', '6470a308-1ced-4f4a-b21d-60d0f6aacc7f', false, NULL);
INSERT INTO public.taller_servicios VALUES (5, 'SVC-20260330-0001', 'Mantenimiento', 'ENTREGADO', 'PAGADO', 500.00, 95.00, 595.00, 'EFECTIVO', 600.00, 5.00, true, '2026-03-30 10:36:11.509482-06', '2026-03-30 10:36:26.430877-06', '2026-03-30 10:37:16.103718-06', '2026-03-30 10:37:25.868896-06', 14, 4, 7, 15, 5, 1, '["Casco incluido"]', '2026-03-30', 'checalo wey', false, '', '', true, 4, '2026-04-01 10:32:32.163162-06', '1b10855c-49e8-4877-9ab9-03aeceb95b4e', false, NULL);
INSERT INTO public.taller_servicios VALUES (3, 'SVC-20260328-0001', 'Mantenimiento', 'ENTREGADO', 'PAGADO', 500.00, 95.00, 595.00, 'EFECTIVO', 600.00, 5.00, true, '2026-03-28 16:27:30.834565-06', '2026-03-28 16:28:03.791647-06', '2026-03-28 16:29:10.359922-06', '2026-03-28 16:29:22.160681-06', 14, 4, 6, 15, 3, 1, '["Casco incluido"]', '2026-03-28', 'checale wey', false, '', '', true, 4, '2026-04-01 10:32:32.163162-06', '191aa4cc-12a8-40f9-bb57-91ee9fdc5cf5', false, NULL);
INSERT INTO public.taller_servicios VALUES (6, 'SVC-20260401-0001', 'Mantenimiento', 'RECIBIDO', 'PAGADO', 500.00, 95.00, 595.00, 'EFECTIVO', 600.00, 5.00, false, '2026-04-01 11:59:52.616455-06', NULL, NULL, NULL, NULL, 4, 10, NULL, 6, 1, '["Casco incluido"]', '2026-04-01', '', false, '', '', false, NULL, NULL, 'f6cfb108-dd97-4242-b687-e23783823313', false, NULL);
INSERT INTO public.taller_servicios VALUES (8, 'SVC-20260406-0002', 'ruido en motor', 'LISTA_PARA_ENTREGAR', 'PENDIENTE_PAGO', 200.00, 95.00, 295.00, NULL, NULL, NULL, false, '2026-04-06 16:18:00.79062-06', NULL, NULL, NULL, 14, 4, 13, 15, 8, 1, '["Casco incluido"]', '2026-04-06', 'checale bien', true, '', '', false, NULL, NULL, '63acfca7-c484-4591-b57b-23487bcc2f7b', false, NULL);
INSERT INTO public.taller_servicios VALUES (7, 'SVC-20260406-0001', 'Reparaciones', 'LISTA_PARA_ENTREGAR', 'PENDIENTE_PAGO', 200.00, 0.00, 200.00, NULL, NULL, NULL, false, '2026-04-06 16:06:17.476676-06', '2026-04-06 16:06:38.803832-06', NULL, NULL, 14, 4, 12, 15, 7, 1, '["Casco incluido"]', '2026-04-06', 'checa bien we', false, '', '', false, NULL, NULL, 'e1e1379b-298f-41a6-bcd4-f704cb4fa063', false, NULL);


--
-- Name: taller_servicios_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.taller_servicios_id_seq', 8, true);


--
-- PostgreSQL database dump complete
--


-- -----------------------------------------------------------------------------
-- Tabla: taller_servicio_items  (9 filas)
-- -----------------------------------------------------------------------------
--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: taller_servicio_items; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.taller_servicio_items VALUES (1, 'REFACCION', 'Aceite Motor Bardahl 4T 20W-50 1 Litro', 1, 95.00, 95.00, true, '2026-03-26 12:03:27.54915-06', 4, 8, 1);
INSERT INTO public.taller_servicio_items VALUES (2, 'EXTRA', 'Amortiguador Trasero Italika FT125 (par)', 1, 320.00, 320.00, true, '2026-03-26 12:05:48.748615-06', 4, 9, 1);
INSERT INTO public.taller_servicio_items VALUES (3, 'REFACCION', 'Amortiguador Trasero Italika FT125 (par)', 2, 320.03, 640.06, true, '2026-03-26 14:11:15.946868-06', 4, 9, 2);
INSERT INTO public.taller_servicio_items VALUES (4, 'EXTRA', 'Bujía NGK CR7HSA', 1, 85.00, 85.00, true, '2026-03-26 14:13:30.748464-06', 4, 3, 2);
INSERT INTO public.taller_servicio_items VALUES (5, 'REFACCION', 'Aceite Motor Bardahl 4T 20W-50 1 Litro', 1, 95.00, 95.00, true, '2026-03-28 16:27:30.845065-06', 4, 8, 3);
INSERT INTO public.taller_servicio_items VALUES (6, 'EXTRA', 'Aceite Motor Bardahl 4T 20W-50 1 Litro', 1, 95.00, 95.00, true, '2026-03-28 16:44:29.119894-06', 4, 8, 4);
INSERT INTO public.taller_servicio_items VALUES (7, 'REFACCION', 'Aceite Motor Bardahl 4T 20W-50 1 Litro', 1, 95.00, 95.00, true, '2026-03-30 10:36:11.524066-06', 4, 8, 5);
INSERT INTO public.taller_servicio_items VALUES (8, 'REFACCION', 'Aceite Motor Bardahl 4T 20W-50 1 Litro', 1, 95.00, 95.00, true, '2026-04-01 11:59:52.631589-06', 4, 8, 6);
INSERT INTO public.taller_servicio_items VALUES (9, 'EXTRA', 'Aceite Motor Bardahl 4T 20W-50 1 Litro', 1, 95.00, 95.00, true, '2026-04-06 16:19:15.837959-06', 4, 8, 8);


--
-- Name: taller_servicio_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.taller_servicio_items_id_seq', 9, true);


--
-- PostgreSQL database dump complete
--


-- -----------------------------------------------------------------------------
-- Tabla: taller_solicitudes_extra  (4 filas)
-- -----------------------------------------------------------------------------
--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: taller_solicitudes_extra; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.taller_solicitudes_extra VALUES (1, 1, 'es que la chinge', 'APROBADA', '2026-03-26 12:05:37.878708-06', '2026-03-26 12:05:48.758082-06', 15, 9, 4, 1);
INSERT INTO public.taller_solicitudes_extra VALUES (2, 1, 'esta quemada', 'APROBADA', '2026-03-26 14:13:08.786091-06', '2026-03-26 14:13:30.761314-06', 15, 3, 4, 2);
INSERT INTO public.taller_solicitudes_extra VALUES (3, 1, 'se dañaron los amortiguadors', 'APROBADA', '2026-03-28 16:44:16.722436-06', '2026-03-28 16:44:29.123891-06', 15, 8, 4, 4);
INSERT INTO public.taller_solicitudes_extra VALUES (4, 1, 'ocupa para un servicio', 'APROBADA', '2026-04-06 16:18:54.866283-06', '2026-04-06 16:19:15.843465-06', 15, 8, 4, 8);


--
-- Name: taller_solicitudes_extra_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.taller_solicitudes_extra_id_seq', 4, true);


--
-- PostgreSQL database dump complete
--


-- -----------------------------------------------------------------------------
-- Tabla: catalogo_servicios_categoriaservicio  (8 filas)
-- -----------------------------------------------------------------------------
--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: catalogo_servicios_categoriaservicio; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.catalogo_servicios_categoriaservicio VALUES (1, 'Mantenimiento General', '', true);
INSERT INTO public.catalogo_servicios_categoriaservicio VALUES (2, 'Mecanica General', 'Reparaciones.', true);
INSERT INTO public.catalogo_servicios_categoriaservicio VALUES (9, 'Mantenimiento Preventivo', '', true);
INSERT INTO public.catalogo_servicios_categoriaservicio VALUES (10, 'Transmision', '', true);
INSERT INTO public.catalogo_servicios_categoriaservicio VALUES (11, 'Frenos y Suspension', '', true);
INSERT INTO public.catalogo_servicios_categoriaservicio VALUES (12, 'Sistema Electrico', '', true);
INSERT INTO public.catalogo_servicios_categoriaservicio VALUES (13, 'Motor y Mecanica', '', true);
INSERT INTO public.catalogo_servicios_categoriaservicio VALUES (14, 'Diagnostico y Revision', '', true);


--
-- Name: catalogo_servicios_categoriaservicio_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.catalogo_servicios_categoriaservicio_id_seq', 14, true);


--
-- PostgreSQL database dump complete
--


-- -----------------------------------------------------------------------------
-- Tabla: catalogo_servicios_catalogoservicio  (20 filas)
-- -----------------------------------------------------------------------------
--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: catalogo_servicios_catalogoservicio; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.catalogo_servicios_catalogoservicio VALUES (1, 'Mantenimiento', 'Mantenimiento preventivo', 500.00, 90, true, '2026-03-26 11:56:43.705834-06', '2026-03-26 11:56:43.705834-06', 2, 1);
INSERT INTO public.catalogo_servicios_catalogoservicio VALUES (2, 'Reparaciones', 'Reparaciones de Mecanica en general', NULL, NULL, true, '2026-03-26 14:08:01.614788-06', '2026-03-26 14:08:01.614788-06', 2, 2);
INSERT INTO public.catalogo_servicios_catalogoservicio VALUES (21, 'Cambio de aceite y filtro', '', 150.00, 30, true, '2026-04-08 12:32:22.083899-06', '2026-04-08 12:32:22.083899-06', NULL, 9);
INSERT INTO public.catalogo_servicios_catalogoservicio VALUES (22, 'Cambio de bujia', '', 80.00, 20, true, '2026-04-08 12:32:22.085897-06', '2026-04-08 12:32:22.085897-06', NULL, 9);
INSERT INTO public.catalogo_servicios_catalogoservicio VALUES (23, 'Ajuste de carburador', '', 200.00, 45, true, '2026-04-08 12:32:22.087899-06', '2026-04-08 12:32:22.087899-06', NULL, 9);
INSERT INTO public.catalogo_servicios_catalogoservicio VALUES (24, 'Revision general 20 puntos', '', 300.00, 60, true, '2026-04-08 12:32:22.08991-06', '2026-04-08 12:32:22.09091-06', NULL, 9);
INSERT INTO public.catalogo_servicios_catalogoservicio VALUES (25, 'Cambio de cadena y pinones', '', 350.00, 60, true, '2026-04-08 12:32:22.093911-06', '2026-04-08 12:32:22.093911-06', NULL, 10);
INSERT INTO public.catalogo_servicios_catalogoservicio VALUES (26, 'Ajuste de clutch', '', 120.00, 30, true, '2026-04-08 12:32:22.095908-06', '2026-04-08 12:32:22.095908-06', NULL, 10);
INSERT INTO public.catalogo_servicios_catalogoservicio VALUES (27, 'Cambio de pastillas delanteras', '', 180.00, 45, true, '2026-04-08 12:32:22.099908-06', '2026-04-08 12:32:22.099908-06', NULL, 11);
INSERT INTO public.catalogo_servicios_catalogoservicio VALUES (28, 'Cambio de pastillas traseras', '', 180.00, 45, true, '2026-04-08 12:32:22.101908-06', '2026-04-08 12:32:22.101908-06', NULL, 11);
INSERT INTO public.catalogo_servicios_catalogoservicio VALUES (29, 'Ajuste de frenos traseros', '', 100.00, 20, true, '2026-04-08 12:32:22.105022-06', '2026-04-08 12:32:22.105022-06', NULL, 11);
INSERT INTO public.catalogo_servicios_catalogoservicio VALUES (30, 'Cambio de amortiguadores traseros', '', 400.00, 90, true, '2026-04-08 12:32:22.107037-06', '2026-04-08 12:32:22.107037-06', NULL, 11);
INSERT INTO public.catalogo_servicios_catalogoservicio VALUES (31, 'Cambio de llanta delantera', '', 250.00, 40, true, '2026-04-08 12:32:22.109036-06', '2026-04-08 12:32:22.109036-06', NULL, 11);
INSERT INTO public.catalogo_servicios_catalogoservicio VALUES (32, 'Cambio de llanta trasera', '', 280.00, 50, true, '2026-04-08 12:32:22.111038-06', '2026-04-08 12:32:22.111038-06', NULL, 11);
INSERT INTO public.catalogo_servicios_catalogoservicio VALUES (33, 'Diagnostico electrico', '', 200.00, 60, true, '2026-04-08 12:32:22.115141-06', '2026-04-08 12:32:22.115141-06', NULL, 12);
INSERT INTO public.catalogo_servicios_catalogoservicio VALUES (34, 'Cambio de bateria', '', 100.00, 20, true, '2026-04-08 12:32:22.11714-06', '2026-04-08 12:32:22.11714-06', NULL, 12);
INSERT INTO public.catalogo_servicios_catalogoservicio VALUES (35, 'Cambio de bujia de encendido', '', 80.00, 15, true, '2026-04-08 12:32:22.12014-06', '2026-04-08 12:32:22.12014-06', NULL, 12);
INSERT INTO public.catalogo_servicios_catalogoservicio VALUES (36, 'Overhaul de motor 125cc', '', 2500.00, 480, true, '2026-04-08 12:32:22.124321-06', '2026-04-08 12:32:22.124321-06', NULL, 13);
INSERT INTO public.catalogo_servicios_catalogoservicio VALUES (37, 'Cambio de piston y segmentos', '', 800.00, 180, true, '2026-04-08 12:32:22.126322-06', '2026-04-08 12:32:22.126322-06', NULL, 13);
INSERT INTO public.catalogo_servicios_catalogoservicio VALUES (38, 'Diagnostico por computadora', '', 250.00, 45, true, '2026-04-08 12:32:22.130122-06', '2026-04-08 12:32:22.130122-06', NULL, 14);


--
-- Name: catalogo_servicios_catalogoservicio_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.catalogo_servicios_catalogoservicio_id_seq', 38, true);


--
-- PostgreSQL database dump complete
--

-- Tabla catalogo_servicios_catalogoserviciorefaccion: sin datos


-- -----------------------------------------------------------------------------
-- Tabla: catalogo_servicios_precioserviciosede  (19 filas)
-- -----------------------------------------------------------------------------
--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: catalogo_servicios_precioserviciosede; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.catalogo_servicios_precioserviciosede VALUES (20, 250.00, true, '2026-04-08 12:32:22.139135-06', 2, 38);
INSERT INTO public.catalogo_servicios_precioserviciosede VALUES (21, 100.00, true, '2026-04-08 12:32:22.141248-06', 2, 29);
INSERT INTO public.catalogo_servicios_precioserviciosede VALUES (22, 400.00, true, '2026-04-08 12:32:22.144248-06', 2, 30);
INSERT INTO public.catalogo_servicios_precioserviciosede VALUES (23, 250.00, true, '2026-04-08 12:32:22.145249-06', 2, 31);
INSERT INTO public.catalogo_servicios_precioserviciosede VALUES (24, 280.00, true, '2026-04-08 12:32:22.147249-06', 2, 32);
INSERT INTO public.catalogo_servicios_precioserviciosede VALUES (25, 180.00, true, '2026-04-08 12:32:22.149246-06', 2, 27);
INSERT INTO public.catalogo_servicios_precioserviciosede VALUES (26, 180.00, true, '2026-04-08 12:32:22.152247-06', 2, 28);
INSERT INTO public.catalogo_servicios_precioserviciosede VALUES (27, 500.00, true, '2026-04-08 12:32:22.153759-06', 2, 1);
INSERT INTO public.catalogo_servicios_precioserviciosede VALUES (28, 200.00, true, '2026-04-08 12:32:22.15577-06', 2, 23);
INSERT INTO public.catalogo_servicios_precioserviciosede VALUES (29, 150.00, true, '2026-04-08 12:32:22.157773-06', 2, 21);
INSERT INTO public.catalogo_servicios_precioserviciosede VALUES (30, 80.00, true, '2026-04-08 12:32:22.15977-06', 2, 22);
INSERT INTO public.catalogo_servicios_precioserviciosede VALUES (31, 300.00, true, '2026-04-08 12:32:22.161775-06', 2, 24);
INSERT INTO public.catalogo_servicios_precioserviciosede VALUES (32, 800.00, true, '2026-04-08 12:32:22.163771-06', 2, 37);
INSERT INTO public.catalogo_servicios_precioserviciosede VALUES (33, 2500.00, true, '2026-04-08 12:32:22.165956-06', 2, 36);
INSERT INTO public.catalogo_servicios_precioserviciosede VALUES (34, 100.00, true, '2026-04-08 12:32:22.167573-06', 2, 34);
INSERT INTO public.catalogo_servicios_precioserviciosede VALUES (35, 80.00, true, '2026-04-08 12:32:22.169586-06', 2, 35);
INSERT INTO public.catalogo_servicios_precioserviciosede VALUES (36, 200.00, true, '2026-04-08 12:32:22.171586-06', 2, 33);
INSERT INTO public.catalogo_servicios_precioserviciosede VALUES (37, 120.00, true, '2026-04-08 12:32:22.174107-06', 2, 26);
INSERT INTO public.catalogo_servicios_precioserviciosede VALUES (38, 350.00, true, '2026-04-08 12:32:22.176231-06', 2, 25);


--
-- Name: catalogo_servicios_precioserviciosede_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.catalogo_servicios_precioserviciosede_id_seq', 38, true);


--
-- PostgreSQL database dump complete
--


-- -----------------------------------------------------------------------------
-- Tabla: billing_config_fiscal_sede  (2 filas)
-- -----------------------------------------------------------------------------
--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: billing_config_fiscal_sede; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.billing_config_fiscal_sede VALUES (1, 'Moto Q Fox', 'Moto Q Fox', '1234560000000', 'av. Ejido calzada pie de la cuesta #6', '7445514025', 'motoqfox@gmail.com', '', 'Gracias por su compra. Este documento no es una factura fiscal.', '2026-03-10 09:16:47.386972-06', '2026-03-10 09:16:47.386972-06', 1, 16.00);
INSERT INTO public.billing_config_fiscal_sede VALUES (3, 'Moto Q Fox - Sucursal Norte', 'Moto Q Fox S.A. de C.V.', 'MQF000000000', 'Av. Ejido, Colonia Hoogar moderno', '7445514025', 'norte@motoqfox.com', '', 'Gracias por su compra. Este documento no es una factura fiscal.', '2026-04-08 12:32:18.381602-06', '2026-04-08 12:32:18.381602-06', 2, 16.00);


--
-- Name: billing_config_fiscal_sede_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.billing_config_fiscal_sede_id_seq', 3, true);


--
-- PostgreSQL database dump complete
--


-- =============================================================================
--  Reactivar constraints
-- =============================================================================
SET session_replication_role = DEFAULT;

-- =============================================================================
--  Actualizar secuencias (auto-increment)
--  Ejecutar después de cargar los datos para que los nuevos registros
--  no colisionen con los IDs importados.
-- =============================================================================
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT
      tc.table_name,
      kcu.column_name,
      pg_get_serial_sequence(tc.table_name, kcu.column_name) AS seq_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.columns c
      ON kcu.table_name = c.table_name
      AND kcu.column_name = c.column_name
    WHERE tc.constraint_type = 'PRIMARY KEY'
      AND c.column_default LIKE 'nextval%'
      AND tc.table_schema = 'public'
  LOOP
    IF r.seq_name IS NOT NULL THEN
      EXECUTE format(
        'SELECT setval(%L, COALESCE((SELECT MAX(%I) FROM %I), 0) + 1, false)',
        r.seq_name, r.column_name, r.table_name
      );
    END IF;
  END LOOP;
END $$;

