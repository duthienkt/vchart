import Vcore from "./VCore";
import { isNumber, text, circle, hline } from "./helper";
import { showTooltip, closeTooltip } from "./ToolTip";
import { translate, rotate } from "./template";

var _ = Vcore._;
var $ = Vcore.$;

function LineChart() {
    return _('basechart', true);
};


LineChart.prototype.processMinMax = function () {
    this.minValue = this.lines.reduce(function (minValue, line) {
        return line.values.reduce(function (minValue, value) {
            if (!isNumber(value)) return minValue;
            return Math.min(minValue, value);
        }, minValue);
    }, 1000000000);

    this.maxValue = this.lines.reduce(function (maxValue, line) {
        return line.values.reduce(function (maxValue, value) {
            if (!isNumber(value)) return maxValue;

            return Math.max(maxValue, value);
        }, maxValue);
    }, -1000000000);
    if (this.minValue > this.maxValue) {
        this.minValue = 0;
        this.maxValue = this.minValue + 10;
    }
};

LineChart.prototype._createLineNote = function (name, color) {
    var res = _('g');
    res.$line = hline(0, -5, this.noteLineLength, 'line-chart-line').addStyle('stroke', color).addTo(res);
    res.$name = text(name, this.noteLineLength + 5, 0).addTo(res);
    return res;
};

LineChart.prototype._createKeyName = function (key) {
    var res = _('g');
    res.$text = text(key, 0, 5).addTo(res);
    return res;
};

LineChart.prototype._createLine = function (line, color) {
    var res = _({
        tag: 'g',
        style: {
            fill: color,
            stroke: color
        }
    });
    res.$path = _('shape.line-chart-line').addTo(res);
    res.$plots = line.values.map(function (u, i) {
        var plot = circle(0, 0, this.plotRadius, 'line-chart-plot').addTo(res).on('mouseenter', function (event) {
            var text = line.texts && line.texts[i];
            if (!text) return;
            var currentBound = this.getBoundingClientRect();

            showTooltip(text, (currentBound.left + currentBound.right) / 2, (currentBound.top + currentBound.bottom) / 2).then(function (token) {
                this.once('mouseleave', function () {
                    setTimeout(function () {
                        closeTooltip(token);
                    }, 1000);
                });
            }.bind(this));
        });
        if (line.plotColors && line.plotColors[i]) {
            plot.addStyle('fill', line.plotColors[i]);
        }
        return plot;
    }.bind(this));
    return res;
};



LineChart.prototype.initBackComp = function () {
    this.super();
    this.colors = this.lines.map(function (line, i, arr) {
        if (line.color) return line.color;
        return this.colorTable[Math.floor(this.colorTable.length * i / arr.length)];
    }.bind(this));

    this.$lineNotes = this.lines.map(function (line, i) {
        return this._createLineNote(line.name, this.colors[i]).addTo(this);
    }.bind(this));

    this.$keyNames = this.keys.map(function (key) {
        return this._createKeyName(key).addTo(this.$content);
    }.bind(this));
};


LineChart.prototype.updateBackComp = function () {
    this.super();
    this.oxyBottom = this.canvasHeight - 25;

    var lineNoteWidth = this.$lineNotes.reduce(function (lineNoteWidth, $lineNote) {
        return lineNoteWidth + $lineNote.getBBox().width + 15;
    }.bind(this), 0);

    this.$lineNotes.reduce(function (x, $lineNote) {
        $lineNote.attr('transform', translate(x, this.canvasHeight - 5));
        return x + $lineNote.getBBox().width + 15;
    }.bind(this), (this.canvasWidth - lineNoteWidth) / 2);

    var maxKeyNameWidth = this.$keyNames.reduce(function (w, $keyName) {
        return Math.max(w, $keyName.$text.getBBox().width);
    }, 0);

    this.oxSegmentLength = this.oxLength / this.keys.length;
    this.oxContentLength = this.oxLength;
    if (this.oxSegmentLength < maxKeyNameWidth + this.keyPaddingH * 2) {
        this.rotateText = true;
    }
    else if (this.minOXSegmentLength > this.oxSegmentLength) {
        this.oxSegmentLength = this.minOXSegmentLength;
        this.rotateText = true;
        this.oxContentLength = this.oxSegmentLength * this.keys.length;
    }

    if (this.rotateText) {
        this.$keyNames.forEach(function (e, i) {
            e.attr('transform', translate((i + 0.5) * this.oxSegmentLength - 5, 12));
            e.$text.attr('transform', rotate(45));

        }.bind(this));
        this.oxyBottom -= maxKeyNameWidth / 1.4 + 12;
    }
    else {
        this.$keyNames.forEach(function (e, i) {
            e.attr('transform', translate((i + 0.5) * this.oxSegmentLength, 12));
            e.$text.attr('text-anchor', 'middle');

        }.bind(this));
        this.oxyBottom -= 30;
    }





    //reupdate because update oxybottom
    this.super();
};



LineChart.prototype.initComp = function () {
    this.$lines = this.lines.map(function (line, i) {
        return this._createLine(line, this.colors[i]).addTo(this.$content);
    }.bind(this));
};


LineChart.prototype.updateComp = function () {
    console.log(this.lines);
    this.$lines.map(function ($line, i) {
        var line = this.lines[i];
        $line.$plots.forEach(function ($plot, j) {
            $plot.attr('display');
            var value = line.values[j];
            if (isNumber(value)) {
                $plot.attr({
                    cx: this.oxSegmentLength * (j + 0.5),
                    cy: this.mapOYValue(value)
                });
            }
            else {
                $plot.attr('display', 'none');
            }
        }.bind(this));


        $line.$path.begin();
        line.values.reduce(function (state, value, j) {

            if (line.length == 1) {
                if (!isNumber(value)) return 'NOT_START';
                var y = this.mapOYValue(value);
                var x = this.oxSegmentLength * (j);
                $line.$path.moveTo(x, y);
                x = this.oxSegmentLength * (j + 1);
                $line.$path.lineTo(x, y);
                return "IN_LINE";
            }

            if (state == "NOT_START") {
                if (!isNumber(value)) return 'NOT_START';

                var y = this.mapOYValue(value);
                var x = this.oxSegmentLength * (j + 0.5);
                $line.$path.moveTo(x, y);
                return 'IN_LINE';
            }
            else if (state == 'IN_LINE') {
                if (!isNumber(value)) return 'NOT_START';
                var y = this.mapOYValue(value);
                var x = this.oxSegmentLength * (j + 0.5);
                $line.$path.lineTo(x, y);
                return 'IN_LINE';
            }
            return ac;
        }.bind(this), "NOT_START");

        $line.$path.end();
    }.bind(this));
};




LineChart.prototype.preInit = function () {
    this.super();
    this.rotateText = true;
    this.noteLineLength = 40;
    this.plotRadius = 6;
    this.keyPaddingH = 4;
    this.minOXSegmentLength = 25;
    this.colorTable = ['#821616', ' #824116', '#826C16', '#6C8216', '#418216', '#168216',
        '#168241', '#16826C', '#166C82', '#164182', '#161682', '#411682', '#6C1682',
        '#82166C', '#821641'];
    this.lines = [];
};

Vcore.creator.linechart = LineChart;

export default LineChart;

// LineChart = function () {
//     var _ = _;
//     var $ = $;

//     var res = _({
//         tag: 'svg',
//         class: 'vchart-linechart',
//         child: [

//             {
//                 tag: 'g',
//                 child: 'axis'
//             }
//         ]
//     });
//     res.$axis = $('.axis', res);
//     res._axisLeft = 50;
//     res._axisBottom = 50;
//     res.$g = $('g', res);
//     res.sync = res.afterAttached();
//     return res;
// };

// LineChart.property = {};



// LineChart.property.colCount = {
//     set: function (value) {
//         this._colCount = value;
//     },
//     get: function () {
//         return this._colCount || 0;
//     }
// };

// LineChart.property.colNames = {
//     set: function (value) {
//         this._colNames = value || [];
//         if (this.$colNames) this.$colNames.forEach(function (e) { e.selftRemove() });
//         this.$colNames = this._colNames.map(function (name) {
//             return this._createColText(name, 0, 0).addTo(this.$g);
//         }.bind(this));
//     },
//     get: function () {
//         return this._colNames || [];
//     }
// };

// LineChart.property.lines = {
//     set: function (value) {
//         this._lines = value || [];
//         if (this.$lines) this.$lines.map(function (e) { e.selftRemove() });
//         this.$lines = this._lines.map(function (props) {
//             return this._createLine(props).addTo(this.$g);
//         }.bind(this));
//     },
//     get: function () {
//         return this._lines;
//     }
// }






// LineChart.prototype._createColText = function (text, x, y) {
//     return _([
//         '<g transform="translate(' + x + ',' + y + ')">',
//         '<g  transform="rotate(60)">',
//         '<text class="vchart-coltext" >',
//         '<tspan>' + text + '</tspan>',
//         '</text>',
//         '</g>',
//         '</g>'
//     ].join(''));
// };

// LineChart.prototype._createLine = function (props) {
//     var res = _({
//         tag: 'g',
//         style: {
//             fill: props.color || 'rgb(68, 68, 255)',
//             stroke: props.color || 'rgb(68, 68, 255)'
//         }
//     });


//     res.$dots = Array(props.values.length)
//         .fill('<ellipse  rx="7" ry="7" style="stroke:none" />').map(_)
//         .map(function (e) { e.addTo(res); return e; });
//     res.$path = _('<path style="fill:none"/>').addTo(res);

//     res._values = props.values;

//     return res;
// };



// LineChart.prototype.updateColNamePositions = function () {
//     if (this.$colNames) {
//         var maxSize = this.$colNames.reduce(function (ac, text) {
//             ac.width = Math.max(text.getBBox().width, ac.width);
//             ac.height = Math.max(text.getBBox().height, ac.height);
//             return ac;
//         }.bind(this), { width: 0, height: 0 });

//         this._oxLength = this.canvasWidth - this._axisLeft - maxSize.width;
//         this._oxSegmentLength = this._oxLength / (this.colCount + 1);
//         this._oyLength = this.canvasHeight - maxSize.height - 50;
//         this._axisBottom = maxSize.height + 20;
//         var x0 = this._axisLeft + this._oxSegmentLength / 2;
//         var y0 = this.canvasHeight - maxSize.height - 5;
//         this.$colNames.forEach(function (text, index) {
//             text.attr('transform',
//                 'translate(' +
//                 (x0 + index * this._oxSegmentLength) + ',' +
//                 y0 + ')'
//             );
//         }.bind(this));
//     }
// };

// LineChart.prototype.updateAxis = function () {
//     this.$axis.moveTo(this._axisLeft, this.canvasHeight - this._axisBottom);
//     this.$axis.resize(this._oxLength, this._oyLength);
// }

// LineChart.prototype.updateSize = function () {
//     this.attr({ width: this.canvasWidth + '', height: this.canvasHeight + '', viewBox: [0, 0, this.canvasWidth, this.canvasHeight].join(' ') });

// };

// LineChart.prototype._updateLines = function () {
//     if (this.$lines) {
//         this.$lines.forEach(function (e) {
//             var x0 = this._axisLeft + this._oxSegmentLength / 2;
//             var y0 = this.canvasHeight - this._axisBottom - Math.map(e._values[0], 0, this.max - this.min, 0, this._oyLength);
//             e.$dots[0].attr({ cx: x0, cy: y0 });
//             var d = 'm' + x0 + ' ' + y0;
//             var dx = this._oxSegmentLength, dy;
//             for (var i = 1; i < e._values.length; ++i) {
//                 dy = -Math.map((e._values[i] - e._values[i - 1]), 0, this.max - this.min, 0, this._oyLength);
//                 d += ' ' + dx + ' ' + dy;
//                 x0 += dx;
//                 y0 += dy;
//                 e.$dots[i].attr({ cx: x0, cy: y0 });


//             }
//             e.$path.attr('d', d);
//         }.bind(this));
//     }
// };


// LineChart.prototype.update = function (width, height) {
//     this.updateSize();
//     this.updateColNamePositions();
//     this.updateAxis();
//     this._updateLines();
//     //todo
// };



// LineChart.prototype.init = function (props) {
//     props = props || {};
//     props.canvasWidth = props.canvasWidth || 400;
//     props.canvasHeight = props.canvasHeight || 300;
//     this.super(props);
//     this.sync.then(this.update.bind(this));
// };