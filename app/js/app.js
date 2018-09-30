'use strict';

class DbUtil {
  static init(callback) {
    return new Promise(function (resolve, reject) {
      const request = window.indexedDB.open('snippet', 1);
      request.onupgradeneeded = event => {
        const db = event.target.result;
        callback(db);
      };
      request.onsuccess = event => {
        resolve(event.target.result);
      };
    });
  }

  static readOne(db, storeName, id) {
    const objectStore = db.transaction(storeName, 'readonly').objectStore(storeName);

    return new Promise(function (resolve, reject) {
      const request = objectStore.get(id);

      request.onsuccess = (event) => {
        resolve(event.target.result);
      };
      request.onerror = (event) => {
        resolve(null);
      }
    });
  }

  static readAll(db, storeName) {
    const objectStore = db.transaction(storeName, 'readonly').objectStore(storeName);

    const resultArray = [];

    return new Promise(function (resolve, reject) {
      const range = IDBKeyRange.lowerBound(0);
      const cursorRequest = objectStore.openCursor(range);
      cursorRequest.onsuccess = function (event) {
        const result = event.target.result;
        if (!result) {
          resolve(resultArray);
          return;
        }
        resultArray.push(result.value);
        result.continue();
      };
      cursorRequest.onerror = error => {
        resolve(resultArray);
      };
    });
  }

  static put(db, storeName, data) {
    const tx = db.transaction(storeName, 'readwrite');
    const objectStore = tx.objectStore(storeName);

    return new Promise(function (resolve, reject) {
      const request = objectStore.put(data);

      request.onsuccess = function () {
      };

      tx.oncomplete = function () {
        resolve();
      };
    });
  }

  static deleteOne(db, storeName, key) {
    const objectStore = db.transaction(storeName, "readwrite").objectStore(storeName);

    return new Promise(function (resolve, reject) {
      const request = objectStore.delete(key);

      request.onsuccess = function (event) {
        resolve();
      };
    });
  }

}

const NEW_SNIPPET = '新規スニペット';

Vue.component('snippet-item', {
  template: `<li v-bind:id="snippet.id"
                 v-bind:class="{ selected: snippet.selected }"
                 @click="onClickSnippet">{{ snippet.name || '新規スニペット' }}</li>`,
  props: {
    snippet: {}
  },
  methods: {
    onClickSnippet: function () {
      this.$emit('select-snippet', this.snippet.id);
    }
  }
});

var app = new Vue({
  el: '#app',
  data: {
    db: {},
    currentId: 0,
    formDisabled: true,
    name: '',
    html: '',
    css: '',
    selectedName: '',
    htmlSource: 'data:text/html; charset=utf-8,',
    snippetList: [],
    currentIndex: 0
  },
  created: async function () {
    this.db = await DbUtil.init((db) => {
      db.createObjectStore('next_id', {keyPath: 'id'});
      db.createObjectStore('snippet', {keyPath: 'id'});
    });

    const list = await DbUtil.readAll(this.db, 'snippet');
    list.forEach(value => {
      value.selected = false;
      this.snippetList.push(value);
    });
  },
  methods: {
    newSnippet: async function () {
      this.formDisabled = false;

      const nextId = await DbUtil.readOne(this.db, 'next_id', 0);
      this.currentId = nextId ? nextId.next_id : 0;

      this.clearSelected();

      this.name = NEW_SNIPPET;
      this.html = '';
      this.css = '';

      this.snippetList.push({
        id: this.currentId,
        name: this.name,
        selected: true
      });
      this.currentIndex = this.snippetList.length - 1;

      this.inputForm();

      DbUtil.put(this.db, 'next_id', {id: 0, next_id: this.currentId + 1});
    },
    inputForm: function () {
      this.snippetList[this.currentIndex].name = this.name;
      this.htmlSource = `data:text/html; charset=utf-8,${this.html}<style>${this.css}</style>`;
      this.saveSnippet();
    },
    onFocusName: function (event) {
      const text = event.currentTarget.value;
      if (text === NEW_SNIPPET) {
        event.currentTarget.select(0, NEW_SNIPPET.length);
      }
    },
    saveSnippet: function () {
      const saveData = {
        id: this.currentId,
        name: this.name ? this.name : NEW_SNIPPET,
        html: this.html,
        css: this.css
      };
      DbUtil.put(this.db, 'snippet', saveData);
    },
    clearSelected: function () {
      this.snippetList.forEach(value => {
        value.selected = false;
      });
    },
    onSelectSnippet: async function (id) {
      this.clearSelected();
      this.snippetList.forEach((value, index) => {
        if (value.id === id) {
          this.currentIndex = index;
        }
      });
      this.snippetList[this.currentIndex].selected = true;

      const snippet = await DbUtil.readOne(this.db, 'snippet', id);
      this.formDisabled = false;
      this.currentId = id;
      this.name = snippet.name;
      this.html = snippet.html;
      this.css = snippet.css;
      this.inputForm();
    },
    onClickDeleteButton: function () {
      if (!confirm('このデータを削除しますか？')) return;
      this.snippetList.forEach((value, index) => {
        if (value.id === this.currentId) {
          this.snippetList.splice(index, 1);
          DbUtil.deleteOne(this.db, 'snippet', this.currentId);
        }
      });
      this.name = '';
      this.html = '';
      this.css = '';
      this.formDisabled = true;
    }
  }
});
