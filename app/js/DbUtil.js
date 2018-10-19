'use strict';

class DbUtil {
  static dispErrorMessage(message, event) {
    return `${message}
${event.target.error.name}
${event.target.error.message}`
  }

  static init(callback) {
    return new Promise(function (resolve, reject) {
      const request = window.indexedDB.open('snippet', 1);
      request.onupgradeneeded = event => callback(event.target.result);
      request.onsuccess = event => resolve(event.target.result);
      request.onerror = event => reject(DbUtil.dispErrorMessage('DbUtil.init', event));
    });
  }

  static readOne(db, storeName, id) {
    const objectStore = db.transaction(storeName, 'readonly').objectStore(storeName);

    return new Promise(function (resolve, reject) {
      const request = objectStore.get(id);

      request.onsuccess = event => resolve(event.target.result);
      request.onerror = event => resolve(null);
    });
  }

  static readAll(db, storeName) {
    const objectStore = db.transaction(storeName, 'readonly').objectStore(storeName);

    const resultArray = [];

    return new Promise(function (resolve, reject) {
      const range = IDBKeyRange.lowerBound(0);
      const cursorRequest = objectStore.openCursor(range);
      cursorRequest.onsuccess = event => {
        const result = event.target.result;
        if (!result) {
          resolve(resultArray);
          return;
        }
        resultArray.push(result.value);
        result.continue();
      };
      cursorRequest.onerror = event => resolve(resultArray);
    });
  }

  static put(db, storeName, data) {
    const tx = db.transaction(storeName, 'readwrite');
    const objectStore = tx.objectStore(storeName);

    return new Promise(function (resolve, reject) {
      const request = objectStore.put(data);

      request.onsuccess = event => {};
      tx.oncomplete = event => resolve();

      request.onerror = event => reject(DbUtil.dispErrorMessage('DbUtil.put', event));
      tx.onerror = event => reject(DbUtil.dispErrorMessage('DbUtil.put', event));
    });
  }

  static deleteOne(db, storeName, key) {
    const objectStore = db.transaction(storeName, "readwrite").objectStore(storeName);

    return new Promise(function (resolve, reject) {
      const request = objectStore.delete(key);
      request.onsuccess = event => resolve();
      request.onerror = event =>  reject(DbUtil.dispErrorMessage('DbUtil.deleteOne', event));
    });
  }
}
