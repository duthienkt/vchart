import Vcore from "./VCore";
import SvgCanvas from "absol-svg/js/svg/SvgCanvas";
import DomSignal from "absol/src/HTML5/DomSignal";
import Color from "absol/src/Color/Color";
import {generateBackgroundColors} from "./helper";
import './style/piechart.css';
import BChart from "./BChart";
import OOP from "absol/src/HTML5/OOP";

var _ = Vcore._;
var $ = Vcore.$;


/***
 * @typedef VCPiece
 * @property {string} name
 * @property {number} value
 * @property {string} valueText
 * @property {string} fillColor
 * @property {boolean} separated
 */


/***
 * @extends BChart
 * @constructor
 */
function PieChart() {
    BChart.call(this);
    this.$pieCtn = this.$body;
    this.$pie = _('gcontainer');
    this.$pieCtn.addChild(this.$pie);
    /***
     *
     * @type {VCPiece[]}
     */
    this.pieces = [];
}

OOP.mixClass(PieChart, BChart);

PieChart.tag = 'PieChart'.toLowerCase();

PieChart.render = function () {
    return BChart.render();
};


PieChart.prototype._createPie = function () {
    this.$pie.clearChild();

    var thisC = this;
    this.$pieces = this.pieces.map(function (piece) {
        var pieceElt = _({
            tag: 'shape',
            class: 'vc-piece',
            style: {
                fill: piece.fillColor + ''
            }
        });
        thisC.$pie.addChild(pieceElt);
        return pieceElt;
    });
    this.$pieceValues = this.pieces.map(function (piece) {
        var valueElt = _({
            tag: 'text',
            class: 'vc-piece-value',
            style: {
                fill: Color.parse(piece.fillColor + '').getContrastYIQ()
            },
            child: { text: piece.valueText || piece.value }
        });
        thisC.$pie.addChild(valueElt);
        return valueElt;
    });

};

PieChart.prototype.computeNotes = function (){
    return this.pieces.map(function (piece){
        return {
          color:  piece.fillColor,
            text: piece.name,
            type: 'rect'
        }
    });
};

PieChart.prototype._createContent = function () {
    BChart.prototype._createContent.call(this);
    this._createPie();
};

PieChart.prototype._updatePiePosition = function () {
    var piece, pieceElt;
    var sum = this.pieces.reduce(function (ac, cr) {
        return ac + cr.value;
    }, 0);

    this.$pieCenter = _({
        tag: 'circle',
        attr: {
            cx: 0,
            cy: 0,
            r: 1
        },
        style: {
            fill: 'transparent'
        }
    });
    this.$pie.addChild(this.$pieCenter);
    var pieCenterBound = this.$pieCenter.getBBox();

    for (var k = 0; k < 50; ++k) {
        var startAngle = -Math.PI / 2;
        var endAngle = 0;
        var valueElt;
        var valueBound;
        var x0, y0;
        var r = Math.min(this.$pieCtn.box.width - 5, this.$pieCtn.box.height - 5) / 2 * (1 - k / 150);
        var sr = Math.max(3, r / 15);
        for (var i = 0; i < this.pieces.length; ++i) {
            piece = this.pieces[i];
            pieceElt = this.$pieces[i];
            valueElt = this.$pieceValues[i];
            if (piece.value === 0) {
                pieceElt.addStyle('display', 'none');
                valueElt.addStyle('display', 'none');
            }
            else {
                pieceElt.removeStyle('display');
                valueElt.removeStyle('display');
            }
            endAngle = startAngle + Math.PI * 2 * piece.value / sum;
            x0 = 0;
            y0 = 0;
            if (piece.separated) {
                x0 += sr * Math.cos((startAngle + endAngle) / 2);
                y0 += sr * Math.sin((startAngle + endAngle) / 2);
            }
            pieceElt.begin();

            if (piece.value < sum) {
                pieceElt.moveTo(x0, y0);

                pieceElt.lineTo(x0 + r * Math.cos(startAngle), y0 + r * Math.sin(startAngle))
            }
            else {
                pieceElt.moveTo(x0 + r * Math.cos(startAngle), y0 + r * Math.sin(startAngle));
            }

            pieceElt.arcTo(x0 + r * Math.cos((startAngle + endAngle) / 2), y0 + r * Math.sin((startAngle + endAngle) / 2), r, r, 0, 1, 0)
                .arcTo(x0 + r * Math.cos(endAngle), y0 + r * Math.sin(endAngle), r, r, 0, 1, 0)
                .closePath()
                .end();
            valueBound = valueElt.getBBox();
            if (piece.value === sum) {
                valueElt.attr({
                    x: 0,
                    y: 7
                });
            }
            else {
                valueElt.attr({
                    x: x0 + (r - 20 - valueBound.width / 2) * Math.cos((startAngle + endAngle) / 2),
                    y: y0 + (r - 20 - valueBound.height / 2) * Math.sin((startAngle + endAngle) / 2) + 7
                });
            }

            startAngle = endAngle;
        }
        var piePound = this.$pie.getBBox();
        if (piePound.width < this.$pieCtn.box.width && piePound.height < this.$pieCtn.box.height) {
            this.$pie.box.setPosition(
                this.$pieCtn.box.width / 2 - (piePound.width / 2 - (pieCenterBound.x + 1 - piePound.x)),
                this.$pieCtn.box.height / 2 - (piePound.height / 2 - (pieCenterBound.y + 1 - piePound.y))
            )
            break;
        }
    }

};

PieChart.prototype._updateBodyPosition = function (){
    BChart.prototype._updateBodyPosition.call(this);
    this._updatePiePosition();
}

PieChart.prototype._normalizeData = function () {
    var blockColors = generateBackgroundColors(this.pieces.length);
    this.pieces.forEach(function (piece, i) {
        piece.fillColor = piece.fillColor || blockColors[i];
    });
};

PieChart.property = Object.assign({}, BChart.property);

Vcore.install(PieChart);

export default PieChart;