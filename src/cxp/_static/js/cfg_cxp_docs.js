var cfg = {

    _modified:[],

    table_id:"",
    table:null,

    init()
    {
        this.table = document.getElementById(this.table_id);

        this.table.backup();
        this.setTableEvents();
    },

    setTableEvents()
    {
        this.table.Events[this.table.EdiTable.Const.Events.FieldUpdated] = (e) => {
            const row = e.sender.DataArray[e.row];
            const mod = this._modified.findIndex(m => m.documento == row.documento);
            
            if (mod == -1) this._modified.push(row);
            else if (JSON.stringify(this._modified[mod]) != JSON.stringify(row)) this._modified[mod] = row;
            else this._modified.splice(mod,1);
        };

        this.table.Events[this.table.EdiTable.Const.Events.IsDirtyChanged] = () => {
            this.hideBtnDiscard(!this.table.IsDirty);
        }
    },

    hideBtnDiscard(v) { document.getElementById('btn-discard').hidden = v },

    save()
    {
        if (this.saving || !this._modified.length) return;
        this.saving = true;

        InduxsoftCrudlModel.InvokeService('/!/cxp/cfg-docs/', { modified: this._modified },
            data => 
            {
                this.hideBtnDiscard(true);
                this.table.backup();
                this._modified = [];
                this.saving = false;

                alert("Configuraciones guardadas");
            },
            error => {
                let message = error.message || JSON.stringify(error);
                alert('No fue posible guardar la configuración.\n'+message);
                this.saving = false;
            },
            "POST", false
        );
    },

    discard()
    {
        this.hideBtnDiscard(true)
        this.table.restore();
        this._modified = [];
    }
};

document.addEventListener('DOMContentLoaded', () => cfg.init());