var proveedor =
{
    tableId: "", table: null,

    init()
    {
        if (this.tableId.trim() != "") { this.table = document.getElementById(this.tableId); }
    },

    trigger(element,event) {
        if (element) {
            let e = new Event(event);
            element.dispatchEvent(e);
        }
    },

    goTo(url)
    {
        if (!url) { alert("No se ha indicado un destino."); return; }
        if (!this.table) { alert("No se encontro una definición de tabla (edit-table)."); return; }
        if (this.table.CurrentRowIndex() < 0) { alert("Debe seleccionar una fila"); return; }

        var data = this.table.DataArray[this.table.CurrentRowIndex()];
        window.location.href = url.replace("@proveedor",data.sys_pk);
    },

    list: {
        tbl_proveedores: null,
        txt_search_proveedor: null,
        btn_search_proveedor: null,
        btn_new_proveedor: null,

        init()
        {
            this.txt_search_proveedor = document.getElementById("txt_search_proveedor");
            this.btn_search_proveedor = document.getElementById("btn_search_proveedor");
            this.btn_new_proveedor = document.getElementById("btn_new_proveedor");
            this.tbl_proveedores = document.getElementById("tbl_proveedores");

            if (this.txt_search_proveedor) {
                this.txt_search_proveedor.addEventListener("keydown", (e) => {
                    if (e.key === "Enter") this.buscarProveedor();
                });
            }
            if (this.btn_search_proveedor) {
                this.btn_search_proveedor.addEventListener("click", () => { this.buscarProveedor(); });
            }
        },

        buscarProveedor() {
            let text = this.txt_search_proveedor.value.trim();
            let url = this.txt_search_proveedor.getAttribute("data-url-search").trim();
            if (!text) return;
            if (!url) { alert("No se indico un destino"); return; }
            if (!this.tbl_proveedores) { alert("No se ha definido la tabla de proveedores."); return; }
            url = url.replace("@search",text);
            
            let onSuccess = (data) => {
                if (data.message) { alert(data.message); }
    
                this.tbl_proveedores.DataArray = data;
                this.tbl_proveedores._printRows();
            }
            let onFailure = (error) => {
                alert('No se pudo realizar la busqueda.\n' + JSON.stringify(error));
            }
    
            InduxsoftCrudlModel.InvokeService(url,null,onSuccess,onFailure,"GET",false);
        }
    },

    form: {
        formProveedor: null,
        fcElements: null,
        btnSave: null,
        url_buscar_edoprov: "",
        url_buscar_ciudad: "",
        
        init()
        {
            this.formProveedor = document.getElementById("form_proveedor");
            this.btnSave = document.getElementById("btn_save");
            this.setEvents();
        },

        setEvents()
        {
            if (this.btnSave) { this.btnSave.addEventListener("click", () => { this.saveForm(); }); }
            if (this.formProveedor) {
                this.fcElements = this.formProveedor.elements;

                this.fcElements["chq_domicilio1"].addEventListener("change", (event) => {
                    let domicilio1 = document.getElementById("cbody_domicilio1");
                    (event.target.checked) ? domicilio1.classList.remove("disable-form") : domicilio1.classList.add("disable-form");
                    if (this.fcElements["sel_estado"].options.length <= 0) this.fillEstados(this.fcElements["sel_pais"],this.fcElements["sel_estado"]);
                });
                this.fcElements["sel_pais"].addEventListener("change", () => {
                    this.fillEstados(this.fcElements["sel_pais"],this.fcElements["sel_estado"]);
                });
                this.fcElements["sel_estado"].addEventListener("change", () => {
                    this.fillCiudades(this.fcElements["sel_estado"],this.fcElements["sel_ciudad"]);
                });
                
                this.fcElements["chq_domicilio2"].addEventListener("change", (event) => {
                    let domicilio2 = document.getElementById("cbody_domicilio2");
                    (event.target.checked) ? domicilio2.classList.remove("disable-form") : domicilio2.classList.add("disable-form");
                    if (this.fcElements["sel_estado2"].options.length <= 0) this.fillEstados(this.fcElements["sel_pais2"],this.fcElements["sel_estado2"]);
                });
                this.fcElements["sel_pais2"].addEventListener("change", () => {
                    this.fillEstados(this.fcElements["sel_pais2"],this.fcElements["sel_estado2"]);
                });
                this.fcElements["sel_estado2"].addEventListener("change", () => {
                    this.fillCiudades(this.fcElements["sel_estado2"],this.fcElements["sel_ciudad2"]);
                });

                this.fcElements["chq_domicilio3"].addEventListener("change", (event) => {
                    let domicilio3 = document.getElementById("cbody_domicilio3");
                    (event.target.checked) ? domicilio3.classList.remove("disable-form") : domicilio3.classList.add("disable-form");
                    if (this.fcElements["sel_estado3"].options.length <= 0) this.fillEstados(this.fcElements["sel_pais3"],this.fcElements["sel_estado3"]);
                });
                this.fcElements["sel_pais3"].addEventListener("change", () => {
                    this.fillEstados(this.fcElements["sel_pais3"],this.fcElements["sel_estado3"]);
                });
                this.fcElements["sel_estado3"].addEventListener("change", () => {
                    this.fillCiudades(this.fcElements["sel_estado3"],this.fcElements["sel_ciudad3"]);
                });

                this.fcElements["chq_otorgar_credito"].addEventListener("change", (event) => {
                    let div_credito = document.getElementById("div_otorgar_credito");
                    (event.target.checked) ? div_credito.classList.remove("disable-form") : div_credito.classList.add("disable-form");
                });
                this.fcElements["rd_credito_ilimitado"].addEventListener("change", (event) => {
                    this.fcElements["limitecredito"].type = "hidden";
                });
                this.fcElements["rd_credito_limitado"].addEventListener("change", (event) => {
                    this.fcElements["limitecredito"].type = "number";
                });
            }
        },

        fillEstados(ref,out){
            let url = this.url_buscar_edoprov.replace("search","ipais");
            url = InduxsoftCrudlModel.UrlReplace(url,{ipais:ref.value});

            let onSuccess = (data) => {
                if (data.message) {
                    console.error(data.message);
                    return;
                }

                out.innerHTML = "";
                data.forEach(item => {
                    const option = document.createElement("option");
                    option.value = item.sys_pk;
                    option.text = item.text;

                    out.appendChild(option);
                });
                proveedor.trigger(out,"change");
            }
            let onFailure = (error) => { console.error(error) }
            InduxsoftCrudlModel.InvokeService(url,null,onSuccess,onFailure,"GET",false,false);
        },

        fillCiudades(ref,out){
            let url = this.url_buscar_ciudad.replace("search","iestado");
            url = InduxsoftCrudlModel.UrlReplace(url,{iestado:ref.value});

            let onSuccess = (data) => {
                if (data.message) {
                    console.error(data.message);
                    return;
                }

                out.innerHTML = "";
                data.forEach(item => {
                    const option = document.createElement("option");
                    option.value = item.sys_pk;
                    option.text = item.text;

                    out.appendChild(option);
                });
            }
            let onFailure = (error) => { console.error(error) }
            InduxsoftCrudlModel.InvokeService(url,null,onSuccess,onFailure,"GET",false,false);
        },

        saveForm(){
            if (!this.formProveedor.reportValidity()) return;

            this.formProveedor.submit();
        },
    },
}