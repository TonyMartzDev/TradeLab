import BaseDataHandler from './BaseDataHandler.js';
import postgresConnection from './PostgresConnection.js';

class SettingsObjectHandler extends BaseDataHandler {
    constructor(storageType = 'indexeddb') {
        super(storageType);
        this.dbName = 'TradeLabDB';
        this.storeName = 'settings';
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
                    const store = db.createObjectStore(this.storeName, { keyPath: 'setting_id', autoIncrement: true });
                    store.createIndex('user_id', 'user_id', { unique: false });
                    store.createIndex('setting_name', 'setting_name', { unique: false });
                }
            };
        });
    }

    async initPostgres() {
        try {
            await postgresConnection.connect();
        } catch (error) {
            console.error('Failed to initialize PostgreSQL connection:', error);
            throw error;
        }
    }

    async create(settingData) {
        if (!settingData.user_id || !settingData.setting_name || settingData.setting_value === undefined) {
            throw new Error('Missing required setting data');
        }

        if (this.storageType === 'indexeddb') {
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([this.storeName], 'readwrite');
                const store = transaction.objectStore(this.storeName);
                const request = store.add(settingData);
                
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        } else {
            const query = `
                INSERT INTO settings (user_id, setting_name, setting_value)
                VALUES ($1, $2, $3)
                RETURNING setting_id
            `;
            const values = [
                settingData.user_id,
                settingData.setting_name,
                JSON.stringify(settingData.setting_value)
            ];
            const result = await postgresConnection.query(query, values);
            return result.rows[0].setting_id;
        }
    }

    async read(settingId) {
        if (this.storageType === 'indexeddb') {
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([this.storeName], 'readonly');
                const store = transaction.objectStore(this.storeName);
                const request = store.get(settingId);
                
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        } else {
            const query = 'SELECT * FROM settings WHERE setting_id = $1';
            const result = await postgresConnection.query(query, [settingId]);
            if (result.rows[0]) {
                result.rows[0].setting_value = JSON.parse(result.rows[0].setting_value);
            }
            return result.rows[0] || null;
        }
    }

    async update(settingId, settingData) {
        if (this.storageType === 'indexeddb') {
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([this.storeName], 'readwrite');
                const store = transaction.objectStore(this.storeName);
                
                const getRequest = store.get(settingId);
                getRequest.onsuccess = () => {
                    const existingSetting = getRequest.result;
                    if (!existingSetting) {
                        reject(new Error('Setting not found'));
                        return;
                    }

                    const updatedSetting = {
                        ...existingSetting,
                        ...settingData,
                        setting_id: settingId
                    };

                    const updateRequest = store.put(updatedSetting);
                    updateRequest.onsuccess = () => resolve(updateRequest.result);
                    updateRequest.onerror = () => reject(updateRequest.error);
                };
            });
        } else {
            if (settingData.setting_value !== undefined) {
                settingData.setting_value = JSON.stringify(settingData.setting_value);
            }
            
            const setClause = Object.keys(settingData)
                .map((key, index) => `${key} = $${index + 2}`)
                .join(', ');
            const query = `UPDATE settings SET ${setClause} WHERE setting_id = $1 RETURNING setting_id`;
            const values = [settingId, ...Object.values(settingData)];
            
            const result = await postgresConnection.query(query, values);
            return result.rows[0].setting_id;
        }
    }

    async delete(settingId) {
        if (this.storageType === 'indexeddb') {
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([this.storeName], 'readwrite');
                const store = transaction.objectStore(this.storeName);
                const request = store.delete(settingId);
                
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        } else {
            const query = 'DELETE FROM settings WHERE setting_id = $1';
            await postgresConnection.query(query, [settingId]);
        }
    }

    async getUserSettings(userId) {
        if (this.storageType === 'indexeddb') {
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([this.storeName], 'readonly');
                const store = transaction.objectStore(this.storeName);
                const index = store.index('user_id');
                const request = index.getAll(userId);
                
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        } else {
            const query = 'SELECT * FROM settings WHERE user_id = $1';
            const result = await postgresConnection.query(query, [userId]);
            return result.rows.map(row => ({
                ...row,
                setting_value: JSON.parse(row.setting_value)
            }));
        }
    }

    async getSetting(userId, settingName) {
        if (this.storageType === 'indexeddb') {
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([this.storeName], 'readonly');
                const store = transaction.objectStore(this.storeName);
                const index = store.index('setting_name');
                const request = index.get(settingName);
                
                request.onsuccess = () => {
                    const setting = request.result;
                    resolve(setting && setting.user_id === userId ? setting : null);
                };
                request.onerror = () => reject(request.error);
            });
        } else {
            const query = 'SELECT * FROM settings WHERE user_id = $1 AND setting_name = $2';
            const result = await postgresConnection.query(query, [userId, settingName]);
            if (result.rows[0]) {
                result.rows[0].setting_value = JSON.parse(result.rows[0].setting_value);
            }
            return result.rows[0] || null;
        }
    }
}

export default SettingsObjectHandler;
