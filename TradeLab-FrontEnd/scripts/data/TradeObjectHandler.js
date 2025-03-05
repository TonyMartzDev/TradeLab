import BaseDataHandler from "./BaseDataHandler.js";
import { tradeAPI } from "../api.js";
import { showErrorMessage, showSuccessMessage } from "../notifications.js";

class Trade {
  constructor(
    symbol,
    market,
    entryPrice,
    exitPrice,
    quantity,
    date,
    notes,
    direction
  ) {
    this.id = Date.now().toString() + Math.random().toString(36).substr(2, 9); // More unique ID
    this.symbol = symbol;
    this.market = market.charAt(0).toUpperCase() + market.slice(1);
    this.entryPrice = parseFloat(entryPrice);
    this.exitPrice = parseFloat(exitPrice);
    this.quantity = parseFloat(quantity);

    // Handle date input - ensure it's a Date object set to midnight local time
    let tradeDate;
    if (date instanceof Date) {
      tradeDate = new Date(date);
    } else if (typeof date === "string") {
      // Try parsing as ISO date first (YYYY-MM-DD)
      const dateParts = date.split(/[-/]/);
      if (dateParts.length === 3) {
        // Assume YYYY-MM-DD or MM/DD/YYYY format
        if (dateParts[0].length === 4) {
          // YYYY-MM-DD
          tradeDate = new Date(
            parseInt(dateParts[0]),
            parseInt(dateParts[1]) - 1,
            parseInt(dateParts[2])
          );
        } else {
          // MM/DD/YYYY
          tradeDate = new Date(
            parseInt(dateParts[2]),
            parseInt(dateParts[0]) - 1,
            parseInt(dateParts[1])
          );
        }
      } else {
        tradeDate = new Date(date);
      }
    } else {
      tradeDate = new Date();
    }
    tradeDate.setHours(0, 0, 0, 0);
    this.date = tradeDate;

    this.notes = notes;
    this.direction = direction.toLowerCase(); // 'long' or 'short'
    this.investment = parseFloat(
      (this.entryPrice * Math.abs(this.quantity)).toFixed(2)
    );
    this.profitLoss = parseFloat(this.calculateProfitLoss().toFixed(2));
    this.profitLossPercentage = parseFloat(
      ((this.profitLoss / this.investment) * 100).toFixed(2)
    );

    // Calculate MFE and MAE
    const excursion = this.calculateExcursion();
    this.maxRunup = excursion.maxRunup;
    this.maxDrawdown = excursion.maxDrawdown;
  }

  calculateProfitLoss() {
    // Futures contract specifications
    const tickData = {
      // Equity Index Futures
      ES: { tickSize: 0.25, tickValue: 12.5 }, // E-mini S&P 500
      NQ: { tickSize: 0.25, tickValue: 5.0 }, // E-mini Nasdaq-100
      RTY: { tickSize: 0.1, tickValue: 10.0 }, // E-mini Russell 2000
      YM: { tickSize: 1.0, tickValue: 5.0 }, // E-mini Dow
      MES: { tickSize: 0.25, tickValue: 1.25 }, // Micro E-mini S&P 500
      MNQ: { tickSize: 0.25, tickValue: 0.5 }, // Micro E-mini Nasdaq-100
      M2K: { tickSize: 0.1, tickValue: 1.0 }, // Micro E-mini Russell 2000
      MYM: { tickSize: 1.0, tickValue: 0.5 }, // Micro E-mini Dow

      // Energy Futures
      CL: { tickSize: 0.01, tickValue: 10.0 }, // Crude Oil
      NG: { tickSize: 0.001, tickValue: 10.0 }, // Natural Gas
      HO: { tickSize: 0.0001, tickValue: 4.2 }, // Heating Oil
      RB: { tickSize: 0.0001, tickValue: 4.2 }, // RBOB Gasoline
      MCL: { tickSize: 0.01, tickValue: 1.0 }, // Micro Crude Oil

      // Metals Futures
      GC: { tickSize: 0.1, tickValue: 10.0 }, // Gold
      SI: { tickSize: 0.005, tickValue: 25.0 }, // Silver
      HG: { tickSize: 0.0005, tickValue: 12.5 }, // Copper
      MGC: { tickSize: 0.1, tickValue: 1.0 }, // Micro Gold
      SIL: { tickSize: 0.005, tickValue: 2.5 }, // Micro Silver

      // Agricultural Futures
      ZC: { tickSize: 0.25, tickValue: 12.5 }, // Corn
      ZW: { tickSize: 0.25, tickValue: 12.5 }, // Wheat
      ZS: { tickSize: 0.25, tickValue: 12.5 }, // Soybeans
      ZM: { tickSize: 0.1, tickValue: 10.0 }, // Soybean Meal
      ZL: { tickSize: 0.0001, tickValue: 6.0 }, // Soybean Oil
      KC: { tickSize: 0.05, tickValue: 18.75 }, // Coffee
      CT: { tickSize: 0.01, tickValue: 5.0 }, // Cotton
      SB: { tickSize: 0.01, tickValue: 11.2 }, // Sugar

      // Financial Futures
      ZN: { tickSize: 0.015625, tickValue: 15.625 }, // 10-Year T-Note
      ZB: { tickSize: 0.03125, tickValue: 31.25 }, // 30-Year T-Bond
      ZF: { tickSize: 0.0078125, tickValue: 7.8125 }, // 5-Year T-Note
      ZT: { tickSize: 0.00390625, tickValue: 3.90625 }, // 2-Year T-Note
      GE: { tickSize: 0.0025, tickValue: 12.5 }, // Eurodollar
      ZQ: { tickSize: 0.0025, tickValue: 10.4167 }, // 30-Day Fed Funds

      // Currency Futures
      "6E": { tickSize: 0.0001, tickValue: 12.5 }, // Euro FX
      "6B": { tickSize: 0.0001, tickValue: 6.25 }, // British Pound
      "6J": { tickSize: 0.0000001, tickValue: 12.5 }, // Japanese Yen
      "6C": { tickSize: 0.0001, tickValue: 10.0 }, // Canadian Dollar
      "6A": { tickSize: 0.0001, tickValue: 10.0 }, // Australian Dollar
      "6N": { tickSize: 0.0001, tickValue: 12.5 }, // New Zealand Dollar
      "6M": { tickSize: 0.00001, tickValue: 5.0 }, // Mexican Peso
      M6E: { tickSize: 0.0001, tickValue: 1.25 }, // Micro Euro FX

      // Cryptocurrency Futures
      BTC: { tickSize: 5.0, tickValue: 5.0 }, // Bitcoin
      ETH: { tickSize: 0.5, tickValue: 0.5 }, // Ethereum
      MBT: { tickSize: 5.0, tickValue: 0.5 }, // Micro Bitcoin
      MET: { tickSize: 0.5, tickValue: 0.05 }, // Micro Ether

      // VIX Futures
      VX: { tickSize: 0.05, tickValue: 50.0 }, // VIX
      VXM: { tickSize: 0.05, tickValue: 5.0 }, // Mini VIX
    };

    // Check if this is a futures trade
    if (this.market.toLowerCase() === "futures" && tickData[this.symbol]) {
      const { tickSize, tickValue } = tickData[this.symbol];
      const priceDifference =
        this.direction === "long"
          ? this.exitPrice - this.entryPrice
          : this.entryPrice - this.exitPrice;

      // Calculate number of ticks (rounded to nearest tick)
      const numTicks = Math.round(priceDifference / tickSize);

      // Calculate PNL based on tick value
      return numTicks * tickValue * Math.abs(this.quantity);
    } else {
      // For non-futures trades, use the regular calculation
      let rawPL = 0;
      if (this.direction === "long") {
        rawPL = (this.exitPrice - this.entryPrice) * Math.abs(this.quantity);
      } else {
        rawPL = (this.entryPrice - this.exitPrice) * Math.abs(this.quantity);
      }
      return rawPL;
    }
  }

  calculateExcursion() {
    let maxRunup = 0;
    let maxDrawdown = 0;
    const priceDiff = this.exitPrice - this.entryPrice;

    if (this.direction === "long") {
      if (priceDiff > 0) {
        maxRunup = priceDiff * Math.abs(this.quantity);
        maxDrawdown = 0;
      } else {
        maxRunup = 0;
        maxDrawdown = priceDiff * Math.abs(this.quantity);
      }
    } else {
      // short
      if (priceDiff < 0) {
        maxRunup = Math.abs(priceDiff) * Math.abs(this.quantity);
        maxDrawdown = 0;
      } else {
        maxRunup = 0;
        maxDrawdown = -priceDiff * Math.abs(this.quantity);
      }
    }

    return {
      maxRunup: parseFloat(maxRunup.toFixed(2)),
      maxDrawdown: parseFloat(maxDrawdown.toFixed(2)),
    };
  }

  // Add a method to convert to a plain object for storage
  toStorageObject() {
    return {
      id: this.id,
      symbol: this.symbol,
      market: this.market,
      entryPrice: this.entryPrice,
      exitPrice: this.exitPrice,
      quantity: this.quantity,
      date: this.date.toISOString().split("T")[0], // Store as YYYY-MM-DD
      notes: this.notes,
      direction: this.direction,
      profitLoss: this.profitLoss,
      investment: this.investment,
      profitLossPercentage: this.profitLossPercentage,
      maxRunup: this.maxRunup,
      maxDrawdown: this.maxDrawdown,
    };
  }

  static fromStorageObject(obj) {
    // Parse the date and set to midnight in local timezone
    const dateParts = obj.date.split("-");
    const localDate = new Date(
      parseInt(dateParts[0]), // year
      parseInt(dateParts[1]) - 1, // month (0-based)
      parseInt(dateParts[2]) // day
    );
    localDate.setHours(0, 0, 0, 0);

    const trade = new Trade(
      obj.symbol,
      obj.market,
      obj.entryPrice,
      obj.exitPrice,
      obj.quantity,
      localDate,
      obj.notes,
      obj.direction
    );
    trade.id = obj.id; // Preserve the original ID
    // Restore other properties
    trade.profitLoss = obj.profitLoss;
    trade.investment = obj.investment;
    trade.profitLossPercentage = obj.profitLossPercentage;
    trade.maxRunup = obj.maxRunup;
    trade.maxDrawdown = obj.maxDrawdown;
    return trade;
  }
}
// Storage Strategy Interface
class StorageStrategy {
  async loadTrades() {
    throw new Error("Method not implemented");
  }
  async saveTrades(trades) {
    throw new Error("Method not implemented");
  }
}

// IndexedDB Storage Strategy
class IndexedDBStrategy extends StorageStrategy {
  constructor() {
    super();
    this.dbName = "TradeLabDB";
    this.version = 1;
    this.storeName = "trades";
  }

  async openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: "id" });
        }
      };
    });
  }

  async loadTrades() {
    try {
      const db = await this.openDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.storeName], "readonly");
        const store = transaction.objectStore(this.storeName);
        const request = store.getAll();

        request.onerror = () => {
          console.error("Error loading trades:", request.error);
          reject(request.error);
        };

        request.onsuccess = () => {
          console.log("Successfully loaded trades:", request.result);
          resolve(request.result);
        };
      });
    } catch (error) {
      console.error("Error in loadTrades:", error);
      throw error;
    }
  }

  async saveTrades(trades) {
    try {
      console.log("Attempting to save trades:", trades);

      if (!Array.isArray(trades)) {
        throw new Error("Trades must be an array");
      }

      const db = await this.openDB();

      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.storeName], "readwrite");
        const store = transaction.objectStore(this.storeName);

        // Clear existing data
        const clearRequest = store.clear();

        clearRequest.onsuccess = () => {
          console.log("Cleared existing trades");

          // Convert each trade to storage format
          trades.forEach((trade) => {
            // Convert to Trade instance if it's not already one
            const tradeInstance =
              trade instanceof Trade ? trade : Trade.fromStorageObject(trade);
            // Convert to storage format
            const storageObject = tradeInstance.toStorageObject();
            console.log("Saving trade:", storageObject);
            const addRequest = store.add(storageObject);

            addRequest.onerror = (event) => {
              console.error("Error adding trade:", addRequest.error);
              reject(addRequest.error);
            };
          });
        };

        clearRequest.onerror = (event) => {
          console.error("Error clearing trades:", clearRequest.error);
          reject(clearRequest.error);
        };

        transaction.oncomplete = () => {
          console.log("All trades saved successfully");
          resolve();
        };

        transaction.onerror = (event) => {
          console.error("Transaction error:", transaction.error);
          reject(transaction.error);
        };
      });
    } catch (error) {
      console.error("Error in saveTrades:", error);
      throw error;
    }
  }
}

class TradeObjectHandler extends BaseDataHandler {
  constructor(storageType = "indexeddb") {
    super(storageType);
    this.trades = [];
  }

  // async initIndexedDB() {
  //   return new Promise((resolve, reject) => {
  //     const request = indexedDB.open(this.dbName, 1);

  //     request.onerror = () => reject(request.error);
  //     request.onsuccess = () => {
  //       this.db = request.result;
  //       resolve();
  //     };

  //     request.onupgradeneeded = (event) => {
  //       const db = event.target.result;
  //       if (!db.objectStoreNames.contains(this.storeName)) {
  //         const store = db.createObjectStore(this.storeName, {
  //           keyPath: "trade_id",
  //           autoIncrement: true,
  //         });

  //         // Create indexes based on our schema
  //         store.createIndex("tracked_account_id", "tracked_account_id", {
  //           unique: false,
  //         });
  //         store.createIndex("trade_date", "trade_date", { unique: false });
  //         store.createIndex("ticker_symbol", "ticker_symbol", {
  //           unique: false,
  //         });
  //       }
  //     };
  //   });
  // }

  async addTrade(tradeData) {
    try {
      if (
        //   !tradeData.tracked_account_id ||
        !tradeData.ticker_symbol ||
        !tradeData.direction
      ) {
        throw new Error("Missing required trade data");
      }

      if (this.storageType === "indexeddb") {
        // const transaction = this.storageStrategy.transaction([this.storeName], "readwrite");
        // const store = transaction.objectStore(this.storeName);

        // Add timestamp if not provided
        const trade = {
          ...tradeData,
          created_at: tradeData.created_at || new Date().toISOString(),
        };

        this.trades.unshift(trade);
        await this.saveTrades();
        this.displayTrades();
        showSuccessMessage("Trade added successfully");
      } else {
        // SQLite implementation
        // Send data to test server
      }
    } catch (err) {
      console.error("Error adding trade:", err);
      showErrorMessage(err.message || "Error adding trade");
      throw err;
    }
  }

  async loadTrades() {
    try {
      if (this.storageType === "indexeddb") {
        const loadedTrades = await this.storageStrategy.loadTrades();

        // Convert plain objects back to trade instances to ensure all properties are calculated
        this.trades = loadedTrades.map((trade) =>
          Trade.fromStorageObject(trade)
        );
        this.displayTrades();

        showSuccessMessage("Trades loaded successfully");

        return this.trades;
      } else {
        // PostgreSQL implementation
        throw new Error("PostgreSQL implementation pending");
      }
    } catch (error) {
      console.error("Error loading trades:", error);
      showErrorNotification(
        error.message || "Error loading trades. Please try again."
      );
      throw error;
    }
  }

  async saveTrades(trades = null) {
    try {
      // If trades parameter is provided, update this.trades
      if (trades !== null) {
        this.trades = trades;
      }
      if (this.storageType === "indexeddb") {
        if (!trades) {
          throw new Error("No trades provided");
        }
        await this.storageStrategy.saveTrades(trades);
        console.log("Saving trades:", this.trades);
        console.log(this.storageStrategy);
        showSuccessMessage("Trades saved successfully");
      } else {
        // PostgreSQL implementation
        throw new Error("PostgreSQL implementation pending");
      }
    } catch (error) {
      console.error("Error saving trades:", error);
      showErrorNotification(
        error.message || "Error saving trades. Please try again."
      );
      throw error;
    }
  }

  displayTrades(trades) {
    const tbody = document.querySelector("#tradesTable tbody");
    if (!tbody) return;

    tbody.innerHTML = '';

    // Use provided trades or use this.trades
    const tradesToDisplay = trades || this.trades;
    if (!tradesToDisplay || Array.isArray(tradesToDisplay)) {
      console.log('No trades to display');
      showErrorMessage('No trades to display.');
      return;
    }

    // Sort trades by date (Newest first) and take only the 10 most recent
    const recentTrades = [...tradesToDisplay]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10);

    recentTrades.forEach(tradeCopy => {
      const formattedDate = new Date(tradeCopy.date).toLocaleDateString();
      const tr = document.createElement('tr');

      tr.innerHTML = `
                <td>${formattedDate}</td>
        <td class="symbol">
          <a href="#" class="symbol-link" data-symbol="${tradeCopy.symbol}">${tradeCopy.symbol.toUpperCase()}</a>
        </td>
                <td>
          <span class="direction-badge ${tradeCopy.direction}">
            ${tradeCopy.direction === "long" ? "▲ LONG" : "▼ SHORT"}
                    </span>
                </td>
        <td>${tradeCopy.market}</td>
        <td>${tradeCopy.entryPrice.toFixed(2)}</td>
        <td>${tradeCopy.exitPrice.toFixed(2)}</td>
        <td>${tradeCopy.quantity}</td>
        <td>$${tradeCopy.investment.toFixed(2)}</td>
        <td class="${tradeCopy.profitLoss >= 0 ? "profit" : "loss"}">
          ${tradeCopy.profitLoss >= 0 ? "+" : ""}$${tradeCopy.profitLoss.toFixed(2)}
                    </td>
        <td class="${tradeCopy.profitLoss >= 0 ? "profit" : "loss"}">
          ${tradeCopy.profitLoss >= 0 ? "+" : ""}${tradeCopy.profitLossPercentage.toFixed(2)}%
                </td>
        <td class="notes">${tradeCopy.notes || "-"}</td>
        <td class="actions-cell">
          <button class="edit-trade-btn" data-trade-id="${tradeCopy.id}" title="Edit Trade">
            <i class="fas fa-edit"></i>
          </button>
          <button class="delete-trade-btn" data-trade-id="${tradeCopy.id}" title="Delete Trade">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;

      const deleteBtn = tr.querySelector('.edit-trade-btn');
      deleteBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        if (confirm('Are you sure you want to edit this trade?')) {
          const tradeId = e.currentTarget.getAttribute('data-trade-id');
          await this.deleteTrade(tradeId);
        }
      });

      // Add editBtn event listener
      const editBtn = tr.querySelector('.edit-trade-btn');
      editBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        const tradeId = e.currentTarget.getAttribute('data-trade-id');
        const trade = this.trades.find(t => t.id === tradeId);
        if (trade) {
          const editModal = document.getElementById('editTradeModal');
          const editForm = document.getElementById('editTradeForm');

          // Populate form fields
          document.getElementById('editTradeId').value = trade.id;
          document.getElementById('editDate').value = new Date(trade.date).toISOString().split('T')[0];
          document.getElementById('editSymbol').value = trade.symbol;
          document.getElementById('editDirection').value = trade.direction.charAt(0).toUpperCase() + trade.direction.slice(1);
          document.getElementById('editMarket').value = trade.market;
          document.getElementById('editEntryPrice').value = trade.entryPrice;
          document.getElementById('editExitPrice').value = trade.exitPrice;
          document.getElementById('editQuantity').value = trade.quantity;
          document.getElementById('editNotes').value = trade.notes || '';

          // Show modal
          editModal.style.display = 'block';
        }
      });

      // Add symbol click handler
      const symbolLink = tr.querySelector('.symbol-link');
      symbolLink.addEventListener('click', (e) => {
        e.preventDefault();
        const symbol = e.target.dataset.symbol;
        if (window.tradeModal) {
          window.tradeModal.show(tradeCopy);
        }
      });

      tbody.appendChild(tr);
    });
  }


  async query(criteria) {
    if (this.storageType === "indexeddb") {
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([this.storeName], "readonly");
        const store = transaction.objectStore(this.storeName);
        const results = [];

        // Determine which index to use based on criteria
        let request;
        if (criteria.tracked_account_id) {
          const index = store.index("tracked_account_id");
          request = index.openCursor(
            IDBKeyRange.only(criteria.tracked_account_id)
          );
        } else if (criteria.trade_date) {
          const index = store.index("trade_date");
          request = index.openCursor(IDBKeyRange.only(criteria.trade_date));
        } else {
          request = store.openCursor();
        }

        request.onsuccess = (event) => {
          const cursor = event.target.result;
          if (cursor) {
            // Apply additional filtering based on criteria
            let match = true;
            for (const [key, value] of Object.entries(criteria)) {
              if (cursor.value[key] !== value) {
                match = false;
                break;
              }
            }
            if (match) {
              results.push(cursor.value);
            }
            cursor.continue();
          } else {
            resolve(results);
          }
        };

        request.onerror = () => reject(request.error);
      });
    } else {
      // PostgreSQL implementation
      throw new Error("PostgreSQL implementation pending");
    }
  }

  // Set storage strategy
  async setStorageStrategy(type) {
    try {
      // Normalize storage type to lowercase for case-insensitive comparison
      const normalizedType = type.toLowerCase();

      if (normalizedType === "indexeddb")
        this.storageStrategy = new IndexedDBStrategy();
      else {
        // Default to IndexedDB if storage type is not recognized
        console.warn(
          `Storage type '${type}' not recognized, defaulting to IndexedDB.`
        );
        this.storageStrategy = new IndexedDBStrategy();

        // Update the storage preference to match what we're using.
        localStorage.setItem("storagePreference", "indexedDB");

        // Save the preference
        localStorage.setItem(
          "storagePreference",
          normalizedType === "indexeddb" ? "indexedDB" : type
        );

        // Load trades with new strategy
        await this.loadTrades();
      }
    } catch (error) {
      console.error("Error setting storage strategy:", error);
      // If setting strategy fails, default to IndexedDB
      this.storageStrategy = new IndexedDBStrategy();
      localStorage.setItem("storagePreference", "indexedDB");
    }
  }

  // Helper method to calculate profit/loss
  calculateProfitLoss(trade) {
    if (!trade.exit_price) return null;

    const profitLoss = (trade.exit_price - trade.entry_price) * trade.amount;
    return trade.direction.toLowerCase() === "long" ? profitLoss : -profitLoss;
  }

  async loadTrades() {
    if (this.storageType === "indexeddb") {
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([this.storeName], "readonly");
        const store = transaction.objectStore(this.storeName);
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } else {
      // SQLite implementation
      try {
        const response = await tradeAPI.getAllTrades();
        return response.data;
      } catch (error) {
        console.error("Error fetching trades from SQLite:", error);
        return [];
      }
    }
  }
}

export default TradeObjectHandler;
