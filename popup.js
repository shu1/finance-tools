// Shuichi Aizawa 2024
"use strict";

pre_btn.onclick = () => shuFinanceTools(0);
post_btn.onclick = () => shuFinanceTools(1);
range_btn.onclick = () => shuFinanceTools(2);
target_btn.onclick = () => shuFinanceTools(3);

function shuFinanceTools(mode) {
  chrome.tabs.query({ active: true, lastFocusedWindow: true }, ([tab]) => {
    if (tab.url.startsWith("https://finance.yahoo.com/portfolio/")) {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: contentScript,
        args: [mode],
      }).then(([res]) => {
        if (res.result) {
          if (res.result[0] <= 1) {
            chrome.action.setBadgeText({ text: res.result[3].toFixed(1) + "%" });
            chrome.action.setTitle({ title: res.result[1] + "-Mkt Chg Sum: $" + res.result[2] });
            msg_div.textContent = `${res.result[1]}-Mkt Chg Sum: $${res.result[2]}, ${res.result[3]}%`;

            stock_table.innerHTML = "";
            res.result[4].forEach((stock) => {
              stock_table.innerHTML += `<tr>
<td><a title="${stock.name}" href="https://finance.yahoo.com/quote/${stock.symbol}">${stock.symbol}</a></td>
<td>${stock.changePercent.toFixed(1)}%</td>
<td>$${Math.round(stock.changeValue)}</td>
<td>$${Math.round(stock.marketValue)}</td>
<td class=name>${stock.name}</td>
</tr>`;
            });
          }
          else if (res.result[0] == 2) {
            let changes = 0;
            res.result[1].sort((a, b) => a.change - b.change);
            res.result[1].forEach((stock) => {
              if (stock.change) {
                if (!changes) stock_table.innerHTML = "";
                stock_table.innerHTML += `<tr>
<td><a title="${stock.name}" href="https://finance.yahoo.com/quote/${stock.symbol}">${stock.symbol}</a></td>
<td>${stock.change}</td>
<td>$${stock.marketValue ? Math.round(stock.marketValue) : 0}</td>
<td class=name>${stock.name}</td>
</tr>`;
                ++changes;
              }
            });
            if (!changes) stock_table.innerHTML = "No changes";
          }
          else if (res.result[0] == 3) {
            stock_table.innerHTML = "";
            res.result[1].forEach((stock) => {
              stock_table.innerHTML += `<tr>
<td><a title="${stock.name}" href="https://finance.yahoo.com/quote/${stock.symbol}">${stock.symbol}</a></td>
<td>${Math.round(stock.target)}%</td>
<td>$${stock.marketValue ? Math.round(stock.marketValue) : 0}</td>
<td class=name>${stock.name}</td>
</tr>`;
            });
          }
          else msg_div.textContent = res.result;
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
  const heads = stockTable.querySelectorAll("thead > tr > th");
  const stocks = stockTable.querySelectorAll("tbody > tr");
  if (mode <= 1) {
    const p = ["Pre", "Post"];

    let changePercentCol, marketValueCol;
    heads.forEach((head, i) => {
      if (head.innerText == p[mode] + "-Mkt Chg %") changePercentCol = i + 1;
      else if (head.innerText == "Market Value ($)") marketValueCol = i + 1;
    });
    if (!changePercentCol || !marketValueCol) {
      const msg = `"${p[mode]}-Mkt Chg %" or "Market Value ($)" columns not found.`;
      console.log(msg);
      return msg;
    }

    let portfolioSum, changeSum, changeArray;
    function scrapeTable() {
      portfolioSum = 0;
      changeSum = 0;
      changeArray = [];
      stocks.forEach((stock) => {
        const marketValue = Number(stock.querySelector(`td:nth-child(${marketValueCol})`).textContent.replace(/,/g, ""));
        portfolioSum += marketValue;

        const changePercent = Number(stock.querySelector(`td:nth-child(${changePercentCol})`)?.textContent.replace(/%/g, ""));
        const changeValue = changePercent ? marketValue * changePercent / 100 : 0;
        changeSum += changeValue;

        const symbol = stock.querySelector("td.inlineBlock.lpin > div > div > a");
        changeArray.push({
          symbol: symbol.textContent,
          name: symbol.title,
          changePercent: format(changePercent),
          changeValue: format(changeValue),
          marketValue: format(marketValue + changeValue),
        });
      });
      changeArray.sort((a, b) => a.changeValue - b.changeValue);
    }
    scrapeTable();
    if (!changeSum) {
      mode = 1 - mode;
      scrapeTable();
    }
    if (!changeSum) return p[mode] + "-Mkt Chg Sum: None";

    const changeTable = {};
    for (let i = 0; i < changeArray.length; ++i) {
      changeTable[changeArray[i].symbol] = {
        [p[mode] + "-Mkt Chg %"]: changeArray[i].changePercent,
        [p[mode] + "-Mkt Chg $"]: changeArray[i].changeValue,
        [p[mode] + "-Mkt $"]: changeArray[i].marketValue,
      };
    }
    console.table(changeTable);
    const sumPercent = format(changeSum / portfolioSum * 100);
    changeSum = Math.round(changeSum);
    console.log(`${p[mode]}-Mkt Chg Sum: $${changeSum}, ${sumPercent}%`);
    return [mode, p[mode], changeSum, sumPercent, changeArray];
  }
  else if (mode == 2) {
    let marketValueCol, priceCol, highCol, lowCol;
    heads.forEach((head, i) => {
      if (head.innerText == "Market Value ($)") marketValueCol = i + 1;
      else if (head.innerText == "Last Price") priceCol = i + 1;
      else if (head.innerText == "52-Wk High") highCol = i + 1;
      else if (head.innerText == "52-Wk Low") lowCol = i + 1;
    });
    if (!priceCol || !highCol || !lowCol) {
      const msg = '"52-Wk Low" or "52-Wk High" or "Last Price" columns not found.';
      console.log(msg);
      return msg;
    }

    const rangeArray = [];
    stocks.forEach((stock, i) => {
      const marketValue = marketValueCol ? Number(stock.querySelector(`td:nth-child(${marketValueCol})`).textContent.replace(/,/g, "")) : 0;
      const price = Number(stock.querySelector(`td:nth-child(${priceCol})`).textContent.replace(/,/g, ""));
      const high = Number(stock.querySelector(`td:nth-child(${highCol})`).textContent.replace(/,/g, ""));
      const low = Number(stock.querySelector(`td:nth-child(${lowCol})`).textContent.replace(/,/g, ""));
      const symbol = stock.querySelector("td.inlineBlock.lpin > div > div > a");

      rangeArray.push({
        index: i,
        pos: stock.dataset.testidRow,
        symbol: symbol.textContent,
        name: symbol.title,
        percentage: (price - low) / (high - low),
        marketValue: marketValue,
      });
    });
    rangeArray.sort((a, b) => a.percentage - b.percentage);

    if (document.querySelector("button.quaternary-blue-btn.fin-size-small.rounded")) {
      const pfId = location.pathname.match(/\/portfolio\/([^/]+)(\/view)?/)[1];
      const crumb = JSON.parse(document.getElementById("nimbus-benji-config").textContent)?.i13n?.user?.crumb;
      fetch(`https://query1.finance.yahoo.com/v6/finance/portfolio/update?pfId=${pfId}&crumb=${crumb}`, {
        method: "put",
        credentials: "include",
        body: JSON.stringify({
          "parameters": { "pfId": pfId },
          "operations": rangeArray.map((e, i) => ({ "operation": "position_update", "posId": e.pos, "sortOrder": i }))
        })
      });
    }

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
  else if (mode == 3) {
    let marketValueCol, targetCol, priceCol;
    heads.forEach((head, i) => {
      if (head.innerText == "Market Value ($)") marketValueCol = i + 1;
      else if (head.innerText == "1yr Target Est") targetCol = i + 1;
      else if (head.innerText == "Last Price") priceCol = i + 1;
    });
    if (!targetCol || !priceCol) {
      const msg = '"1yr Target Est" or "Last Price" columns not found.';
      console.log(msg);
      return msg;
    }

    const targetArray = [];
    stocks.forEach((stock, i) => {
      const marketValue = marketValueCol ? Number(stock.querySelector(`td:nth-child(${marketValueCol})`).textContent.replace(/,/g, "")) : 0;
      const target = Number(stock.querySelector(`td:nth-child(${targetCol})`).textContent.replace(/,/g, ""));
      const price = Number(stock.querySelector(`td:nth-child(${priceCol})`).textContent.replace(/,/g, ""));
      const symbol = stock.querySelector("td.inlineBlock.lpin > div > div > a");

      targetArray.push({
        symbol: symbol.textContent,
        name: symbol.title,
        target: format((target - price) / price * 100),
        marketValue: format(marketValue),
      });
    });
    targetArray.sort((a, b) => a.target - b.target);

    const targetTable = {};
    for (let i = 0; i < targetArray.length; ++i) {
      targetTable[targetArray[i].symbol] = {
        "1yr Target Est %": targetArray[i].target,
        "Market Value": targetArray[i].marketValue,
      };
    }
    console.table(targetTable);
    return [mode, targetArray];
  }
}
