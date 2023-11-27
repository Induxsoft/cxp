Incluir las dependencias:
 - Bootstrap 5
 - induxsoft.controls.js
 - induxsoft.controls.editable.js

Incluir las siguientes regla en el routes.map

*: /cxp/{_program}/{_entity_id}/{_view}/ > /packs/cxp/entry-point.dkl
*: /cxp/{_program}/{_entity_id?} > /packs/cxp/entry-point.dkl
*: /cxp/ > /packs/cxp/index.dkl

Colocar al final solo si aun no se cuenta con el map
*: / > /packs/webshell/index.dkl