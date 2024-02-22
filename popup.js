// Shuichi Aizawa 2024
chrome.tabs.query({ active: true, lastFocusedWindow: true }, ([tab]) => {
  if (tab.url.startsWith("https://finance.yahoo.com/portfolio/")) {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: computeChange,
    }).then(([res]) => {
      if (res.result) {
        pre_post.innerHTML = res.result[0];
        change_sum.innerHTML = "$" + res.result[1];
        warning_div.style.display = "none";
        result_div.style.display = "block";
        chrome.action.setBadgeText({ text: res.result[2].toFixed(1) + "%" });
        chrome.action.setTitle({ title: res.result[0] + "-Mkt Chg Sum: $" + res.result[1] });
      }
    });
  }
});

function computeChange() {
  const stockTable = document.querySelector("#pf-detail-table");
  const stockList = stockTable.querySelectorAll(".Fz\\(s\\)[data-field=regularMarketPrice][data-trend=none]");

  function format(n) {
    return n ? Number(n.toFixed(2)) : 0;
  }

  const p = ["Post", "Pre"];
  let i, portfolioSum, changeSum, changeTable;
  function makeTable(preOrPost) {
    i = preOrPost;
    portfolioSum = 0;
    changeSum = 0;
    changeTable = {};
    stockList.forEach((stock) => {
      const marketValue = Number(stock.getAttribute("value"));
      portfolioSum += marketValue;

      const changePercent = Number(stockTable.querySelector(`[data-field=${i ? "pre" : "post"}MarketChangePercent][data-symbol=${stock.dataset.symbol}]`)?.getAttribute("value"));
      const changeValue = marketValue * changePercent / 100;
      changeSum += changePercent ? changeValue : 0;

      changeTable[stock.dataset.symbol] = {
        "Market Value": format(marketValue),
        [p[i] + "-Mkt Chg %"]: format(changePercent),
        [p[i] + "-Mkt Chg Val"]: format(changeValue),
      };
    });
  }
  makeTable(0);
  if (!changeSum) makeTable(1);
  if (!changeSum) return;

  console.table(changeTable);
  const sumPercent = format(changeSum / portfolioSum * 100);
  console.log(`${p[i]}-Mkt Chg Sum: $${format(changeSum)}, ${sumPercent}%`);
  return [p[i], format(changeSum), sumPercent];
}
