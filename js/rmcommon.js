// $Id$
// --------------------------------------------------------------
// Red México Common Utilities
// A framework for Red México Modules
// Author: Eduardo Cortés <i.bitcero@gmail.com>
// Email: i.bitcero@gmail.com
// License: GPL 2.0
// --------------------------------------------------------------

var cuHandler = {

    /**
     * Propiedades
     */
    ismobile: /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(navigator.userAgent.toLowerCase()),

    /**
     * Send a request to a remote URL and present the response in a window
     * Launcher can have several useful data attributes:
     * <strong>data-url</strong>: URL where the request will be send
     * @param launcher Element that will function as launcher
     * @returns {boolean}
     */
    loadRemoteDialog: function( launcher ){

        var url = $(launcher).data('url');
        var handler = $(launcher).data("handler");
        var window_id = $(launcher).data("window-id");
        var params_retriever = $(launcher).data('retriever');
        var params_setter = $(launcher).data('setter');

        if ( params_retriever != undefined )
            var params = eval(params_retriever+'(launcher)');
        else if ( params_setter != undefined ){

            eval("var params = " + params_setter);

        }
        else
            var params = {SBTOKEN_REQUEST: $("#smartb-token").val()};

        if (params==false)
            return false;

        cuHandler.showLoader();

        $.get(url, params, function(response){

            if(!cuHandler.retrieveAjax( response ) )
                return false;

            if (handler == undefined && handler != '' ){

                cuHandler.closeLoader();

                bootbox.dialog({
                    message: response.content,
                    title: response.message,
                    icon: response.icon != undefined ? response.icon : '',
                    width: response.width != undefined ? response.width : '',
                    id: window_id,
                    animate: false,
                    closeButton: response.closeButton != undefined ? response.closeButton : true
                });

            } else {

                cuHandler.closeLoader();
                eval(handler+"(response, launcher);");

            }

            $(".sb-data-table").each( function(){
                cuHandler.createDataTable( $(this) );
            });

            cuHandler.checkAjaxAction( response );

            return false;

        }, 'json');

    },

    submitAjaxForm: function(form){

        if ( !$(form).valid() )
            return false;

        cuHandler.showLoader();

        var params = form.serialize();
        params += "&SBTOKEN_REQUEST=" + $("#smartb-token").val();

        var action = form.attr("action");
        var method = form.attr("method");

        if ( method == 'post' )
            $.post( action, params, cuHandler.retrieveAjax, 'json');
        else
            $.get( action, params, cuHandler.retrieveAjax, 'json');

        return false;

    },

    // Retrieve information for AJAX-FORMS
    retrieveAjax: function(response){

        if (response.type=='error'){

            if (response.modal_message!=undefined)
                bootbox.alert({
                    message: response.message
                });
            else
                alert(response.message);

        }else
            cuHandler.showInPanel(3, response.message, false);

        if( response.token!='' )
            $("#smartb-token").val(response.token);

        cuHandler.closeLoader();

        cuHandler.checkAjaxAction( response );

        if (response.type=='error')
            return false;

        return true;

    },

    checkAjaxAction: function( data ){

        /**
         * Ejecución de otras acciones
         */

        // closeWindow: "#window-id"
        if(data.closeWindow != undefined)
            $(data.closeWindow).modal('hide');

        if(data.runHandler != undefined)
            eval(data.runHandler + "(data)");

        if (data.goto != undefined)
            window.location.href = data.goto;

        if(data.function != undefined)
            eval(data.function);
        
        if(data.openDialog != undefined){
            
            bootbox.dialog({
                message: data.content,
                title: data.message,
                icon: data.icon != undefined ? data.icon : '',
                width: data.width != undefined ? data.width : '',
                owner: data.owner != undefined ? data.owner : '',
                id: data.windowId!=undefined ? data.windowId : '',
                animate: false,
                closeButton: data.closeButton != undefined ? data.closeButton : true
            });
            
        }

    },

    showLoader: function(){

        $(".cu-window-loader").hide();
        $(".cu-window-blocker").hide();

        var html = '<div class="cu-window-blocker"></div>';
        html += '<div id="cu-window-loader">' +
            '<div class="loader-container text-center">' +
            '<button class="close" type="button">&times;</button>' +
            '<span>Operación en progreso...</span>' +
            '</div></div>';

        $(body).append(html);

        $(".cu-window-blocker").fadeIn(0, function(){
            $(".cu-window-loader").fadeIn(1);
        });

    },

    closeLoader: function( handler ){
        $("#cu-window-loader").fadeOut(1, function(){
            $("#cu-window-blocker").fadeOut(0, handler);
        });
    },

    getURI: function( module, controller, action, zone, params ){

        var url = xoUrl;

        if( cu_rewrite ){

            url += zone=='backend'?'/admin':'';
            url += '/' + module + '/' + controller + '/' + action + '/';

        } else {

            url += '/modules/' + module;
            url += zone=='backend'?'/admin':'';
            url += '/index.php/' + controller + '/' + action + '/';

        }

        if (params == undefined)
            return url;

        var query = '';
        for(key in params){
            query += (query=='' ? '?' : '&') + key + '=' + eval('params.' + key);
        }

        return url + query;

    },

    /**
     * Crea una tabla de datos
     * @param ele
     */
    createDataTable: function( ele ){

        if ( ele.hasClass("dataTable") )
            return;

        var exclude = $(ele).data("exclude");
        var cols = exclude != undefined ? exclude.toString().split(",") : '';

        $(ele).dataTable( {
            "bProcessing": true,
            "bServerSide": true,
            "sAjaxSource": $(ele).data('source'),
            "bPaginate": true,
            //"aoColumnDefs": [exclude != undefined ? {"bSortable": false, "aTargets": cols} : '']
        } );

    },

    /**
     * Controlar la barra de estado
     */
    showInPanel: function( panel, message, process ){

        process = process == undefined ? false : process;
        var loader = '';
        if (process)
            loader = '<img src="' + xoUrl + '/themes/smarterp/images/loader.gif">';

        $("#status-" + panel).html(loader + ' &nbsp; ' +message);

    },

    getPanel: function(panel){
        return $("#status-" + panel).html();
    },

    /**
     * Ejecuta una acción asociada a un elemento específico
     */
    runAction: function( e) {

        var action = $(e).data("action");

        switch(action){
            case 'load-remote-dialog':
            case 'load-module-dialog':
                cuHandler.loadRemoteDialog( e );
                break;
            case 'goto':
                var url = $(e).data("url");
                var retriever = $(e).data("retriever");

                if (retriever != undefined)
                    url = url + eval(retriever+'(e)');

                if(url!=undefined && url!='')
                    window.location.href = url;
                break;
        }

    },

    enableCommands: function(){

        var total = $(".tr-checked").length;

        $(".on-checked").each(function(index){

            var required = $(this).data("count")!=undefined ? $(this).data("count") : ' >= 1';

            if ( eval('total ' + required)){
                $(this).attr("disabled", false);
                $(this).addClass("disabled");
            } else {
                $(this).attr("disabled", true);
                $(this).removeClass("disabled");
            }

        });

    }

};

/**
 * formato para monedas
 */
Number.prototype.formatMoney = function(c, d, t){
    var n = this,
        c = isNaN(c = Math.abs(c)) ? 2 : c,
        d = d == undefined ? "." : d,
        t = t == undefined ? "," : t,
        s = n < 0 ? "-" : "",
        i = parseInt(n = Math.abs(+n || 0).toFixed(c)) + "",
        j = (j = i.length) > 3 ? j % 3 : 0;
    return s + (j ? i.substr(0, j) + t : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : "");
};

/**
 * Plugin para habilitar o desabilitar un element
 */
jQuery.fn.enable = function(){
    this.each(function(){
        jQuery(this).attr("disabled", false);
    });
}

jQuery.fn.disable = function(){
    this.each(function(){
        jQuery(this).attr("disabled", true);
    });
}

$(document).ready(function(){

    /**
     * Calcularmos las dimensiones del contenido
     */
    cuHandler.adjustDimensions();
    $(window).resize( $.debounce( 500, function( e ){
        cuHandler.adjustDimensions();
    } ) );

    /**
     * Cargar diálogos de otros módulos
     */
    $('body').on('click', '*[data-action]', function(){

        cuHandler.runAction( $(this) )

    });

    $("body").on("click touch", ".table-checker tbody tr td", function(){
        cuHandler.selectRow( $(this).parents("tr") );
        cuHandler.enableCommands();
    });

    $("body").on("click touch", ".table-checker-live tbody tr td", function(){

        cuHandler.selectRow( $(this).parents("tr") );
        cuHandler.enableCommands();

    });

    $("body").on('submit', '.ajax-form', function(){
        cuHandler.submitAjaxForm( $(this) );
        return false;
    });

    $("#smartb-loader .close").click(function(){
        cuHandler.closeLoader();
    });

    $(".sb-data-table").each( function(){
        cuHandler.createDataTable( $(this) );
    });

    $("*[data-rel='tooltip']").tooltip();

    $("body").on("dblclick", ".table-checker > tbody > tr > td, .table-checker-live > tbody > tr > td", function(){

        cuHandler.selectRow( $(this) );
        var ele = $("*[data-capture='.tr-checked']");
        if (ele.length > 0){
            $(ele).enable();
            $(ele).click();
        }


    });

    $("body").on("click", "#sb-system-alerts", function(){

        $("#sb-system-alerts").remove();

        $.get( xoUrl + '/themes/smarterp/include/alerts.php', function(data){

            bootbox.dialog({
                message: data,
                title: 'Alertas del Sistema',
                width: 'large',
                id: 'sb-dialog-alerts',
                animate: false,
                closeButton: true
            });

        }, 'html' );

    });

    $("body").on("click", ".discard-alert", function(){
        var ele = $(this);
        var params = {
            id: $(this).data("id"),
            action: 'discard'
        };

        $.post(xoUrl + '/themes/smarterp/include/alerts.php', params, function(data){
            if (data==0)
                return false;

            $(ele).parents(".sb-alert-item").remove();

        }, 'html');
    });

    if($("#sb-system-alerts").length > 0){

        setTimeout(function(){
            $("#sb-system-alerts").remove();
        }, 10000);

    }

});

