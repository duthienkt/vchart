import Vcore from "./VCore";
import Color from 'absol/src/Color/Color';
var _ = Vcore._;


export var beautyStep = [
    0.001, 0.002, 0.0025, 0.005,
    0.01, 0.02, 0.025, 0.05,
    0.1, 0.2, 0.25, 0.5,
    1, 2, 5].concat((function () {
        var res = [];
        var h = 1;
        while (h < 10000000000) {
            res.push(10 * h);
            res.push(20 * h);
            res.push(25 * h);
            res.push(50 * h);
            h *= 10;
        }
        return res;
    })());



export function circle(x, y, r, eClss) {
    return _({
        tag: 'circle',
        class: eClss,
        attr: {
            cx: x,
            cy: y,
            r: r
        }
    });
};

/**
 * @param {String} text
 * @param {Number} x
 * @param {Number} y
 * @param {String} eClss - can be undefine
 * @returns {SVGTextElement} 
 */
export function text(text, x, y, eClss) {
    if (eClss instanceof Array) eClss = eClss.join(' ');
    return _('<text x="' + x + '" y="' + y + '" ' + (eClss ? 'class="' + eClss + '"' : '') + '>' + text + '</text>')
};

export function vline(x, y, length, eClss) {
    return _({
        tag: 'path',
        class: eClss,
        attr: {
            d: 'm' + x + ' ' + y + 'v' + length
        }
    });
};

export function moveVLine(e, x, y, length) {
    return e.attr('d', 'm' + x + ' ' + y + 'v' + length);
};

export function hline(x, y, length, eClss) {
    return _({
        tag: 'path',
        class: eClss,
        attr: {
            d: 'm' + x + ' ' + y + 'h' + length
        }
    });
};

export function moveHLine(e, x, y, length) {
    return e.attr('d', 'm' + x + ' ' + y + 'h' + length);
};

export function rect(x, y, width, height, eClss) {
    var option = {
        tag: 'rect',
        attr: {
            x: x,
            y: y,
            width: width,
            height: height
        },
        class: eClss
    };
    return _(option);
};



export function calBeautySegment(maxSegment, minValue, maxValue) {
    var i = 0;
    var res = { step: 1, segmentCout: maxValue - minValue, maxValue: maxValue, minValue: minValue };
    while (i < beautyStep.length) {
        var step = beautyStep[i];
        var bot = Math.floor(minValue / step);
        var top = Math.ceil(maxValue / step);
        if (top - bot <= maxSegment) {
            res.step = step;
            res.segmentCout = top - bot;
            res.maxValue = top * step;
            res.minValue = bot * step;
            break;
        }
        ++i;
    }
    return res;
};



//x[i] < x[i+1] 
export function autoCurve(points, strong, free) {
    if (!(strong > 0)) strong = 0.5;
    if (points.length == 0) {
        return '';
    };
    var paddingLeft = points[0].slice();
    var paddingRight = points[points.length - 1].slice();
    if (typeof free == "number") {
        paddingLeft[0] -= (points[1][0] - points[0][0]) * free;
        paddingLeft[1] -= (points[1][1] - points[0][1]) * free;

        paddingRight[0] += (points[points.length - 1][0] - points[points.length - 2][0]) * free;
        paddingRight[1] += (points[points.length - 1][1] - points[points.length - 2][1]) * free;
    }
    else if (free instanceof Array) {
        paddingLeft[0] -= free[0][0];
        paddingLeft[1] -= free[0][1];

        paddingRight[0] += free[1][0];
        paddingRight[1] += free[1][1];
    }
    points = [paddingLeft].concat(points).concat([paddingRight]);
    var Cs = [];
    Cs.push('M' + points[1].join(' '));

    for (var i = 1; i < points.length - 2; ++i) {
        var A = Math.makeVec2(points[i - 1]);
        var B = Math.makeVec2(points[i]);
        var C = Math.makeVec2(points[i + 1]);
        var D = Math.makeVec2(points[i + 2]);
        var AB = B.sub(A);
        var BC = C.sub(B);
        var CB = BC.inv();
        var DC = C.sub(D);
        var lAB = AB.abs();
        var lBC = BC.abs();
        var lDC = DC.abs();
        var lCB = lBC;
        var h1 = Math.sqrt(lAB * lBC);
        var h2 = Math.sqrt(lBC * lDC);
        if (h1 == 0) h1 = 1;
        if (h2 == 0) h2 = 1;

        var N1 = (AB.normalized()).add(BC.normalized()).normalized();
        var N2 = (CB.normalized()).add(DC.normalized()).normalized();

        var lN1 = lBC == 0 ? 0 : lBC * (N1.dot(BC) / (N1.abs() * BC.abs())) * h1 / (h1 + h2) * strong;
        var lN2 = lCB == 0 ? 0 : lCB * (N2.dot(CB) / (N2.abs() * CB.abs())) * h2 / (h1 + h2) * strong;
        N1 = N1.mult(lN1);
        N2 = N2.mult(lN2);
        var P1 = B.add(N1);
        var P2 = C.add(N2);
        var x1 = P1.x;
        var y1 = P1.y;
        var x2 = P2.x;
        var y2 = P2.y;
        var x = C.x;
        var y = C.y;
        Cs.push('C ' + x1 + ' ' + y1 + ', ' + x2 + ' ' + y2 + ', ' + x + ' ' + y);
    }
    return Cs.join('');
};



export function generateBackgroundColors(n) {
    var l = Math.ceil(Math.sqrt(n));
    var arrs = Array(n).fill(null).reduce(function (ac, cr, i) {
        var tail = ac[ac.length - 1];
        if (tail.length >= l) {
            var tail = [];
            ac.push(tail);
        }

        var color = Color.fromHSL(i / n, 0.296, 0.46);
        tail.push(color);
        return ac;
    }, [[]]);

    var res = [];
    var i = 0;
    while (res.length < n) {
        if (arrs[i].length > 0) {
            res.push(arrs[i].shift());
        }
        i = (i + 1) % arrs.length;
    }
    return res;
};

export function isNumber(x) {
    return -Infinity < x && x < Infinity;
};

export function map(x, l, h, L, H) {
    return L + (x - l) / (h - l) * (H - L);
}