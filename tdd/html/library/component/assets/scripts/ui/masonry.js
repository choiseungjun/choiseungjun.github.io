/*!
 * @author 김승일
 * @email comahead@gmail.com
 */;
(function($, core, undefined) {

    core.ui('Masonry', {
            defaults: {
                itemWidth: 310,
                space: 18,
                scrollLoad: false,
                itemSelector: 'div.ui_item'
            },
            initialize: function(el, options) {
                var self = this;
                if (self.supr(el, options) === false) {
                    return;
                }

                core.uitl.lazyLoadImage(self.$('img')).done(function() {
                    self.init();
                    self._configure();
                    self.update();
                });
            },
            init: function() {
                var self = this,
                    timer = null,
                    timer2 = null,
                    getDocHeight = core.util.getDocHeight;

                // 스크롤을 내릴때 새로 추가된 노드에 대해서 재배치
                self.options.scrollLoad && $(window).on('scroll.masonry', function() {
                    clearTimeout(timer);
                    timer = setTimeout(function() {
                        var clientHeight = $(this).height(),
                            scrollTop = $(this).scrollTop(),
                            docHeight = getDocHeight();

                        if (docHeight - 100 < clientHeight + scrollTop) {
                            self.update(self.$el.find(self.options.itemSelector).length);
                        }
                    }, 400);
                });
            },
            _configure: function() {
                var self = this,
                    opts = self.options;

                self._width = self.$el.width(); // 컨테이너 너비
                self._itemWidth = opts.itemWidth + opts.space; // 아이템 너비
                self._colCount = Math.ceil(self._width / self._itemWidth); // 열 갯수

                self._colsHeight = [];
                for (var i = 0; i < self._colCount; i++) {
                    self._colsHeight[i] = 0;
                }
            },
            // 렬 중에서 가장 짧은 렬 반환
            _getMinCol: function() {
                var heights = this._colsHeight,
                    col = 0;
                for (var i = 0, len = heights.length; i < len; i++) {
                    if (heights[i] < heights[col]) {
                        col = i;
                    }
                }
                return col;
            },

            // 렬 중에서 가장 긴 렬 반환
            _getMaxCol: function() {
                var heights = this._colsHeight,
                    col = 0;
                for (var i = 0, len = heights.length; i < len; i++) {
                    if (heights[i] > heights[col]) {
                        col = i;
                    }
                }
                return col;
            },

            update: function(start) {
                start = start || 0;

                var self = this,
                    space = self.options.space,
                    boxes = self.$el.find(self.options.itemSelector).filter(function(i) {
                        return i >= start;
                    });

                self.$el.css('visibility', 'hidden').show();

                boxes.each(function(i) {
                    var $this = $(this),
                        thisWidth = $this.width(),
                        thisHeight = $this.height(),
                        isBigItem = thisWidth > self._itemWidth,
                        col, top;

                    col = self._getMinCol(); // 젤 짧은 렬 검색
                    top = self._colsHeight[col];

                    // 두칸짜리이고 전체너비를 초과하는 경우에, 다음 행에 표시
                    if (isBigItem) {
                        if (col === self._colCount - 1) {
                            col = 0;
                        }

                        if (self._colsHeight.length > col) {
                            top = Math.max(self._colsHeight[col], self._colsHeight[col + 1]);
                            self._colsHeight[col + 1] = top + thisHeight + space;
                        }
                    }
                    self._colsHeight[col] = top + thisHeight + space;

                    // 배치
                    $this.css({
                        'top': top,
                        'left': col * self._itemWidth
                    });
                });

                col = self._getMaxCol(self._colsHeight);
                self.$el.css({
                    'height': self._colsHeight[col] - space,
                    'visibility': ''
                });
                boxes.fadeIn();
            }
        });


})(jQuery, window[LIB_NAME]);
