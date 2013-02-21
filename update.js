/**
 * Had to hack sorttable into this script. Scroll down a bit for the main app.
 */


var stIsIE = /*@cc_on!@*/false;
sorttable = {
	  init: function() {
	    if (!document.createElement || !document.getElementsByTagName) return;
		    sorttable.DATE_RE = /^(\d\d?)[\/\.-](\d\d?)[\/\.-]((\d\d)?\d\d)$/;
		    forEach(document.getElementsByTagName('table'), function(table) {
		    	if (table.className.search(/\bsortable\b/) != -1) {
		    		sorttable.makeSortable(table);
		      }
		    });
	  },
	  
	  makeSortable: function(table) {
	    if (table.getElementsByTagName('thead').length == 0) {
	      // table doesn't have a tHead. Since it should have, create one and
	      // put the first table row in it.
	      the = document.createElement('thead');
	      the.appendChild(table.rows[0]);
	      table.insertBefore(the,table.firstChild);
	    }
	    // Safari doesn't support table.tHead, sigh
	    if (table.tHead == null) table.tHead = table.getElementsByTagName('thead')[0];
	    
	    if (table.tHead.rows.length != 1) return; // can't cope with two header rows
	    
	    // Sorttable v1 put rows with a class of "sortbottom" at the bottom (as
	    // "total" rows, for example). This is B&R, since what you're supposed
	    // to do is put them in a tfoot. So, if there are sortbottom rows,
	    // for backwards compatibility, move them to tfoot (creating it if needed).
	    sortbottomrows = [];
	    for (var i=0; i<table.rows.length; i++) {
	      if (table.rows[i].className.search(/\bsortbottom\b/) != -1) {
	        sortbottomrows[sortbottomrows.length] = table.rows[i];
	      }
	    }
	    if (sortbottomrows) {
	      if (table.tFoot == null) {
	        // table doesn't have a tfoot. Create one.
	        tfo = document.createElement('tfoot');
	        table.appendChild(tfo);
	      }
	      for (var i=0; i<sortbottomrows.length; i++) {
	        tfo.appendChild(sortbottomrows[i]);
	      }
	      delete sortbottomrows;
	    }
	    
	    // work through each column and calculate its type
	    headrow = table.tHead.rows[0].cells;
	    for (var i=0; i<headrow.length; i++) {
	      // manually override the type with a sorttable_type attribute
	      if (!headrow[i].className.match(/\bsorttable_nosort\b/)) { // skip this col
	        mtch = headrow[i].className.match(/\bsorttable_([a-z0-9]+)\b/);
	        if (mtch) { override = mtch[1]; }
		      if (mtch && typeof sorttable["sort_"+override] == 'function') {
		        headrow[i].sorttable_sortfunction = sorttable["sort_"+override];
		      } else {
		        headrow[i].sorttable_sortfunction = sorttable.guessType(table,i);
		      }
		      // make it clickable to sort
		      headrow[i].sorttable_columnindex = i;
		      headrow[i].sorttable_tbody = table.tBodies[0];
		      dean_addEvent(headrow[i],"click", function(e) {

	          if (this.className.search(/\bsorttable_sorted\b/) != -1) {
	            // if we're already sorted by this column, just 
	            // reverse the table, which is quicker
	            sorttable.reverse(this.sorttable_tbody);
	            this.className = this.className.replace('sorttable_sorted',
	                                                    'sorttable_sorted_reverse');
	            this.removeChild(document.getElementById('sorttable_sortfwdind'));
	            sortrevind = document.createElement('span');
	            sortrevind.id = "sorttable_sortrevind";
	            sortrevind.innerHTML = stIsIE ? '&nbsp<font face="webdings">5</font>' : '&nbsp;&#x25B4;';
	            this.appendChild(sortrevind);
	            return;
	          }
	          if (this.className.search(/\bsorttable_sorted_reverse\b/) != -1) {
	            // if we're already sorted by this column in reverse, just 
	            // re-reverse the table, which is quicker
	            sorttable.reverse(this.sorttable_tbody);
	            this.className = this.className.replace('sorttable_sorted_reverse',
	                                                    'sorttable_sorted');
	            this.removeChild(document.getElementById('sorttable_sortrevind'));
	            sortfwdind = document.createElement('span');
	            sortfwdind.id = "sorttable_sortfwdind";
	            sortfwdind.innerHTML = stIsIE ? '&nbsp<font face="webdings">6</font>' : '&nbsp;&#x25BE;';
	            this.appendChild(sortfwdind);
	            return;
	          }
	          
	          // remove sorttable_sorted classes
	          theadrow = this.parentNode;
	          forEach(theadrow.childNodes, function(cell) {
	            if (cell.nodeType == 1) { // an element
	              cell.className = cell.className.replace('sorttable_sorted_reverse','');
	              cell.className = cell.className.replace('sorttable_sorted','');
	            }
	          });
	          sortfwdind = document.getElementById('sorttable_sortfwdind');
	          if (sortfwdind) { sortfwdind.parentNode.removeChild(sortfwdind); }
	          sortrevind = document.getElementById('sorttable_sortrevind');
	          if (sortrevind) { sortrevind.parentNode.removeChild(sortrevind); }
	          
	          this.className += ' sorttable_sorted';
	          sortfwdind = document.createElement('span');
	          sortfwdind.id = "sorttable_sortfwdind";
	          sortfwdind.innerHTML = stIsIE ? '&nbsp<font face="webdings">6</font>' : '&nbsp;&#x25BE;';
	          this.appendChild(sortfwdind);

		        // build an array to sort. This is a Schwartzian transform thing,
		        // i.e., we "decorate" each row with the actual sort key,
		        // sort based on the sort keys, and then put the rows back in order
		        // which is a lot faster because you only do getInnerText once per row
		        row_array = [];
		        col = this.sorttable_columnindex;
		        rows = this.sorttable_tbody.rows;
		        for (var j=0; j<rows.length; j++) {
		          row_array[row_array.length] = [sorttable.getInnerText(rows[j].cells[col]), rows[j]];
		        }
		        /* If you want a stable sort, uncomment the following line */
		        //sorttable.shaker_sort(row_array, this.sorttable_sortfunction);
		        /* and comment out this one */
		        row_array.sort(this.sorttable_sortfunction);
		        
		        tb = this.sorttable_tbody;
		        for (var j=0; j<row_array.length; j++) {
		          tb.appendChild(row_array[j][1]);
		        }
		        
		        delete row_array;
		      });
		    }
	    }
	  },
	  
	  guessType: function(table, column) {
	    // guess the type of a column based on its first non-blank row
	    for (var x=0; x<table.rows.length; x++) {
	      var textie = sorttable.getInnerText(table.rows[x].cells[column]);
	      if (textie !== "") {
	        if (textie.match(/[-+]?[0-9]*\.?[0-9]+/)) {
	          return sorttable.sort_numeric;
	        }
	      }
	    }
	    return sorttable.sort_alpha;
	  },
	  
	  getInnerText: function(node) {
	    // gets the text we want to use for sorting for a cell.
	    // strips leading and trailing whitespace.
	    // this is *not* a generic getInnerText function; it's special to sorttable.
	    // for example, you can override the cell text with a customkey attribute.
	    // it also gets .value for <input> fields.
	    
		if (!node) return "";
		
	    hasInputs = (typeof node.getElementsByTagName == 'function') &&
	                 node.getElementsByTagName('input').length;
	    
	    if (node.getAttribute("sorttable_customkey") != null) {
	      return node.getAttribute("sorttable_customkey");
	    }
	    else if (typeof node.textContent != 'undefined' && !hasInputs) {
	      return node.textContent.replace(/^\s+|\s+$/g, '');
	    }
	    else if (typeof node.innerText != 'undefined' && !hasInputs) {
	      return node.innerText.replace(/^\s+|\s+$/g, '');
	    }
	    else if (typeof node.text != 'undefined' && !hasInputs) {
	      return node.text.replace(/^\s+|\s+$/g, '');
	    }
	    else {
	      switch (node.nodeType) {
	        case 3:
	          if (node.nodeName.toLowerCase() == 'input') {
	            return node.value.replace(/^\s+|\s+$/g, '');
	          }
	        case 4:
	          return node.nodeValue.replace(/^\s+|\s+$/g, '');
	          break;
	        case 1:
	        case 11:
	          var innerText = '';
	          for (var i = 0; i < node.childNodes.length; i++) {
	            innerText += sorttable.getInnerText(node.childNodes[i]);
	          }
	          return innerText.replace(/^\s+|\s+$/g, '');
	          break;
	        default:
	          return '';
	      }
	    }
	  },
	  
	  reverse: function(tbody) {
	    // reverse the rows in a tbody
	    newrows = [];
	    for (var i=0; i<tbody.rows.length; i++) {
	      newrows[newrows.length] = tbody.rows[i];
	    }
	    for (var i=newrows.length-1; i>=0; i--) {
	       tbody.appendChild(newrows[i]);
	    }
	    delete newrows;
	  },
	  
	  sort_numeric: function(a,b) {
	    aa = parseFloat(a[0].replace(/[^0-9.-]/g,''));
	    if (isNaN(aa)) aa = 0;
	    bb = parseFloat(b[0].replace(/[^0-9.-]/g,'')); 
	    if (isNaN(bb)) bb = 0;
	    return aa-bb;
	  },
	  sort_alpha: function(a,b) {
	    if (a[0]==b[0]) return 0;
	    if (a[0]<b[0]) return -1;
	    return 1;
	  }
	  
};

/*****************************************************
 * This is where the app starts. Above here be sorting
 *****************************************************/

var stocks = {
	ABCAM : { symbol : "LON:ABC" },
	ADVANCED : { symbol : "LON:AMS" },
	ANDOR : { symbol : "LON:AND" },
	ASML : { symbol : "AMS:ASML" },
	AVEVA : { symbol : "LON:AVV" },
	BIOTECH : { symbol : "LON:BIOG" },
	BLINKX : { symbol : "LON:BLNX" },
	BRADY : { symbol : "LON:BRY" },
    BRAINJUICER : { symbol : "LONG:BJU" },
	COBHAM : { symbol : "LON:COB" },
	CUPID : { symbol : "LON:CUP" },
	DECHRA : { symbol : "LON:DPH" },
	DELCAM : { symbol : "LON:DLC" },
	FENNER : { symbol : "LON:FENR" },
	FIDESSA : { symbol : "LON:FDSA" },
	FIRST : { symbol : "LON:FDP" },
	GENUS : { symbol : "LON:GNS" },
	GILEAD : { symbol : "NASDAQ:GILD" },
	GW : { symbol : "LON:GWP" },
	GOOGLE : { symbol : "NASDAQ:GOOG" },
	HALMA : { symbol : "LON:HLMA" },
	INSTEM : { symbol : "LON:INS" },
	INTERCEDE : { symbol : "LON:IGP" },
	INTUITIVE : { symbol : "NASDAQ:ISRG" },
	IP : { symbol : "LON:IPO" },
	IQE : { symbol : "LON:IQE" },
	JOHNSON : { symbol : "LON:JMAT" },
	JUDGES : { symbol : "LON:JDG" },
	MEDTRONIC : { symbol : "NYSE:MDT" },
	MORPHOSYS : { symbol : "ETR:MOR" },
	MURGITROYD : { symbol : "LON:MUR" },
	NCC : { symbol : "LON:NCC" },
	RENISHAW : { symbol : "LON:RSW" },
	ROTORK : { symbol : "LON:ROR" },
	SDL : { symbol : "LON:SDL" },
	SPIRENT : { symbol : "LON:SPT" },
	SURGICAL : { symbol : "LON:SUN" },
	SYMRISE : { symbol : "FRA:SY1" },
	TEVA : { symbol : "NASDAQ:TEVA" },
	VECTURA : { symbol : "LON:VEC" },
	VICTREX : { symbol : "LON:VCT" }
};

// Split the page into the parts we need
var portfolio = document.getElementById("newsletterbooklet-view").getElementsByTagName("table");
var main = portfolio[0];
var risky = portfolio[1];
var closed = portfolio[2];

// Update each table with extra data
updateTable(main, stocks);
updateTable(risky, stocks);


/*********************************************************
 * This is where the app finishes. Below here be functions
 *********************************************************/

/**
 * Update a table with latest pricing info
 */
function updateTable(table, stocks) {
	table.className += "sortable";
	for (var i = 0; i < table.rows.length; i++) {
		(i === 0) ? updateHeaderRow(table.rows[i]) : updateDataRow(table.rows[i], stocks);
	}
}

/**
 * Prettify and add real time data to a data row
 */
function updateDataRow(row) {
	colourize(row);
	addRealtimeData(row, stocks);
}

/**
 * Add extra column headers
 */
function updateHeaderRow(row){
	row.insertCell(0).innerHTML = "Current Google price";
	row.insertCell(0).innerHTML = "Limit/Current price ratio";
}

/**
 * Make a table row look nice depending on it's recommendation
 */
function colourize(row) {
	var decision = row.cells[0].innerText;
	if (decision.lastIndexOf("BUY", 0) === 0) {
		row.style.backgroundColor = "#EAFFEF";
	}
	if (decision.lastIndexOf("HOLD", 0) === 0) {
		row.style.backgroundColor = "#ECF4FF";
	}
	if (decision.lastIndexOf("SELL", 0) === 0) {
		row.style.backgroundColor = "#FFECF5";
	}
}

/**
 * Get updated prices from Google
 */
function addRealtimeData(row, stocks) {
	
	// Some bits we'll need
	var company = getSymbol(row, stocks);
	
	// If we don't get a valid symbol then just enter blanks
	if (!company) {
		row.insertCell(0).innerHTML = "";
		row.insertCell(0).innerHTML = "";
		sorttable.init();
		return;
	}
	
	var buyLimit = getPriceOnly(row.cells[0].innerText);
	var originalPrice = getPriceOnly(row.cells[5].innerText);
	
	// Now get the latest trade
	var xhr = new XMLHttpRequest();
	xhr.open("GET", "http://www.google.co.uk/finance?q=" + company, true);
	xhr.onreadystatechange = function() {
		if (xhr.readyState != 4) {
			return;
		}
		var resp = xhr.responseText;
		
		// Extract last trade
		var start = resp.indexOf("id=market-data-div");
		var end = start + 200;
		var lastTrade = resp.substring(start, end);
		start = lastTrade.indexOf("</span") - 10;
		end = start + 10;
		lastTrade = lastTrade.substring(start, end);
		start = lastTrade.indexOf(">") + 1;
		end = lastTrade.length;
		lastTrade = lastTrade.substring(start, end);
		lastTrade = lastTrade.replace(",", "");
		
		// Extract currency
		start = resp.indexOf("Currency in ") + 12;
		end = start + 10
		var currency = resp.substring(start, end);
		start = 0
		end = 3;
		currency = currency.substring(start, end);
		if (currency === 'tml') {
			currency = "";
		}
		
		// Result time
		var trade = new Object();
		trade.price = lastTrade;
		trade.currency = currency;
		var priceRatio = (trade.price) ? (buyLimit / trade.price).toFixed(2) : "";
		
		// Now update the row
		row.insertCell(0).innerHTML = trade.price + " " + trade.currency;
		row.insertCell(0).innerHTML = priceRatio;
		sorttable.init();
	}
	
	xhr.send(null);
}

/**
 * Get the company name
 */
function getSymbol(row, stocks) {
	var result = row.cells[1].innerText;
	result = result.substring(0, result.indexOf("("));
	if (result) {
		result = result.trim();
		if (result.indexOf(" ") > -1) {
			result = result.substring(0, result.indexOf(" "));
		}
		if (stocks[result] && stocks[result].symbol) {
			return stocks[result].symbol;
		}
	}
	return undefined;
}

/**
 * Get the exchange that this stock is traded on
 */
function getExchange(row) {
	var priceNow = row.cells[5].innerText;
	var currency = priceNow.replace(/[^A-Za-z]/g, "");
	if (currency === "p") {
		return "LSE";
	}
}

/**
 * Strip a price from a piece of text
 */
function getPriceOnly(text) {
	if (text.indexOf("stop loss") > -1) {
		text = text.substring(0, text.indexOf("stop loss"));
	}
	return text.replace(/[^0-9.]/g, "");
}

/**
 * Useful method for iterating arrays
 */
function forEach(array, block, context) {
	for (var i = 0; i < array.length; i++) {
		block.call(context, array[i], i, array);
	}
}

/**
 * Used by sorttable...
 */
function dean_addEvent(element, type, handler) {
	if (element.addEventListener) {
		element.addEventListener(type, handler, false);
	} else {
		if (!handler.$$guid) handler.$$guid = dean_addEvent.guid++;
		if (!element.events) element.events = {};
		var handlers = element.events[type];
		if (!handlers) {
			handlers = element.events[type] = {};
			if (element["on" + type]) {
				handlers[0] = element["on" + type];
			}
		}
		handlers[handler.$$guid] = handler;
		element["on" + type] = handleEvent;
	}
}




