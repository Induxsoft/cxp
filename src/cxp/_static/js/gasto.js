var gasto=
{
    form:
    {
        init()
        {
            this.txt_fecha=document.getElementById("txt_fecha");
            this.txt_referencia=document.getElementById("txt_referencia");
            this.file=document.getElementById("file");

            if(this.file)this.file.addEventListener("change",()=>{gasto.form.uploadFile();});

            this.media_list=document.getElementById("media-list");
            if(this.media_list)this.media_list.onClicking=data=>
            {
                this.SelectedElement(data);
            }
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
            this.data_preview=this.getDataById(data.__internal_id__);
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
    }
}