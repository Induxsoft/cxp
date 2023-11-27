// ---------------------------------------------------------------------------------
//                              Induxsoft EdiTable.js
//                Copyright 2021 Induxsoft Data Services S de RL de CV
//                
//         Induxsoft is a trademark of Induxsoft Data Services S de RL de CV               
//                             https://induxsoft.net/
//                             
//         Licensed under the Apache License, Version 2.0 (the "License")
//         YOU MAY NOT USE THIS FILE EXCEPT IN COMPLIANCE WITH THE LICENSE.
//                       You may obtain a copy of the License at 
//                    http://www.apache.org/licenses/LICENSE-2.0
//
// ---------------------------------------------------------------------------------

var EdiTable={
    Const : {
        HTML:{
            Selector:'<button id="__table_selector" class="EdiTable-Selector"></button>',
            Inputs:{
                "Text":'<input type="text" id="__table_input" class="Editable-Input-Text"/>',
                "Number":'<input type="number" id="__table_input" class="Editable-Input-Number"/>',
                "Date":'<input type="date" id="__table_input" class="Editable-Input-Date"/>',
                "DateTime":'<input type="datetime-local" id="__table_input" class="Editable-Input-DateTime"/>',
                "Memo":'<textarea id="__table_input" class="Editable-Input-Memo"></textarea>',
                "Select":'<select id="__table_input" class="Editable-Input-Select"/>',
                "Check":'<input type="checkbox" id="__table_input" class="Editable-Input-Check"/>'
            },
            TR:"tr", 
            TD:"td",
            TABLE:"table",
            THEAD:"thead",
            TBODY:"tbody",
            TH:"th"
        },
        Columns:{
            Types:{
                Text:"Text",
                Number:"Number",
                Date:"Date",
                DateTime:"DateTime",
                Memo:"Memo",
                Check:"Check",
                Select:"Select",
                Custom:"Custom",
                NoEditable:"NoEditable"
            }
        },
        Events:{
            EnterCell:"entercell",
            LeaveCell:"leavecell",
            StartEdition:"startedition",
            ConfirmEdition:"confirmedition",
            CancelEdition:"canceledition",
            InputCreated:"inputcreated",
            BeforeUpdateCell:"beforeupdatecell",
            BeforeSetInput:"beforesetinput",
            FieldUpdated:"fieldupdated",
            RowAdded:"rowadded"
        },
        SelectorId:"__table_selector",
        InputId:"__table_input"
    },
    focusedTable:null,
    Converts:{
        Boolean:{
            ToString:function(value)
            {
                if (value) return "Sí";
                return "No";
            },
            FromString:function(value)
            {
                switch (value.trim().toLowerCase())
                {
                    case "sí":
                    case "si":
                    case "s":
                    case "y":
                    case "yes":
                    case "ok":
                    case "1":
                    case "t":
                    case "on":
                    case "true":
                    case "cierto":
                        return true;
                }

                return false;
            }
        }
    },
    GetSelector:function()
    {
        return $("#"+EdiTable.Const.SelectorId);
    },
    GetInput:function()
    {
        var input=$("#"+EdiTable.Const.InputId);
        if (input.prop("tagName")==undefined)
            return undefined;
        
        return input;
    },
    GetInputValue:function(input, _current, columnDef)
    {
        var tag=$(input).prop("tagName");

        if (tag==undefined)
        {
            return "";
        }

        switch(tag.toLowerCase())
        {
            case "input":
                switch ($(input).attr("type").toLowerCase())
                {
                    case "checkbox":
                        return  columnDef.Converts.ToString($(input).prop("checked"));
                    default:
                        return $(input).val();
                }
                break;
            case "textarea":
                return $(input).val();
            case "select":
                return $(input).val();
        }

        
    },
    SetInputVal: function (input, text, _current, columnDef)
    {
        switch($(input).prop("tagName").toLowerCase())
        {
            case "input":
                switch ($(input).attr("type").toLowerCase())
                {
                    case "checkbox":
                        $(input).prop("checked",columnDef.Converts.FromString(text));
                        break;
                }

                break;
        }

        $(input).val(text);
    },
    SetSelectorKeyEventHandler:function(selector, _current)
    {
        selector.off("keydown");
        selector.on("keydown",function(e){

            switch(e.key)
            {
                case "Home":
                    if (e.ctrlKey)
                        _current.NavToHome();
                    else
                        _current.NavToFirstCell(_current.CurrentRowIndex());
                    break;
                case "End":
                    if (e.ctrlKey)
                        _current.NavToEnd();
                    else
                        _current.NavToLastCell(_current.CurrentRowIndex());
                    break;
                case "PageUp":
                    if (_current.CurrentRowIndex()-_current.PagOffSet<0)
                        _current.NavTo(0,_current.CurrentColIndex());
                    else
                        _current.NavTo(_current.CurrentRowIndex()-_current.PagOffSet,_current.CurrentColIndex());
                    break;
                case "PageDown":
                    if (_current.CurrentRowIndex()+_current.PagOffSet>_current.TRCount()-1)
                        _current.NavTo(_current.TRCount()-1,_current.CurrentColIndex());
                    else
                        _current.NavTo(_current.CurrentRowIndex()+_current.PagOffSet,_current.CurrentColIndex());
                    break;
                case "Insert":
                    if (_current.AutoDelRow && e.ctrlKey) _current.InsertRow(_current.CurrentRowIndex());
                    break;
                case "F2":
                    setTimeout(function(){
                        _current.StartEdit(selector.parent(),"");
                    },1);
                    break;
                case "Delete":
                    if (_current.AutoDelRow && e.ctrlKey) _current.DeleteCurrentRow();
                    if (!e.ctrlKey)
                    {
                        setTimeout(function(){
                            _current.StartEdit(selector.parent(),"",true);
                        },1);
                    }
                    break;
                case "ArrowUp":
                _current.NavUp($(this).parent());
                    break;
                case "ArrowLeft":
                    _current.NavLeft($(this).parent());
                    break;
                case "ArrowRight":
                    _current.NavRight($(this).parent());
                    break;
                case "ArrowDown":
                _current.NavDown($(this).parent());
                    break;
                default:
                    if (e.key.trim().length==1)
                    {
                        setTimeout(function(){
                            _current.StartEdit(selector.parent(),e.key);
                        },1);
                    }
                    break;
            }
            e.stopPropagation();
        });
    },
    SetInputStdEventHandler:function(input, _current)
    {
        
        input.on("keydown",function(e){
            switch(e.key)
            {
                case "ArrowUp":
                    _current.NavUp($(this).parent());
                    e.stopPropagation();
                    break;
                case "Escape":
                    _current.CancelEdit(input.parent());
                    e.stopPropagation();
                    break
                case "Enter":
                    _current.NavRight($(this).parent());
                    e.stopPropagation();
                    break;
                case "ArrowLeft":
                    if (this.selectionStart==0 || $(this).attr("type").toLowerCase()=="checkbox")
                    {
                        _current.NavLeft($(this).parent());
                        e.stopPropagation();
                    }
                    break;
                case "ArrowRight":
                    if (this.selectionStart==$(this).val().length || $(this).attr("type").toLowerCase()=="checkbox")
                    {
                        _current.NavRight($(this).parent());
                        e.stopPropagation();
                    }
                    break;
                case "ArrowDown":
                    _current.NavDown($(this).parent());
                    e.stopPropagation();
                    break;
            }
            
        });
    },
    SetInputTextareaEventHandler:function(input, _current)
    {
        input.on("keydown",function(e){
            switch(e.key)
            {
                case "Escape":
                    _current.CancelEdit(input.parent());
                    e.stopPropagation();
                    break
                case "Enter":
                    if (e.ctrlKey)
                    {
                        _current.NavRight($(this).parent());
                        e.stopPropagation();
                    }
                    break;
                case "ArrowLeft":
                    if (this.selectionStart==0)
                    {
                        _current.NavLeft($(this).parent());
                        e.stopPropagation();
                    }
                    break;
                case "ArrowRight":
                    if (this.selectionStart==$(this).val().length)
                    {
                        _current.NavRight($(this).parent());
                        e.stopPropagation();
                    }
                    break;
            }
            
        });
    },
    SetInputSelectEventHandler:function(input, _current)
    {
        input.on("keydown",function(e){
            switch(e.key)
            {
                case "Escape":
                    _current.CancelEdit(input.parent());
                    e.stopPropagation();
                    break
                case "Enter":
                    if (e.ctrlKey)
                    {
                        _current.NavRight($(this).parent());
                        e.stopPropagation();
                    }
                    break;
                case "ArrowLeft":
                    _current.NavLeft($(this).parent());
                    e.stopPropagation();
                    break;
                case "ArrowRight":
                    _current.NavRight($(this).parent());
                    e.stopPropagation();
                    break;
            }
            
        });
    },
    SetInputEventHandler:function(input, _current)
    {
        input.on("click",function(e){
            e.stopPropagation();
        });

        switch($(input).prop("tagName").toLowerCase())
        {
            case "input":
                EdiTable.SetInputStdEventHandler(input, _current);
                break;
            case "textarea":
                EdiTable.SetInputTextareaEventHandler(input, _current);
                break;
            case "select":
                EdiTable.SetInputSelectEventHandler(input, _current);
                break;
        }
        
    }

};

function ediTable(id)
{
    var _current={
        Events:{ },
        TheadRowIndex:0,
        AutoAddRow:true,
        AutoDelRow:true,
        EverMove:true,  //Si es true, deplazamiento a la izquierda en la primera celda sube una fila y se mueve a la última, a la derecha en la última baja una fila y va a la primer celda
        PagOffSet:10,//Desplazamiento con AvPag PrevPag
        DataArray:[],//Contiene un array asociado a las filas
        ColumnsDefaultType:EdiTable.Const.Columns.Types.Text,
        CSS:
            {
                Cell:"EdiTable-Cell",
                RowSelected: "EdiTable-Row-Selected"
            },
        Initialize:function (tableId)
        {
            $(EdiTable.Const.HTML.TABLE+"#"+tableId+" "+EdiTable.Const.HTML.TD).on("click",function(e){
                e.stopPropagation();
                _current.CellFocus(this);
                });
            
            this["tableId"]=tableId;
        },
        Columns:[],
        GetTHead:function()
        {
            return $(EdiTable.Const.HTML.TABLE+"#"+this.tableId+" "+EdiTable.Const.HTML.THEAD);
        },
        GetTBody:function(){
            var tbody= $(EdiTable.Const.HTML.TABLE+"#"+this.tableId+" "+EdiTable.Const.HTML.TBODY);

            if (tbody.length==0)
            {
                $("#"+this.tableId).append("<tbody></tbody>");
                tbody=$(EdiTable.Const.HTML.TABLE+"#"+this.tableId+" "+EdiTable.Const.HTML.TBODY);
            }

            return tbody;
        },
        ColumnsCount:function()
        {
            var cols=this.THCount();

            if (cols<1)
                if (this.Columns)
                    if (this.Columns.length>0)
                        cols=this.Columns.length;
            
            return cols;
        },
        NavToHome: function()
        {
            this.NavTo(0,0);
        },
        NavToEnd: function()
        {
            this.NavTo(this.TRCount()-1,this.ColumnsCount()-1);
        },
        NavToFirstCell:function (row)
        {
            this.NavTo(row,0);
        },
        NavToLastCell:function (row)
        {
            this.NavTo(row,this.ColumnsCount()-1);
        },
        NavTo:function (row, col)
        {
            let rows=this.TRCount();
            let cols=this.ColumnsCount();

            if (rows<1 || cols<1 || row>rows-1 || col>cols-1 || col<0 || row<0) return;
            
            let tbody=this.GetTBody();
            let td=$(tbody.find(EdiTable.Const.HTML.TR).get(row)).find(EdiTable.Const.HTML.TD).get(col);
            this.CellFocus( td );
        },
        GetTrByIndex:function(row)
        {
            let rows=this.TRCount();
            let cols=this.ColumnsCount();

            if (rows<1 || cols<1 || row>rows-1 || row<0) return undefined;
            
            let tbody=this.GetTBody();

            return $(tbody.find(EdiTable.Const.HTML.TR).get(row));
        },
        DeleteCurrentRow:function()
        {
            let col=this.CurrentColIndex();
            let row=this.CurrentRowIndex();

            if (this.DeleteRow(row))
                this.NavTo(row,col);
        },
        DeleteRow:function(row)
        {
            let rows=this.TRCount();
            let cols=this.ColumnsCount();

            if (rows<1 || cols<1 || row>rows-1 || row<0) return false;

            if (this.GetTrByIndex(row).remove())
            {
                this.DataArray.splice(row, 1);
                return true;
            }

            return false;
        },
        UpdateRow:function(row)
        {
            let tr=this.GetTrByIndex(row);

            if (tr==undefined) return false;
            var tds=tr.find(EdiTable.Const.HTML.TD);

            if (tds==undefined) return false;

            for(i=0;i<this.TDCount(tr);i++)
            {
                if (this.Columns[i]!=undefined)
                {
                    if (this.Columns[i].field!=undefined)
                        $(tds.get(i)).html(this.DataArray[row][this.Columns[i].field]);
                }
            }

            return true;
        },
        UpdateData:function()
        {
            for(i=0;i<this.TRCount();i++)
                this.UpdateDataRow(i);
        },
        UpdateDataRow:function(row)
        {
            let tr=this.GetTrByIndex(row);

            if (tr==undefined) return false;
            var tds=tr.find(EdiTable.Const.HTML.TD);

            if (tds==undefined) return false;

            for(i=0;i<this.TDCount(tr);i++)
            {
                if (this.Columns[i]!=undefined)
                {
                    if (this.Columns[i].field!=undefined)
                    {
                        if (tds.get(i)==this.CurrentTd().get(0))
                        {
                            if (!this.Editing)
                            {
                                this.UpdateDataMember(row,this.Columns[i].field,EdiTable.GetSelector().html());
                            }
                        }
                        else
                        {
                            this.UpdateDataMember(row,this.Columns[i].field,$(tds.get(i)).html());
                        }
                    }
                }
            }

            return true;
        },
        UpdateDataMember:function(row, field, value,stopfire=false)
        {
            if (this.DataArray[row]==undefined)
                this.DataArray[row]={};

            if (field!=undefined && value!=undefined)
            {
                this.DataArray[row][field]=value;
                var eventArgs={
                    sender:this,
                    row:row,
                    field:field,
                    value:value
                };

                if (this.Events[EdiTable.Const.Events.FieldUpdated]!=undefined && !stopfire)
                    this.Events[EdiTable.Const.Events.FieldUpdated](eventArgs);
            }

            return this.DataArray[row];
        },
        AddRow:function()
        {
            return this.InsertRow();
        },
        InsertRow:function(rw,nofocus=false)
        {
            var tbody=this.GetTBody();
            var cols=this.ColumnsCount();
            
            if (rw!=undefined)
            {
                this.DataArray.splice(rw,0,{});
            }

            if (cols<1)
                return;

            if (tbody)
            {
                var nr=tbody.get(0).insertRow(rw);
                var indexRow=$(nr).index();

                for (i=0;i<cols;i++)
                {
                    let cell=nr.insertCell();
                    let coldef=this.Columns[i];

                    if (this.CSS.Cell)
                        $(cell).addClass(this.CSS.Cell);

                        if (coldef!=undefined)
                            if (coldef.default!=undefined)
                            {
                                this.UpdateDataMember(indexRow,coldef.field,coldef.default,true)
                                $(cell).append(coldef.default);
                            }
                }
                $(EdiTable.Const.HTML.TABLE+"#"+this.tableId+" "+EdiTable.Const.HTML.TD).off("click");
                $(EdiTable.Const.HTML.TABLE+"#"+this.tableId+" "+EdiTable.Const.HTML.TD).on("click",function(e){
                    e.stopPropagation();
                    _current.CellFocus(this);
                });

                if (!nofocus)
                    this.CellFocus(nr.cells[0]);
                
                var eventArgs={
                    sender:this,
                    tr:$(nr),
                    rowIndex:indexRow,
                };

                if (this.Events[EdiTable.Const.Events.RowAdded]!=undefined)
                    this.Events[EdiTable.Const.Events.RowAdded](eventArgs);
            }
        },
        TRCount:function()
        {
            var tbody=this.GetTBody();
            if (tbody)
            {
                let trs=tbody.find(EdiTable.Const.HTML.TR);
                if (trs)
                    if (trs) return trs.length;
            }

          return 0;
        },
        THCount:function()
        {
          var thead=this.GetTHead();
          if (thead)
          {
             let tr=thead.find(EdiTable.Const.HTML.TR).get(this.TheadRowIndex);

             if (tr)
             {
                let ths=$(tr).find(EdiTable.Const.HTML.TH);
                if (ths) return ths.length;
             }
          }

          return 0;
        },
        TDCount:function(tr)
        {
             if (tr)
             {
                let tds=$(tr).find(EdiTable.Const.HTML.TD);
                if (tds) return tds.length;
             }

          return 0;
        },
        CurrentTd:function()
        {

            if (EdiTable.focusedTable!=_current)
                return null;

            var selector=undefined;

            if (this.Editing)
            {
                selector=EdiTable.GetInput();
                if (selector==undefined)
                    selector=EdiTable.GetSelector();
            }
            else
            {
                selector=EdiTable.GetSelector();
            }

            if (selector==undefined)
                return null;

            if (selector==null)
                return null;

            return selector.parent();
            
        },
        TrOfTd:function(td)
        {
            if (td==undefined)
                return null;

            if (td==null)
                return null;
            
            return $(td.parent());
        },
        RowIndexOfTd:function(td)
        {
            if (td==undefined)
                return -1;

            if (td==null)
                return -1;
            
            return $(td.parent()).index();
        },
        CurrentRowIndex:function()
        {
            let current_td=this.CurrentTd();

            if (current_td==null)
                return -1;
            
            return $(current_td.parent()).index();
        },
        ColIndexOfTd:function(td)
        {
            if (td==undefined)
                return -1;

            if (td==null)
                return -1;
            
            return $(td).index();
        },
        CurrentColIndex:function()
        {
            let current_td=this.CurrentTd();

            if (current_td==null)
                return -1;
            
            return $(current_td).index();
        },
        LeaveCell: function(td)
        {
            if (_current.Events[EdiTable.Const.Events.LeaveCell]==undefined)
            return;

            var eventArgs={
                    td:td,
                    sender:this,
                };

            this.Events[EdiTable.Const.Events.LeaveCell](eventArgs);
        },
        EnterCell: function(td)
        {
            
            if (_current.Events[EdiTable.Const.Events.EnterCell]==undefined)
            return;

            var eventArgs={
                    td:td,
                    sender:_current,
                };

            this.Events[EdiTable.Const.Events.EnterCell](eventArgs);
        },
        Editing:false,
        GetColumnDef:function()
        {
            let columnDef=this.Columns[this.CurrentColIndex()];
            if (columnDef==undefined)
                columnDef={type:this.ColumnsDefaultType};

            if (columnDef.type==undefined)
                    columnDef.type=this.ColumnsDefaultType;

            if (columnDef.type==EdiTable.Const.Columns.Types.Check)
            {
                if (columnDef["Converts"]==undefined)
                    columnDef["Converts"]=EdiTable.Converts.Boolean;
            }
            return columnDef;
        },
        GetColumnDefOfTd:function(td)
        {
            let columnDef=this.Columns[this.ColIndexOfTd(td)];
            if (columnDef==undefined)
                return null;

            return columnDef;
        },
        StartEdit:function(td,text,clear)
        {
            
            let columnDef=this.GetColumnDef();
           
            if (columnDef.type==EdiTable.Const.Columns.Types.NoEditable)
                return;

            this.Editing=true;
            
            if (_current.Events[EdiTable.Const.Events.StartEdition]!=undefined)
            {
                var eventArgs={
                    td:td,
                    sender:this,
                    coldef:columnDef,
                    text:text
                };

                this.Events[EdiTable.Const.Events.StartEdition](eventArgs);
            }

            if (columnDef.type==EdiTable.Const.Columns.Types.Custom)
            {
                this.Editing=false;
                return;
            }

            selector=EdiTable.GetSelector();

            this["temp_html"]=selector.html();

            if (text==undefined)
                text=selector.text();

            if (text.trim()==="")
                text=selector.text();

            if (clear)
                text="";
            
            selector.hide();

            switch(columnDef.type)
            {
                case EdiTable.Const.Columns.Types.Memo:
                    td.html(EdiTable.Const.HTML.Inputs.Memo);
                    break;
                case EdiTable.Const.Columns.Types.Date:
                    td.html(EdiTable.Const.HTML.Inputs.Date);
                    break;
                case EdiTable.Const.Columns.Types.DateTime:
                    td.html(EdiTable.Const.HTML.Inputs.DateTime);
                    break;
                case EdiTable.Const.Columns.Types.Select:
                    td.html(EdiTable.Const.HTML.Inputs.Select);
                    break;
                case EdiTable.Const.Columns.Types.Check:
                    td.html(EdiTable.Const.HTML.Inputs.Check);
                    break;
                case EdiTable.Const.Columns.Types.Number:
                    td.html(EdiTable.Const.HTML.Inputs.Number);
                    break;
                case EdiTable.Const.Columns.Types.Text:
                    td.html(EdiTable.Const.HTML.Inputs.Text);
                    break;
            }
            let input=EdiTable.GetInput();

            if (columnDef.type==EdiTable.Const.Columns.Types.Select && columnDef.options!=undefined)
            {
                $.each(columnDef.options, function(key, value) {
                    $(input).append($('<option>', {
                        value: key,
                        text: value
                    }));
                  });

                if (columnDef.keyfield!=undefined)
                {
                    if (this.DataArray[this.RowIndexOfTd(td)]!=undefined)
                        if (this.DataArray[this.RowIndexOfTd(td)][columnDef.keyfield]!=undefined)
                            text=this.DataArray[this.RowIndexOfTd(td)][columnDef.keyfield];
                }
            }

            var eventArgs={
                input:input,
                td:td,
                sender:this,
                text:text,
                coldef:columnDef
            };

            if (_current.Events[EdiTable.Const.Events.InputCreated]!=undefined)
                this.Events[EdiTable.Const.Events.InputCreated](eventArgs);

          
            if (_current.Events[EdiTable.Const.Events.BeforeSetInput]!=undefined)
                this.Events[EdiTable.Const.Events.BeforeSetInput](eventArgs);
            
            EdiTable.SetInputVal(input, eventArgs.text, _current, columnDef);

            input.focus();
            EdiTable.SetInputEventHandler(input,_current); 
                                    
        },
        ConfirmEdit:function(td,displayText)
        {
            if (!this.Editing)
                return true;
            
            var columnDef=this.GetColumnDef();

            this.Editing=false;

            let input=EdiTable.GetInput();
            var eventArgs={
                input:input,
                text:displayText,
                td:td,
                sender:this,
                coldef:columnDef,
                cancel:false
            };

            if (input!=undefined)
            {
                eventArgs.text=EdiTable.GetInputValue(input, this, columnDef);

                if (columnDef.keyfield!=undefined && columnDef.type==EdiTable.Const.Columns.Types.Select)
                {
                    var combo=input.get(0);
                    if (combo.selectedIndex<0)
                        eventArgs.text="";
                    else
                        eventArgs.text=combo.options[combo.selectedIndex].text;
                        
                    this.UpdateDataMember (this.RowIndexOfTd(eventArgs.td),columnDef.keyfield,input.val());
                }

                if (this.Events[EdiTable.Const.Events.BeforeUpdateCell]!=undefined)
                    this.Events[EdiTable.Const.Events.BeforeUpdateCell](eventArgs);

                if (eventArgs.cancel)
                {
                    this.Editing=true;
                    return false;
                }

                input.remove();
                eventArgs.input=undefined;
            }

            if (_current.Events[EdiTable.Const.Events.ConfirmEdition]!=undefined)
                this.Events[EdiTable.Const.Events.ConfirmEdition](eventArgs);
            
            if (eventArgs.cancel)
                return false;
            
            $(td).html(eventArgs.text);
            this.UpdateDataMember(this.RowIndexOfTd(td),columnDef.field,eventArgs.text);

            return true;
        },
        CancelEdit:function(td)
        {
            
            if (!this.Editing)
                return;

            this.Editing=false;

            let input=EdiTable.GetInput();

            if (input!=undefined)
            {
                input.remove();

                if (this["temp_html"]!=undefined && EdiTable.focusedTable==this)
                {
                    td.html( this["temp_html"] );
                }

                this.CellFocus(td);
            }

            if (_current.Events[EdiTable.Const.Events.CancelEdition]!=undefined)
            {
                var eventArgs={
                    td:td,
                    sender:this,
                };

                this.Events[EdiTable.Const.Events.CancelEdition](eventArgs);
            }
        },
        CellFocus: function(td)
        {
            let selector=EdiTable.GetSelector();
            let input=EdiTable.GetInput();

            if (input!=undefined)
            {
                if (EdiTable.focusedTable!=null)
                    if (!EdiTable.focusedTable.ConfirmEdit(input.parent())) return;
                else
                    input.remove();
            }

            if (selector!=undefined)
            {
                selector.parent().html(selector.html());
                if (EdiTable.focusedTable!=null)
                {
                    this.LeaveCell(selector.parent());
                }

                selector.remove();
            }
            
            let txt=$(td).html();
            $(td).html(EdiTable.Const.HTML.Selector);
            
            selector=EdiTable.GetSelector();
            selector.html(txt);

            EdiTable.focusedTable=_current;

            selector.focus();
            this.EnterCell(selector.parent());
            selector.off("click");
            selector.on("click",function(e){
                e.stopPropagation();
                _current.StartEdit(selector.parent(),"");
            });

            EdiTable.SetSelectorKeyEventHandler(selector, _current);
            if (this.CSS.RowSelected)
                $($(td).parent()).addClass(this.CSS.RowSelected).siblings().removeClass(this.CSS.RowSelected);
        },
        NavUp:function(active_cell)
        {
            let active_cell_index=active_cell.index();
            let parent_tr = active_cell.parent();
            let parent_tbody = active_cell.parents().eq(1);
            let target_tr = parent_tbody.find(EdiTable.Const.HTML.TR).get(parent_tr.index() - 1);
            let target_cell = $($(target_tr).find(EdiTable.Const.HTML.TD).get(active_cell_index));
            if( parent_tr.index() != 0 ) 
            _current.CellFocus(target_cell);
        },
        NavLeft:function(active_cell)
        {
            let active_cell_index=active_cell.index();
            if (active_cell_index==0)
            {
                if (!this.EverMove)
                    return;
                
                this.NavUp(active_cell);
                this.NavToLastCell(this.CurrentRowIndex());
                return;
            }

            let parent_tr = active_cell.parent();
            let target_cell = $($(parent_tr).find(EdiTable.Const.HTML.TD).get(active_cell_index-1));
            _current.CellFocus(target_cell);
        },
        NavRight:function(active_cell)
        {
            let active_cell_index=active_cell.index();

            let parent_tr = active_cell.parent();
            
            if (active_cell_index==parent_tr.children("td").length-1)
            {
                if (!this.EverMove)
                    return;
                
                this.NavDown(active_cell);
                this.NavToFirstCell(this.CurrentRowIndex());
                return;
            }

            let target_cell = $($(parent_tr).find(EdiTable.Const.HTML.TD).get(active_cell_index+1));
            _current.CellFocus(target_cell);
        },
        NavDown:function(active_cell) 
        {
            let active_cell_index=active_cell.index();
            let parent_tr = active_cell.parent();
            let parent_tbody = active_cell.parents().eq(1);
            let target_tr = parent_tbody.find(EdiTable.Const.HTML.TR).get(parent_tr.index() + 1);
            let target_cell = $($(target_tr).find(EdiTable.Const.HTML.TD).get(active_cell_index));
            if( target_tr!=undefined) 
                _current.CellFocus(target_cell);
            else
            {
                if (this.AutoAddRow)
                    this.AddRow();
            }
        }

    };

    if (id!=undefined)
        _current.Initialize(id);

    return _current;
};