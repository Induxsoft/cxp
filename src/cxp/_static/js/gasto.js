var gasto=
{
    form:
    {
        formId:"", formulario:null, ff:null,
        btn_submit:document.getElementById("btn-submit"),
        btn_corregir:null,
        btn_cancelar:null,
        btn_eliminar:null,

        init()
        {
            this.formulario = document.getElementById(this.formId);
            this.ff = this.formulario.elements;
            this.btn_corregir = document.getElementById("btn-fix");
            this.btn_cancelar = document.getElementById("btn-cancel");
            this.btn_eliminar = document.getElementById("btn-delete");
            this.txt_fecha=document.getElementById("txt_fecha");
            this.txt_referencia=document.getElementById("txt_referencia");
            this.file=document.getElementById("file");
            this.lbl_attachment_name = document.getElementById("lbl_attachment_name");

            if(this.file)this.file.addEventListener("change",()=>{gasto.form.uploadFile();});

            this.media_list=document.getElementById("media-list");
            if(this.media_list)this.media_list.onClicking = (data) => {
                this.SelectedElement(data);
            }

            if (this.btn_corregir) this.btn_corregir.addEventListener("click", () => this.corregir());
            if (this.btn_cancelar) this.btn_cancelar.addEventListener("click", () => this.cancelar());
            if (this.btn_eliminar) this.btn_eliminar.addEventListener("click", () => this.eliminar_gasto());
        },
        uploadFile()
        {
            if(this.file.value.trim()=="")return;
            if(this.file.files.length<1)return;
            
            var data = new FormData();
            data.append("upl-file",true);
            for (let i = 0; i < this.file.files.length; i++) 
            {
                var file = this.file.files[i];
                data.append(file.name,file);    
            }

            InduxsoftCrudlModel.InvokeService(".",data,
            (result) => {
                this.file.value="";
                window.location.reload();
            },
            (error) => {
                this.file.value="";
                alert(error.message ?? JSON.stringify(error));
            },
            "PUT",false,true,"",true);
        },
        data_preview:null,
        SelectedElement(data)
        {
            if (this.lbl_attachment_name) this.lbl_attachment_name.textContent = "> " + data.name + data.ext;
            this.data_preview = this.getDataById(data.__internal_id__);
        },
        preview()
        {
            var data=this.data_preview;
            if(!data)
            {
                alert("Debe seleccionar un elemento");
                return;
            }
            
            let url = InduxsoftCrudlModel.UrlAddParameter(data.url,"_act","download");
            // window.location.href = url;
            window.open(url,"_blank");
        },
        remover()
        {
            let item = this.data_preview;
            if(!item)
            {
                alert("Debe seleccionar un elemento");
                return;
            }

            var data = new FormData();
            data.append("del-file",true);
            data.append("gasto",document.querySelector("input[name='sys_guid']").value);
            data.append("filename",item.name);

            // let url = InduxsoftCrudlModel.UrlAddParameter(item.url,"_act","delete");
            InduxsoftCrudlModel.InvokeService(".",data,
            (result) => {
                if (result.message) {
                    alert(result.message);
                    return
                }
                this.media_list.removeMediaByIndex(item.index);
            },
            (error) => {
                this.file.value="";
                alert(error.message ?? JSON.stringify(error));
            },
            "PUT",false,true,"",true);
        },
        getDataById(id)
        {
            var data= this.media_list.getData(false).find(e=>e.__internal_id__==id);
            data["index"]= this.media_list.getData(false).findIndex(e=>e.__internal_id__==id);
            return data;
        },
        desactivar(value)
        {
            var fields = document.querySelectorAll("input,select,input-key,textarea");
            for(var i=0; i<fields.length; i++)
            {
                var itm=fields[i];
                if (!itm || ["sys_pk","sys_guid","sys_recver","file","subtotal"].includes(itm.name)) continue;

                if ("disabled" in itm) itm.disabled = value;
                else itm.setAttribute("disabled",(value?"true":"false"));
            }
        },
        corregir()
        {
            this.btn_submit.disabled = false;
            this.btn_corregir.hidden = true;
            this.btn_cancelar.hidden = false;
            this.ff["icategoria"].disabled = false;
            this.ff["concepto"].disabled = false;
            this.ff["retisr"].disabled = false;
            this.ff["retiva"].disabled = false;
            this.ff["iva"].disabled = false;
        },
        cancelar()
        {
            this.btn_submit.disabled = true;
            this.btn_corregir.hidden = false;
            this.btn_cancelar.hidden = true;
            this.ff["icategoria"].disabled = true;
            this.ff["concepto"].disabled = true;
            this.ff["retisr"].disabled = true;
            this.ff["retiva"].disabled = true;
            this.ff["iva"].disabled = true;
            this.formulario.reset();
        },
        eliminar_gasto()
        {
            if (!confirm("¿Esta seguro que desea eliminar: "+this.ff["referencia"].value+"?")) return;

            let endpoint = "/!/cxp/gastos/"+Number(this.ff["sys_pk"].value)+"/";
            InduxsoftCrudlModel.InvokeService(endpoint, null,
                function (data) {
                    window.location.href = "/!/cxp/gastos/";
                },
                function (error) {
                    if (error.message) alert(error.message);
                    else console.error(error);
                }, "DELETE", false, false
            );
        }
    }
}