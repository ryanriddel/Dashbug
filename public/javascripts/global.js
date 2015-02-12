var stationListData=[];
var socket;

jQuery(document).ready(function(){
    console.log("Page load");
    initializeDatePicker();
    socket = io();

    $('#stationlist tbody').on('click', 'td a.linkshowuser', showStationInfo);
    $('#btn_send_socket').on('click', sendSocket);
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

    socket.on('date_broadcast', function(msg)
    {
        $('h1').text(msg);
    })

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

    $('.ui-jqgrid').css("font-size:10px;");

    populateTable();
});

function sendSocket()
{
    socket.emit('button_pressed', $('#socket_data').val());
}

function populateTable()
{
    console.log("Requesting Database Contents");
    var tableContent="";

    jQuery.getJSON('users/userlist', function(data)
    {
        stationListData=data;
        for(var i=0; i<data.length; i++)
        {
            tableContent+="<tr>";
            tableContent+="<td><a href='#' class='linkshowuser' rel='" + data[i].name + "' >" + data[i].name + "</a></td>";
            tableContent+="<td>" + data[i].status + "</td>";
            tableContent+="<td><a href='#' class='linkdeleteuser'>delete</a></td>";
            tableContent+="</tr>";
            
        }
        $("#stationlist tbody").html(tableContent);
    });
    
    
}

function showStationInfo(event)
{
    event.preventDefault();

    var thisStationName=$(this).attr('rel');

    var arrayPosition=stationListData.map(function(arrayItem){ return arrayItem.name;}).indexOf(thisStationName);

    var stationObj=stationListData[arrayPosition];

    $('#station_name').text(stationObj.name);
    $('#station_birth_date').text(stationObj.birth_date);
    $('#station_id').text(stationObj.id);
    $('#station_status').text(stationObj.status);

}

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

        var stationExplorerColWidth=[150/1190*stationExplorerWidth, 50/1190*stationExplorerWidth, 345/1190*stationExplorerWidth, 250/1190*stationExplorerWidth, 355/1190*stationExplorerWidth];
        
        console.log(response.data);

        $('#station_list_grid').jqGrid({
            data:response.data,
            datatype: "local",
            mtype: "GET",
            colNames: ["Station Name", "ID", "Running Since", "Status", "Last Error"],
            colModel: [
                { name: "name", width: stationExplorerColWidth[0] },
                { name: "id", width: stationExplorerColWidth[1] },
                { name: "birth_date", width: stationExplorerColWidth[2], align: "right" },
                { name: "status", width: stationExplorerColWidth[3], align: "right" },
                { name: "last_error", width:stationExplorerColWidth[4], align: "right"}
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
                { name: "ground_station_id", width: stationErrorGridColWidth[0] },
                { name: "lifetime_errors", width: stationErrorGridColWidth[1] },
                { name: "last_error", width: stationErrorGridColWidth[2], align: "right" },
                { name: "most_recent_error", width: stationErrorGridColWidth[3], align: "right" }
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
            colNames: ["Module", "Date", "Error Message", "State"],
            colModel: [
                { name: "module", width: recentErrorGridColWidth[0] },
                { name: "timestamp", width: recentErrorGridColWidth[1] },
                { name: "error_message", width: recentErrorGridColWidth[2], align: "right" },
                { name: "state", width: recentErrorGridColWidth[3], align: "right" }
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

function dropDownClick()
{

}














