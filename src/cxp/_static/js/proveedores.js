var proveedor =
{
    tableId: "", table: null,

    init()
    {
        if (this.tableId.trim() != "") { this.table = document.getElementById(this.tableId); }
    },

    trigger(element,event) {
        if (element) {
            if (element.nodeName==="FORM" && event=='submit') {
                element.requestSubmit();
                return
            }
            let e = new Event(event);
            element.dispatchEvent(e);
        }
    },

    round(num, dec=2) {
        var signo = (num >= 0 ? 1 : -1);
        num = num * signo;
        if (dec === 0) return signo * Math.round(num);
        num = num.toString().split('e');
        num = Math.round(+(num[0] + 'e' + (num[1] ? (+num[1] + dec) : dec)));
        num = num.toString().split('e');
        return signo * (num[0] + 'e' + (num[1] ? (+num[1] - dec) : -dec));
    },

    goTo(url) {
        if (!url) { alert("No se ha indicado un destino."); return; }
        if (!this.table) { alert("No se encontro una definición de tabla (edit-table)."); return; }
        if (this.table.CurrentRowIndex() < 0) { alert("Debe seleccionar una fila"); return; }

        var data = this.table.DataArray[this.table.CurrentRowIndex()];
        window.location.href = url.replace("@proveedor",data.sys_pk);
    },

    getCurrentContext()
    {
        const id = (this.table?.DataArray[this.table.CurrentRowIndex()]?.sys_pk ?? "");
        return { item_id:id, context: {} }
    },

    list: {
        tbl_proveedores: null,
        tEvents: {},
        tData: {},
        txt_search_proveedor: null,
        btn_search_proveedor: null,

        init()
        {
            this.txt_search_proveedor = document.getElementById("txt_search_proveedor");
            this.btn_search_proveedor = document.getElementById("btn_search_proveedor");
            this.tbl_proveedores = document.getElementById("tbl_proveedores");

            if (this.txt_search_proveedor) {
                this.txt_search_proveedor.addEventListener("keydown", (e) => {
                    if (e.key === "Enter") this.buscarProveedor();
                });
            }
            if (this.btn_search_proveedor) {
                this.btn_search_proveedor.addEventListener("click", () => { this.buscarProveedor(); });
            }

            this.setEvents();
            this.setKeyboardShortcuts();
        },

        setEvents()
        {
            if (this.tbl_proveedores)
            {
                this.tbl_proveedores.hiddeSelector = true;
                this.tbl_proveedores.AutoAddRow = false;
                this.tbl_proveedores.AutoDelRow = false;

                this.tEvents = this.tbl_proveedores.EdiTable.Const.Events;
                // this.tData = this.tbl_proveedores.DataArray;

                this.tbl_proveedores.Events[this.tEvents.EnterCell] = (e) => {
                    let tr = e.td.offsetParent;
                    // let currRow = e.sender.CurrentRowIndex();
                    // let currCol = e.sender.CurrentColIndex();
                    // let dtPdr = this.tData[currRow];

                    tr.ondblclick = (event) => { proveedor.goTo("/!/cxp/proveedores/@proveedor/"); }
                };

                this.tbl_proveedores.Events[this.tEvents.BeforeCellFocus] = (e) => {
                    // v12navbar.toggleButtonInteraction(false);
                }

                this.tbl_proveedores.Events[this.tEvents.LostFocus] = (e) => {
                    // v12navbar.toggleButtonInteraction(true);
                }
                this.tbl_proveedores.Events[this.tEvents.RowChanged] = (e) => {
                    let obj = this.tbl_proveedores.DataArray[e.index];
                    v12navbar.toggleButtonInteraction(!obj);
                }
                v12navbar.toggleButtonInteraction(true);
            }
        },

        setKeyboardShortcuts()
        {
            document.addEventListener("keydown", (e) => {
                // console.log("key: "+ e.key + " | " + "code: " + e.code);
                if (e.key === "Escape") {
                    e.preventDefault();
                    window.open("/","_top");
                }
            });
        },

        buscarProveedor() {
            let text = this.txt_search_proveedor.value.trim();
            let url = this.txt_search_proveedor.getAttribute("data-url-search").trim();
            if (!text) return;
            if (!url) { alert("No se indico un destino"); return; }
            if (!this.tbl_proveedores) { alert("No se ha definido la tabla de proveedores."); return; }
            url = url.replace("@search",text);
            
            let onSuccess = (data) => {
                if (data.message) { alert(data.message); return;}
                let div_spnmsg = document.getElementById("div_spnmsg");

                if (Object.entries(data).length == 0) {
                    div_spnmsg.querySelector("#spnmsg").textContent = "No se encontraron resultados.";
                    div_spnmsg.classList.remove("d-none");
                } else {
                    div_spnmsg.querySelector("#spnmsg").textContent = "";
                    div_spnmsg.classList.add("d-none");
                }
                
                this.tData = data;
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
        _GET: {},
        formProveedor: null,
        elements: null,
        btnSave: null,

        dtProv: {},
        domicilio1: {},
        domicilio2: {},
        domicilio3: {},

        url_buscar_edoprov: "",
        url_buscar_ciudad: "",
        url_buscar_contacto: "",
        CXP_PROVS: "", PDR_AGREGAR: "",
        ipais: 0, iestado: 0, iciudad: 0,
        
        init()
        {
            this.formProveedor = document.getElementById("form_proveedor");
            this.btnSave = document.getElementById("btn_save");
            this.setEvents();
            this.setKeyboardShortcuts();
        },
        ValidateForm(event)
        {
            if(!event)return true;
            
            event.stopPropagation();
            event.preventDefault();

            var form=event.target;
      
            if(!form)return true;

            if(!form.reportValidity())return false;

            var fields_number=form.querySelectorAll(".validate-number");
            
            var break_for=false;
            for (let i = 0; i < fields_number.length; i++) 
            {
                const field = fields_number[i];
                if(field && field.hasAttribute("required"))
                {
                    var data_value=field.getAttribute("data-value") ?? field.value;
                    var value=field.getAttribute("value");
                    var alert_text=field.getAttribute("alert");
                    if(data_value.trim()!="")value=data_value;

                    if(Number(value)<1)
                    {
                        var msg=field.message??"El campo "+field.name+" debe ser mayor a 0";
                        break_for=true;
                        field.focus();
                        if(alert_text=="true")
                        {
                            alert(msg);
                        }
                    }
                }
                if(break_for)break;
            }
            if(break_for)return false;

            return true;
        },
        setEvents()
        {
            if (this.btnSave) { this.btnSave.addEventListener("click", () => { this.saveForm(); }); }
            if (this.formProveedor) {
                this.elements = this.formProveedor.elements;

                this.elements["chq_domicilio1"].addEventListener("change", (event) => {
                    let domicilio1 = document.getElementById("cbody_domicilio1");
                    (event.target.checked) ? domicilio1.classList.remove("disable-form") : domicilio1.classList.add("disable-form");
                    
                    if (this._GET["_entity_id"] == "_new" || Object.entries(this.domicilio1).length == 0) { this.elements["sel_pais"].value = this.ipais; }
                    else { this.elements["sel_pais"].value = this.domicilio1.ipais; }

                    if (this.elements["sel_estado"].options.length <= 0) this.fillEstados(this.elements["sel_pais"],this.elements["sel_estado"]);
                });
                this.elements["sel_pais"].addEventListener("change", () => {
                    this.fillEstados(this.elements["sel_pais"],this.elements["sel_estado"]);
                });
                this.elements["sel_estado"].addEventListener("change", () => {
                    this.fillCiudades(this.elements["sel_estado"],this.elements["sel_ciudad"]);
                });
                
                this.elements["chq_domicilio2"].addEventListener("change", (event) => {
                    let domicilio2 = document.getElementById("cbody_domicilio2");
                    (event.target.checked) ? domicilio2.classList.remove("disable-form") : domicilio2.classList.add("disable-form");

                    if (this._GET["_entity_id"] == "_new" || Object.entries(this.domicilio2).length == 0) { this.elements["sel_pais2"].value = this.ipais; }
                    else { this.elements["sel_pais2"].value = this.domicilio2.ipais; }

                    if (this.elements["sel_estado2"].options.length <= 0) this.fillEstados(this.elements["sel_pais2"],this.elements["sel_estado2"]);
                });
                this.elements["sel_pais2"].addEventListener("change", () => {
                    this.fillEstados(this.elements["sel_pais2"],this.elements["sel_estado2"]);
                });
                this.elements["sel_estado2"].addEventListener("change", () => {
                    this.fillCiudades(this.elements["sel_estado2"],this.elements["sel_ciudad2"]);
                });

                this.elements["chq_domicilio3"].addEventListener("change", (event) => {
                    let domicilio3 = document.getElementById("cbody_domicilio3");
                    (event.target.checked) ? domicilio3.classList.remove("disable-form") : domicilio3.classList.add("disable-form");

                    if (this._GET["_entity_id"] == "_new" || Object.entries(this.domicilio3).length === 0) { this.elements["sel_pais3"].value = this.ipais; }
                    else { this.elements["sel_pais3"].value = this.domicilio3.ipais; }

                    if (this.elements["sel_estado3"].options.length <= 0) this.fillEstados(this.elements["sel_pais3"],this.elements["sel_estado3"]);
                });
                this.elements["sel_pais3"].addEventListener("change", () => {
                    this.fillEstados(this.elements["sel_pais3"],this.elements["sel_estado3"]);
                });
                this.elements["sel_estado3"].addEventListener("change", () => {
                    this.fillCiudades(this.elements["sel_estado3"],this.elements["sel_ciudad3"]);
                });

                this.elements["chq_otorgar_credito"].addEventListener("change", (event) => {
                    let div_credito = document.getElementById("div_otorgar_credito");
                    (event.target.checked) ? div_credito.classList.remove("disable-form") : div_credito.classList.add("disable-form");
                });
                this.elements["rd_credito_ilimitado"].addEventListener("change", (event) => {
                    this.elements["limitecredito"].type = "hidden";
                    this.elements["limitecredito"].value = 0;
                });
                this.elements["rd_credito_limitado"].addEventListener("change", (event) => {
                    this.elements["limitecredito"].type = "number";
                });

                if (this._GET["_entity_id"] != "new")
                {
                    proveedor.trigger(this.elements["chq_domicilio1"],"change");

                    let contacto1 = Number(this.dtProv.contacto1);
                    let contacto2 = Number(this.dtProv.contacto2);
                    let contacto3 = Number(this.dtProv.contacto3);

                    if (contacto1 > 0) {
                        let ikContacto1 = document.getElementById("ik_contacto1");
                        this.setContacto(ikContacto1,contacto1);
                    }
                    if (contacto2 > 0) {
                        let ikContacto2 = document.getElementById("ik_contacto2");
                        this.setContacto(ikContacto2,contacto2);
                    }
                    if (contacto3 > 0) {
                        let ikContacto3 = document.getElementById("ik_contacto3");
                        this.setContacto(ikContacto3,contacto3);
                    }

                    proveedor.trigger(this.elements["chq_domicilio2"],"change");
                    proveedor.trigger(this.elements["chq_domicilio3"],"change");
                }
            }
        },

        setKeyboardShortcuts()
        {
            document.addEventListener("keydown", (e) => {
                // console.log("key: "+ e.key + " | " + "code: " + e.code);
                if (e.key === "Escape") {
                    // Salir
                    e.preventDefault();
                    window.location.href = this.CXP_PROVS;
                }
                if (e.key === "F2") {
                    // Agregar nuevo
                    e.preventDefault();
                    if (this._GET["_entity_id"] != "_new") window.location.href = this.PDR_AGREGAR;
                }
                if (e.key === "F6") {
                    // Guardar
                    e.preventDefault();
                    this.elements["shortcut"].value = "F6";
                    this.saveForm();
                }
                if (e.key === "F8") {
                    // Guardar y salir
                    e.preventDefault();
                    this.elements["shortcut"].value = "F8";
                    this.saveForm();
                }
                if (e.key === "F9") {
                    // Guardar y nuevo
                    e.preventDefault();
                    this.elements["shortcut"].value = "F9";
                    this.saveForm();
                }
            });
        },

        fillEstados(ref,out){
            let url = this.url_buscar_edoprov.replace("search","ipais");
            url = InduxsoftCrudlModel.UrlReplace(url,{ipais:ref.value});
            let selected = this.iestado;
            if (this._GET["_entity_id"] != "_new")
            {
                if (out.id == "sel_estado" && Object.entries(this.domicilio1).length > 0) selected = this.domicilio1.iestado;
                else if (out.id == "sel_estado2" && Object.entries(this.domicilio2).length > 0) selected = this.domicilio2.iestado;
                else if (out.id == "sel_estado3" && Object.entries(this.domicilio3).length > 0) selected = this.domicilio3.iestado;
            }

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
                    if (item.sys_pk == selected) option.selected = true;

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
            let selected = this.iciudad;
            if (this._GET["_entity_id"] != "new")
            {
                if (out.id == "sel_ciudad" && Object.entries(this.domicilio1).length > 0) selected = this.domicilio1.iciudad;
                else if (out.id == "sel_ciudad2" && Object.entries(this.domicilio2).length > 0) selected = this.domicilio2.iciudad;
                else if (out.id == "sel_ciudad3" && Object.entries(this.domicilio3).length > 0) selected = this.domicilio3.iciudad;
            }

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
                    if (item.sys_pk == selected) option.selected = true;

                    out.appendChild(option);
                });
            }
            let onFailure = (error) => { console.error(error) }
            InduxsoftCrudlModel.InvokeService(url,null,onSuccess,onFailure,"GET",false,false);
        },

        setContacto(ik,icontacto){
            let url = this.url_buscar_contacto.replace("search","id");
            url = InduxsoftCrudlModel.UrlReplace(url,{id:icontacto})

            let onSuccess = (data) => {
                if (data.message) { alert(data.message); return; }
                ik.setValue(data);
            }
            let onFailure = (error) => { console.error(error) }
            InduxsoftCrudlModel.InvokeService(url,null,onSuccess,onFailure,"GET",false,false);
        },

        saveForm(){
            if (!this.formProveedor.reportValidity()) return;

            this.formProveedor.submit();
        },
    },

    pago: {
        formPagoProv: null,
        elements: null,
        btnSave: null,
        dtProv: {},
        dvsPred: {},
        decimals: 2,

        init()
        {
            this.formPagoProv = document.getElementById("form_pagoprov");
            this.btnSave = document.getElementById("btn_save");
            this.setEvents();
        },

        setEvents()
        {
            if (this.btnSave) { this.btnSave.addEventListener("click", () => { proveedor.trigger(this.formPagoProv,"submit") }); }
            if (this.formPagoProv) {
                this.elements = this.formPagoProv.elements;

                this.elements["sel_cuenta_retiro"].addEventListener("change", (event) => {
                    let option = event.target.options[event.target.selectedIndex];
                    let codigo = option.getAttribute("data-divisa").toUpperCase();
                    let cambio = Number(option.getAttribute("data-tcambio"));

                    this.pedirTCambio();

                    this.elements["txt_tcambio_retiro"].value = Math.RoundTo(cambio, this.decimals);
                    proveedor.trigger(this.elements["txt_tcambio_retiro"],"change");
                });
                
                this.elements["txt_tcambio_retiro"].addEventListener("change", (event) => {
                    let tcambio_ret = Number(event.target.value);
                    let tcambio_pdr = Number(this.elements["txt_tcambio"].value);
                    
                    let importe_pdr = Number(this.elements["txt_importe"].value);
                    let importe_ret = Math.mul(importe_pdr,tcambio_pdr);
                    importe_ret = Math.div(importe_ret,tcambio_ret);
                    
                    this.elements["txt_importe_retiro"].value = Math.RoundTo(importe_ret, this.decimals);
                });
                this.elements["txt_importe_retiro"].addEventListener("change", (event) => {
                    let tcambio_pdr = Number(this.elements["txt_tcambio"].value);
                    let tcambio_ret = Number(this.elements["txt_tcambio_retiro"].value);
                    
                    let importe_ret = Number(event.target.value);
                    let importe_pdr = Math.mul(importe_ret,tcambio_ret);
                    importe_pdr = Math.div(importe_pdr,tcambio_pdr);

                    this.elements["txt_importe"].value = Math.RoundTo(importe_pdr, this.decimals);
                });

                this.elements["txt_importe"].addEventListener("change", (event) => {
                    let tcambio_pdr = Number(this.elements["txt_tcambio"].value);
                    let tcambio_ret = Number(this.elements["txt_tcambio_retiro"].value);
                    
                    let importe_pdr = Number(event.target.value);
                    let importe_ret = Math.mul(importe_pdr,tcambio_pdr);
                    importe_ret = Math.div(importe_ret,tcambio_ret);

                    this.elements["txt_importe_retiro"].value = Math.RoundTo(importe_ret, this.decimals);
                });
            }
        },

        pedirTCambio(){
            let optCtaR = this.elements["sel_cuenta_retiro"].options[this.elements["sel_cuenta_retiro"].selectedIndex];
            let cDvsPred = (this.dvsPred.codigo).toUpperCase();
            let cDvsProv = (this.dtProv.divisa).toUpperCase();
            let cDvsCtaR = optCtaR.getAttribute("data-divisa").toUpperCase();

            let hide_tcambio_ret = false;
            let hide_importe_ret = false;
            let hide_tcambio_pdr = false;

            let div_tcambio_pdr = document.getElementById("div_tcambio");
            let txt_tcambio_pdr = document.getElementById("txt_tcambio");
            let txt_importe_pdr = document.getElementById("txt_importe");

            let div_tcambio_ret = document.getElementById("div_tcambio_retiro");
            let div_importe_ret = document.getElementById("div_importe_retiro");
            let txt_tcambio_ret = document.getElementById("txt_tcambio_retiro");
            let spn_tcambio_ret = document.getElementById("spn_tcambio_retiro");
            let txt_importe_ret = document.getElementById("txt_importe_retiro");
            let spn_importe_ret = document.getElementById("spn_importe_retiro");

            if (cDvsPred == cDvsProv && cDvsPred == cDvsCtaR)
            {
                txt_tcambio_pdr.value = 1;
                txt_tcambio_ret.value = 1;

                hide_tcambio_pdr = true;
                hide_tcambio_ret = true;
                hide_importe_ret = true;
            }
            else if (cDvsPred != cDvsProv && cDvsProv == cDvsCtaR)
            {
                let tcambio_pdr = Number(txt_tcambio_pdr.value);

                txt_tcambio_pdr.value = (tcambio_pdr <= 0) ? Number(this.dtProv.tcambio) : tcambio_pdr;
                txt_tcambio_ret.value = (tcambio_pdr <= 0) ? Number(this.dtProv.tcambio) : tcambio_pdr;

                hide_tcambio_ret = true;
                hide_importe_ret = true;
            }
            else if (cDvsPred == cDvsProv && cDvsPred != cDvsCtaR)
            {
                let tcambio_ret = Number(txt_tcambio_ret.value);

                txt_tcambio_pdr.value = 1;
                txt_tcambio_ret.value = (tcambio_ret <= 0) ? Number(optCtaR.getAttribute("data-tcambio")) : tcambio_ret;
                
                spn_tcambio_ret.innerText = cDvsPred + " = 1 " + cDvsCtaR;
                spn_importe_ret.innerText = cDvsCtaR;

                hide_tcambio_pdr = true;
            }
            else if (cDvsPred != cDvsProv && cDvsPred == cDvsCtaR)
            {
                let tcambio_pdr = Number(txt_tcambio_pdr.value);

                txt_tcambio_pdr.value = (tcambio_pdr <= 0) ? Number(this.dtProv.tcambio) : tcambio_pdr;
                txt_tcambio_ret.value = 1;

                spn_tcambio_ret.innerText = cDvsPred + " = 1 " + cDvsCtaR;
                spn_importe_ret.innerText = cDvsCtaR;

                hide_tcambio_ret = true;
            }
            else if (cDvsPred != cDvsProv && cDvsPred != cDvsCtaR)
            {
                let tcambio_pdr = Number(txt_tcambio_pdr.value);
                let tcambio_ret = Number(txt_tcambio_ret.value);

                txt_tcambio_pdr.value = (tcambio_pdr <= 0) ? Number(this.dtProv.tcambio) : tcambio_pdr;
                txt_tcambio_ret.value = (tcambio_ret <= 0) ? Number(optCtaR.getAttribute("data-tcambio")) : tcambio_ret;
                
                spn_tcambio_ret.innerText = cDvsPred + " = 1 " + cDvsCtaR;
                spn_importe_ret.innerText = cDvsCtaR;
            }

            txt_importe_pdr.value = Number(txt_importe_pdr.value);
            txt_importe_ret.value = Number(txt_importe_ret.value);

            div_tcambio_ret.classList.toggle("d-none",hide_tcambio_ret);
            div_importe_ret.classList.toggle("d-none",hide_importe_ret);
            div_tcambio_pdr.classList.toggle("d-none",hide_tcambio_pdr);
        },
    },

    devolucion: {
        formId: "", form: null, ff: null,
        dtProv: {},
        dvsPred: {},
        decimals: 2,

        init()
        {
            this.form = document.getElementById(this.formId);
            this.ff = this.form.elements;
            
            this.setEvents();
        },

        setEvents()
        {
            if (!this.form) return;

            this.ff["sel_cuenta_deposito"].addEventListener("change", (event) => {
                let option = event.target.options[event.target.selectedIndex];
                let codigo = option.getAttribute("data-divisa").toUpperCase();
                let cambio = Number(option.getAttribute("data-tcambio"));

                this.pedirTCambio();

                this.ff["txt_tcambio_deposito"].value = Math.RoundTo(cambio, this.decimals);
                proveedor.trigger(this.ff["txt_tcambio_deposito"],"change");
            });
            
            this.ff["txt_tcambio_deposito"].addEventListener("change", (event) => {
                let tcambio_ret = Number(event.target.value);
                let tcambio_pdr = Number(this.ff["txt_tcambio"].value);
                
                let importe_pdr = Number(this.ff["txt_importe"].value);
                let importe_ret = Math.mul(importe_pdr,tcambio_pdr);
                importe_ret = Math.div(importe_ret,tcambio_ret);
                
                this.ff["txt_importe_deposito"].value = Math.RoundTo(importe_ret, this.decimals);
            });
            this.ff["txt_importe_deposito"].addEventListener("change", (event) => {
                let tcambio_pdr = Number(this.ff["txt_tcambio"].value);
                let tcambio_ret = Number(this.ff["txt_tcambio_deposito"].value);
                
                let importe_ret = Number(event.target.value);
                let importe_pdr = Math.mul(importe_ret,tcambio_ret);
                importe_pdr = Math.div(importe_pdr,tcambio_pdr);

                this.ff["txt_importe"].value = Math.RoundTo(importe_pdr, this.decimals);
            });

            this.ff["txt_importe"].addEventListener("change", (event) => {
                let tcambio_pdr = Number(this.ff["txt_tcambio"].value);
                let tcambio_ret = Number(this.ff["txt_tcambio_deposito"].value);
                
                let importe_pdr = Number(event.target.value);
                let importe_ret = Math.mul(importe_pdr,tcambio_pdr);
                importe_ret = Math.div(importe_ret,tcambio_ret);

                this.ff["txt_importe_deposito"].value = Math.RoundTo(importe_ret, this.decimals);
            });

            const btnSubmit = document.getElementById("btn-submit");
            btnSubmit.addEventListener("click", (e) => proveedor.trigger(this.form,"submit"));
        },

        pedirTCambio(){
            let optCtaR = this.ff["sel_cuenta_deposito"].options[this.ff["sel_cuenta_deposito"].selectedIndex];
            let cDvsPred = (this.dvsPred.codigo).toUpperCase();
            let cDvsProv = (this.dtProv.divisa).toUpperCase();
            let cDvsCtaR = optCtaR.getAttribute("data-divisa").toUpperCase();

            let hide_tcambio_ret = false;
            let hide_importe_ret = false;
            let hide_tcambio_pdr = false;

            let div_tcambio_pdr = document.getElementById("div_tcambio");
            let txt_tcambio_pdr = document.getElementById("txt_tcambio");
            let txt_importe_pdr = document.getElementById("txt_importe");

            let div_tcambio_ret = document.getElementById("div_tcambio_deposito");
            let div_importe_ret = document.getElementById("div_importe_deposito");
            let txt_tcambio_ret = document.getElementById("txt_tcambio_deposito");
            let spn_tcambio_ret = document.getElementById("spn_tcambio_deposito");
            let txt_importe_ret = document.getElementById("txt_importe_deposito");
            let spn_importe_ret = document.getElementById("spn_importe_deposito");

            if (cDvsPred == cDvsProv && cDvsPred == cDvsCtaR)
            {
                txt_tcambio_pdr.value = 1;
                txt_tcambio_ret.value = 1;

                hide_tcambio_pdr = true;
                hide_tcambio_ret = true;
                hide_importe_ret = true;
            }
            else if (cDvsPred != cDvsProv && cDvsProv == cDvsCtaR)
            {
                let tcambio_pdr = Number(txt_tcambio_pdr.value);

                txt_tcambio_pdr.value = (tcambio_pdr <= 0) ? Number(this.dtProv.tcambio) : tcambio_pdr;
                txt_tcambio_ret.value = (tcambio_pdr <= 0) ? Number(this.dtProv.tcambio) : tcambio_pdr;

                hide_tcambio_ret = true;
                hide_importe_ret = true;
            }
            else if (cDvsPred == cDvsProv && cDvsPred != cDvsCtaR)
            {
                let tcambio_ret = Number(txt_tcambio_ret.value);

                txt_tcambio_pdr.value = 1;
                txt_tcambio_ret.value = (tcambio_ret <= 0) ? Number(optCtaR.getAttribute("data-tcambio")) : tcambio_ret;
                
                spn_tcambio_ret.innerText = cDvsPred + " = 1 " + cDvsCtaR;
                spn_importe_ret.innerText = cDvsCtaR;

                hide_tcambio_pdr = true;
            }
            else if (cDvsPred != cDvsProv && cDvsPred == cDvsCtaR)
            {
                let tcambio_pdr = Number(txt_tcambio_pdr.value);

                txt_tcambio_pdr.value = (tcambio_pdr <= 0) ? Number(this.dtProv.tcambio) : tcambio_pdr;
                txt_tcambio_ret.value = 1;

                spn_tcambio_ret.innerText = cDvsPred + " = 1 " + cDvsCtaR;
                spn_importe_ret.innerText = cDvsCtaR;

                hide_tcambio_ret = true;
            }
            else if (cDvsPred != cDvsProv && cDvsPred != cDvsCtaR)
            {
                let tcambio_pdr = Number(txt_tcambio_pdr.value);
                let tcambio_ret = Number(txt_tcambio_ret.value);

                txt_tcambio_pdr.value = (tcambio_pdr <= 0) ? Number(this.dtProv.tcambio) : tcambio_pdr;
                txt_tcambio_ret.value = (tcambio_ret <= 0) ? Number(optCtaR.getAttribute("data-tcambio")) : tcambio_ret;
                
                spn_tcambio_ret.innerText = cDvsPred + " = 1 " + cDvsCtaR;
                spn_importe_ret.innerText = cDvsCtaR;
            }

            txt_importe_pdr.value = Number(txt_importe_pdr.value);
            txt_importe_ret.value = Number(txt_importe_ret.value);

            div_tcambio_ret.classList.toggle("d-none",hide_tcambio_ret);
            div_importe_ret.classList.toggle("d-none",hide_importe_ret);
            div_tcambio_pdr.classList.toggle("d-none",hide_tcambio_pdr);
        },
    },

    bonificacion: {
        formBonificacion: null,
        elements: null,
        btnSave: null,

        init()
        {
            this.formBonificacion = document.getElementById("form_bonificacion_prov");
            this.btnSave = document.getElementById("btn_save");
            this.setEvents();
        },

        setEvents()
        {
            if (this.btnSave) { this.btnSave.addEventListener("click", () => { proveedor.trigger(this.formBonificacion,"submit") }); }
            if (this.formBonificacion) { this.elements = this.formBonificacion.elements; }
        },
    },
}