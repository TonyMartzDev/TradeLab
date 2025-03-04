import BaseDataHandler from "./BaseDataHandler.js";
import { tradeAPI } from "../api.js";

class TradeObjectHandler extends BaseDataHandler {
  constructor(storageType = "indexeddb") {
    super(storageType);
    this.dbName = "TradeLabDB";
    this.storeName = "trades";
    this.db = null;
  }

  async initIndexedDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, {
            keyPath: "trade_id",
            autoIncrement: true,
          });

          // Create indexes based on our schema
          store.createIndex("tracked_account_id", "tracked_account_id", {
            unique: false,
          });
          store.createIndex("trade_date", "trade_date", { unique: false });
          store.createIndex("ticker_symbol", "ticker_symbol", {
            unique: false,
          });
        }
      };
    });
  }

  async create(tradeData) {
    if (
      //   !tradeData.tracked_account_id ||
      !tradeData.ticker_symbol ||
      !tradeData.direction
    ) {
      throw new Error("Missing required trade data");
    }

    if (this.storageType === "indexeddb") {
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([this.storeName], "readwrite");
        const store = transaction.objectStore(this.storeName);

        // Add timestamp if not provided
        const trade = {
          ...tradeData,
          created_at: tradeData.created_at || new Date().toISOString(),
        };

        const request = store.add(trade);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } else {
      // SQLite implementation
      // Send data to test server
    }
  }

  async read(tradeId) {
    if (this.storageType === "indexeddb") {
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([this.storeName], "readonly");
        const store = transaction.objectStore(this.storeName);
        const request = store.get(tradeId);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } else {
      // PostgreSQL implementation
      throw new Error("PostgreSQL implementation pending");
    }
  }

  async update(tradeId, tradeData) {
    if (this.storageType === "indexeddb") {
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([this.storeName], "readwrite");
        const store = transaction.objectStore(this.storeName);

        // First get existing trade
        const getRequest = store.get(tradeId);

        getRequest.onsuccess = () => {
          const existingTrade = getRequest.result;
          if (!existingTrade) {
            reject(new Error("Trade not found"));
            return;
          }

          // Update trade with new data
          const updatedTrade = {
            ...existingTrade,
            ...tradeData,
            trade_id: tradeId, // Ensure ID doesn't change
          };

          const updateRequest = store.put(updatedTrade);
          updateRequest.onsuccess = () => resolve(updateRequest.result);
          updateRequest.onerror = () => reject(updateRequest.error);
        };

        getRequest.onerror = () => reject(getRequest.error);
      });
    } else {
      // PostgreSQL implementation
      throw new Error("PostgreSQL implementation pending");
    }
  }

  async delete(tradeId) {
    if (this.storageType === "indexeddb") {
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([this.storeName], "readwrite");
        const store = transaction.objectStore(this.storeName);
        const request = store.delete(tradeId);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } else {
      // PostgreSQL implementation
      throw new Error("PostgreSQL implementation pending");
    }
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

  // Helper method to calculate profit/loss
  calculateProfitLoss(trade) {
    if (!trade.exit_price) return null;

    const profitLoss = (trade.exit_price - trade.entry_price) * trade.amount;
    return trade.direction.toLowerCase() === "long" ? profitLoss : -profitLoss;
  }

  async getAll() {
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
