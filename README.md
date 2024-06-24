# Shu's Finance Tools
Chrome extension that adds extra utilities for your Yahoo Finance portfolios.  
This extension only works on Yahoo Finance portfolio pages.

### After-Hours Portfolio Tracker
- A [custom portfolio view](https://help.yahoo.com/kb/set-custom-views-portfolios-sln5231.html) with **Post-Mkt Chg %** (or **Pre-Mkt Chg %**) and **Market Value** columns required.
- The portfolio must have holdings data of bought stocks.
- Open the browser console, then click the button.  
The popup will show the amount your portfolio changed after hours.  
The extension button badge will show what percent of your portfolio the change is.  
The browser console will show a table of all stocks in the portfolio, and the amount each stock changed after hours. Click on a column head to sort by that column.

### 52-Week Range Sorter
- A [custom portfolio view](https://help.yahoo.com/kb/set-custom-views-portfolios-sln5231.html) with **52-Wk Low**, **52-Wk High**, and **Last Price** columns required.
- Open the browser console, then click the button.  
The console will show a table of all stocks in the portfolio, and the 52-week percentage. Click on the column head to sort by the 52-week range.

## Installation
- Download the source into a folder.
- Load the folder as an [unpacked extension](https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world#load-unpacked) in Developer Mode, and [pin the extension](https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world#pin_the_extension).
- Go to one of your Yahoo Finance portfolio pages, and click on the extension button.
