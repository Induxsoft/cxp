Incluir las siguientes dependencias dentro del render.dk (crear si no existe) ubicado dentro de _protected:
 - Bootstrap 5
 - induxsoft.controls.js
 - induxsoft.controls.editable.js
 - induxsoft.crudl.js

Incluir las siguientes lineas en routes.map (crear si no existe) ubicado dentro de _protected

 - *: /cxp/{_program}/{_entity_id}/{_view}/ > $cxp/entry-point.dkl
 - *: /cxp/{_program}/{_entity_id?} > $cxp/entry-point.dkl
 - *: /cxp/ > $cxp/index.dkl

Colocar al final solo si aun no se cuenta con el map: `*: / > $webshell/index.dkl`