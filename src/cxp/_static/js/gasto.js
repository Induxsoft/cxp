


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
            
            var data=new FormData();
            for (let i = 0; i < this.file.files.length; i++) 
            {
                var file = this.file.files[i];
                data.append(file.name,file);    
            }
            data.append("onlyfile",true);

            InduxsoftCrudlModel.InvokeService(".",data,
            (result)=>
            {
                this.file.value="";
                window.location.reload();
            },
            (error)=>
            {
                this.file.value="";
                alert(error.message??JSON.stringify(error));
            },"PUT",false,true,"",true);
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
            
            window.open(data.url,"_blank");
        },
        getDataById(id)
        {
            var data= this.media_list.getData(false).find(e=>e.__internal_id__==id);
            data["index"]= this.media_list.getData(false).findIndex(e=>e.__internal_id__==id);
            return data;
        },
        DeleteFile()
        {
            var data=this.data_preview;
            if(!data)
            {
                alert("Debe seleccionar un elemento");
                return;
            }
            var new_data=new FormData();
            new_data.append("file",data.name??"");
            new_data.append("action","delete_file");

            InduxsoftCrudlModel.InvokeService(".",new_data,
                (result)=>
                {
                    window.location.reload();
                },
                (error)=>
                {
                    alert(error.message??JSON.stringify(error));
                },"PUT",false,true,"",true);
        }
    }
}