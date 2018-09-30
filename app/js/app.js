'use strict';

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
    currentId: 0,
    idList: [],
    formDisabled: true,
    name: '',
    html: '',
    css: '',
    selectedName: '',
    htmlSource: 'data:text/html; charset=utf-8,',
    snippetList: [],
    currentIndex: 0
  },
  created: function () {
    const tempIdList = localStorage.getItem('idList');
    this.idList = tempIdList ? JSON.parse(tempIdList) : [];

    this.idList.forEach(value => {
      const snippet = JSON.parse(localStorage.getItem(value));
      this.snippetList.push({
        id: value,
        name: snippet.name,
        selected: false
      });
    });
  },
  methods: {
    newSnippet: function () {
      this.formDisabled = false;

      this.currentId = parseInt(localStorage.getItem('nextId'), 10) || 0;
      this.idList.push(this.currentId);

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

      localStorage.setItem('nextId', this.currentId + 1);
      localStorage.setItem('idList', JSON.stringify(this.idList));
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
        name: this.name ? this.name : NEW_SNIPPET,
        html: this.html,
        css: this.css
      };
      localStorage.setItem(this.currentId, JSON.stringify(saveData));
    },
    clearSelected: function () {
      this.snippetList.forEach(value => {
        value.selected = false;
      });
    },
    onSelectSnippet: function (id) {
      this.clearSelected();
      this.snippetList.forEach((value, index) => {
        if (value.id === id) {
          this.currentIndex = index;
        }
      });
      this.snippetList[this.currentIndex].selected = true;

      const snippet = JSON.parse(localStorage.getItem(id));
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
          localStorage.removeItem(value.id);
        }
      });
      this.idList.forEach((value, index) => {
        if (value === this.currentId) {
          this.idList.splice(index, 1);
          localStorage.setItem('idList', JSON.stringify(this.idList));
        }
      });
      this.name = '';
      this.html = '';
      this.css = '';
      this.formDisabled = true;
    }
  }
});
