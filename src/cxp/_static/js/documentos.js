var documento =
{
    tableId: "", table: null,

    init()
    {
        if (this.tableId.trim() != "") { this.table = document.getElementById(this.tableId); }
        this.setTableEvents();
    },

    trigger(element,event) {
        if (element) {
            if (event=='submit') {
                element.requestSubmit();
                return
            }
            let e = new Event(event);
            element.dispatchEvent(e);
        }
    },

    submit(form) {
        if (!form || !form.reportValidity()) return;
        form.submit();
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
        window.location.href = url.replace("@doc",data.sys_pk);
    },

    getCurrentContext()
    {
        const id = (this.table?.DataArray[this.table.CurrentRowIndex()]?.sys_pk ?? "");
        return { item_id:id, context: {} }
    },

    setTableEvents()
    {
        if (!this.table) return;

        const table = this.table;
        const event = table.EdiTable.Const.Events;

        table.Events[event.LostFocus] = (e) => {
            // v12navbar.toggleButtonInteraction(true);
        }

        table.Events[event.BeforeCellFocus] = (e) => {
            // v12navbar.toggleButtonInteraction(false);
        }

        table.Events[event.RowChanged] = (e) => {
            let obj = table.DataArray[e.index];
            v12navbar.toggleButtonInteraction(!obj);

            const btn_pagar = document.getElementById("v12_GC13");
            const btn_bonif = document.getElementById("v12_GC14");
            const btn_intmor = document.getElementById("v12_GC15");
            const btn_aplicar = document.getElementById("v12_GC16");

            if (btn_pagar) btn_pagar.parentElement.hidden = (Number(obj?.haber) <= 0);
            if (btn_bonif) btn_bonif.parentElement.hidden = (Number(obj?.haber) <= 0);
            if (btn_intmor) btn_intmor.parentElement.hidden = (Number(obj?.haber) <= 0);
            if (btn_aplicar) btn_aplicar.parentElement.hidden = (Number(obj?.debe) <= 0);
        }

        v12navbar.toggleButtonInteraction(true);
    },

    list: {},

    form: {},

    crear: {
        formcxp: null,
        elements: null,
        btnSave: null,

        init()
        {
            this.formcxp = document.getElementById("form_cxp");
            this.btnSave = document.getElementById("btn_save");
            this.setEvents();
        },

        setEvents()
        {
            if (this.btnSave) { this.btnSave.addEventListener("click", () => { documento.trigger(this.formcxp,"submit") }); }
            if (this.formcxp) {
                this.elements = this.formcxp.elements;

                let ik_proveedor = document.getElementById("sel_proveedor");
                ik_proveedor.addEventListener("change",function(data) {
                    let txt_divisa = document.getElementById("txt_divisa");
                    let txt_tcambio = document.getElementById("txt_tcambio");

                    txt_divisa.value = data.divisa;
                    txt_tcambio.value = data.tcambio;
                });
            }
        },
    },

    pago: {
        formPagoCXP: null,
        elements: null,
        btnSave: null,
        dtCXP: {},
        dvsPred: {},
        decimals: 2,

        init()
        {
            this.formPagoCXP = document.getElementById("form_pagocxp");
            this.btnSave = document.getElementById("btn_save");
            this.setEvents();
        },

        setEvents()
        {
            if (this.btnSave) { this.btnSave.addEventListener("click", () => { documento.trigger(this.formPagoCXP,"submit") }); }
            if (this.formPagoCXP) {
                this.elements = this.formPagoCXP.elements;

                this.elements["txt_importe"].addEventListener("input", (event) => {
                    let importe = Number(event.target.value);
                    let saldo = Number(this.dtCXP.saldo);

                    this.elements["txt_nuevo_saldo"].value = Math.RoundTo(Math.sub(saldo,importe),this.decimals);
                });

                this.elements["sel_cuenta_retiro"].addEventListener("change", (event) => {
                    let option = event.target.options[event.target.selectedIndex];
                    let codigo = option.getAttribute("data-divisa").toUpperCase();
                    let cambio = Number(option.getAttribute("data-tcambio"));

                    this.pedirTCambio();

                    this.elements["txt_tcambio_retiro"].value = Math.RoundTo(cambio, this.decimals);
                    documento.trigger(this.elements["txt_tcambio_retiro"],"change");
                });
                
                this.elements["txt_tcambio_retiro"].addEventListener("change", (event) => {
                    let tcambio_ret = Number(event.target.value);
                    let tcambio_pdr = Number(this.elements["txt_tcambio"].value);
                    
                    let importe_pdr = Number(this.elements["txt_importe"].value);
                    let importe_ret = Math.mul(importe_pdr,tcambio_pdr);
                    importe_ret = Math.div(importe_ret,tcambio_ret);
                    
                    this.elements["txt_importe_retiro"].value = Math.RoundTo(importe_ret,this.decimals);
                });
                this.elements["txt_importe_retiro"].addEventListener("change", (event) => {
                    let tcambio_pdr = Number(this.elements["txt_tcambio"].value);
                    let tcambio_ret = Number(this.elements["txt_tcambio_retiro"].value);
                    
                    let importe_ret = Number(event.target.value);
                    let importe_pdr = Math.mul(importe_ret,tcambio_ret);
                    importe_pdr = Math.div(importe_pdr,tcambio_pdr);

                    this.elements["txt_importe"].value = Math.RoundTo(importe_pdr,this.decimals);
                    documento.trigger(this.elements["txt_importe"],"input");
                });

                this.elements["txt_importe"].addEventListener("change", (event) => {
                    let tcambio_pdr = Number(this.elements["txt_tcambio"].value);
                    let tcambio_ret = Number(this.elements["txt_tcambio_retiro"].value);
                    
                    let importe_pdr = Number(event.target.value);
                    let importe_ret = Math.mul(importe_pdr,tcambio_pdr);
                    importe_ret = Math.div(importe_ret,tcambio_ret);

                    this.elements["txt_importe_retiro"].value = Math.RoundTo(importe_ret,this.decimals);
                });

                documento.trigger(this.elements["txt_importe"],"input");
                documento.trigger(this.elements["sel_cuenta_retiro"],"change");
            }
        },

        pedirTCambio(){
            let optCtaR = this.elements["sel_cuenta_retiro"].options[this.elements["sel_cuenta_retiro"].selectedIndex];
            let cDvsPred = (this.dvsPred.codigo).toUpperCase();
            let cDvsProv = (this.dtCXP.divisa).toUpperCase();
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

    bonificacion: {
        formBonificacionCXP: null,
        elements: null,
        btnSave: null,
        dtCXP: {},
        dvsPred: {},
        decimals: 2,

        init()
        {
            this.formBonificacionCXP = document.getElementById("form_bonificacion_cxp");
            this.btnSave = document.getElementById("btn_save");
            this.setEvents();
        },

        setEvents()
        {
            if (this.btnSave) { this.btnSave.addEventListener("click", () => { documento.trigger(this.formBonificacionCXP,"submit") }); }
            if (this.formBonificacionCXP) {
                this.elements = this.formBonificacionCXP.elements;

                this.elements["txt_importe"].addEventListener("input", (event) => {
                    let importe = Number(event.target.value);
                    let saldo = Number(this.dtCXP.saldo);

                    this.elements["txt_nuevo_saldo"].value = Math.RoundTo(Math.sub(saldo,importe),this.decimals);
                });
            }
        },
    },

    intmor: {
        formIntMor: null,
        elements: null,
        btnSave: null,
        dtCXP: {},
        dvsPred: {},
        decimals: 2,

        init()
        {
            this.formIntMor = document.getElementById("form_intmor");
            this.btnSave = document.getElementById("btn_save");
            this.setEvents();
        },

        setEvents()
        {
            if (this.btnSave) { this.btnSave.addEventListener("click", () => { documento.trigger(this.formIntMor,"submit") }); }
            if (this.formIntMor) {
                this.elements = this.formIntMor.elements;

                this.elements["txt_importe"].addEventListener("input", (event) => {
                    let importe = Number(event.target.value);
                    let saldo = Number(this.dtCXP.saldo);

                    this.elements["txt_nuevo_saldo"].value = Math.RoundTo(Math.add(saldo,importe),this.decimals);
                });
            }
        },
    },

    aplicar: {
        tbl_xaplicar:null, arr_xaplicar:[], tbl_aplicados:null, arr_aplicados:[],
        source:{}, decimals:2,

        init()
        {
            this.tbl_xaplicar = document.getElementById("tbl_xaplicar");
            this.tbl_aplicados = document.getElementById("tbl_aplicados");
            const btn_aplicar = document.getElementById("btn_aplicar");
            const btn_desaplicar = document.getElementById("btn_desaplicar");

            btn_aplicar.addEventListener("click", (e) => this.aplicar());
            btn_desaplicar.addEventListener("click", (e) => this.desaplicar());

            this.setTableEvents();
        },

        setTableEvents()
        {
            if (this.tbl_xaplicar)
            {
                let table = this.tbl_xaplicar;
                let events = table.EdiTable.Const.Events;
                this.arr_xaplicar = table?.DataArray ?? [];

                table.AutoAddRow = false;

                table.Events[events.BeforeUpdateCell] = (e) => this.validarImportes(e);
                table.Events[events.ConfirmEdition] = (e) => this.actualizarImportes(e);
            }
            
            if (this.tbl_aplicados)
            {
                let table = this.tbl_aplicados;
                let events = table.EdiTable.Const.Events;
                this.arr_aplicados = table?.DataArray ?? [];

                table.AutoAddRow = false;
            }
        },

        submit(endpoint, data, callback=null)
        {
            // Opciones de la petición
            const options =
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            };

            // Hacer la petición
            fetch(endpoint, options).then((response) => response.json())
            .then((res) => {
                // Manejar la respuesta del servidor
                if (res.message) {
                    alert(res.message);
                    return;
                }

                if (callback) callback(res);
                else console.log(res);
            })
            .catch((err) => {
                // Manejar el error
                alert(err.message);
            });
        },

        aplicar()
        {
            let arr_xaplicar = this.tbl_xaplicar.DataArray;
            
            let lista = [];
            for (let i = 0; i < arr_xaplicar.length; i++) {
                const doc = arr_xaplicar[i];
                let aplicar = Number(doc.aplicar);
                
                if (aplicar <= 0) continue;

                let destino =
                {
                    id_origen: this.source.sys_pk,
                    id_destino: doc.sys_pk,
                    aplicar: aplicar
                }

                lista.push(destino);
            }
            
            if (lista.length === 0) return;
            let data = { aplicacion: lista }

            this.submit("./?_act=aplicar", data, function(res){ window.location.reload() });
        },

        desaplicar()
        {
            let arr_aplicados = this.tbl_aplicados.DataArray;

            if (arr_aplicados.length === 0) return;
            if (!confirm("¿Esta seguro que quiere desaplicar todos los documentos?")) return;

            this.submit("./?_act=desaplicar", {}, function(res){ window.location.reload() });
        },

        importesAplicar(e)
        {
            let cur_row = e.sender.RowIndexOfTd(e.td);
            let arr_xaplicar = this.tbl_xaplicar.DataArray;
                        
            let saplicado = this.source.aplicado;
            let sxaplicar = this.source.xaplicar;

            let saldo = Number(e.sender.DataArray[cur_row]["saldo"]);
            let aplicar = Number(e.text.trim());
            let sfinal = Math.sub(saldo,aplicar);

            let aplicado = 0;
            let xaplicar = 0;
            for (let i = 0; i < arr_xaplicar.length; i++) {
                const impAplicar = Number(arr_xaplicar[i]["aplicar"]);
                aplicado = Math.add(aplicado,impAplicar);
            }
            aplicado = Math.RoundTo(Math.add(aplicado,aplicar),this.decimals);
            xaplicar = Math.RoundTo(Math.sub(sxaplicar,aplicado),this.decimals);

            let rst = 
            {
                aplicar: aplicar,
                sfinal: sfinal,
                aplicado: aplicado,
                xaplicar: xaplicar,
            }

            return rst
        },

        validarImportes(e)
        {
            if (e.coldef.field === "aplicar" && !e.cancel)
            {
                let rst = this.importesAplicar(e);
                
                if (rst.aplicar < 0) {
                    alert("El importe a aplicar no puede ser menor a 0.");
                    e.cancel = true;
                    return;
                }

                if (rst.sfinal < 0) {
                    alert("El importe a aplicar no puede ser mayor al saldo del documento.");
                    e.cancel = true;
                    return;
                }

                if (rst.xaplicar < 0) {
                    alert("El importe aplicado no puede superar al saldo disponible para aplicar.");
                    e.cancel = true;
                    return;
                }
            }
        },

        actualizarImportes(e)
        {
            let cur_row = e.sender.RowIndexOfTd(e.td);
                        
            if (e.coldef.field === "aplicar")
            {
                let lbl_saldo = document.getElementById("lbl_saldo");
                let lbl_aplicado = document.getElementById("lbl_aplicado");
                let lbl_xaplicar = document.getElementById("lbl_xaplicar");

                let rst = this.importesAplicar(e);

                e.sender.DataArray[cur_row]["aplicar"] = rst.aplicar;
                e.sender.DataArray[cur_row]["sfinal"] = rst.sfinal;
                e.sender.UpdateRow(cur_row);

                let langcode = (new Intl.NumberFormat()).resolvedOptions().locale;
                const formatter = new Intl.NumberFormat(langcode, {
                    style: "currency",
                    currency: "MXN",
                    minimumFractionDigits: this.decimals,
                    maximumFractionDigits: this.decimals
                });

                lbl_aplicado.textContent = formatter.format(rst.aplicado);
                lbl_xaplicar.textContent = formatter.format(rst.xaplicar);
            }
        },
    }
}