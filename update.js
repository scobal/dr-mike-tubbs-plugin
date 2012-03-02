
// Split the page into the parts we need
var portfolio = document.getElementById("newsletterbooklet-view").getElementsByTagName("table");
var main = portfolio[0];
var risky = portfolio[1];
var closed = portfolio[2];

for (var i = 0; i < main.rows.length; i++) {
	var row = main.rows[i];
	if (i === 0) {
		row.insertCell(0).innerHTML = "Current Google price";
		row.insertCell(0).innerHTML = "Current price ratio";
	} else {

		// Calculate everything we'll need
		var company = getCompany(row);
		var buyLimit = getPriceOnly(row.cells[0].innerText);
		var originalPrice = getPriceOnly(row.cells[5].innerText);
		var currentGooglePrice = getLastTrade(company);
		var priceRatio = (currentGooglePrice) ? (buyLimit / currentGooglePrice).toFixed(2) : "";
		
		// Now update the row
		row.insertCell(0).innerHTML = currentGooglePrice;
		row.insertCell(0).innerHTML = priceRatio;
	}
}

/**
 * Get the company name
 */
function getCompany(row) {
	var company = row.cells[1].innerText;
	return company.substring(0, company.indexOf("("));
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
		var resp = synchronousAjax("http://www.google.co.uk/finance?q=" + symbol);
		if (resp) {
			var start = resp.indexOf("id=market-data-div");
			var end = start + 200;
			resp = resp.substring(start, end);
			
			start = resp.indexOf("</span") - 10;
			end = start + 10;
			resp = resp.substring(start, end);
			
			start = resp.indexOf(">") + 1;
			end = resp.length;
			resp = resp.substring(start, end);
			
			console.log(symbol + ": " + resp);
			
			resp = resp.replace(",", "");
			return resp;
		}
	}
	return "";
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

