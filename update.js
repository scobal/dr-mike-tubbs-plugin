
// Split the page into the parts we need
var portfolio = document.getElementById("newsletterbooklet-view").getElementsByTagName("table");
var main = portfolio[0];
var risky = portfolio[1];
var closed = portfolio[2];

for (var i = 0; i < main.rows.length; i++) {
	var row = main.rows[i];
	if (i === 0) {
		row.insertCell(0).innerHTML = "Last trade";
		row.insertCell(0).innerHTML = "Symbol";
		row.insertCell(0).innerHTML = "Exchange";
		row.insertCell(0).innerHTML = "Current growth rate";
		row.insertCell(0).innerHTML = "Original growth rate";
	} else {

		// Calculate everything we'll need
		var exchange = getExchange(row);
		var symbol = getSymbol(row, exchange);
		var buyLimit = getPriceOnly(row.cells[0].innerText);
		var originalPrice = getPriceOnly(row.cells[5].innerText);
		var lastTrade = getLastTrade(symbol);
		var originalGrowthRate = (buyLimit / originalPrice).toFixed(2);
		var currentGrowthRate = (buyLimit / lastTrade).toFixed(2);
		
		// Now update the row
		row.insertCell(0).innerHTML = lastTrade;
		row.insertCell(0).innerHTML = symbol;
		row.insertCell(0).innerHTML = exchange;
		row.insertCell(0).innerHTML = currentGrowthRate;
		row.insertCell(0).innerHTML = originalGrowthRate;
	}
}

/**
 * Try and work out the stocks symbol from a given row and exchange
 */
function getSymbol(row, exchange) {
	var company = row.cells[1].innerText;
	var query = company.substring(0, company.indexOf("("));
	if (exchange && query) {
		var symbol = getSymbolFromYahoo(query, exchange);
		if (symbol) {
			return symbol;
		}
	}
	return "";
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
 * Get the last trade for a given stock
 */
function getLastTrade(symbol) {
	if (symbol) {
		var resp = synchronousAjax("http://www.google.com/ig/api?stock=" + symbol);
		if (resp) {
			var xml = new DOMParser().parseFromString(resp, "text/xml");
			return xml.getElementsByTagName("last")[0].attributes.getNamedItem("data").nodeValue;
		}
	}
}

/**
 * Try and get the stocks symbol from yahoo! finance
 */
function getSymbolFromYahoo(query, exchange) {
	var resp = synchronousAjax("http://d.yimg.com/autoc.finance.yahoo.com/autoc?query=" + query + "&callback=YAHOO.Finance.SymbolSuggest.ssCallback");
	resp = resp.replace("YAHOO.Finance.SymbolSuggest.ssCallback(","");
	resp = resp.substring(0, resp.length - 1);
    var results = JSON.parse(resp).ResultSet.Result;
    for (var i = 0; i < results.length; i++) {
    	var result = results[i];
    	if (result.exch === exchange) {
    		return result.symbol;
    	}
    }
}

/**
 * Send an an ajax request (synchronously)
 */
function synchronousAjax(url) {
	var xhr = new XMLHttpRequest();
	xhr.open("GET", url, false);
	xhr.send();
	return xhr.responseText;
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