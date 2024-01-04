var documento =
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

    list: {
        tbl_documentos: null,

        init()
        {
            this.tbl_documentos = document.getElementById("tbl_cxp");
            this.setEvents();
        },

        setEvents()
        {
            if (this.tbl_documentos)
            {
                this.tbl_documentos.hiddeSelector = true;
                this.tbl_documentos.AutoAddRow = false;
                this.tbl_documentos.AutoDelRow = false;
            }
        },
    },

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
            if (this.btnSave) { this.btnSave.addEventListener("click", () => { this.saveForm(); }); }
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

        saveForm(){
            if (!this.formcxp.reportValidity()) return;
            this.formcxp.submit();
        },
    },

    pago: {
        formPagoCXP: null,
        elements: null,
        btnSave: null,
        dtCXP: {},
        dvsPred: {},

        init()
        {
            this.formPagoCXP = document.getElementById("form_pagocxp");
            this.btnSave = document.getElementById("btn_save");
            this.setEvents();
        },

        setEvents()
        {
            if (this.btnSave) { this.btnSave.addEventListener("click", () => { this.saveForm(); }); }
            if (this.formPagoCXP) {
                this.elements = this.formPagoCXP.elements;

                this.elements["txt_importe"].addEventListener("input", (event) => {
                    let importe = Number(event.target.value);
                    let saldo = Number(this.dtCXP.saldo);

                    this.elements["txt_nuevo_saldo"].value = Math.sub(saldo,importe);
                });

                this.elements["sel_cuenta_retiro"].addEventListener("change", (event) => {
                    let option = event.target.options[event.target.selectedIndex];
                    let codigo = option.getAttribute("data-divisa").toUpperCase();
                    let cambio = Number(option.getAttribute("data-tcambio"));

                    this.pedirTCambio();

                    this.elements["txt_tcambio_retiro"].value = cambio;
                    documento.trigger(this.elements["txt_tcambio_retiro"],"change");
                });
                
                this.elements["txt_tcambio_retiro"].addEventListener("change", (event) => {
                    let tcambio_ret = Number(event.target.value);
                    let tcambio_pdr = Number(this.elements["txt_tcambio"].value);
                    
                    let importe_pdr = Number(this.elements["txt_importe"].value);
                    let importe_ret = Math.mul(importe_pdr,tcambio_pdr);
                    importe_ret = Math.div(importe_ret,tcambio_ret);
                    
                    this.elements["txt_importe_retiro"].value = importe_ret;
                });
                this.elements["txt_importe_retiro"].addEventListener("change", (event) => {
                    let tcambio_pdr = Number(this.elements["txt_tcambio"].value);
                    let tcambio_ret = Number(this.elements["txt_tcambio_retiro"].value);
                    
                    let importe_ret = Number(event.target.value);
                    let importe_pdr = Math.mul(importe_ret,tcambio_ret);
                    importe_pdr = Math.div(importe_pdr,tcambio_pdr);

                    this.elements["txt_importe"].value = importe_pdr;
                    documento.trigger(this.elements["txt_importe"],"input");
                });

                this.elements["txt_importe"].addEventListener("change", (event) => {
                    let tcambio_pdr = Number(this.elements["txt_tcambio"].value);
                    let tcambio_ret = Number(this.elements["txt_tcambio_retiro"].value);
                    
                    let importe_pdr = Number(event.target.value);
                    let importe_ret = Math.mul(importe_pdr,tcambio_pdr);
                    importe_ret = Math.div(importe_ret,tcambio_ret);

                    this.elements["txt_importe_retiro"].value = importe_ret;
                });
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

        saveForm(){
            if (!this.formPagoCXP.reportValidity()) return;
            this.formPagoCXP.submit();
        },
    },

    bonificacion: {
        formBonificacionCXP: null,
        elements: null,
        btnSave: null,
        dtCXP: {},
        dvsPred: {},

        init()
        {
            this.formBonificacionCXP = document.getElementById("form_bonificacion_cxp");
            this.btnSave = document.getElementById("btn_save");
            this.setEvents();
        },

        setEvents()
        {
            if (this.btnSave) { this.btnSave.addEventListener("click", () => { this.saveForm(); }); }
            if (this.formBonificacionCXP) {
                this.elements = this.formBonificacionCXP.elements;

                this.elements["txt_importe"].addEventListener("input", (event) => {
                    let importe = Number(event.target.value);
                    let saldo = Number(this.dtCXP.saldo);

                    this.elements["txt_nuevo_saldo"].value = Math.sub(saldo,importe);
                });
            }
        },

        saveForm(){
            if (!this.formBonificacionCXP.reportValidity()) return;
            this.formBonificacionCXP.submit();
        },
    },

    intmor: {
        formIntMor: null,
        elements: null,
        btnSave: null,
        dtCXP: {},
        dvsPred: {},

        init()
        {
            this.formIntMor = document.getElementById("form_intmor");
            this.btnSave = document.getElementById("btn_save");
            this.setEvents();
        },

        setEvents()
        {
            if (this.btnSave) { this.btnSave.addEventListener("click", () => { this.saveForm(); }); }
            if (this.formIntMor) {
                this.elements = this.formIntMor.elements;

                this.elements["txt_importe"].addEventListener("input", (event) => {
                    let importe = Number(event.target.value);
                    let saldo = Number(this.dtCXP.saldo);

                    this.elements["txt_nuevo_saldo"].value = Math.add(saldo,importe);
                });
            }
        },

        saveForm(){
            if (!this.formIntMor.reportValidity()) return;
            this.formIntMor.submit();
        },
    },
}