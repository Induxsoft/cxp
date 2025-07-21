var documento =
{
    tableId: "", table: null,
    url_exit: "",

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

    Delete(sys_pk)
    {
        if (!confirm("¿Esta seguro de eliminar el documento?")) return;
        
        let endpoint = "/!/cxp/documentos/"+sys_pk+"/";

        const onSuccess = (response)=>
        {
            alert("¡El documento se ha eliminado!");

            if (documento.url_exit.trim()!="") window.location.href = documento.url_exit.trim();
            else window.location.href = '/!/cxp/documentos/';
        }
        const onFailure = (failure) => {
            if (failure.message) alert(failure.message);
            else console.error(failure);
        }

        InduxsoftCrudlModel.InvokeService(endpoint,null,onSuccess,onFailure,"DELETE",false,false);
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

    crear: {
        formcxp: null,
        elements: null,
        btnSave: null,

        init()
        {
            this.formcxp = document.getElementById("form_cxp");
            this.btnSave = document.getElementById("btn_save");
            this.setEvents();

            this.btn_auth=document.getElementById("btn_auth");
            if(this.btn_auth)this.btn_auth.addEventListener("click",()=>{documento.calendario.AutorizarPago();});
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
        _rowdata:null,
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
                if (res.message) 
                {
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
                    aplicar: aplicar,
                    referencia:doc.referencia??""
                }

                lista.push(destino);
            }
            
            if (lista.length === 0) return;
            let data = { aplicacion: lista }

            this.submit("./?_act=aplicar", data, 
            (res)=>
            { 
                if(res)
                {
                    let error="Los siguientes documentos no pudieron ser aplicados:";
                    let cerror=0;
                    for (let i = 0; i < res.length; i++) 
                    {
                        const element = res[i];
                        if(element && element.error)
                        {
                            error+="\n\r"+element.referencia+" => "+element.error;
                            cerror++;
                        }
                    }
                    if(cerror>0)alert(error);
                }
                window.location.reload(); 
            }
            );
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
            let oaplicar = Number(e.sender.DataArray[cur_row]["aplicar"]);
            let aplicar = Number(e.text.trim());
            let sfinal = Math.sub(saldo,aplicar);

            let aplicado = 0;
            let xaplicar = 0;
            for (let i = 0; i < arr_xaplicar.length; i++) {
                const impAplicar = Number(arr_xaplicar[i]["aplicar"]);
                aplicado = Math.add(aplicado,impAplicar);
            }
            aplicado = Math.RoundTo(Math.add(Math.sub(aplicado,oaplicar),aplicar), this.decimals);
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
            let field = e.coldef.field;
            let index = e.sender.RowIndexOfTd(e.td);
            this._rowdata = JSON.parse(JSON.stringify(e.sender.DataArray[index]));

            if (field === "aplicar" && !e.cancel)
            {
                let rst = this.importesAplicar(e);
                
                if (rst.aplicar < 0) {
                    alert("El importe a aplicar no puede ser menor a 0.");
                    e.text = this._rowdata[field].toString();
                    return;
                }

                if (rst.sfinal < 0) {
                    alert("El importe a aplicar no puede ser mayor al saldo del documento.");
                    e.text = this._rowdata[field].toString();
                    return;
                }

                if (rst.xaplicar < 0) {
                    alert("El importe aplicado no puede superar al saldo disponible para aplicar.");
                    e.text = this._rowdata[field].toString();
                    return;
                }
            }
        },

        actualizarImportes(e)
        {
            let field = e.coldef.field;
            let cur_row = e.sender.RowIndexOfTd(e.td);
            
            if (this._rowdata[field] == e.text) return;

            if (field === "aplicar")
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
    },

    calendario: {
        tableId: "", table: null, decimals: 2,
        saldos:{ total:0, autorizado:0, rechazado:0, pagado:0, pendiente:0, xconfirmar:0 },

        init()
        {
            this.fil_date = document.getElementById("filter_date");
            this.fil_status = document.getElementById("sts");
            this.fil_divisas = document.getElementById("dvs");
            this.td_total = document.getElementById("td-total");
            this.td_autorizados = document.getElementById("td-autorizados");
            this.td_rechazados = document.getElementById("td-rechazados");
            this.td_pagados = document.getElementById("td-pagados");
            this.td_pendientes = document.getElementById("td-pendientes");
            this.td_xconfirmar = document.getElementById("td-xconfirmar");
            this.saldo_total = document.getElementById("saldo_total");

            this.table = document.getElementById(this.tableId);
            this.setTableEvents();

            if (this.fil_date._btnDone) this.fil_date._btnDone.addEventListener("click", () => {
                document.getElementById("form_search").submit();
            });
            if (this.fil_status) this.fil_status.addEventListener("change", () => {
                document.getElementById("form_search").submit();
            });
            if (this.fil_divisas) this.fil_divisas.addEventListener("change", () => {
                document.getElementById("form_search").submit();
            });

            this.updateSummary();
        },

        setTableEvents()
        {
            if (!this.table) return;

            const table = this.table;
            const events = table.EdiTable.Const.Events;

            var _global_data = null;

            table.onTdPaint=(td, row, col, field) =>
            {
                var data=table.DataArray[row];
                if(field!="f_prevpago" && data.edit_fprevpago)
                {
                    td.style="background:#F5F5F5;color:black;"
                }
                else if (!data.edit_fprevpago)
                {
                    td.style="background:#F5F5F5;color:black;"
                }

                if(field=="pa" || field=="depa")td.style="background:white;color:black;"
            };

            table.Events[events.EnterCell] = (e) =>
            {
                var data = table.DataArray[table.CurrentRowIndex()];
                this.tr_selected = table.GetTrByIndex(table.RowIndexOfTd(e.td));
                
                if(!data)return;

                if(data.edit_fprevpago) table.Columns[4] = {type:table.EdiTable.Const.Columns.Types.Date, field:"f_prevpago"};
                else table.Columns[4] = {type:table.EdiTable.Const.Columns.Types.NoEditable, field:"f_prevpago"};

                _global_data = data;
            }
            table.Events[events.ConfirmEdition] = (e) =>
            {
                let index = table.RowIndexOfTd(e.td);
                if(index < 1)return;

                var data = table.DataArray[index];
                if(!data)return;
            
                if((data.f_prevpago??"") != (e.text??"") && (e.text??"")!="")
                {
                    let fecha_fprev=(data.f_prevpago??"");
                    var request=
                    {
                        f_prevpago:e.text,
                        change_data:true
                    }

                    let onSuccess=(data)=>
                    {
                        
                    }
                    let onFailure=(failure)=>
                    {
                        data["f_prevpago"]=fecha_fprev;
                        e.Cancel=true;
                        alert(failure.message??JSON.stringify(failure));
                        table._printRows();
                    }
                    let url=this.url_calendar_pagos.replace("@doc",data.sys_pk);

                    InduxsoftCrudlModel.InvokeService(url,request,onSuccess,onFailure,"PATCH",false,false);
                }
            }

            table._printRows();
        },

        AuthPago(saldo,sys_pk)
        {
            const onSuccess = (response) =>
            {
                const DataRow = this.table.DataArray.find(row => row.sys_pk == sys_pk);
                let oldStatus = DataRow.cod_status;
                let newStatus = (DataRow.two_auth && DataRow.cod_status==99) ? 1 : 2;
                
                if (this.fil_status.value != '*')
                {
                    const index = this.table.DataArray.findIndex(row => row.sys_pk == sys_pk);
                    this.table.DeleteRow(index);
                }
                else
                {
                    DataRow["cod_status"] = newStatus;
                    DataRow["status"] = this.GetTextStatus(newStatus);
                    DataRow["autorizado"] = true;
                    this.table._printRows();
                }

                this.updateSummary(DataRow.saldo, oldStatus, newStatus);
                this.tr_selected=null;
            };
            const onFailure = (failure) =>
            {
                if (failure.message) alert(failure.message);
                else console.error(failure);
            };

            let url = this.consultar.replace("@doc",sys_pk);
            let data =
            {
                importe:saldo,
                auth:{authorizer:true}
            }
            InduxsoftCrudlModel.InvokeService(url,data,onSuccess,onFailure,"POST",false,false);
        },
        DesautorizarPago(sys_pk)
        {
            const onSuccess = (response) =>
            {
                const DataRow = this.table.DataArray.find(row => row.sys_pk == sys_pk);
                let oldStatus = DataRow.cod_status;
                let newStatus = 99;

                if (this.fil_status.value != '*')
                {
                    const index = this.table.DataArray.findIndex(row => row.sys_pk == sys_pk);
                    this.table.DeleteRow(index);
                }
                else
                {
                    DataRow["cod_status"] = newStatus;
                    DataRow["status"] = this.GetTextStatus(newStatus);
                    DataRow["autorizado"] = false;
                    this.table._printRows();
                }

                this.updateSummary(DataRow.saldo, oldStatus, newStatus);
                this.tr_selected=null;
            };
            const onFailure = (failure) =>
            {
                if (failure.message) alert(failure.message);
                else console.error(failure);
            };

            let url = this.url_calendar_pagos.replace("@doc",sys_pk);
            url += "?_action=desautorizar-pago"

            InduxsoftCrudlModel.InvokeService(url,null,onSuccess,onFailure,"PATCH",false,false);
        },
        RechazarPago(sys_pk)
        {
            const onSuccess = (response) =>
            {
                const DataRow = this.table.DataArray.find(row => row.sys_pk == sys_pk);
                let oldStatus = DataRow.cod_status;
                let newStatus = 5;
                
                if (this.fil_status.value != '*')
                {
                    const index = this.table.DataArray.findIndex(row => row.sys_pk == sys_pk);
                    this.table.DeleteRow(index);
                }
                else
                {
                    DataRow["cod_status"] = newStatus;
                    DataRow["status"] = this.GetTextStatus(newStatus);
                    DataRow["rechazado"] = true;
                    this.table._printRows();
                }

                this.updateSummary(DataRow.saldo, oldStatus, newStatus);
                this.tr_selected=null;
            };
            const onFailure = (failure) =>
            {
                if (failure.message) alert(failure.message);
                else console.error(failure);
            };

            let url = this.url_calendar_pagos.replace("@doc",sys_pk);
            url += "?_action=rechazar-pago"

            InduxsoftCrudlModel.InvokeService(url,null,onSuccess,onFailure,"PATCH",false,false);
        },
        DesrechazarPago(sys_pk)
        {
            const onSuccess = (response) =>
            {
                const DataRow = this.table.DataArray.find(row => row.sys_pk == sys_pk);
                let oldStatus = DataRow.cod_status;
                let newStatus = 99;
                
                if (this.fil_status.value != '*')
                {
                    const index = this.table.DataArray.findIndex(row => row.sys_pk == sys_pk);
                    this.table.DeleteRow(index);
                }
                else
                {
                    DataRow["cod_status"] = newStatus;
                    DataRow["status"] = this.GetTextStatus(newStatus);
                    DataRow["rechazado"] = false;
                    this.table._printRows();
                }

                this.updateSummary(DataRow.saldo, oldStatus, newStatus);
                this.tr_selected=null;
            };
            const onFailure = (failure) =>
            {
                if (failure.message) alert(failure.message);
                else console.error(failure);
            };
            
            let url = this.url_calendar_pagos.replace("@doc",sys_pk);
            url += "?_action=desrechazar-pago"

            InduxsoftCrudlModel.InvokeService(url,null,onSuccess,onFailure,"PATCH",false,false);
        },
        AutorizarPago()
        {
            var detail=
            {
                auth:{authorizer:true}
            }
            InduxsoftCrudlModel.Submit("form_cxp",detail,
            (data)=>
            {
                window.location.reload();
            });
        },
        GetTextStatus(status)
        {
            const descriptions =
            {
                1:"Por confirmar",
                2:"Autorizado",
                3:"Pagado",
                4:"Por pagar",
                5:"Rechazado",
                99:"Por autorizar"
            };
            return descriptions[status] ?? "Desconocido";
        },
        GetCellByIndex(index)
        {
            var elements=this.tr_selected.querySelectorAll("td");
            for (let i = 0; i < elements.length; i++) 
            {
                const element = elements[i];
                if(index==i)return element;
            }
            return null;
        },
        updateBalance(saldo,status)
        {
            if (saldo == 0) return;
            switch (status) {
                case 1:
                    this.saldos.xconfirmar += saldo;
                    this.td_xconfirmar.textContent = "$ "+this.table._format(this.saldos.xconfirmar, this.decimals, true);
                    break;
                case 2:
                    this.saldos.autorizado += saldo;
                    this.td_autorizados.textContent = "$ "+this.table._format(this.saldos.autorizado, this.decimals, true);
                    break;
                case 3:
                    this.saldos.pagado += saldo;
                    this.td_pagados.textContent = "$ "+this.table._format(this.saldos.pagado, this.decimals, true);
                    break;
                case 5:
                    this.saldos.rechazado += saldo;
                    this.td_rechazados.textContent = "$ "+this.table._format(this.saldos.rechazado, this.decimals, true);
                    break;
                case 99:
                    this.saldos.pendiente += saldo;
                    this.td_pendientes.textContent = "$ "+this.table._format(this.saldos.pendiente, this.decimals, true);
                    break;
            }
        },
        updateSummary(saldo=0,oldStatus=0,newStatus=0)
        {
            let DataArray = this.table.DataArray;
            let saldos = DataArray.reduce((acc,cxp) => Math.add(acc,cxp.saldo), 0);
            
            if (oldStatus && newStatus)
            {
                this.updateBalance(saldo * (-1), oldStatus);
                this.updateBalance(saldo, newStatus);
            }
            
            this.saldo_total.textContent = "$ "+this.table._format(saldos, this.decimals, true);
        },
    }
}