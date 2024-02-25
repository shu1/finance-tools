Shu's After Hours Portfolio Tracker
---
Chrome extension to track the after hours total of your Yahoo Finance portfolio.  
This extension only works on Yahoo Finance portfolio pages.  
A custom portfolio view with **Post-Mkt Chg %** (or **Pre-Mkt Chg %**) and **Market Value** columns required.

- Download the source into a folder.
- Load the folder as an [unpacked extension](https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world#load-unpacked) in Developer Mode, and [pin the extension](https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world#pin_the_extension).
- Go to one of your Yahoo Finance portfolio pages, where you must have holdings data of bought stocks.  
  You must have a [custom view](https://help.yahoo.com/kb/set-custom-views-portfolios-sln5231.html) with **Post-Mkt Chg %** (or **Pre-Mkt Chg %**) and **Market Value** columns.
- Open the browser console (ctrl-shift-J).
- Click on the extension button.

The popup will show the amount your portfolio changed after hours.  
The extension button badge will show what percent of your portfolio the change is.  
By default, it will try to get the Post-Market change. You can also click the Pre-Market button, if you have the **Pre-Mkt Chg %** column in your view.  Depending on the time of day, if data in one column isn't available then it'll automatically try the other.  
The browser console will show a table of all stocks in the portfolio, and the amount each stock changed after hours. Click on a column head to sort by that column.
