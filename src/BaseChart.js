import Vcore from "./VCore";
import OOP from "absol/src/HTML5/OOP";
import { calBeautySegment, text, moveHLine, map } from "./helper";
import { translate } from "./template";

var _ = Vcore._;

var $ = Vcore.$;

function BaseChart() {
    var _ = vchart._;
    var $ = vchart.$;
    var res = _({
        tag: 'svg',
        class: 'base-chart',
        child: [

            {
                tag: 'g',
                attr: {
                    id: 'contentBox'
                },
                child: 'g#content'
            },
            {
                tag: 'path',
                class: 'base-chart-white-mask',
                attr: {
                    fill: 'white',
                    stroke: 'white',
                    'fill-rule': 'evenodd',
                    d: 'M0,0  0,2000 2000,2000 2000,0zM100,0  0,200 200,200 200,0z'
                }
            },
            'axis',
            'hscrollbar'
        ]
    });
    res.sync = res.afterAttached();
    res.$axis = $('axis', res);
    res.$whiteBoxMask = $('.base-chart-white-mask', res);
    res.$content = $('g#content', res);
    res.eventHandler = OOP.bindFunctions(res, BaseChart.eventHandler);
    // res.on('wheel', res.eventHandler.wheel);
    res.$hscrollbar = $('hscrollbar', res).on('scroll', res.eventHandler.scrollbarscroll);
    res.integerOnly = false;
    return res;
};


BaseChart.prototype.integerOnly = false;

BaseChart.eventHandler = {};
BaseChart.eventHandler.wheel = function (event) {
    var d = this.scrollBy(event.deltaY);
    if (d != 0) {
        event.preventDefault();
    }
};

BaseChart.eventHandler.scrollArrowsPressLeft = function (event) {
    this.scrollBy(-60);
};

BaseChart.eventHandler.scrollArrowsPressRight = function (event) {
    this.scrollBy(60);
};

BaseChart.eventHandler.scrollbarscroll = function (event) {
    this.scrollLeft = this.$hscrollbar.scrollLeft;
    event.preventDefault();
};


BaseChart.prototype.scrollBy = function (dX) {
    var scrollLeft = this.scrollLeft + dX / 5;
    var scrollLeft = Math.max(0, Math.min(this.oxContentLength - this.oxLength, scrollLeft));
    var deltaX = scrollLeft - this.scrollLeft;
    if (deltaX != 0) {
        this.scrollLeft = scrollLeft;
        this.$hscrollbar.scrollLeft = scrollLeft;
    }
    return deltaX;
};



BaseChart.prototype._createOyValues = function (minValue, step, segmentCount, extendOY) {
    var child = Array(segmentCount + 1 + (extendOY ? 1 : 0)).fill(0).map(function (u, i) {
        var value;
        if (extendOY) {
            if (i == 0) {
                value = 0;
            }
            else {
                value = minValue + (i - 1) * step;
            }

        }
        else {
            value = minValue + i * step;
        }
        return {
            tag: 'text',

            attr: {
                x: '-14',
                y: '0',
                'text-anchor': 'end'
            },
            props: {
                innerHTML: this.numberToString(value)
            }
        }
    }.bind(this));
    return vchart._({
        tag: 'g',
        child: child
    });
};


BaseChart.prototype._createOYSegmentLines = function (n) {
    var _ = vchart._;
    var res = _({
        tag: 'g',
        child: Array(n).fill('path.vchart-segment-line')
    });
    return res;
};



BaseChart.prototype.numberToString = function (value) {
    return value.toString();
};

BaseChart.prototype.mapOYValue = function (val) {
    return -this.paddingnAxisBottom + (this.extendOY ? -this.oySegmentLength : 0) - map(val, this.oyMinValue, this.oyMaxValue, 0, this.oyLength - (this.extendOY ? this.oySegmentLength : 0));
};

BaseChart.prototype.preInit = function () {

};

BaseChart.prototype.updateSize = function () {
    this.attr({ width: this.canvasWidth + '', height: this.canvasHeight + '', viewBox: [0, 0, this.canvasWidth, this.canvasHeight].join(' ') });
};



BaseChart.prototype.updateOyValues = function () {
    this.oyLength = this.oxyBottom - 70 - this.paddingnAxisBottom;
    this.oySegmentLength = this.oyLength / (this.oySegmentCount + (this.extendOY ? 1 : 0));
    Array.prototype.forEach.call(this.$oyValues.childNodes, function (e, i) {
        e.attr({
            y: -i * this.oySegmentLength + 5 - this.paddingnAxisBottom,
            x: - 10
        });
    }.bind(this));

    var oyValuesBox = this.$oyValues.getBBox();
    this.oxyLeft = Math.max(this.oxyLeft, oyValuesBox.width + 14, this.$oyName.getBBox().width);
    this.oxLength = this.oxLength || this.canvasWidth - this.oxyLeft - 50;
    this.$oyValues.attr('transform', 'translate(' + this.oxyLeft + ',' + this.oxyBottom + ')');
};

BaseChart.prototype.updateOYSegmentLines = function () {
    this.$oySegmentLines.attr('transform', 'translate(' + this.oxyLeft + ',' + this.oxyBottom + ')');
    Array.prototype.forEach.call(this.$oySegmentLines.childNodes, function (e, i) {
        moveHLine(e, -2, -i * this.oySegmentLength - this.paddingnAxisBottom, 4);
    }.bind(this));
};


BaseChart.prototype.updateBackComp = function () {
    this.$title.attr('x', this.canvasWidth / 2);
    this.updateOyValues();
    this.updateOYSegmentLines();
};



BaseChart.prototype.updateAxis = function () {
    this.$axis.attr('transform', translate(this.oxyLeft, this.oxyBottom));
    this.$axis.resize(this.canvasWidth - this.oxyLeft - 10, this.oxyBottom - 50);
    this.$oyName.attr({
        x: this.oxyLeft,
        y: 30,
        'text-anchor': 'end'
    });

    this.$whiteBoxMask.attr('d', 'M0,0  0,cvh cvw,cvh cvw,0zMleft,top  left,bottom right,bottom right,topz'
        .replace(/cvh/g, this.canvasHeight)
        .replace(/cvw/g, this.canvasWidth)
        .replace(/left/g, this.oxyLeft)
        .replace(/top/g, 1)
        .replace(/bottom/g, this.canvasHeight)
        .replace(/right/g, this.canvasWidth - 10)
    )

    this.$content.attr('transform', 'translate(' + this.oxyLeft + ',' + this.oxyBottom + ')');
    this.$oxName.attr({ x: this.canvasWidth - this.$oxName.getBBox().width - 3, y: this.oxyBottom - 9 });
};

BaseChart.prototype.updateFrontComp = function () { };
BaseChart.prototype.updateComp = function () { };

BaseChart.prototype.updateScrollArrows = function () {
    this.$scrollArrows.box.setPosition(this.oxyLeft + 7,this.oxyBottom - this.oyLength / 2 );
    this.$scrollArrows.width = this.oxLength - 15;
    this.scrollLeft = this.scrollLeft + 0;//update
    this.$hscrollbar.resize(this.oxLength, 10);
    this.$hscrollbar.moveTo(this.oxyLeft, this.oxyBottom - 10);
    this.$hscrollbar.outterWidth = this.oxLength;
    this.$hscrollbar.innerWidth = this.oxContentLength;
};

BaseChart.prototype.update = function () {
    if (typeof this.canvasWidth != 'number') {
        this.canvasWidth = 300;
        this.autoWidth = true;
    }
    this.oxLength = 0;//init
    this.updateSize();
    this.updateBackComp();
    this.updateAxis();
    this.updateComp();
    this.updateScrollArrows();
    this.updateFrontComp();
    requestAnimationFrame(function () {
        if (this.autoWidth) {
            var requireWidth = this.canvasWidth + this.overflowOX;
            var proviceWidth = this.parentElement.getBoundingClientRect().width;
            this.canvasWidth = Math.max(Math.min(requireWidth, proviceWidth), 300);
            this.autoWidth = false;
            this.update();
        }
    }.bind(this));
};


BaseChart.prototype.initScroll = function () {
    this.$scrollArrows = vchart._('scrollarrow')
        .addTo(this)
        .on('pressleft', this.eventHandler.scrollArrowsPressLeft)
        .on('pressright', this.eventHandler.scrollArrowsPressRight);
};



BaseChart.prototype.preInit = function () {
    this.canvasWidth = 900;
    this.canvasHeight = 600;
    this.paddingnAxisBottom = 0;
    this.maxSegment = 9;
    this.oyMaxValue = 10;
    this.oyMinValue = 0;
    this.valueName = '';
    this.keyName = '';
    this.colorTable = ['#821616', ' #824116', '#826C16', '#6C8216', '#418216', '#168216',
        '#168241', '#16826C', '#166C82', '#164182', '#161682', '#411682', '#6C1682',
        '#82166C', '#821641'];
};


BaseChart.prototype.processMinMax = function () {
    this.minValue = 0;
    this.maxValue = 10;
};

BaseChart.prototype.beautifyMinMax = function () {
    if (!(this.maxValue >= this.minValue)) {
        this.maxValue = 10;
        this.minValue = 0;
    }
    if (this.maxValue == this.minValue) this.maxValue += this.maxSegment;

    var btSgmt = calBeautySegment(this.maxSegment, this.minValue, this.maxValue, this.integerOnly);

    this.oySegmentCount = btSgmt.segmentCount;
    this.oyMinValue = btSgmt.minValue;
    this.oyMaxValue = btSgmt.maxValue;
    this.extendOY = !!(this.zeroOY && (this.oyMinValue > 0));
    this.oyStep = btSgmt.step;
    this.oxyLeft = 20;
    this.oxyBottom = this.canvasHeight - 40;
};




BaseChart.prototype.initBackComp = function () {

    this.$oyValues = this._createOyValues(this.oyMinValue, this.oyStep, this.oySegmentCount, this.extendOY)
        .addTo(this);

    this.$oySegmentLines = this._createOYSegmentLines(this.oySegmentCount + 1 + (this.extendOY ? 1 : 0)).addTo(this);

    this.$title = text(this.title||'', 0, 19, 'base-chart-title').attr('text-anchor', 'middle').addTo(this);

    this.$oyName = text(this.valueName || '', 0, 0, 'base-chart-oxy-text').addTo(this);
    this.$oxName = text(this.keyName || '', 0, 0, 'base-chart-oxy-text').addTo(this);

};

BaseChart.prototype.initComp = function () { };
BaseChart.prototype.initFrontComp = function () { };

BaseChart.prototype.initScroll = function () {
    this.$scrollArrows = vchart._('scrollarrow')
        .addTo(this)
        .on('pressleft', this.eventHandler.scrollArrowsPressLeft)
        .on('pressright', this.eventHandler.scrollArrowsPressRight);
};



BaseChart.prototype.init = function (props) {
    for (var key in props) {
        if (props[key] === undefined) delete props[key];
    }
    this.preInit();
    this.super(props);
    this.processMinMax();
    this.beautifyMinMax();
    this.initBackComp();
    this.initComp();
    this.initFrontComp();
    this.initScroll();
    this.sync = this.sync.then(this.update.bind(this));
};



BaseChart.property = {};


BaseChart.property.scrollLeft = {
    set: function (value) {
        this._scrollLeft = value || 0;
        this.$content.attr('transform', 'translate(' + (this.oxyLeft - this.scrollLeft) + ',' + this.oxyBottom + ')');
        if (this.scrollLeft > 0.001) {
            this.$scrollArrows.$leftArrow.removeStyle('display');
        }
        else {
            this.$scrollArrows.$leftArrow.addStyle('display', 'none');
        }

        if (this.oxContentLength - this.oxLength > this.scrollLeft + 0.001) {
            this.$scrollArrows.$rightArrow.removeStyle('display');
        }
        else {
            this.$scrollArrows.$rightArrow.addStyle('display', 'none');
        }
    },
    get: function () {
        return this._scrollLeft || 0;
    }
};

BaseChart.property.overflowOX = {
    get: function () {
        return Math.max(0, this.oxContentLength - this.oxLength);
    }
};

BaseChart.property.showInlineValue = {
    set: function (value) {
        if (value) {
            this.addClass('vchart-show-inline-value');
        }
        else {
            this.removeClass('vchart-show-inline-value');
        }
    },
    get: function () {
        return this.containsClass('vchart-show-inline-value');
    }
};


Vcore.creator.basechart = BaseChart;

export default BaseChart;