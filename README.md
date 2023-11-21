Incluir las dependencias:
 - Bootstrap 5
 - induxsoft.controls.js
 - induxsoft.controls.editable.js

Incluir la siguiente regla en el routes.map
  - *: /{_entities_type}/{_entity_id}/{_view?} > /entry-point.dkl

Se requiere nuevos tipos de categorias
 - ID: 30
 - CONST: Transferencias bancarias

En el archivo config.dk de cxp_docs y ut_gasto, modificar el host del enlace para la busqueda de proveedores.