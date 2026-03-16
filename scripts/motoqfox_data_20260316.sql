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

SET SESSION AUTHORIZATION DEFAULT;

ALTER TABLE public.branches_sedes DISABLE TRIGGER ALL;

INSERT INTO public.branches_sedes VALUES (2, 'Sucursal Norte', 'Av. Ejido, Colonia Hoogar moderno', '7445514025', true, '2026-02-25 23:01:21.149501-06', '2026-02-26 10:40:42.332354-06');
INSERT INTO public.branches_sedes VALUES (1, 'Sucursal Central', 'Av. Moto 100, Col. Centro', '555-0001', true, '2026-02-25 22:50:05.758274-06', '2026-02-27 10:55:34.688121-06');


ALTER TABLE public.branches_sedes ENABLE TRIGGER ALL;

--
-- Data for Name: billing_config_fiscal_sede; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.billing_config_fiscal_sede DISABLE TRIGGER ALL;

INSERT INTO public.billing_config_fiscal_sede VALUES (1, 'Moto Q Fox', 'Moto Q Fox', '1234560000000', 'av. Ejido calzada pie de la cuesta #6', '7445514025', 'motoqfox@gmail.com', '', 'Gracias por su compra. Este documento no es una factura fiscal.', '2026-03-10 09:16:47.386972-06', '2026-03-10 09:16:47.386972-06', 1);


ALTER TABLE public.billing_config_fiscal_sede ENABLE TRIGGER ALL;

--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.users DISABLE TRIGGER ALL;

INSERT INTO public.users VALUES ('pbkdf2_sha256$720000$O9VgzxLxP6vZFjl4uxFVbJ$UcGQS4JvOzKERfC+mmWS5YGIx5xaPsZIMCP1AgC3lXU=', '2026-01-05 23:21:17.928216-06', 1, 'admin@gmail.com', 'admin', 'admin', 'ADMINISTRATOR', true, true, true, '2026-01-05 23:20:29.880887-06', '2026-01-05 23:20:30.538786-06', NULL, '', NULL, 0, false);
INSERT INTO public.users VALUES ('pbkdf2_sha256$720000$6Y2BzsxdVcmqnZQkLghamL$N8ovUp+ffVxs3zzIxv6bQjaCZYalSyzCGHpkyKEcUv4=', NULL, 13, 'jona@gmail.com', 'Jona', 'Gatica', 'CUSTOMER', true, false, false, '2026-03-12 12:29:30.695212-06', '2026-03-12 12:29:31.682739-06', NULL, '', NULL, 0, false);
INSERT INTO public.users VALUES ('pbkdf2_sha256$720000$J69Z7ALPLPmE0AzWtIOM3c$58c25djiAu/UFc/z1X5YA3HMs3u1GjC6UP7bo47BNfY=', NULL, 10, 'emanuelrealgamboa@gmail.com', 'Emanuel', 'Real Gamboa', 'CASHIER', true, false, false, '2026-03-02 13:38:14.813364-06', '2026-03-02 13:42:26.598834-06', 2, '7445514025', NULL, 0, false);
INSERT INTO public.users VALUES ('pbkdf2_sha256$720000$2AcQWCKHTtNXN3eJvPJ2xJ$2t7/K9B1ZUrP6o+eVSl4K1WuOyWOM1OIFvhNJoL9ths=', NULL, 2, 'admin@motoqfox.com', 'Admin', 'Sistema', 'ADMINISTRATOR', true, false, false, '2026-02-25 22:50:05.781276-06', '2026-02-25 22:50:06.585172-06', NULL, '', NULL, 0, false);
INSERT INTO public.users VALUES ('pbkdf2_sha256$1000000$3z89GAIJXmIPr7sEfr5xxe$yDFt4wvwigi6Fm9n5lyhEoCFzehGgq9ZiankH//meyQ=', NULL, 5, 'customer@motoqfox.com', 'Luis', 'Cliente', 'CUSTOMER', true, false, false, '2026-02-25 22:50:37.035973-06', '2026-02-25 22:59:37.665035-06', NULL, '', NULL, 0, false);
INSERT INTO public.users VALUES ('pbkdf2_sha256$720000$UkGEilZG6W6anjbeXVzLVa$UnZyMxP0B3Aamk85pm6U/fqAcYtVWyxtQkTcldQGnG8=', NULL, 15, 'mecanico@gmail.com', 'mecanico', 'mecanico', 'MECANICO', true, false, false, '2026-03-16 15:27:32.617148-06', '2026-03-16 15:27:33.54895-06', 1, '1234567890', NULL, 0, false);
INSERT INTO public.users VALUES ('pbkdf2_sha256$720000$iPNrFTmegA5ViHi3H5WU7E$TrnxRsDizHNEI53VrwDfBPuHuBs8U8X/Q0zLKiM4xZs=', NULL, 14, 'jefemecanico@gmail.com', 'Jefe', 'mecanico', 'JEFE_MECANICO', true, false, false, '2026-03-16 15:25:21.888991-06', '2026-03-16 15:25:22.802704-06', 1, '1234567890', NULL, 0, false);
INSERT INTO public.users VALUES ('pbkdf2_sha256$720000$2RBpnHQPVZD51hAlSHBTe1$ZAhpd90fZSq9lTsZMpoHH95N4LcHKMOSK3hJF/S6HVU=', NULL, 4, 'cashier@motoqfox.com', 'María', 'Cajera', 'CASHIER', true, false, false, '2026-02-25 22:50:36.241716-06', '2026-02-25 22:50:37.026511-06', 1, '', NULL, 0, false);
INSERT INTO public.users VALUES ('pbkdf2_sha256$720000$RjoLHTyIDkPA5Hmz7WMWeH$CghjADscurxb2YaLFYs1Yk1cYv+G3gLvwjPsVCVTkyk=', NULL, 7, 'antonio@gmail.com', 'Antonio', 'Texta', 'ENCARGADO', true, false, false, '2026-02-26 10:37:20.471252-06', '2026-02-26 10:40:23.260191-06', 1, '', NULL, 0, false);
INSERT INTO public.users VALUES ('pbkdf2_sha256$720000$BXdf1lky0YrKUJqeIjPOWI$e/+b3l6oeBtVILDKoCzm4b1Ddek0ZvAmL3cseZANuWw=', NULL, 11, 'emanuelrealgamboa1@gmail.com', 'Emanuel', 'Real', 'CUSTOMER', true, false, false, '2026-03-11 09:50:08.732622-06', '2026-03-11 09:50:09.790654-06', NULL, '', NULL, 0, false);
INSERT INTO public.users VALUES ('pbkdf2_sha256$720000$c0EDpikg9bDuKGO2pd1wFY$PpQlUjV8pxcbSoE7OESaRtm/wns76bAMvYyobNh4vNA=', NULL, 12, 'betza1@gmail.com', 'betza', 'alvarado velasco', 'CUSTOMER', true, false, false, '2026-03-11 22:39:10.20818-06', '2026-03-11 22:39:11.233936-06', NULL, '', NULL, 0, false);
INSERT INTO public.users VALUES ('pbkdf2_sha256$720000$0dLOZqpFGC8JpO0quuujTm$2lGwYVyQbptuPBbjJ+o61qIiSqGz1Bkj67ks3hQrfLM=', NULL, 6, 'emanuel@gmail.com', 'Emanuel', 'Real Gamboa', 'WORKER', true, false, false, '2026-02-25 23:00:16.367931-06', '2026-02-25 23:00:17.389392-06', 1, '', NULL, 1, false);
INSERT INTO public.users VALUES ('pbkdf2_sha256$720000$P0Ga7N5bwmHZdkPhAFwu4t$ggv9Qx+QALLZhng7wubEH0dwME8zrJ0seAJ5tLOe844=', NULL, 3, 'worker@motoqfox.com', 'Carlos', 'Mecánico', 'WORKER', true, false, false, '2026-02-25 22:50:35.434819-06', '2026-02-25 22:50:36.220179-06', 1, '', NULL, 0, false);


ALTER TABLE public.users ENABLE TRIGGER ALL;

--
-- Data for Name: customers_perfiles; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.customers_perfiles DISABLE TRIGGER ALL;

INSERT INTO public.customers_perfiles VALUES (1, '7445514025', '2004-07-09', 'b4c82e8a-7ffc-42e3-ac65-6ce299eae845', '', 0, '2026-03-11 09:50:09.837913-06', 11);
INSERT INTO public.customers_perfiles VALUES (2, '1234567890', '2000-01-05', '746b1936-09f9-4b1e-bf80-75141a6367a7', '', 0, '2026-03-11 22:39:11.274878-06', 12);
INSERT INTO public.customers_perfiles VALUES (3, '7445514025', '2003-12-02', 'eeb4cb2d-5c70-4b53-88d5-00007fb44015', '', 0, '2026-03-12 12:29:31.739004-06', 13);


ALTER TABLE public.customers_perfiles ENABLE TRIGGER ALL;

--
-- Data for Name: django_content_type; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.django_content_type DISABLE TRIGGER ALL;

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


ALTER TABLE public.django_content_type ENABLE TRIGGER ALL;

--
-- Data for Name: django_migrations; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.django_migrations DISABLE TRIGGER ALL;

INSERT INTO public.django_migrations VALUES (1, 'contenttypes', '0001_initial', '2026-01-05 23:19:44.730274-06');
INSERT INTO public.django_migrations VALUES (2, 'contenttypes', '0002_remove_content_type_name', '2026-01-05 23:19:44.752464-06');
INSERT INTO public.django_migrations VALUES (3, 'auth', '0001_initial', '2026-01-05 23:19:44.834122-06');
INSERT INTO public.django_migrations VALUES (4, 'auth', '0002_alter_permission_name_max_length', '2026-01-05 23:19:44.842906-06');
INSERT INTO public.django_migrations VALUES (5, 'auth', '0003_alter_user_email_max_length', '2026-01-05 23:19:44.850567-06');
INSERT INTO public.django_migrations VALUES (6, 'auth', '0004_alter_user_username_opts', '2026-01-05 23:19:44.860961-06');
INSERT INTO public.django_migrations VALUES (7, 'auth', '0005_alter_user_last_login_null', '2026-01-05 23:19:44.869272-06');
INSERT INTO public.django_migrations VALUES (8, 'auth', '0006_require_contenttypes_0002', '2026-01-05 23:19:44.872498-06');
INSERT INTO public.django_migrations VALUES (9, 'auth', '0007_alter_validators_add_error_messages', '2026-01-05 23:19:44.88198-06');
INSERT INTO public.django_migrations VALUES (10, 'auth', '0008_alter_user_username_max_length', '2026-01-05 23:19:44.891127-06');
INSERT INTO public.django_migrations VALUES (11, 'auth', '0009_alter_user_last_name_max_length', '2026-01-05 23:19:44.898398-06');
INSERT INTO public.django_migrations VALUES (12, 'auth', '0010_alter_group_name_max_length', '2026-01-05 23:19:44.915972-06');
INSERT INTO public.django_migrations VALUES (13, 'auth', '0011_update_proxy_permissions', '2026-01-05 23:19:44.927982-06');
INSERT INTO public.django_migrations VALUES (14, 'auth', '0012_alter_user_first_name_max_length', '2026-01-05 23:19:44.936586-06');
INSERT INTO public.django_migrations VALUES (15, 'users', '0001_initial', '2026-01-05 23:19:45.011653-06');
INSERT INTO public.django_migrations VALUES (16, 'admin', '0001_initial', '2026-01-05 23:19:45.050245-06');
INSERT INTO public.django_migrations VALUES (17, 'admin', '0002_logentry_remove_auto_add', '2026-01-05 23:19:45.062105-06');
INSERT INTO public.django_migrations VALUES (18, 'admin', '0003_logentry_add_action_flag_choices', '2026-01-05 23:19:45.072909-06');
INSERT INTO public.django_migrations VALUES (19, 'sessions', '0001_initial', '2026-01-05 23:19:45.091376-06');
INSERT INTO public.django_migrations VALUES (20, 'branches', '0001_initial', '2026-02-25 16:58:41.870334-06');
INSERT INTO public.django_migrations VALUES (21, 'users', '0002_customuser_sede', '2026-02-25 16:58:41.910337-06');
INSERT INTO public.django_migrations VALUES (22, 'inventory', '0001_initial', '2026-02-25 23:18:04.859695-06');
INSERT INTO public.django_migrations VALUES (23, 'users', '0003_alter_customuser_role_turno', '2026-02-26 10:34:51.126519-06');
INSERT INTO public.django_migrations VALUES (24, 'users', '0004_customuser_phone', '2026-02-26 21:42:11.073671-06');
INSERT INTO public.django_migrations VALUES (25, 'users', '0005_customuser_locked_until_customuser_login_attempts_and_more', '2026-02-26 22:38:57.458065-06');
INSERT INTO public.django_migrations VALUES (26, 'users', '0006_loginauditlog', '2026-02-26 22:58:52.841563-06');
INSERT INTO public.django_migrations VALUES (27, 'inventory', '0002_marcafabricante_marcamoto_producto_codigo_barras_and_more', '2026-02-27 13:32:43.990716-06');
INSERT INTO public.django_migrations VALUES (28, 'inventory', '0003_producto_imagen', '2026-03-01 21:23:06.205651-06');
INSERT INTO public.django_migrations VALUES (29, 'sales', '0001_initial', '2026-03-03 20:59:13.846688-06');
INSERT INTO public.django_migrations VALUES (30, 'sales', '0002_codigoapertura_aperturacaja_and_more', '2026-03-09 13:10:35.509359-06');
INSERT INTO public.django_migrations VALUES (31, 'billing', '0001_initial', '2026-03-10 09:14:15.662741-06');
INSERT INTO public.django_migrations VALUES (32, 'customers', '0001_initial', '2026-03-11 09:44:12.817866-06');
INSERT INTO public.django_migrations VALUES (33, 'sales', '0003_venta_cliente_venta_puntos_ganados', '2026-03-11 09:44:12.926223-06');
INSERT INTO public.django_migrations VALUES (34, 'pedidos', '0001_initial', '2026-03-11 23:09:38.261771-06');
INSERT INTO public.django_migrations VALUES (35, 'sales', '0004_reportecaja', '2026-03-13 09:29:26.750245-06');
INSERT INTO public.django_migrations VALUES (36, 'taller', '0001_initial', '2026-03-16 14:33:10.607932-06');


ALTER TABLE public.django_migrations ENABLE TRIGGER ALL;

--
-- Data for Name: inventory_auditorias; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.inventory_auditorias DISABLE TRIGGER ALL;



ALTER TABLE public.inventory_auditorias ENABLE TRIGGER ALL;

--
-- Data for Name: inventory_categorias; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.inventory_categorias DISABLE TRIGGER ALL;

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


ALTER TABLE public.inventory_categorias ENABLE TRIGGER ALL;

--
-- Data for Name: inventory_marcas_fabricante; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.inventory_marcas_fabricante DISABLE TRIGGER ALL;

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


ALTER TABLE public.inventory_marcas_fabricante ENABLE TRIGGER ALL;

--
-- Data for Name: inventory_subcategorias; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.inventory_subcategorias DISABLE TRIGGER ALL;

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


ALTER TABLE public.inventory_subcategorias ENABLE TRIGGER ALL;

--
-- Data for Name: inventory_productos; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.inventory_productos DISABLE TRIGGER ALL;

INSERT INTO public.inventory_productos VALUES (7, 'ACEITE-MOTUL-4T-10W40-1L', 'Aceite Motor Motul 4T 10W-40 1 Litro', 'Aceite semisintético para motores 4T. Viscosidad 10W-40. Protección máxima.', 145.00, 58.00, true, '2026-02-27 13:32:57.064567-06', '2026-03-02 08:27:59.173202-06', 10, '3374650229117', false, true, '', '', NULL, 116.00, 'AFTERMARKET', 'C-01-1-A', 'LITRO', 5, NULL, 'products/Aceite_Motor_Motul_4T_10W-40_1_Litro.png');
INSERT INTO public.inventory_productos VALUES (9, 'AMORT-TRA-ITALIKA-FT125', 'Amortiguador Trasero Italika FT125 (par)', 'Par de amortiguadores traseros. Longitud 330mm. Compatible FT125 y DT125 2015+.', 320.00, 128.00, true, '2026-02-27 13:32:57.082621-06', '2026-03-02 08:36:04.618226-06', 4, '7501234567898', false, false, '', '52400-GGY-901', NULL, 256.00, 'AFTERMARKET', 'A-04-2-A', 'PAR', 2, NULL, 'products/Amortiguador_Trasero_Italika_FT125_par.png');
INSERT INTO public.inventory_productos VALUES (13, 'BATERIA-YTX5L-BS', 'Batería YTX5L-BS 12V 5Ah', 'Batería sellada libre de mantenimiento. 12V 5Ah. Para motos de 110-150cc.', 380.00, 152.00, true, '2026-02-27 13:32:57.160668-06', '2026-03-02 08:45:31.468115-06', 5, '7501234567902', false, false, '', 'YTX5L-BS', NULL, 304.00, 'AFTERMARKET', 'B-01-1-A', 'PIEZA', 11, NULL, 'products/Batería_YTX5L-BS_12V_5Ah.png');
INSERT INTO public.inventory_productos VALUES (3, 'BUJIA-NGK-CR7HSA', 'Bujía NGK CR7HSA', 'Bujía original NGK para motores 4T de 110cc a 150cc. Electrodo de níquel.', 85.00, 32.00, true, '2026-02-27 13:32:56.990334-06', '2026-03-02 08:46:48.204202-06', 5, '7501234567893', false, true, '', 'CR7HSA', NULL, 68.00, 'AFTERMARKET', 'B-02-1-A', 'PIEZA', 1, NULL, 'products/Bujía_NGK_CR7HSA.png');
INSERT INTO public.inventory_productos VALUES (12, 'CABLE-CLUTCH-ITALIKA', 'Cable de Clutch Universal Italika', 'Cable de embrague para modelos FT125, DT125 y WT150. Longitud 120cm.', 85.00, 34.00, true, '2026-02-27 13:32:57.135668-06', '2026-03-02 08:48:54.690929-06', 2, '7501234567901', false, false, '', '', NULL, 68.00, 'AFTERMARKET', 'A-03-2-A', 'PIEZA', 11, NULL, 'products/Cable_de_Clutch_Universal_Italika.png');
INSERT INTO public.inventory_productos VALUES (5, 'CADENA-428H-120E', 'Cadena de Transmisión 428H 120 Eslabones', 'Cadena reforzada 428H para motos de trabajo y cargo. Incluye remache.', 180.00, 72.00, true, '2026-02-27 13:32:57.018584-06', '2026-03-02 08:51:16.287004-06', 2, '7501234567895', false, false, '', '40530-GGY-901', NULL, 144.00, 'AFTERMARKET', 'A-03-1-A', 'PIEZA', 2, NULL, 'products/cadena_de_transmisión_.png');
INSERT INTO public.inventory_productos VALUES (11, 'CARB-KEIHIN-PB16', 'Carburador PB16 tipo Keihin', 'Carburador de 16mm compatible con la mayoría de scooters y motos 50-110cc automáticas.', 350.00, 140.00, true, '2026-02-27 13:32:57.121668-06', '2026-03-02 08:54:19.917497-06', 6, '7501234567900', false, false, '', '', NULL, 280.00, 'AFTERMARKET', 'B-03-1-A', 'PIEZA', 11, NULL, 'products/Carburador_PB16_tipo_Keihin.png');
INSERT INTO public.inventory_productos VALUES (19, 'CDI-ITALIKA-FT125', 'CDI / Módulo de Encendido Italika FT125', 'Unidad CDI de repuesto para Italika FT125 y DT125. Equivalente al original.', 180.00, 72.00, true, '2026-02-27 13:32:57.27008-06', '2026-03-02 08:58:27.264329-06', 5, '7501234567908', false, false, '', '30400-GGY-901', NULL, 144.00, 'AFTERMARKET', 'B-01-2-A', 'PIEZA', 11, NULL, 'products/CDI_Módulo_de_Encendido_Italika_FT125.png');
INSERT INTO public.inventory_productos VALUES (10, 'DISCO-DEL-ITALIKA-WS150', 'Disco de Freno Delantero Italika WS150', 'Disco ventilado de 220mm. Acero inoxidable. Para modelos WS150 y TC200.', 250.00, 100.00, true, '2026-02-27 13:32:57.101949-06', '2026-03-02 08:59:45.777042-06', 3, '7501234567899', false, false, '', '45251-GBY-901', NULL, 200.00, 'AFTERMARKET', 'A-01-3-A', 'PIEZA', 2, NULL, 'products/Disco_de_Freno_Delantero_Italika_WS150.png');
INSERT INTO public.inventory_productos VALUES (4, 'FILT-ACE-ITALIKA-FT125', 'Filtro de Aceite Italika FT125/DT125', 'Filtro de aceite OEM para motores Italika de 125cc. Reemplazos cada 2,000 km.', 65.00, 28.00, true, '2026-02-27 13:32:56.998568-06', '2026-03-02 09:02:14.564383-06', 1, '7501234567894', false, false, '', 'ITA-FT125-OIL-FILTER', NULL, 52.00, 'OEM', 'A-02-1-A', 'PIEZA', 10, NULL, 'products/Filtro_de_Aceite_Italika_FT125-DT125.png');
INSERT INTO public.inventory_productos VALUES (14, 'FILT-AIRE-ITALIKA-FT125', 'Filtro de Aire Italika FT125', 'Filtro de espuma para caja de filtro original. Evita la entrada de polvo al carburador.', 55.00, 22.00, true, '2026-02-27 13:32:57.19074-06', '2026-03-02 09:03:16.390232-06', 1, '7501234567903', false, false, '', 'ITA-FT125-AIR-FILTER', NULL, 44.00, 'OEM', 'A-02-1-B', 'PIEZA', 10, NULL, 'products/Filtro_de_Aire_Italika_FT125.png');
INSERT INTO public.inventory_productos VALUES (6, 'KIT-CADEN-ITALIKA-FT125', 'Kit Cadena + Piñones Italika FT125', 'Kit completo: cadena 428H 120E + piñón delantero 15T + corona trasera 39T.', 380.00, 152.00, true, '2026-02-27 13:32:57.044568-06', '2026-03-02 09:04:21.026471-06', 2, '7501234567896', false, false, '', '', NULL, 304.00, 'AFTERMARKET', 'A-03-1-B', 'KIT', 2, NULL, 'products/Kit_Cadena__Piñones_Italika_FT125.png');
INSERT INTO public.inventory_productos VALUES (20, 'KIT-FRENOS-ITALIKA-FT125', 'Kit de Frenos Completo Italika FT125', 'Kit: pastillas delanteras + pastillas traseras + líquido DOT3. Para mantenimiento preventivo.', 280.00, 112.00, true, '2026-02-27 13:32:57.290166-06', '2026-03-02 09:06:07.966687-06', 12, '7501234567909', false, false, '', '', NULL, 224.00, 'AFTERMARKET', 'A-01-4-A', 'KIT', 2, NULL, 'products/Kit_de_Frenos_Completo_Italika_FT125.png');
INSERT INTO public.inventory_productos VALUES (15, 'EMPAQUE-MOTOR-ITALIKA-FT125', 'Kit Empaques Motor Italika FT125', 'Juego completo de empaques: cabeza, cilindro, carter y tapa. Para overhaul de motor.', 220.00, 88.00, true, '2026-02-27 13:32:57.212094-06', '2026-03-02 09:07:33.452997-06', 1, '7501234567904', false, false, '', '', NULL, 176.00, 'AFTERMARKET', 'A-02-2-A', 'KIT', 11, NULL, 'products/Kit_Empaques_Motor_Italika_FT125.png');
INSERT INTO public.inventory_productos VALUES (17, 'LLANTA-DEL-275-17', 'Llanta Delantera 2.75-17 Tubo', 'Llanta con tubo para rin de 17". Diseño multiuso. Compatible con la mayoría de cargo 125-150cc.', 280.00, 112.00, true, '2026-02-27 13:32:57.252079-06', '2026-03-02 09:08:30.726466-06', 8, '7501234567906', false, true, '', '', NULL, 224.00, 'AFTERMARKET', 'D-01-1-A', 'PIEZA', 11, NULL, 'products/Llanta_Delantera_2.75-17_Tubo.png');
INSERT INTO public.inventory_productos VALUES (18, 'LLANTA-TRA-300-17', 'Llanta Trasera 3.00-17 Tubo', 'Llanta con tubo para rin trasero de 17". Para motos de carga y trabajo.', 320.00, 128.00, true, '2026-02-27 13:32:57.261079-06', '2026-03-02 09:09:32.208561-06', 8, '7501234567907', false, true, '', '', NULL, 256.00, 'AFTERMARKET', 'D-01-1-B', 'PIEZA', 11, NULL, 'products/Llanta_Trasera_3.00-17_Tubo.png');
INSERT INTO public.inventory_productos VALUES (1, 'PAST-DEL-AHL-001', 'Pastilla de Freno Delantera AHL', 'Par de pastillas semimetálicas para freno de disco hidráulico. Alta resistencia al calor.', 120.00, 48.00, true, '2026-02-27 13:32:56.939294-06', '2026-03-02 09:11:20.054077-06', 3, '7501234567891', false, false, '', '45105-GBY-901', NULL, 95.00, 'AFTERMARKET', 'A-01-2-A', 'PAR', 2, NULL, 'products/Pastilla_de_Freno_Delantera_AHL.png');
INSERT INTO public.inventory_productos VALUES (2, 'PAST-TRA-AHL-001', 'Pastilla de Freno Trasera AHL', 'Par de pastillas para freno de disco trasero. Compatible con modelos de 125cc a 150cc.', 110.00, 44.00, true, '2026-02-27 13:32:56.971294-06', '2026-03-02 09:13:42.01951-06', 3, '7501234567892', false, false, '', '43105-GBY-901', NULL, 88.00, 'AFTERMARKET', 'A-01-2-B', 'PAR', 2, NULL, 'products/Pastilla_de_Freno_Trasera_AHL.png');
INSERT INTO public.inventory_productos VALUES (16, 'PISTON-STD-ITALIKA-FT125', 'Pistón con Segmentos STD Italika FT125', 'Pistón diámetro 52.4mm STD con anillos de compresión y aceite. Material: aluminio forjado.', 450.00, 180.00, true, '2026-02-27 13:32:57.232079-06', '2026-03-02 09:14:51.181123-06', 1, '7501234567905', false, false, '', '13101-GGY-901', NULL, 360.00, 'AFTERMARKET', 'A-02-3-A', 'KIT', 11, NULL, 'products/Pistón_con_Segmentos_STD_Italika_FT125.png');
INSERT INTO public.inventory_productos VALUES (8, 'ACEITE-BARDAHL-4T-20W50-1L', 'Aceite Motor Bardahl 4T 20W-50 1 Litro', 'Aceite mineral para motores 4T. Ideal para clima cálido. Protección antidesgaste.', 95.00, 38.00, true, '2026-02-27 13:32:57.073567-06', '2026-03-02 13:45:52.649682-06', 10, '7501017600011', false, false, '', '', NULL, 76.00, 'AFTERMARKET', 'C-01-1-B', 'LITRO', 6, NULL, 'products/Bardahl_Aceite_para_Motos_Recreativas_y_de_Trabajo_4T.png');


ALTER TABLE public.inventory_productos ENABLE TRIGGER ALL;

--
-- Data for Name: inventory_auditoria_items; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.inventory_auditoria_items DISABLE TRIGGER ALL;



ALTER TABLE public.inventory_auditoria_items ENABLE TRIGGER ALL;

--
-- Data for Name: inventory_marcas_moto; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.inventory_marcas_moto DISABLE TRIGGER ALL;

INSERT INTO public.inventory_marcas_moto VALUES (1, 'Italika', true);
INSERT INTO public.inventory_marcas_moto VALUES (2, 'Honda', true);
INSERT INTO public.inventory_marcas_moto VALUES (3, 'Yamaha', true);
INSERT INTO public.inventory_marcas_moto VALUES (4, 'Suzuki', true);
INSERT INTO public.inventory_marcas_moto VALUES (5, 'Carabela', true);
INSERT INTO public.inventory_marcas_moto VALUES (6, 'Vento', true);
INSERT INTO public.inventory_marcas_moto VALUES (7, 'Benelli', true);
INSERT INTO public.inventory_marcas_moto VALUES (8, 'Bajaj', true);


ALTER TABLE public.inventory_marcas_moto ENABLE TRIGGER ALL;

--
-- Data for Name: inventory_modelos_moto; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.inventory_modelos_moto DISABLE TRIGGER ALL;

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


ALTER TABLE public.inventory_modelos_moto ENABLE TRIGGER ALL;

--
-- Data for Name: inventory_compatibilidad_pieza; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.inventory_compatibilidad_pieza DISABLE TRIGGER ALL;

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


ALTER TABLE public.inventory_compatibilidad_pieza ENABLE TRIGGER ALL;

--
-- Data for Name: inventory_entradas; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.inventory_entradas DISABLE TRIGGER ALL;

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


ALTER TABLE public.inventory_entradas ENABLE TRIGGER ALL;

--
-- Data for Name: inventory_stock; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.inventory_stock DISABLE TRIGGER ALL;

INSERT INTO public.inventory_stock VALUES (2, 80, 5, '2026-03-02 13:47:54.060172-06', 3, 2);
INSERT INTO public.inventory_stock VALUES (4, 100, 5, '2026-03-03 21:15:54.346251-06', 9, 2);
INSERT INTO public.inventory_stock VALUES (5, 50, 5, '2026-03-03 21:16:15.736139-06', 13, 2);
INSERT INTO public.inventory_stock VALUES (6, 100, 5, '2026-03-03 21:16:36.491872-06', 12, 2);
INSERT INTO public.inventory_stock VALUES (7, 70, 5, '2026-03-03 21:16:57.633569-06', 5, 2);
INSERT INTO public.inventory_stock VALUES (8, 100, 5, '2026-03-03 21:17:16.278855-06', 11, 2);
INSERT INTO public.inventory_stock VALUES (9, 100, 5, '2026-03-03 21:17:37.911198-06', 19, 2);
INSERT INTO public.inventory_stock VALUES (3, 99, 5, '2026-03-03 21:04:51.558367-06', 7, 2);
INSERT INTO public.inventory_stock VALUES (1, 98, 5, '2026-03-01 21:30:30.859516-06', 8, 2);
INSERT INTO public.inventory_stock VALUES (12, 100, 5, '2026-03-12 14:12:36.240906-06', 3, 1);
INSERT INTO public.inventory_stock VALUES (11, 49, 5, '2026-03-09 12:46:07.180632-06', 9, 1);
INSERT INTO public.inventory_stock VALUES (10, 45, 5, '2026-03-09 12:42:05.926995-06', 8, 1);


ALTER TABLE public.inventory_stock ENABLE TRIGGER ALL;

--
-- Data for Name: pedidos_bodega; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.pedidos_bodega DISABLE TRIGGER ALL;

INSERT INTO public.pedidos_bodega VALUES (1, 'rapido porfis', 'ENTREGADO', '2026-03-11 23:12:57.350933-06', '2026-03-11 23:13:14.025985-06', 4, 1);
INSERT INTO public.pedidos_bodega VALUES (2, '', 'ENTREGADO', '2026-03-12 14:17:37.131716-06', '2026-03-12 14:18:06.449848-06', 4, 1);


ALTER TABLE public.pedidos_bodega ENABLE TRIGGER ALL;

--
-- Data for Name: pedidos_bodega_items; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.pedidos_bodega_items DISABLE TRIGGER ALL;

INSERT INTO public.pedidos_bodega_items VALUES (1, 1, 'C-01-1-B', 1, 8);
INSERT INTO public.pedidos_bodega_items VALUES (2, 1, 'C-01-1-B', 2, 8);


ALTER TABLE public.pedidos_bodega_items ENABLE TRIGGER ALL;

--
-- Data for Name: sales_codigos_apertura; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.sales_codigos_apertura DISABLE TRIGGER ALL;

INSERT INTO public.sales_codigos_apertura VALUES (1, '979123', '2026-03-09 13:43:54.194075-06', '2026-03-09 13:13:54.19525-06', 7, 1);
INSERT INTO public.sales_codigos_apertura VALUES (2, '285973', '2026-03-10 09:02:27.084131-06', '2026-03-10 08:32:27.084131-06', 7, 1);
INSERT INTO public.sales_codigos_apertura VALUES (3, '342620', '2026-03-12 14:55:40.139381-06', '2026-03-12 14:25:40.139381-06', 7, 1);
INSERT INTO public.sales_codigos_apertura VALUES (4, '818529', '2026-03-16 16:12:19.428219-06', '2026-03-16 15:42:19.430642-06', 7, 1);


ALTER TABLE public.sales_codigos_apertura ENABLE TRIGGER ALL;

--
-- Data for Name: sales_aperturas_caja; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.sales_aperturas_caja DISABLE TRIGGER ALL;

INSERT INTO public.sales_aperturas_caja VALUES (1, '2026-03-09 13:14:06.513423-06', '2026-03-09 13:15:41.414789-06', 'CERRADA', 7, 4, 1, 1);
INSERT INTO public.sales_aperturas_caja VALUES (2, '2026-03-10 08:32:55.676465-06', '2026-03-12 14:25:03.430579-06', 'CERRADA', 7, 4, 1, 2);
INSERT INTO public.sales_aperturas_caja VALUES (3, '2026-03-12 14:26:08.422313-06', '2026-03-13 09:36:07.460169-06', 'CERRADA', 7, 4, 1, 3);
INSERT INTO public.sales_aperturas_caja VALUES (4, '2026-03-16 15:42:40.337347-06', NULL, 'ABIERTA', 7, 4, 1, 4);


ALTER TABLE public.sales_aperturas_caja ENABLE TRIGGER ALL;

--
-- Data for Name: sales_reportes_caja; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.sales_reportes_caja DISABLE TRIGGER ALL;

INSERT INTO public.sales_reportes_caja VALUES (1, 'reportes_caja/2026/03/reporte_1_4_20260313_0936.pdf', 3, 0, 510.00, 510.00, 0.00, 0.00, 0.00, '2026-03-13 09:36:07.716709-06', 3);


ALTER TABLE public.sales_reportes_caja ENABLE TRIGGER ALL;

--
-- Data for Name: sales_ventas; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.sales_ventas DISABLE TRIGGER ALL;

INSERT INTO public.sales_ventas VALUES (1, 240.00, 0.00, 240.00, 'EFECTIVO', 300.00, 60.00, 'COMPLETADA', '', '2026-03-03 21:19:25.185145-06', 10, 2, NULL, 0);
INSERT INTO public.sales_ventas VALUES (2, 95.00, 0.00, 95.00, 'TARJETA', 95.00, 0.00, 'COMPLETADA', '', '2026-03-03 21:20:41.70939-06', 10, 2, NULL, 0);
INSERT INTO public.sales_ventas VALUES (3, 95.00, 0.00, 95.00, 'EFECTIVO', 100.00, 5.00, 'COMPLETADA', '', '2026-03-09 13:14:40.732772-06', 4, 1, NULL, 0);
INSERT INTO public.sales_ventas VALUES (4, 95.00, 0.00, 95.00, 'EFECTIVO', 100.00, 5.00, 'COMPLETADA', '', '2026-03-10 09:17:26.188018-06', 4, 1, NULL, 0);
INSERT INTO public.sales_ventas VALUES (5, 95.00, 0.00, 95.00, 'EFECTIVO', 200.00, 105.00, 'COMPLETADA', '', '2026-03-12 14:14:54.76586-06', 4, 1, NULL, 0);
INSERT INTO public.sales_ventas VALUES (6, 95.00, 0.00, 95.00, 'EFECTIVO', 100.00, 5.00, 'COMPLETADA', '', '2026-03-13 09:35:22.648511-06', 4, 1, NULL, 0);
INSERT INTO public.sales_ventas VALUES (7, 320.00, 0.00, 320.00, 'EFECTIVO', 400.00, 80.00, 'COMPLETADA', '', '2026-03-13 09:35:37.216425-06', 4, 1, NULL, 0);
INSERT INTO public.sales_ventas VALUES (8, 95.00, 0.00, 95.00, 'EFECTIVO', 300.00, 205.00, 'COMPLETADA', '', '2026-03-13 09:35:53.396033-06', 4, 1, NULL, 0);


ALTER TABLE public.sales_ventas ENABLE TRIGGER ALL;

--
-- Data for Name: sales_venta_items; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.sales_venta_items DISABLE TRIGGER ALL;

INSERT INTO public.sales_venta_items VALUES (1, 1, 95.00, 95.00, 8, 1);
INSERT INTO public.sales_venta_items VALUES (2, 1, 145.00, 145.00, 7, 1);
INSERT INTO public.sales_venta_items VALUES (3, 1, 95.00, 95.00, 8, 2);
INSERT INTO public.sales_venta_items VALUES (4, 1, 95.00, 95.00, 8, 3);
INSERT INTO public.sales_venta_items VALUES (5, 1, 95.00, 95.00, 8, 4);
INSERT INTO public.sales_venta_items VALUES (6, 1, 95.00, 95.00, 8, 5);
INSERT INTO public.sales_venta_items VALUES (7, 1, 95.00, 95.00, 8, 6);
INSERT INTO public.sales_venta_items VALUES (8, 1, 320.00, 320.00, 9, 7);
INSERT INTO public.sales_venta_items VALUES (9, 1, 95.00, 95.00, 8, 8);


ALTER TABLE public.sales_venta_items ENABLE TRIGGER ALL;

--
-- Data for Name: taller_motos_cliente; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.taller_motos_cliente DISABLE TRIGGER ALL;



ALTER TABLE public.taller_motos_cliente ENABLE TRIGGER ALL;

--
-- Data for Name: taller_servicios; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.taller_servicios DISABLE TRIGGER ALL;



ALTER TABLE public.taller_servicios ENABLE TRIGGER ALL;

--
-- Data for Name: taller_servicio_items; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.taller_servicio_items DISABLE TRIGGER ALL;



ALTER TABLE public.taller_servicio_items ENABLE TRIGGER ALL;

--
-- Data for Name: taller_solicitudes_extra; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.taller_solicitudes_extra DISABLE TRIGGER ALL;



ALTER TABLE public.taller_solicitudes_extra ENABLE TRIGGER ALL;

--
-- Data for Name: users_login_audit_log; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.users_login_audit_log DISABLE TRIGGER ALL;

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


ALTER TABLE public.users_login_audit_log ENABLE TRIGGER ALL;

--
-- Data for Name: users_password_reset_tokens; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.users_password_reset_tokens DISABLE TRIGGER ALL;

INSERT INTO public.users_password_reset_tokens VALUES (2, 'e33cc13a-00f7-449c-9112-f0bd42c2631c', '2026-03-02 13:41:08.013131-06', '2026-03-02 14:41:08.013131-06', true, 10);


ALTER TABLE public.users_password_reset_tokens ENABLE TRIGGER ALL;

--
-- Data for Name: users_turnos; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.users_turnos DISABLE TRIGGER ALL;



ALTER TABLE public.users_turnos ENABLE TRIGGER ALL;

--
-- Name: billing_config_fiscal_sede_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.billing_config_fiscal_sede_id_seq', 1, true);


--
-- Name: branches_sedes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.branches_sedes_id_seq', 2, true);


--
-- Name: customers_perfiles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.customers_perfiles_id_seq', 3, true);


--
-- Name: django_content_type_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.django_content_type_id_seq', 34, true);


--
-- Name: django_migrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.django_migrations_id_seq', 36, true);


--
-- Name: inventory_auditoria_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.inventory_auditoria_items_id_seq', 1, false);


--
-- Name: inventory_auditorias_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.inventory_auditorias_id_seq', 1, false);


--
-- Name: inventory_categorias_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.inventory_categorias_id_seq', 12, true);


--
-- Name: inventory_compatibilidad_pieza_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.inventory_compatibilidad_pieza_id_seq', 37, true);


--
-- Name: inventory_entradas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.inventory_entradas_id_seq', 12, true);


--
-- Name: inventory_marcas_fabricante_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.inventory_marcas_fabricante_id_seq', 11, true);


--
-- Name: inventory_marcas_moto_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.inventory_marcas_moto_id_seq', 8, true);


--
-- Name: inventory_modelos_moto_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.inventory_modelos_moto_id_seq', 26, true);


--
-- Name: inventory_productos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.inventory_productos_id_seq', 20, true);


--
-- Name: inventory_stock_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.inventory_stock_id_seq', 12, true);


--
-- Name: inventory_subcategorias_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.inventory_subcategorias_id_seq', 80, true);


--
-- Name: pedidos_bodega_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.pedidos_bodega_id_seq', 2, true);


--
-- Name: pedidos_bodega_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.pedidos_bodega_items_id_seq', 2, true);


--
-- Name: sales_aperturas_caja_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.sales_aperturas_caja_id_seq', 4, true);


--
-- Name: sales_codigos_apertura_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.sales_codigos_apertura_id_seq', 4, true);


--
-- Name: sales_reportes_caja_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.sales_reportes_caja_id_seq', 1, true);


--
-- Name: sales_venta_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.sales_venta_items_id_seq', 9, true);


--
-- Name: sales_ventas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.sales_ventas_id_seq', 8, true);


--
-- Name: taller_motos_cliente_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.taller_motos_cliente_id_seq', 1, false);


--
-- Name: taller_servicio_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.taller_servicio_items_id_seq', 1, false);


--
-- Name: taller_servicios_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.taller_servicios_id_seq', 1, false);


--
-- Name: taller_solicitudes_extra_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.taller_solicitudes_extra_id_seq', 1, false);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 15, true);


--
-- Name: users_login_audit_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_login_audit_log_id_seq', 56, true);


--
-- Name: users_password_reset_tokens_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_password_reset_tokens_id_seq', 2, true);


--
-- Name: users_turnos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_turnos_id_seq', 1, false);


--
-- PostgreSQL database dump complete
--

