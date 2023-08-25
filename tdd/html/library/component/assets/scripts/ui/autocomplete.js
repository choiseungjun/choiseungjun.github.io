/**
 * @module vcui.ui.AutoComplete
 * @description 자동완성 컴포넌트
 */

(function ($, core, undefined) {
    "use strict";

    var $win = $(window),
        $doc = $(document);


    var Autocomplete = core.ui('Autocomplete', {
        bindjQuery: 'autocomplete',
        defaults: {
            minLen : 1 // 최소 입력글자수
        },
        selectors: {
            keywordList: "",
            keywordClass: ""
        },
        initialize: function (el, options) {
            var self = this;

            if (self.supr(el, options) === false) {
                return;
            }

            self.minLen = self.options.minLen;
            self.keywordListArr = [];

            var list = self.options.list || self.$el.data('list');

            if(core.is(list, 'string')) {
                try {
                    self.keywordListArr = ( new Function( 'return ' + list ) )();;
                } catch (e){ self.keywordListArr = []; }

            }else if(core.is(list,'array')){
                self.keywordListArr = list;
            }

            var url = self.options.url || self.$el.data('url');
            if (url) self.ajaxUrl = url;

            self._build();
            self._bindEvents();
        },

        _build: function () {
            var self = this;
            var top = self.$el.position().top + self.$el.outerHeight();
            var left = self.$el.position().left;
            var minWidth = self.$el.outerWidth();
            var style = "";

            if (self.options.keywordClass) {
                style = "style='position:absolute; min-width:" +
                    minWidth + "px; left:" + left + "px; top:" + top +
                    "px;'" + " class='" + self.options.keywordClass + "'";
            } else {
                style = "style='position:absolute; background-color:#ffffff; min-width:" +
                    minWidth + "px; left:" + left + "px; top:" + top + "px;";
            }

            if (!self.$keywordList.length) {
                var cid = "ui_keyword_list_" + self.cid.toLowerCase();
                self.$el.after("<div id='" + cid + "'" + style + "'><ul></ul></div>");
                self.$keywordList = $("#" + cid);
            } else {
                self.$keywordList.attr('style', style);
            }

            self.$keywordList.css('display', 'none');
        },

        _bindEvents: function () {
            var self = this;
            var keyBlockArr = [
                core.keyCode.UP,
                core.keyCode.LEFT,
                core.keyCode.DOWN,
                core.keyCode.RIGHT,
                core.keyCode.END,
                core.keyCode.HOME,
                core.keyCode.ENTER,
                core.keyCode.ESCAPE
            ];

            if (core.detect.isGecko) {
                // 파폭에서는 한글키 입력시에 키이벤트가 발생안되는 버그가 있어서 타이머를 돌려서 강제를 이벤트를 발생
                self._forceKeyup();
            }



            self.on('focusout', function (e) {

                self.closeTimer = setTimeout(function () {
                    self._close();
                }, 100);

            }).on('keyup paste cut focusin', function (e) {

                if (e.type == 'keyup' && core.array.include(keyBlockArr, e.keyCode)) return;
                if (self.oldKeyword == this.value) return;

                self.oldKeyword = this.value;
                clearTimeout(self.closeTimer);

                if (self.ajaxUrl) {
                    self._loadKeywords(this.value);
                } else {
                    self._renderKeywords(this.value, self.keywordListArr);
                }
            }).on('keydown', function (e) {
                switch (e.keyCode) {
                    case core.keyCode.UP:
                        e.preventDefault();
                        self._selectItem('up');
                        break;
                    case core.keyCode.DOWN:
                        e.preventDefault();
                        self._selectItem('down');
                        break;
                    case core.keyCode.ESC:
                        e.preventDefault();
                        self._close();
                        break;
                    case core.keyCode.ENTER:
                        e.preventDefault();
                        self._close();
                        self.$el.triggerHandler('autocompleteenter');
                        break;

                }
            });

            self.$keywordList.on('focusin focusout', function(e) {
                if (e.type === 'focusin'){
                    clearTimeout(self.closeTimer);
                } else {
                    self.closeTimer = setTimeout(function () {
                        self._close();
                    }, 100);
                }
            });

        },



        _forceKeyup: function () {
            // 파이어폭스에서 한글을 입력할 때 keyup이벤트가 발생하지 않는 버그가 있어서
            // 타이머로 value값이 변경된걸 체크해서 강제로 keyup 이벤트를 발생시켜 주어야 한다.
            var self = this,
                nowValue,
                win = window,
                doc = document,

                // keyup 이벤트 발생함수: 크로스브라우징 처리
                fireEvent = (function () {
                    if (doc.createEvent) {
                        // no ie
                        return function (oldValue) {
                            var e;
                            if (win.KeyEvent) {
                                e = doc.createEvent('KeyEvents');
                                e.initKeyEvent('keyup', true, true, win, false, false, false, false, 65, 0);
                            } else {
                                e = doc.createEvent('UIEvents');
                                e.initUIEvent('keyup', true, true, win, 1);
                                e.keyCode = 65;
                            }
                            self.$el[0].dispatchEvent(e);
                        };
                    } else {
                        // ie: :(
                        return function (oldValue) {
                            var e = doc.createEventObject();
                            e.keyCode = 65;
                            self.$el[0].fireEvent('onkeyup', e);
                        };
                    }
                })();

            var timer = null;
            self.on('focusin', function () {
                if (timer) {
                    return;
                }
                var el = this;
                self.intervalTimer = timer = setInterval(function () {
                    nowValue = el.value;
                    if (self.oldKeyword !== nowValue) {
                        self.oldKeyword = nowValue;
                        fireEvent();
                    }
                }, 60);
            }).on('focuout', function () {
                if (timer) {
                    clearInterval(timer);
                    timer = null;
                }
            });
        },

        _selectItem: function (dir) {
            var self = this,
                index, $items, $item, count;

            $items = self.$keywordList.find('li');
            count = $items.size();
            index = $items.index($items.filter('.active'));

            if (dir === 'up') {
                index -= 1;
                if (index < 0) {
                    index = count - 1;
                }
            } else {
                index += 1;
                if (index >= count) {
                    index = 0;
                }
            }

            $item = $items.eq(index);
            $items.filter('.active').removeClass('active');
            $item.addClass('active');
            self.$el.val($item.data('keyword'));

            var id = $item.data('id');
            var obj = self.keywordListArr[id];

            self.$el.triggerHandler('autocompleteselect', obj);

        },

        _close: function () {
            var self = this;
            self.oldKeyword = "";
            self.$keywordList.find('li').off('mousedown mouseenter');
            self._toggle(false);
        },

        _open: function () {
            var self = this;
            self._toggle(true);
        },


        _loadKeywords: function (q) {
            var self = this;

            if (self.xhr && self.xhr.readyState != 4) {
                self.xhr.abort();
                self.xhr = null;
            }

            if ($.trim(q) == "" || q.length < self.minLen) {
                self._close();
                return;
            }

            self.xhr = $.ajax({
                url: self.ajaxUrl,
                dataType: 'json',
                cache: false,
                data: {
                    query: q
                }
            }).done(function (json) {
                if (json.responsestatus == 0 && !core.isEmpty(json.result)) {
                    self.keywordListArr = json.result;
                    self._renderKeywords(q, self.keywordListArr);
                } else {
                    self._close();
                }
            }).fail(function () {
                self._close();
            });

            return self.xhr;
        },


        _renderKeywords: function (query, data) {
            var self = this,
                html = ''

            if ($.trim(query) == "" || query.length < self.minLen) {
                self._close();
                return;
            }
            self._open();
            core.each(data, function (item, i) {
                var val = core.type(item, "object") ? core.string.escapeHTML(item.keyword) : core.string.escapeHTML(item);
                if (val.indexOf(query) != -1){
                    html += '<li data-id="' + i + '" data-keyword="' + val + '"><a href="#">' + val.replace(query, '<b>' + query + '</b>') + '</a></li>';
                }
            });

            if (html) {
                self.$keywordList.find('ul').html(html);
                self.$keywordList.find('li').off('mousedown').on('mousedown', function (e) {
                    e.preventDefault();

                    self.$el.val($(this).data('keyword'));
                    var id = $(this).data('id');
                    var obj = self.keywordListArr[id];

                    self.$el.triggerHandler('autocompleteselect', obj);
                    self._close();
                });

                self.$keywordList.find('li').off('mouseenter').on('mouseenter', function (e) {
                    e.preventDefault();
                    self.$keywordList.find('li').removeClass('active');
                });

            } else {
                self.$keywordList.find('li').off('mousedown mouseenter');
                self.$keywordList.find('ul').empty();
            }
        },

        _toggle: function (flag) {
            var self = this;
            if (arguments.length === 0) {
                flag = !self.$keywordList.is('.visible');
            }
            self.$keywordList.toggle(flag).toggleClass('visible', flag);
        },

        destroy: function () {
            var self = this;

            clearInterval(self.intervalTimer);
            self.$keywordList.off();
            self.supr();
        }
    });

    if (typeof define === "function" && define.amd) {
        define([], function () {
            return Autocomplete;
        });
    }

})(jQuery, window[LIB_NAME]);
