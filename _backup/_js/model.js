var model=
{
	invoke_service:function(url,params,callback_success, callback_fail, http_method,reload=true,async=true,autorizations="",formdata=false) 
	{
          if (!http_method) http_method="POST";

            request={
              type: http_method,
              url: url,
              contentType:"application/json;charset=utf-8;",
              async:async,
              crossDomain: true,
             
              success: function(r, textStatus, xhr){
                  if(http_method=="DELETE" && (r==null || r=="undefined"))
                  {
                    callback_success(r)
                    return;
                  }
                  var res = JSON.parse(JSON.stringify(r));

                  if (res.success??false)
                  {
                      if (callback_success)
                          callback_success(res.data);
                  }
                  else if(!res.success && res.success!=null && res.success!=undefined)
                  {
                    if (callback_fail)
                            callback_fail(res);
                  }
                  else
                  {
                    if (xhr.status>=200 && xhr.status<300)
                    {
                      if(callback_success)callback_success(r)
                    }
                    else
                    {
                      if (callback_fail)
                            callback_fail(res);
                    }

                      
                  }
              },
              error: function(r){
                if (callback_fail)
                            callback_fail(JSON.stringify(r));
                  // util.messageBox("Ocurrió un error al invocar el servicio.\n\r"+ JSON.stringify(r));
              }
          };

          if(autorizations)
          {
            request.headers={'Authorization':autorizations};
          }

          if(formdata)
          {
            request.processData=false;
            request.contentType=false;
            request.data=params;
          }
          if (params && !formdata)
          {
            request.dataType="json";
            request.data=JSON.stringify(params);
          }
         
          $.ajax(request).always(function(){
              if(reload)
                  location.reload();
          });
    },
  delete(pk)
  {
      var res=confirm("¿Desea eliminar la fila?");
      if(!res)return;

      model.invoke_service("./"+pk+"/",null,
      function(data)
      {
          window.location.reload();
      },
      function(error)
      {
          alert(error.message ?? error);
      },"DELETE",false);
  }
}