/**
 * Created by 김승일(comahead@vi-nyl.com) on 2015-05-04.
 * Benchmark
 * github: https://github.com/firstopinion/formatter.js
 * License: The MIT License (MIT) Copyright (c) 2013 First Opinion
 */
(function ($, core) {
    "use strict";

    // {{9999}}-{{9999}}-{{9999}}
    // comma
    // tel
    // mobile
    // email

    // 캐얼 모듈
    var inputSel = {
        // 캐럿 위치 반환
        get: function (el) {
            if (core.is(el.selectionStart, 'number')) {
                return {
                    begin: el.selectionStart,
                    end: el.selectionEnd
                };
            }

            var range = document.selection.createRange();
            if (range && range.parentElement() === el) {
                var inputRange = el.createTextRange(), endRange = el.createTextRange(), length = el.value.length;
                inputRange.moveToBookmark(range.getBookmark());
                endRange.collapse(false);

                if (inputRange.compareEndPoints('StartToEnd', endRange) > -1) {
                    return {
                        begin: length,
                        end: length
                    };
                }

                return {
                    begin: -inputRange.moveStart('character', -length),
                    end: -inputRange.moveEnd('character', -length)
                };
            }

            return {
                begin: 0,
                end: 0
            };
        },
        // 캐럿 위치 설정
        set: function (el, pos) {
            if (!core.is(pos, 'object')) {
                pos = {
                    begin: pos,
                    end: pos
                };
            }

            if (el.setSelectionRange) {
                //el.focus();
                el.setSelectionRange(pos.begin, pos.end);
            } else if (el.createTextRange) {
                var range = el.createTextRange();
                range.collapse(true);
                range.moveEnd('character', pos.end);
                range.moveStart('character', pos.begin);
                range.select();
            }
        }
    };

    var utils = {
        numRegex: /[^0-9]/g,
        engRegex: /[^a-zA-Z\s]/g,
        alphaRegex: /[^a-zA-Z]/g,
        alnumRegex: /[^a-zA-Z0-9]/g,
        engnumRegex: /[^a-zA-Z0-9\s]/g,

        isPressedMetaKey: function (e) {
            return e.ctrlKey || e.shiftKey || e.altKey;
        },
        numKey: function (e) {
            var kc = e.keyCode;
            return (e.keyCode >= 48 && e.keyCode <= 57) || (e.keyCode >= 96 && e.keyCode <= 105);
        },
        engKey: function (e) {
            var kc = e.keyCode;
            return (kc >= 65 && kc <= 90) || (kc >= 97 && kc <= 122) || kc === 32; // 32: space bar
        },
        alphaKey: function (e) {
            var kc = e.keyCode;
            return (kc >= 65 && kc <= 90) || (kc >= 97 && kc <= 122);
        },
        alnumKey: function (e) {
            var kc = e.keyCode;
            return (kc >= 65 && kc <= 90) || (kc >= 97 && kc <= 122) || (kc >= 48 && kc <= 57);
        },
        engnumKey: function (e) {
            var kc = e.keyCode;
            return (kc >= 65 && kc <= 90) || (kc >= 97 && kc <= 122) || (kc >= 48 && kc <= 57) || kc === 32; // 32: space bar
        },
        isInvalidKey: function (e, type, ignoreKeys) {
            return !utils.isPressedMetaKey(e) && !utils[type + 'Key'](e) && !core.array.include(ignoreKeys, e.keyCode);
        },
        cleanChars: function (type, el, focusin) {
            var caret = inputSel.get(el);
            el.value = el.value.replace(utils[type + 'Regex'], '');
            if (focusin) {
                inputSel.set(el, Math.min(caret.begin, el.value.length));
            }
        }
    };

    // placeholder 지원여부
    var supportPlaceholder = ('placeholder' in document.createElement('input'));

    var Formatter = core.ui('Formatter', /** @lends axl.ui.Formatter# */{
        $statics: {
            // 허용할 기능키
            byPassKeys: [8, 9, 16, 17, 18, 35, 36, 37, 38, 39, 40, 46, 91, 116],
            // 각 코드에 대한 정규식
            translation: {
                '0': {pattern: /\d/},
                '9': {pattern: /\d/, optional: true},
                '#': {pattern: /\d/, recursive: true},
                'A': {pattern: /[a-zA-Z0-9]/},
                'S': {pattern: /[a-zA-Z]/}
            },
            // 마스킹 타입
            masks: {
                // 현금
                comma: {format: '000,000,000,000,000,000,000,000,000', reverse: true},
                // 전화번호
                tel: {
                    format: function (val, e, field, options) {
                        return val.replace(/\D/g, '').length < 8 ? '000-0000' : '0000-0000'
                    }
                },
                // 핸드폰 번호
                mobile: {
                    format: function (val, e, field, options) {
                        return val.replace(/\D/g, '').length < 8 ? '000-0000' : '0000-0000'
                    }
                },
                // 숫자
                num: {format: '0000000000000000000'},
                // 카드
                card: {format: '0000-0000-0000-0000'},
                // 아멕스카드
                amexcard: {format: '0000-000000-00000'},
                // 운전면허번호
                driverno: {format: '00-000000-00'},
                // 사업자번호
                bizno: {format: '000-00-00000'},
                // 법인번호
                corpno: {format: '000000-0000000'},
                // 날짜
                date: {format: '0000.00.00'},
                // 영문
                eng: {format: 'S'}
            }
        },
        bindjQuery: 'formatter',
        defaults: {
            format: 'comma', // 기본 포맷
            watch: true,    // 수정을 감시할건가
            watchInterval: 300 // 감시 인터벌
        },
        /**
         * 생성자
         * @param el
         * @param options
         * @returns {boolean}
         */
        initialize: function (el, options) {
            var self = this;

            if (self.supr(el, options) === false) {
                return false;
            }

            // 자동완성 끜
            self.$el.attr('autocomplete', 'off');
            // 숫자 와 같이 단순한 포맷은 걍 키만 막고 빠져나간다
            if (self._isSimpleFormat() === true) {
                self.clean = function () {
                    return self.$el.val() === self.txtPlaceholder ? '' : self.$el.val();
                };
                return;
            }

            // 이벤트 바인딩
            self._bindEvents();

            self.oldValue = self.$el.val(); // 원래 값
            self.byPassKeys = Formatter.byPassKeys; // alias
            self.translation = core.extend({}, Formatter.translation, self.options.translation);  // alias
            self.invalid = [];
            if (!supportPlaceholder) {
                // placeholder를 지원하지 않는 브라우저면 placeholder 문구를 보관하고 있는다.
                self.notSupportPlaceholder = true;
                self.txtPlaceholder = self.$el.attr('placeholder');
            }

            self._reloadMask();
            var caret = inputSel.get(self.el).begin; // 캐럿 위치를 보관
            self.update();
            if (self.$el.is(':focus')) {
                inputSel.set(self.el, caret + self._getMCharsBeforeCount(caret, true));
            }
            // 마스킹에 대한 전체 정규식을 가져온다
            self.regexMask = self._getRegexMask();
            // 값이 변경됐는지 감시
            if (self.options.watch) {
                self._watchStart();
            }
        },

        /**
         * 마스킹처리된 값을 인풋에 넣어준다
         */
        update: function () {
            var self = this,
                val = self.$el.val();
            if (val) {
                self.$el.val(this._getMasked());
            }
        },

        /**
         * 마스킹 옵션이 변경됐을 수도 있기 때문에 다시 정규화 한다.
         * @private
         */
        _reloadMask: function () {
            var self = this,
                m, mask;

            if (m = Formatter.masks[self.options.format]) {
                if (core.is(m.format, 'function')) {
                    self.mask = m.format.call(self, self.$el.val());
                } else {
                    self.mask = m.format;
                }
                self.options.reverse = !!m.reverse;
            } else {
                self.mask = core.is(self.options.format, 'function') ? self.options.format.call(self) : self.options.format;
            }
        },

        /**
         * 숫자, 영문자 만 입력하는거면 마스킹 처리는 하지 않고 키보드만 막는다.
         * @returns {boolean}
         * @private
         */
        _isSimpleFormat: function () {
            var self = this,
                format = self.options.format,
                old;

            if (format === 'eng' || format === 'alnum' || format === 'num') {
                self.$el.on('keydown focusin keyup focusout paste', function (e) {
                    var el = this;
                    switch (e.type) {
                        case 'keydown':
                            if (utils.isInvalidKey(e, format, [].concat(Formatter.byPassKeys, 16))) {
                                e.preventDefault();
                            }
                        // break;
                        case 'focusin':
                            old = this.value;
                            break;
                        case 'keyup':
                        case 'focusout':
                        case 'paste':
                            setTimeout(function () {
                                if (old != el.value) {
                                    utils.cleanChars(format, el, e.type !== 'focusout');
                                    old = el.value;
                                }
                            });
                            break;
                    }
                });
                return true;  // 마스킹은 처리안하도록 true 반환
            } else if (core.array.include(['card', 'amexcard',
                    'tel', 'mobile', 'bizno', 'corpno', 'comma', 'date'], format)) {
                if (window.IS_DEBUG && core.browser.isMobile) {
                    self.$el.attr('type', 'tel');
                }
                // 숫자
                self.$el.on('keydown focusin', function (e) {
                    if (e.type === 'keydown') {
                        if (utils.isInvalidKey(e, 'num', Formatter.byPassKeys)) {
                            e.preventDefault();
                        }
                    }
                    old = this.value;
                });
            }
        },

        /**
         * 이벤트 바인딩
         * @private
         */
        _bindEvents: function () {
            var self = this;

            self.$el
                .on('keyup', function (e) {
                    self._reloadMask();
                    self._process(e);
                })
                .on('paste drop', function () {
                    setTimeout(function () {
                        self.$el.keydown().keyup();
                    });
                })
                .on('change', function () {
                    self.$el.data('changed', true);
                })
                .on('blur', function (e) {
                    if (self.oldValue != self.$el.val() && !self.$el.data('changed')) {
                        self.$el.triggerHandler('change');
                    }
                    self.$el.data('change', false);
                    self._watchStart();
                })
                .on('keydown blur', function () {
                    self.oldValue = self.$el.val();
                })
                .on('focusin', function () {
                    // 포커싱될 때 셀렉트시킬 것인가..
                    if (self.options.selectOnFocus === true) {
                        $(e.target).select();
                    }
                    self._watchStop();
                })
                .on('focusout', function () {
                    // 포커스가 나갈 때 안맞는 값을 지울것인가
                    if (self.options.clearIfNotMatch && !self.regexMask.test(self.$el.val())) {
                        self.$el.val('');
                    }
                });

            // comma 형식일 땐 ,가 제거된 상태로 넘어가게
            self.options.format === 'comma' && $(self.el.form).on('submit', function (e) {
                self.remove();
                self.oldValue = '';
            });
        },

        /**
         * 값이 변경됐는지 감시 시작
         * @private
         */
        _watchStart: function () {
            var self = this;
            self._watchStop();

            if (!self.options.watch || self.$el.prop('readonly') || self.$el.prop('disabled')) {
                return;
            }

            var totalTime = 0, dur = self.options.watchInterval;
            self.watchTimer = setInterval(function () {
                // 40초에 한번씩 dom에서 제거 됐건지 체크해서 타이머를 멈춘다.
                if (totalTime > 40000) {
                    totalTime = 0;
                    if (!$.contains(document, self.$el[0])) {
                        clearInterval(self.watchTimer);
                        self.watchTimer = null;
                        return;
                    }
                } else {
                    totalTime += dur;
                }
                if (self.$el[0].disabled || 0 <= self.$el[0].className.indexOf('disabled')) {
                    return;
                }

                var val = self.$el.val();
                if (val && self.oldValue != val) {
                    self.update();
                }
            }, dur);
        },

        /**
         * 값 변경 감시 중지
         * @private
         */
        _watchStop: function () {
            var self = this;
            clearInterval(self.watchTimer);
            self.watchTimer = null;
        },

        /**
         * 마스킹에 대한 정규식 반환
         * @returns {RegExp}
         * @private
         */
        _getRegexMask: function () {
            var self = this,
                maskChunks = [],
                translation, pattern, optional, recursive, oRecursive, r, ch;

            for (var i = 0, len = self.mask.length; i < len; i++) {
                ch = self.mask.charAt(i);
                if (translation = self.translation[ch]) {
                    pattern = translation.pattern.toString().replace(/.{1}$|^.{1}/g, '');
                    optional = translation.optional;
                    if (recursive = translation.recursive) {
                        maskChunks.push(ch);
                        oRecursive = {digit: ch, pattern: pattern};
                    } else {
                        maskChunks.push(!optional ? pattern : (pattern + '?'));
                    }
                } else {
                    maskChunks.push(ch.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'));
                }
            }

            r = maskChunks.join('');
            // 기준을 끝으로 했을 때
            if (oRecursive) {
                r = r.replace(new RegExp('(' + oRecursive.digit + '(.*' + oRecursive.digit + ')?)'), '($1)?')
                    .replace(new RegExp(oRecursive.digit, 'g'), oRecursive.pattern);
            }

            return new RegExp(r);
        },
        /**
         * index위치의 마스킹처리된 문자수
         * @param index
         * @param onCleanVal
         * @returns {number}
         * @private
         */
        _getMCharsBeforeCount: function (index, onCleanVal) {
            var self = this, mask = self.mask;
            for (var count = 0, i = 0, maskL = mask.length; i < maskL && i < index; i++) {
                if (!self.translation[mask.charAt(i)]) {
                    index = onCleanVal ? index + 1 : index;
                    count++;
                }
            }
            return count;
        },
        /**
         * 캐럿 위치
         * @param originalCaretPos
         * @param oldLength
         * @param newLength
         * @param maskDif
         * @returns {*}
         * @private
         */
        _caretPos: function (originalCaretPos, oldLength, newLength, maskDif) {
            var self = this,
                mask = self.mask,
                translation = self.translation[mask.charAt(Math.min(originalCaretPos - 1, mask.length - 1))];

            return !translation ? self._caretPos(originalCaretPos + 1, oldLength, newLength, maskDif)
                : Math.min(originalCaretPos + newLength - oldLength - maskDif, newLength);
        },
        /**
         * 마스킹처리
         * @param e
         * @returns {*}
         * @private
         */
        _process: function (e) {
            var self = this,
                keyCode = e.keyCode;
            // TODO
            if (keyCode === 17 || (keyCode === 65 && e.ctrlKey)) {
                return;
            }

            self.invalid = [];
            if ($.inArray(keyCode, self.byPassKeys) === -1 || keyCode === 46 || keyCode === 8) {
                var caretPos = inputSel.get(self.el).begin,
                    currVal = self.$el.val(),
                    currValL = currVal.length,
                    changeCaret = caretPos < currValL,
                    newVal = self._getMasked(),
                    newValL = newVal.length,
                    maskDif = self._getMCharsBeforeCount(newValL - 1) - self._getMCharsBeforeCount(currValL - 1);

                self.$el.val(newVal);

                // change caret but avoid CTRL+A
                if (changeCaret && !(keyCode === 65 && e.ctrlKey)) {
                    // Avoid adjusting caret on backspace or delete
                    if (!(keyCode === 8 || keyCode === 46)) {
                        caretPos = self._caretPos(caretPos, currValL, newValL, maskDif);
                    }
                    if (self.$el.is(':focus')) {
                        inputSel.set(self.el, caretPos);
                    }
                }

                return self._callbacks(e);
            }
        },
        /**
         * 마스킹처리 코어부분
         * @param skipMaskChars
         * @returns {string}
         * @private
         */
        _getMasked: function (skipMaskChars) {
            var self = this,
                mask = self.mask,
                buf = [],
                value = self.$el.val(),
                m = 0, maskLen = mask.length,
                v = 0, valLen = value.length,
                offset = 1, addMethod = 'push',
                resetPos = -1,
                lastMaskChar,
                check;

            if (self.options.reverse) {
                addMethod = 'unshift';
                offset = -1;
                lastMaskChar = 0;
                m = maskLen - 1;
                v = valLen - 1;
                check = function () {
                    return m > -1 && v > -1;
                };
            } else {
                lastMaskChar = maskLen - 1;
                check = function () {
                    return m < maskLen && v < valLen;
                };
            }

            while (check()) {
                var maskDigit = mask.charAt(m),
                    valDigit = value.charAt(v),
                    translation = self.translation[maskDigit];

                if (translation) {
                    if (valDigit.match(translation.pattern)) {
                        buf[addMethod](valDigit);
                        if (translation.recursive) {
                            if (resetPos === -1) {
                                resetPos = m;
                            } else if (m === lastMaskChar) {
                                m = resetPos - offset;
                            }

                            if (lastMaskChar === resetPos) {
                                m -= offset;
                            }
                        }
                        m += offset;
                    } else if (translation.optional) {
                        m += offset;
                        v -= offset;
                    } else if (translation.fallback) {
                        buf[addMethod](translation.fallback);
                        m += offset;
                        v -= offset;
                    } else {
                        self.invalid.push({p: v, v: valDigit, e: translation.pattern});
                    }
                    v += offset;
                } else {
                    if (!skipMaskChars) {
                        buf[addMethod](maskDigit);
                    }

                    if (valDigit === maskDigit) {
                        v += offset;
                    }

                    m += offset;
                }
            }

            var lastMaskCharDigit = mask.charAt(lastMaskChar);
            if (maskLen === valLen + 1 && !self.translation[lastMaskCharDigit]) {
                buf.push(lastMaskCharDigit);
            }

            return buf.join('');
        },
        /**
         * 콜백함수 바인딩
         * @param e
         * @private
         */
        _callbacks: function (e) {
            var self = this,
                mask = self.mask,
                val = self.$el.val(),
                changed = val !== self.oldValue,
                defaultArgs = [val, e, self.el, self.options],
                callback = function (name, criteria, args) {
                    if (typeof self.options[name] === 'function' && criteria) {
                        self.options[name].apply(this, args);
                    }
                };

            callback('onChange', changed === true, defaultArgs);
            callback('onKeyPress', changed === true, defaultArgs);
            callback('onComplete', val.length === mask.length, defaultArgs);
            callback('onInvalid', self.invalid.length > 0, [val, e, self.el, self.invalid, self.options]);
        },
        /**
         * 지우기
         */
        remove: function () {
            var self = this,
                caret = inputSel.get(self.el).begin;
            self._watchStop();
            self.$el.off();
            self.$el.val(self.clean());
            if (self.$el.is(':focus')) {
                inputSel.set(self.el, caret - self._getMCharsBeforeCount(caret));
            }
        },
        /**
         * 마스킹 제거
         * @returns {*|string}
         */
        clean: function () {
            return this._getMasked(true);
        }
    });

    if (typeof define === "function" && define.amd) {
        define([], function () {
            return Formatter;
        });
    }

})(jQuery, window[LIB_NAME]);
