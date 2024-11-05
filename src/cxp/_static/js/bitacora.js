var _bitacora=
{
    _url:"",
    EnableLog(guid,det="") 
    {
        if(guid.trim()=="" || this._url.trim()=="")return;

        var webshell=window.top.WebShell;
        if(!webshell)
        {
            console.warn("No se pudo obtener el elemento de webshell");
            return;
        }

        var uri=_bitacora._url.replace("@guid",guid).replace("@det",det);
        webshell.Panels.Show(webshell.Panels.Const.Right,uri);
    }
}