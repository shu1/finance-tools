// Shuichi Aizawa 2024
"use strict";

pre_button.onclick = () => shuFinanceTools(0);
post_button.onclick = () => shuFinanceTools(1);
range_button.onclick = () => shuFinanceTools(2);

function shuFinanceTools(mode) {
  chrome.tabs.query({ active: true, lastFocusedWindow: true }, ([tab]) => {
    if (tab.url.startsWith("https://finance.yahoo.com/portfolio/")) {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: contentScript,
        args: [mode],
      })
      .then(([res]) => {
        if (res.result) {
          if (res.result[0] <= 1) {
            pre_post.innerHTML = res.result[1];
            change_sum.innerHTML = "$" + res.result[2];
            chrome.action.setBadgeText({ text: res.result[3].toFixed(1) + "%" });
            chrome.action.setTitle({ title: res.result[1] + "-Mkt Chg Sum: $" + res.result[2] });
          }
          else if (res.result[0] == 2) {
            res.result[1].sort((a, b) => a.change - b.change);
            let changes = 0;
            res.result[1].forEach((stock) => {
              if (stock.change) {
                if (!changes) stock_table.innerHTML = "";
                stock_table.innerHTML += `<tr><td>${stock.symbol}</td><td>${stock.change}</td><td>$${stock.marketValue ? Math.round(stock.marketValue) : 0}</td></tr>`;
                ++changes;
              }
            });
            if (!changes) stock_table.innerHTML = "No changes";
          }
        }
      });
    }
  });
}

function contentScript(mode) {
  function format(n) {
    return n ? Number(n.toFixed(2)) : 0;
  }

  const stockTable = document.querySelector("#nimbus-app .table-container.cs-compact.headerWrap > table");
  if (mode <= 1) {
    const p = ["Pre", "Post"];

    const heads = stockTable.querySelectorAll("thead > tr > th");
    let changePercentCol, marketValueCol;
    heads.forEach((head, i) => {
      if (head.innerText == p[mode] + "-Mkt Chg %") changePercentCol = i + 1;
      else if (head.innerText == "Market Value ($)") marketValueCol = i + 1;
    });
    if (!changePercentCol || !marketValueCol) {
      console.log(`"${p[mode]}-Mkt Chg %" or "Market Value ($)" columns not found.`);
      return;
    }

    const stocks = stockTable.querySelectorAll("tbody > tr");
    let portfolioSum, changeSum, changeTable;
    function scrapeTable() {
      portfolioSum = 0;
      changeSum = 0;
      changeTable = {};
      stocks.forEach((stock) => {
        const marketValue = Number(stock.querySelector(`td:nth-child(${marketValueCol}) > span`).textContent.replace(/,/g, ""));
        portfolioSum += marketValue;

        const changePercent = Number(stock.querySelector(`td:nth-child(${changePercentCol}) > span`)?.textContent.replace(/%/g, ""));
        const changeValue = changePercent ? marketValue * changePercent / 100 : 0;
        changeSum += changeValue;

        changeTable[stock.querySelector("td.inlineBlock.lpin > div > div > a").textContent] = {
          [p[mode] + "-Mkt Chg %"]: format(changePercent),
          [p[mode] + "-Mkt Chg $"]: format(changeValue),
          [p[mode] + "-Mkt $"]: format(marketValue + changeValue),
        };
      });
    }
    scrapeTable();
    if (!changeSum) {
      mode = 1 - mode;
      scrapeTable();
    }
    if (!changeSum) return;

    console.table(changeTable);
    const sumPercent = format(changeSum / portfolioSum * 100);
    console.log(`${p[mode]}-Mkt Chg Sum: $${format(changeSum)}, ${sumPercent}%`);
    return [mode, p[mode], format(changeSum), sumPercent];
  }
  else if (mode == 2) {
    const prices = stockTable.querySelectorAll(":not(.Fz\\(s\\))[data-field=regularMarketPrice][data-trend=none]");
    const highs = stockTable.querySelectorAll("[aria-label='52-Wk High']");
    const lows = stockTable.querySelectorAll("[aria-label='52-Wk Low']");

    const rangeArray = [];
    for (let i = 0; i < prices.length; ++i) {
      const symbol = prices[i].dataset.symbol;
      const stock = stockTable.querySelector(`.Fz\\(s\\)[data-field=regularMarketPrice][data-trend=none][data-symbol="${symbol}"]`);
      const marketValue = Number(stock?.getAttribute("value"));
      const price = Number(prices[i].getAttribute("value"));
      const high = Number(highs[i].innerText.replace(/,/g, ""));
      const low = Number(lows[i].innerText.replace(/,/g, ""));

      rangeArray.push({
        index: i,
        symbol: symbol,
        percentage: (price - low) / (high - low),
        marketValue: marketValue,
      });
    }

    const reorder = document.querySelector("[data-test=save-order-btn]");
    if (reorder) {
      function sortTable(i) {
        let min = i;
        for (let j = i + 1; j < rangeArray.length; ++j) {
          if (rangeArray[j].percentage < rangeArray[min].percentage) min = j;
        }

        if (min > i) {
          const rows = stockTable.querySelector("tbody").querySelectorAll("tr");
          rows[min].dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
          rows[min].dispatchEvent(new MouseEvent("mousemove", { bubbles: true, clientY: (i - min) * 32 }));
          rows[min].dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));

          rangeArray.splice(i, 0, rangeArray.splice(min, 1)[0]);
        }

        if (i + 2 < rangeArray.length) sortTable(i + 1);
      }
      sortTable(0);
    }
    else rangeArray.sort((a, b) => a.percentage - b.percentage);

    const rangeTable = {};
    for (let i = 0; i < rangeArray.length; ++i) {
      rangeArray[i].change = i - rangeArray[i].index;

      rangeTable[rangeArray[i].symbol] = {
        change: rangeArray[i].change,
        "52-Wk %": format(rangeArray[i].percentage * 100),
        "Market Value": format(rangeArray[i].marketValue),
      };
    }
    console.table(rangeTable);
    return [mode, rangeArray];
  }
}
