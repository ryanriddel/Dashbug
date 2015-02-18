var stationListData=[];
var socket;

jQuery(document).ready(function(){
    console.log("Page load");
    initializeDatePicker();
    socket = io();

    $('#test_button').on('click', getStations);
    $('#test_button').on('click', getErrorProne);
    $('#test_button').on('click', getRecentError);
    $('#test_button').on('click', getModuleError);
    $('#test_button').on('click', getSwapsBeforeFailure);

    //this will dynamically resize jqGrid's if the user changes the size of the window
    jQuery(window).bind('resize', function() {
      var newWidth1=jQuery('.col-lg-12').width()-2;//the -2 accounts for the jqGrid header overflowing the container.
      var newWidth2=jQuery('.col-lg-6').width()-2;
      jQuery('#station_list_grid').setGridWidth(newWidth1);
      jQuery('#station_error_grid').setGridWidth(newWidth2);
      jQuery('#recent_error_grid').setGridWidth(newWidth2);
      }).trigger('resize');

    $('#station_error_grid_pager').css("font-size", "10px;"); 

    socket.on('database_response_station_list', function(msg)
    {
        console.log("Database Response Received");
        databaseResponseHandler(msg);
    });

    socket.on('database_response_error_prone_list', function(msg)
    {
        console.log("database_response_error_prone_list received");
        databaseResponseHandler(msg);
    });

    socket.on('database_response_recent_error_list', function(msg)
    {
        databaseResponseHandler(msg);
    });

    socket.on('database_response_module_failure_plot', function(msg)
    {
        databaseResponseHandler(msg);
    });

    socket.on('database_response_swaps_before_failure_data', function(msg)
    {
        databaseResponseHandler(msg);
    });
    socket.on('database_response_swaps_before_failure_gs_best', function(msg)
    {   
        databaseResponseHandler(msg);
    });
    socket.on('database_response_swaps_before_failure_gs_recent', function(msg)
    {
        databaseResponseHandler(msg);
    });
    socket.on('database_response_swaps_before_failure_gs_average', function(msg)
    {
        databaseResponseHandler(msg);
    });
    socket.on('update_station_data', function(msg)
    {
        //this is used to update the state of a ground station in the station jqGrid or plot
        console.log("GOT A SOCKET: UPDATE");
        updateStationData(msg);
    });
    socket.on('add_error', function(msg)
    {
        //this adds an error, which will update a couple jqGrids and (probably) a plot
        console.log("GOT A SOCKET: ADD ERROR");
        addError(msg);

    });

    $('.ui-jqgrid').css("font-size:10px;");
});


function queryDatabase(query)
{
    socket.emit('database_query', query);
}

function getStations()
{
    var query={tag: 'station_list', msg: '', collection:'stationlist'};
    queryDatabase(query);
}

function getErrorProne()
{
    var query={tag: 'error_prone_list', msg: '', collection:'errorlist'};
    queryDatabase(query);
}

function getModuleError()
{
    var tempStartDate=$('#module_error_start_date').val().split("-");
    var tempEndDate=$('#module_error_end_date').val().split("-");
    var startDate=new Date(tempStartDate[2], tempStartDate[1]-1, tempStartDate[0]);
    var endDate=new Date(tempEndDate[2], tempEndDate[1]-1, tempEndDate[0]);

    console.log(startDate);
    console.log(endDate);
  
    var query={tag: 'module_failure_plot', msg: '', collection:'errorlist', startDate:startDate, endDate:endDate};
    queryDatabase(query);
}

function getSwapsBeforeFailure()
{
    var dropdown_selection=jQuery('#swap_failure_dropdown').children("option").filter(":selected").val();
    var query=new Object();
    console.log("DROPDOWN SELECTION" + dropdown_selection);
    if(dropdown_selection=="date")
    {
        //return a line plot that has a line for every ground station, and shows the number of swaps before failure for each.
        //we will use the errorlist database for this.

        query={tag: 'swaps_before_failure_date', msg: '', collection:'errorlist'};
    }
    else if(dropdown_selection=="GS# (Average)")
    {
        query={tag: 'swaps_before_failure_gs_average', msg: '', collection:'errorlist'};
    }
    else if(dropdown_selection=="GS# (Most Recent)")
    {
        query={tag: 'swaps_before_failure_gs_recent', msg: '', collection:'errorlist'};
    }
    else if(dropdown_selection=="GS# (Best)")
    {
        query={tag: 'swaps_before_failure_gs_best', msg: '', collection:'errorlist'};
    }
    else
    {
        console.log("Uh oh...");
    }

    queryDatabase(query);


}

function getRecentError()
{
    var query={tag: 'recent_error_list', msg: '', collection:'errorlist', };
    queryDatabase(query);
}


function databaseResponseHandler(response)
{
    if(response.query.tag=="station_list")
    {
        var stationExplorer=document.getElementById("station_explorer");
        var stationExplorerWidth=stationExplorer.clientWidth;
        //stationExplorerWidth-=30; //this is to accomodate the leftmost header cell.

        var stationExplorerColWidth=[130/1190*stationExplorerWidth, 50/1190*stationExplorerWidth, 220/1190*stationExplorerWidth, 130/1190*stationExplorerWidth, 180/1190*stationExplorerWidth, 155/1190*stationExplorerWidth, 250/1190*stationExplorerWidth];
        
        console.log(response.data);

        $('#station_list_grid').jqGrid({
            data:response.data,
            datatype: "local",
            mtype: "GET",
            colNames: ["Station Name", "ID", "Last Update", "Status", "Last Error", "Number of Swaps", "State"],
            colModel: [
                { name: "name", width: stationExplorerColWidth[0] , align:"center"},
                { name: "id", width: stationExplorerColWidth[1], align:"center" },
                { name: "last_update_timestamp", width: stationExplorerColWidth[2], align:"center"},
                { name: "status", width: stationExplorerColWidth[3], align:"center"},
                { name: "last_error", width:stationExplorerColWidth[4], align:"center"},
                { name: "number_of_swaps", width:stationExplorerColWidth[5], align:"center"},
                { name: "state", width:stationExplorerColWidth[6], align:"center"}
            ],
            pager: "#station_list_pager",
            rowNum: 10,
            rowList: [10, 20, 30],
            sortname: "invid",
            sortorder: "desc",
            viewrecords: true,
            gridview: true,
            autoencode: true,
            //caption: "Station Explorer"
        });
    }
    else if(response.query.tag=="error_prone_list")
    {
        var stationErrorGrid=document.getElementById("station_error");
        var stationErrorGridWidth=stationErrorGrid.clientWidth;
    
        stationErrorGridWidth-=30; //this is to accomodate the minimization arrow.
        var stationErrorGridColWidth=[80/470*stationErrorGridWidth, 100/470*stationErrorGridWidth, 140/470*stationErrorGridWidth, 150/470*stationErrorGridWidth];
        console.log("ERROR PRONE");
        console.log(response.data);

        $('#station_error_grid').jqGrid({
            data:response.data,
            datatype: "local",
            mtype: "GET",
            colNames: ["Station ID", "Lifetime Errors", "Oldest Error (Date)", "Newest Error (Date)"],
            colModel: [
                { name: "ground_station_id", width: stationErrorGridColWidth[0], align:"center" },
                { name: "lifetime_errors", width: stationErrorGridColWidth[1], align:"center" },
                { name: "last_error", width: stationErrorGridColWidth[2], align:"center"},
                { name: "most_recent_error", width: stationErrorGridColWidth[3], align:"center"}
            ],
            pager: "#station_error_grid_pager",
            
            rowNum: 10,
            rowList: [10, 20, 30],
            sortname: "invid",
            sortorder: "desc",
            viewrecords: true,
            gridview: true,
            autoencode: true,
            //caption: "Station Explorer"
        });
    }
    else if(response.query.tag=="recent_error_list")
    {
        var recentErrorGrid=document.getElementById("recent_error")
        var recentErrorGridWidth=recentErrorGrid.clientWidth;
    //containerWidth=containerWidth-container.css('padding-right')-container.css('padding-left');
        recentErrorGridWidth-=30; //this is to accomodate the minimization arrow.
        var recentErrorGridColWidth=[95/566*recentErrorGridWidth, 130/566*recentErrorGridWidth, 166/566*recentErrorGridWidth, 175/566*recentErrorGridWidth];
        console.log("RECENT ERROR");
        console.log(response.data);

        $('#recent_error_grid').jqGrid({
            data:response.data,
            datatype: "local",
            mtype: "GET",
            colNames: ["Module", "Date", "Error Message", "Swaps Before Error"],
            colModel: [
                { name: "module", width: recentErrorGridColWidth[0], align:"center" },
                { name: "timestamp", width: recentErrorGridColWidth[1] , align:"center"},
                { name: "error_message", width: recentErrorGridColWidth[2], align:"center"},
                { name: "swaps_before_error", width: recentErrorGridColWidth[3], align:"center"}
            ],
            pager: "#recent_error_grid_pager",
            rowNum: 10,
            rowList: [10, 20, 30],
            sortname: "invid",
            sortorder: "desc",
            viewrecords: true,
            gridview: true,
            autoencode: true,
            //caption: "Station Explorer"
        });
    }
    else if(response.query.tag=="module_failure_plot")
    {
        console.log("MODULE FAILURE");
        console.log(response.data);
        Morris.Bar
        ({
            element: 'module_error_plot',
            datatype:'local',
            data: response.data,
            xkey: 'module',
            ykeys: ['errors'],
            labels: ['Errors'],
            barRatio: 0.4,
            xLabelAngle: 0,
            hideHover: 'auto',
            resize: true,
            tag: 'module_failure_plot'
        });

    }
    else if(response.query.tag=='swaps_before_failure_date')
    {
        
           /* var swapDataPoints=response.data[i];
            var ground_station_id=swapDataPoint[0].ground_station_id;*/


            //we need to create an array of objects that look like this
            console.log("DATA COMING");
            console.log(response.data);
            Morris.Line({
                // ID of the element in which to draw the chart.
                element: 'swap_failure_plot',
                // Chart data records -- each entry in this array corresponds to a point on
                // the chart.
                data: response.data[0],
                // The name of the data record attribute that contains x-visits.
                xkey: 'timestamp',
                // A list of names of data record attributes that contain y-visits.
                ykeys: ['swaps_before_error'],
                // Labels for the ykeys -- will be displayed when you hover over the
                // chart.
                labels: ['Swaps'],
                xLabels: 'second',
                ymin: 'auto',
                ymax: 'auto',
                // Disables line smoothing
                smooth: false,
                resize: true
            });
    }
    else if(response.query.tag=='swaps_before_failure_gs_recent')
    {
        Morris.Bar
        ({
            element: 'swap_failure_plot', //*******
            datatype:'local',
            data: response.data,
            xkey: 'ground_station_id',
            ykeys: ['swaps_before_error'],
            labels: ['Errors'],
            barRatio: 0.4,
            xLabelAngle: 0,
            hideHover: 'auto',
            resize: true,
            tag: 'swap_failure_plot'
        });
    }
    else if(response.query.tag=='swaps_before_failure_gs_best')
    {
        Morris.Bar
        ({
            element: 'swap_failure_plot',
            datatype:'local',
            data: response.data,
            xkey: 'ground_station_id',
            ykeys: ['swaps_before_error'],
            labels: ['Errors'],
            barRatio: 0.4,
            xLabelAngle: 0,
            hideHover: 'auto',
            resize: true,
            tag: 'swap_failure_plot'
        });
    }
    else if(response.query.tag=='swaps_before_failure_gs_average')
    {
        Morris.Bar
        ({
            element: 'swap_failure_plot',
            datatype:'local',
            data: response.data,
            xkey: 'ground_station_id',
            ykeys: ['swaps_before_error'],
            labels: ['Errors'],
            barRatio: 0.4,
            xLabelAngle: 0,
            hideHover: 'auto',
            resize: true,
            tag: 'swap_failure_plot'
        });
    }
}

function updateStationData(msg)
{
    //The update has already been pushed to the server, we just need to update UI elements.

    //update station explorer
    console.log("Changing cell value");
    console.log(msg);
    changejqGridCell('station_list_grid', msg.id, msg.update_type, msg.data);
    changejqGridCell('station_list_grid', msg.id, 'last_update_timestamp', unixTimestampToJavascriptDate(Date.now()/1000));

}

function changejqGridCell(jqGridId, groundstation_id, attribute_to_change, new_value)
{

    var gridContainer=$('#' + jqGridId);
    var rowData=gridContainer.jqGrid('getRowData', groundstation_id);

    rowData[attribute_to_change]=new_value;

    gridContainer.jqGrid('setRowData', groundstation_id, rowData);
}

function addError(msg)
{
    //The error has already been inserted into the database.  We just need to update the UI elements.
    console.log("UPDATE ERRORS");
    console.log(msg);
}

function initializeDatePicker()
{
/*This block initializes datepicker objects and sets up event handlers */
    
   var datePicker=jQuery('.datepick').datepicker({
      format: 'mm-dd-yyyy'
    });
   

   datePicker.on('changeDate', function(ev)
   {
        //this fixes a bug wherein the calendar does not disappear after a date has been selected
        datePicker.datepicker('hide');

        var beginDate=ev.date;
        
        
   });

}

function unixTimestampToJavascriptDate(timestamp)
{
    var tempDate=new Date(timestamp*1000);
    return (tempDate.toLocaleTimeString() + "  " + (tempDate.getMonth()+1) + "/" + tempDate.getDate() + "/" + tempDate.getFullYear());
}












