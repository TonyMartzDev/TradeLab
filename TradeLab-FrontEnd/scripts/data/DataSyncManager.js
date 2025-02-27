import UserObjectHandler from './UserObjectHandler.js';
import AccountObjectHandler from './AccountObjectHandler.js';
import TrackedAccountObjectHandler from './TrackedAccountObjectHandler.js';
import TradeObjectHandler from './TradeObjectHandler.js';
import SettingsObjectHandler from './SettingsObjectHandler.js';

class DataSyncManager {
    constructor() {
        this.handlers = {
            users: new UserObjectHandler('indexeddb'),
            accounts: new AccountObjectHandler('indexeddb'),
            tracked_accounts: new TrackedAccountObjectHandler('indexeddb'),
            trades: new TradeObjectHandler('indexeddb'),
            settings: new SettingsObjectHandler('indexeddb')
        };

        this.cloudHandlers = {
            users: new UserObjectHandler('postgres'),
            accounts: new AccountObjectHandler('postgres'),
            tracked_accounts: new TrackedAccountObjectHandler('postgres'),
            trades: new TradeObjectHandler('postgres'),
            settings: new SettingsObjectHandler('postgres')
        };

        // Track sync status
        this.syncStatus = {
            lastSync: null,
            inProgress: false,
            error: null
        };
    }

    async init() {
        // Initialize all handlers
        for (const handler of Object.values(this.handlers)) {
            await handler.init();
        }
        for (const handler of Object.values(this.cloudHandlers)) {
            await handler.init();
        }
    }

    async syncToCloud(userId) {
        if (this.syncStatus.inProgress) {
            throw new Error('Sync already in progress');
        }

        this.syncStatus.inProgress = true;
        this.syncStatus.error = null;

        try {
            // Sync user data
            await this._syncEntity('users', userId);

            // Sync accounts
            const accounts = await this.handlers.accounts.getAccountsByUserId(userId);
            for (const account of accounts) {
                await this._syncEntity('accounts', account.account_id);

                // Sync tracked accounts for each account
                const trackedAccounts = await this.handlers.tracked_accounts.getTrackedAccountsByAccountId(account.account_id);
                for (const trackedAccount of trackedAccounts) {
                    await this._syncEntity('tracked_accounts', trackedAccount.tracked_account_id);

                    // Sync trades for each tracked account
                    const trades = await this.handlers.trades.getTradesByTrackedAccountId(trackedAccount.tracked_account_id);
                    for (const trade of trades) {
                        await this._syncEntity('trades', trade.trade_id);
                    }
                }
            }

            // Sync settings
            const settings = await this.handlers.settings.getUserSettings(userId);
            for (const setting of settings) {
                await this._syncEntity('settings', setting.setting_id);
            }

            this.syncStatus.lastSync = new Date().toISOString();
            this.syncStatus.inProgress = false;
        } catch (error) {
            this.syncStatus.error = error.message;
            this.syncStatus.inProgress = false;
            throw error;
        }
    }

    async _syncEntity(entityType, id) {
        const localData = await this.handlers[entityType].read(id);
        if (!localData) return;

        try {
            await this.cloudHandlers[entityType].update(id, localData);
        } catch (error) {
            if (error.message.includes('not found')) {
                await this.cloudHandlers[entityType].create(localData);
            } else {
                throw error;
            }
        }
    }

    async syncFromCloud(userId) {
        if (this.syncStatus.inProgress) {
            throw new Error('Sync already in progress');
        }

        this.syncStatus.inProgress = true;
        this.syncStatus.error = null;

        try {
            // Sync user data
            const userData = await this.cloudHandlers.users.read(userId);
            if (userData) {
                await this.handlers.users.update(userId, userData);
            }

            // Sync accounts
            const accounts = await this.cloudHandlers.accounts.getAccountsByUserId(userId);
            for (const account of accounts) {
                await this._syncEntityFromCloud('accounts', account.account_id);

                // Sync tracked accounts
                const trackedAccounts = await this.cloudHandlers.tracked_accounts.getTrackedAccountsByAccountId(account.account_id);
                for (const trackedAccount of trackedAccounts) {
                    await this._syncEntityFromCloud('tracked_accounts', trackedAccount.tracked_account_id);

                    // Sync trades
                    const trades = await this.cloudHandlers.trades.getTradesByTrackedAccountId(trackedAccount.tracked_account_id);
                    for (const trade of trades) {
                        await this._syncEntityFromCloud('trades', trade.trade_id);
                    }
                }
            }

            // Sync settings
            const settings = await this.cloudHandlers.settings.getUserSettings(userId);
            for (const setting of settings) {
                await this._syncEntityFromCloud('settings', setting.setting_id);
            }

            this.syncStatus.lastSync = new Date().toISOString();
            this.syncStatus.inProgress = false;
        } catch (error) {
            this.syncStatus.error = error.message;
            this.syncStatus.inProgress = false;
            throw error;
        }
    }

    async _syncEntityFromCloud(entityType, id) {
        const cloudData = await this.cloudHandlers[entityType].read(id);
        if (!cloudData) return;

        try {
            await this.handlers[entityType].update(id, cloudData);
        } catch (error) {
            if (error.message.includes('not found')) {
                await this.handlers[entityType].create(cloudData);
            } else {
                throw error;
            }
        }
    }

    getSyncStatus() {
        return { ...this.syncStatus };
    }

    // Helper method to determine if we're online
    async isOnline() {
        return navigator.onLine;
    }
}

// Create a singleton instance
const dataSyncManager = new DataSyncManager();
export default dataSyncManager;
