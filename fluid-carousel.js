import '@polymer/polymer/polymer-legacy';

import { Polymer } from '@polymer/polymer/lib/legacy/polymer-fn.js';
import { html } from '@polymer/polymer/lib/utils/html-tag.js';

/**
 * `fluid-carousel`
 * A Polymer carousel element designed for flexibility and a fluid interaction
 *
 * @customElement
 * @polymer
 * @demo demo/index.html
 */
Polymer({
  _template: html`
    <style is="custom-style">
      :host {
        display: block;
        overflow: hidden;
        width: 100%;
        height: 100%;
      }

      #container {
        display: flex;
      }

      #container ::slotted(*){
        width: var(--item-width, 100%);
        margin: var(--item-margin, 0);
        flex-shrink: 0;
      }
    </style>

    <div id="container">
      <slot></slot>
    </div>
  `,

  is: 'fluid-carousel',

  properties: {
    _selected: {
      type: Object,
      observer: '_selectedChanged'
    },
    _selectedIndex: {
      type: Number,
      value: 0
    },
    _itemStyles: {
      type: Object,
      value: {
        width: Number,
        sideMargins: Number
      }
    }
  },


  /** LIFECYCLE METHODS
   * ================================ */
  ready: function() {
    this.addEventListener('dom-change', this._forceDomRepeatSelect.bind(this));
    requestAnimationFrame(this._setup.bind(this));
  },

  attached: function() {
    this._adjustLayout();
  },


  /** PRIVATE METHODS
   * ================================ */
  _setup: function() {
    this._resetSelected();
    this._installListeners();
  },

  _selectedChanged: function(selected, oldSelected) {
    if (oldSelected) oldSelected.removeAttribute('selected');
    if (selected) {
      selected.setAttribute('selected', '');
      this.fire('selected-changed', { index: this._selectedIndex });
    }
  },

  _clearAnimationStyles: function(e) {
    e.target.style.transition = '';
  },

  _touchstart: function(e) {
    if (!this._swipeDir) {
      this._touchStartX = e.changedTouches[0].clientX;
      this._touchStartY = e.changedTouches[0].clientY;
    }
  },

  _touchmove: function(e) {
    if (!this._swipeDir) {
      var absX = Math.abs(e.changedTouches[0].clientX - this._touchStartX);
      var absY = Math.abs(e.changedTouches[0].clientY - this._touchStartY);
      this._swipeDir = absX > absY ? 'x' : 'y';
    }

    if (this._swipeDir === 'x') {
      e.preventDefault();
      this._dx = Math.round(e.changedTouches[0].clientX - this._touchStartX);
      this._translate(this.$.container, this._dx + this._currentOffset);
    }
  },

  _touchend: function(e) {
    if (this._swipeDir === 'x') {
      if (this._dx > 100 && this._selected.previousElementSibling) {
        this.previous();
      } else if (this._dx < -100 && this._selected.nextElementSibling && this._selected.nextElementSibling.is !== 'dom-repeat') {
        this.next();
      } else {
        this._translate(this.$.container, this._currentOffset, true);
      }
    }

    this._swipeDir = null;
  },

  _installListeners: function() {
    this.addEventListener('transitionend', this._clearAnimationStyles);
    this.addEventListener('touchstart', this._touchstart.bind(this));
    this.addEventListener('touchmove', this._touchmove.bind(this));
    this.addEventListener('touchend', this._touchend.bind(this));
    window.addEventListener('resize', this._adjustLayout.bind(this));
  },

  _resetSelected: function() {
    if ( (!this._selected && this.$.container.firstElementChild && this.$.container.firstElementChild.is !== 'dom-repeat')
          || (this._selected && this._selected.parentElement !== this)) {
      this._selectedIndex = 0;
      this.set('_selected', this.$.container.firstElementChild);
    }
  },

  _adjustLayout: function() {
    var elementStyles = getComputedStyle(this);
    var elementWidth = elementStyles.width.indexOf('%') > -1
      ? 0.01*parseFloat(elementStyles.width)*window.innerWidth
      : parseFloat(elementStyles.width);

    var itemStyles = getComputedStyle(this.$.container.firstElementChild);
    this._itemStyles.width = itemStyles.width.indexOf('%') > -1
      ? 0.01*parseFloat(itemStyles.width)*elementWidth
      : parseFloat(itemStyles.width);
    this._itemStyles.sideMargin = parseFloat(itemStyles.marginLeft);

    this._currentOffset = (elementWidth - this._itemStyles.width)/2.0
      - this._selectedIndex *(this._itemStyles.width + 2*this._itemStyles.sideMargin)
      - this._itemStyles.sideMargin;

    this.$.container.style.transform = 'translateX('+this._currentOffset +'px)';
  },

  _translate: function(elem, dx, withTransition) {
    requestAnimationFrame( function() {
      elem.style.transition = withTransition ? 'transform 0.4s' : '';
      elem.style.transform = 'translateX(' + dx + 'px)';
    });
  },

  _forceDomRepeatSelect: function(e) {
    if (e.target.is === 'dom-repeat') {
      this.removeEventListener('dom-change', this._forceDomRepeatSelect);
      requestAnimationFrame(this._resetSelected.bind(this));
    }
  },


  /** PUBLIC API
   * ================================ */
  previous: function() {
    var elem = this._selected && this._selected.previousElementSibling;
    if (elem) {
      this._selectedIndex--;
      this.set('_selected', elem);
      this._currentOffset = this._currentOffset + this._itemStyles.width + 2*this._itemStyles.sideMargin;
      this._translate(this.$.container, this._currentOffset, true);
    }

    return this.getSelectedIndex();
  },

  next: function() {
    var elem = this._selected && this._selected.nextElementSibling;
    if (elem && this._selected.nextElementSibling.is !== 'dom-repeat') {
      this._selectedIndex++;
      this.set('_selected', elem);
      this._currentOffset = this._currentOffset - this._itemStyles.width  - 2*this._itemStyles.sideMargin;
      this._translate(this.$.container, this._currentOffset, true);
    }

    return this.getSelectedIndex();
  },

  getSelectedIndex: function() {
    return this._selectedIndex;
  },

  getSelected: function() {
    return this._selected;
  },

  reset: function() {
    this._resetSelected();
    this._adjustLayout();
  }
});
