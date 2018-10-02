'use strict';

const NEW_SNIPPET = '新規スニペット';

const SnippetItem = {
  template: `<li v-bind:id="snippet.id"
                 v-bind:class="{ active: snippet.selected }"
                 @click="onClickSnippet"
                 @contextmenu="onContextMenu">{{ snippet.name || '新規スニペット' }}</li>`,
  props: {
    snippet: Object
  },
  date: function() {
    return {
      menu: {},
      remote: {}
    }
  },
  created: function() {
    // コンテキストメニュー
    this.remote = require('electron').remote;
    const {Menu, MenuItem} = this.remote;

    this.menu = new Menu();
    this.menu.append(new MenuItem({
      label: 'このスニペットを削除',
      click: () => {
        this.$emit('delete-snippet', this.snippet.id);
      }
    }));
  },
  methods: {
    onContextMenu: function(event) {
      event.preventDefault();
      this.menu.popup(this.remote.getCurrentWindow());
    },
    onClickSnippet: function() {
      this.$emit('select-snippet', this.snippet.id);
    }
  }
};

new Vue({
  el: '#app',
  components: {
    'snippet-item': SnippetItem,
    editor:require('vue2-ace-editor'),
  },
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
    currentIndex: 0,
    remote: {},
    menu: {},
    htmlOptions: {
      fontSize: 16,
      tabSize: 1
    },
    cssOptions: {
      fontSize: 16,
      tabSize: 2
    }
  },
  created: async function() {
    this.db = await DbUtil.init(db => {
      db.createObjectStore('next_id', {keyPath: 'id'});
      db.createObjectStore('snippet', {keyPath: 'id'});
    });

    const list = await DbUtil.readAll(this.db, 'snippet');
    list.forEach(value => {
      value.selected = false;
      this.snippetList.push(value);
    });

    this.remote = require('electron').remote;
    const {Menu} = this.remote;
    this.menu = Menu.buildFromTemplate([
      {role:'copy'},
      {role:'cut'},
      {role:'paste'},
    ]);
  },
  methods: {
    htmlEditorInit:function () {
      require('brace/mode/html');
      require('brace/theme/chrome');
    },
    javascriptEditorInit:function () {
      require('brace/mode/css');
      require('brace/theme/chrome');
    },
    newSnippet: async function() {
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

      await DbUtil.put(this.db, 'next_id', {id: 0, next_id: this.currentId + 1});
    },
    inputForm: function() {
      this.snippetList[this.currentIndex].name = this.name;
      this.htmlSource = `data:text/html; charset=utf-8,${this.html}<style>${this.css}</style>`;
      this.saveSnippet();
    },
    onFocusName: function(event) {
      const text = event.currentTarget.value;
      if (text === NEW_SNIPPET) {
        event.currentTarget.select(0, NEW_SNIPPET.length);
      }
    },
    saveSnippet: async function() {
      const saveData = {
        id: this.currentId,
        name: this.name ? this.name : NEW_SNIPPET,
        html: this.html,
        css: this.css
      };
      await DbUtil.put(this.db, 'snippet', saveData);
    },
    clearSelected: function() {
      this.snippetList.forEach(value => {
        value.selected = false;
      });
    },
    onSelectSnippet: async function(id) {
      this.clearSelected();
      this.currentIndex = this.snippetList.findIndex(element => {
        return element.id === id;
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
    onDeleteSnippet: async function(id) {
      if (!confirm('このデータを削除しますか？')) return;

      const deleteIndex = this.snippetList.findIndex(element => {
        return element.id === id;
      });
      this.snippetList.splice(deleteIndex, 1);
      await DbUtil.deleteOne(this.db, 'snippet', id);
    },
    onClickDeleteButton: async function() {
      if (!confirm('このデータを削除しますか？')) return;

      const deleteIndex = this.snippetList.findIndex(element => {
        return element.id === this.currentId;
      });
      this.snippetList.splice(deleteIndex, 1);
      await DbUtil.deleteOne(this.db, 'snippet', this.currentId);
      this.name = '';
      this.html = '';
      this.css = '';
      this.formDisabled = true;
    },
    onContextMenu: function () {
      event.preventDefault();
      this.menu.popup(this.remote.getCurrentWindow());
    }
  }
});
