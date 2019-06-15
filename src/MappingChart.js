import Vcore from "./VCore";
import BaseChart from "./BaseChart";
import { text, circle, hline, moveHLine, rect, map, isNumber } from "./helper";
import { translate } from "./template";
import { hostname } from "os";
import { throws } from "assert";


var _ = Vcore._;
var $ = Vcore.$;

var STATE_READY = 0;
var STATE_MODIFY = 1;


function MappingChart() {
    var res = _({
        tag: 'svg',
        attr: {
            tabindex: '1'
        },
        class: 'mapping-chart',
        extendEvent: ['add', 'addmakertop', 'addmarkerbot', 'clicktop', 'clickbot'],
        child: ['g.background', 'g.forceground']
    });

    res.$background = $('g.background', res);
    res.$forceground = $('g.forceground', res);
    res.sync = res.afterAttached();

    return res;
};




MappingChart.prototype.preInit = function () {
    this.canvasWidth = 300;
    this.canvasHeight = 300;
    this.rangePlotRadius = 6;
    this.axisTop = 70;
    this.hitboxHeight = 20;
    this.tempValue = 0;
    this.markerHitboxWidth = 1;

}

MappingChart.prototype.updateSize = BaseChart.prototype.updateSize;
MappingChart.prototype.numberToString = BaseChart.prototype.numberToString;





MappingChart.prototype.initAxis = function () {
    this.$topLine = hline(50, 50, 500, 'mapping-chart-range-line').addTo(this.$background);
    this.$botLine = hline(50, 50, 500, 'mapping-chart-range-line').addTo(this.$background);


    this.$topMinText = text(this.min + '', 20, 20, 'mapping-chart-range-text').addTo(this.$background);
    this.$topMaxText = text(this.max + '', 30, 20, 'mapping-chart-range-text').addTo(this.$background);
    this.$botMinText = text(this.min + '', 20, 50, 'mapping-chart-range-text').addTo(this.$background);
    this.$botMaxText = text(this.max + '', 30, 50, 'mapping-chart-range-text').addTo(this.$background);

    this.$topMinPlot = circle(25, 20, this.rangePlotRadius, 'mapping-chart-range-plot').addTo(this.$background);
    this.$topMaxPlot = circle(55, 20, this.rangePlotRadius, 'mapping-chart-range-plot').addTo(this.$background);

    this.$botMinPlot = circle(25, 50, this.rangePlotRadius, 'mapping-chart-range-plot').addTo(this.$background);
    this.$botMaxPlot = circle(55, 50, this.rangePlotRadius, 'mapping-chart-range-plot').addTo(this.$background);



    this.$title = text(this.title, 0, 25, 'mapping-chart-title').addTo(this.$background).attr('text-anchor', 'middle');

};


MappingChart.prototype.updateAxis = function () {

    this.axisLeft = 10 + this.$topMinText.getBBox().width + 10;
    var maxTextWidth = this.$botMaxText.getBBox().width;
    this.axisRight = this.canvasWidth - 10 - maxTextWidth - 10;
    this.axisBottom = this.canvasHeight - 50;

    this.$topMinText.attr({
        x: '10',
        y: this.axisTop - 4 + ''
    });

    this.$topMaxText.attr({
        x: this.canvasWidth - 10 - maxTextWidth,
        y: this.axisTop - 4 + ''
    });

    this.$botMinText.attr({
        x: '10',
        y: this.axisBottom + 4 + 14
    });
    this.$botMaxText.attr({
        x: this.canvasWidth - 10 - maxTextWidth,
        y: this.axisBottom + 4 + 14
    });

    this.$topMinPlot.attr({
        cx: this.axisLeft,
        cy: this.axisTop
    });

    this.$topMaxPlot.attr({
        cx: this.axisRight,
        cy: this.axisTop
    });


    moveHLine(this.$topLine, this.axisLeft, this.axisTop, this.axisRight - this.axisLeft);

    this.$botMinPlot.attr({
        cx: this.axisLeft,
        cy: this.axisBottom
    });
    this.$botMaxPlot.attr({
        cx: this.axisRight,
        cy: this.axisBottom
    });

    moveHLine(this.$botLine, this.axisLeft, this.axisBottom, this.axisRight - this.axisLeft);

    this.$title.attr({
        x: this.canvasWidth / 2,
        y: 10 + 20
    });
};

MappingChart.prototype.initHitbox = function () {
    this.$topHitbox = rect(20, 20, 300, 20, 'vchart-hitbox')
        .on({
            mouseenter: this.eventEnterHitboxHandler.bind(this),
            mouseleave: this.eventLeaveHitboxHandler.bind(this),
            click: this.eventClickHitboxHandler.bind(this)
        })
        .addTo(this.$forceground);
    this.$botHitbox = rect(20, 80, 300, 20, 'vchart-hitbox')
        .on({
            mouseenter: this.eventEnterHitboxHandler.bind(this),
            mouseleave: this.eventLeaveHitboxHandler.bind(this),
            click: this.eventClickHitboxHandler.bind(this)
        }).addTo(this.$forceground);
};


MappingChart.prototype.updateHitbox = function () {
    this.$topHitbox.attr({
        x: this.axisLeft,
        y: this.axisTop - this.hitboxHeight / 2,
        height: this.hitboxHeight,
        width: this.axisRight - this.axisLeft
    });
    this.$botHitbox.attr({
        x: this.axisLeft,
        y: this.axisBottom - this.hitboxHeight / 2,
        height: this.hitboxHeight,
        width: this.axisRight - this.axisLeft
    });
};


MappingChart.prototype.initTempmarker = function () {
    this.$tempTopMarker = _('mappingchartmarker.top').addTo(this.$forceground);
    this.$tempBotMarker = _('mappingchartmarker.bot').addTo(this.$forceground);
    this.$tempTopMarker.rotate180 = true;
    this.$tempTopMarker.text = this.min;
    this.$tempBotMarker.text = this.min;
};


MappingChart.prototype.updateTempMarker = function () {
    //todo
    if (isNumber(this.collision)) {
        this.markerHitboxWidth = Math.max(1, map(this.collision, 0, this.max - this.min, 0, this.axisRight - this.axisLeft));
    }
    this.$tempTopMarker.moveTo(this.axisLeft, this.axisTop);
    this.$tempBotMarker.moveTo(this.axisLeft, this.axisBottom);
    this.$tempTopMarker.hitboxWidth = this.markerHitboxWidth;
    this.$tempBotMarker.hitboxWidth = this.markerHitboxWidth;

};


MappingChart.prototype.initComp = function () {
    this.initAxis();
    this.initTempmarker();
    this.initHitbox();
};

MappingChart.prototype.updateComp = function () {
    this.updateAxis();
    this.updateHitbox();
    this.updateTempMarker();

};


MappingChart.prototype.update = function () {
    this.updateSize();

    this.updateComp();

};

MappingChart.prototype.addMarkerTop = function (value) {
    var value = Math.round(this.tempValue / 100000) * 100000;
    var cLine;

    if (!this._tempLine) {
        this._tempLine = {
            value: 0,//default
            $line: _('shape.mapping-chart-map-line').addTo(this.$background),
            $topMarker: _({
                tag: 'mappingchartmarker',
            }).addTo(this.$forceground),
            $topPlot: circle(20, 20, 5, 'mapping-chart-line-plot').addTo(this.$forceground)
        }
    }
    this._tempLine.value = value;
    var x0 = map(value, this.min, this.max, this.axisLeft, this.axisRight);
    var y0 = this.axisTop;
    this._tempLine.x0 = x0;
    this._tempLine.y0 = y0;
    this._tempLine.$topMarker.moveTo(x0, y0);
    this._tempLine.$topPlot.attr({
        cx: x0,
        cy: y0
    });
    this._tempLine.$topMarker.text = this.numberToString(value);
    this.emit('addmakertop', {
        target: this,
        data: this._tempLine
    }, this);


    var self = this;
    var lineElt = this._tempLine.$line;
    function mouseMoveHandler(event) {
        lineElt.begin().moveTo(x0, y0).lineTo(self.mouseX, self.mouseY).end();

    }



    this.on('mousemove', mouseMoveHandler);
    this.once('addmarkerbot', function () {
        this.off('mousemove', mouseMoveHandler);
    });

    this.once('addmakertop', function () {
        this.off('mousemove', mouseMoveHandler);
    });


};

MappingChart.prototype.addMarkerBottom = function (mapValue) {
    if (!this._tempLine) return;//must click top first
    var mapValue = Math.round(this.tempValue / 100000) * 100000;
    var isCross = this._checkLineIsCross(this._tempLine.value, mapValue);
    if (isCross) return;
    var x1 = map(mapValue, this.min, this.max, this.axisLeft, this.axisRight);
    var y1 = this.axisBottom;
    this._tempLine.mapValue = mapValue;
    this._tempLine.$botMarker = _({
        tag: 'mappingchartmarker',
        props: {
            text: this.numberToString(mapValue),
            rotate180: true
        }
    })
        .moveTo(x1, y1)
        .addTo(this.$forceground);

    this._tempLine.x1 = x1;
    this._tempLine.y1 = y1;

    this._tempLine.$botPlot = circle(20, 80, 5, 'mapping-chart-line-plot').addTo(this.$forceground);

    this._tempLine.$botPlot.attr({
        cx: x1,
        cy: y1
    });

    this._tempLine.$line.begin()
        .moveTo(this._tempLine.x0, this._tempLine.y0)
        .lineTo(x1, y1)
        .end();

    var tempLine = this._tempLine;
    var self = this;
    function clickLineHandler(event) {
        self._selectedLine = tempLine;
        tempLine.$line.addClass('selected-line');
    }

    var lineElt = tempLine.$line;
    function clickTopPlotHandler(event) {
        self.state = STATE_MODIFY;
        tempLine.$topMarker.addStyle('visibility', 'hidden');
        tempLine.$topPlot.addStyle('visibility', 'hidden');
        function mouseMoveHandler(event) {
            lineElt.begin().moveTo(self.mouseX, self.mouseY).lineTo(tempLine.x1, tempLine.y1).end();
        }

        function clickTopBarHandler(event, sender) {
            var newValue = self.tempValue;
            if (self._checkLineIsCross(newValue, tempLine.mapValue)) {
            }
            else {
                var newX0 = map(newValue, this.min, this.max, this.axisLeft, this.axisRight);
                lineElt.begin().moveTo(newX0, tempLine.y0).lineTo(tempLine.x1, tempLine.y1).end();
                tempLine.$topMarker.moveTo(newX0, tempLine.y0);
                tempLine.$topMarker.text = self.numberToString(newValue);
                tempLine.$topPlot.attr({
                    cx: newX0,
                    cy: tempLine.y0
                });
                tempLine.x0 = newX0;

                tempLine.$topMarker.removeStyle('visibility', 'hidden');
                tempLine.$topPlot.removeStyle('visibility', 'hidden');

                self.off('clicktop', clickTopBarHandler);
                self.off('mousemove', mouseMoveHandler);
                self.off('keydown', KeyDownHandler);
                self.state = STATE_READY;
            }
            
        }
        function cancel(){
            lineElt.begin().moveTo(tempLine.x0, tempLine.y0).lineTo(tempLine.x1, tempLine.y1).end();
        };
        
        function deleteElt(){
            tempLine.$topMarker.remove();
            tempLine.$topPlot.remove();
            tempLine.$botMarker.remove();
            tempLine.$botPlot.remove();
            tempLine.$line.remove();
            self._lineList = self._lineList.filter(function(elt){
                return ((elt.value != tempLine.value) && (elt.mapValue != tempLine.mapValue));
            });
            console.log(self._lineList);
        };
        
        function KeyDownHandler(event) {
            tempLine.$topMarker.removeStyle('visibility', 'hidden');
            tempLine.$topPlot.removeStyle('visibility', 'hidden');
            if (event.key == "Escape") {
                cancel();
                event.preventDefault();
            } else if (event.key == "Delete") {
                deleteElt();
                event.preventDefault();
            }
            self.off('clicktop', clickTopBarHandler);
            self.off('mousemove', mouseMoveHandler);
            self.off('keydown', KeyDownHandler);
            self.state = STATE_READY;
        };
        
        self.on('clicktop', clickTopBarHandler);
        
        self.on('mousemove', mouseMoveHandler);

        self.on('keydown', KeyDownHandler);

    }

    function clickBotPlotHandler(event) {
        self.state = STATE_MODIFY;
        tempLine.$botMarker.addStyle('visibility', 'hidden');
        tempLine.$botPlot.addStyle('visibility', 'hidden');
        function mouseMoveHandler(event) {
            lineElt.begin().moveTo(tempLine.x0, tempLine.y0).lineTo(self.mouseX, self.mouseY).end();
        }

        function clickBotBarHandler(event, sender) {
            var newValue = self.tempValue;
            if (self._checkLineIsCross(tempLine.value, newValue)) {
            }
            else {
                var newX1 = map(newValue, this.min, this.max, this.axisLeft, this.axisRight);
                lineElt.begin().moveTo(tempLine.x0, tempLine.y0).lineTo(newX1, tempLine.y1).end();
                tempLine.$botMarker.moveTo(newX1, tempLine.y1);
                tempLine.$botMarker.text = self.numberToString(newValue);
                tempLine.$botPlot.attr({
                    cx: newX1,
                    cy: tempLine.y1
                });
                tempLine.x1 = newX1;

                tempLine.$botMarker.removeStyle('visibility', 'hidden');
                tempLine.$botPlot.removeStyle('visibility', 'hidden');

                self.off('clickbot', clickBotBarHandler);
                self.off('mousemove', mouseMoveHandler);
                self.off('keydown', KeyDownHandler);
                self.state = STATE_READY;
            }

        }
        function cancel(){
            lineElt.begin().moveTo(tempLine.x0, tempLine.y0).lineTo(tempLine.x1, tempLine.y1).end();
        };
        
        function deleteElt(){
            tempLine.$topMarker.remove();
            tempLine.$topPlot.remove();
            tempLine.$botMarker.remove();
            tempLine.$botPlot.remove();
            tempLine.$line.remove();
            console.log(tempLine);
            self._lineList = self._lineList.filter(function(elt){
                return ((elt.value != tempLine.value) && (elt.mapValue != tempLine.mapValue));
            });
            console.log(self._lineList);
        };
        
        function KeyDownHandler(event) {
            tempLine.$botMarker.removeStyle('visibility', 'hidden');
            tempLine.$botPlot.removeStyle('visibility', 'hidden');
            if (event.key == "Escape") {
                cancel();
                event.preventDefault();
            } else if (event.key == "Delete") {
                deleteElt();
                event.preventDefault();
            }
            self.off('clickbot', clickBotBarHandler);
            self.off('mousemove', mouseMoveHandler);
            self.off('keydown', KeyDownHandler);
            self.state = STATE_READY;
        };

        self.on('clickbot', clickBotBarHandler);

        self.on('mousemove', mouseMoveHandler);

        self.on('keydown', KeyDownHandler);

    }

    this._tempLine.$line.on("click", clickLineHandler);
    this._tempLine.$topPlot.on("click", clickTopPlotHandler);
    this._tempLine.$botPlot.on("click", clickBotPlotHandler);


    this._lineList.push(this._tempLine);
    this._tempLine = undefined;
    this.emit('addmarkerbot', {
        target: this,
        data: tempLine
    }, this)
};

MappingChart.prototype._checkLineIsCross = function (value, mapValue) {
    return this._lineList.some(function (element) {
        return (element.value - value) * (element.mapValue - mapValue) < 0;
    });
};




MappingChart.prototype.eventEnterHitboxHandler = function (event) {
    if (this.__removeClassTimeOut) {
        clearTimeout(this.__removeClassTimeOut);
        self.__removeClassTimeOut = false;
    }
    if (event.target == this.$topHitbox) {
        this.addClass('mapping-chart-hover-top');
    }
    else if (event.target == this.$botHitbox) {
        this.addClass('mapping-chart-hover-bot');
    }
};

MappingChart.prototype.eventLeaveHitboxHandler = function (event) {
    var target = event.target;
    var self = this;


    if (target == self.$topHitbox) {

        if (this.__removeClassTimeOutTop) {
            clearTimeout(this.__removeClassTimeOutTop);
            self.__removeClassTimeOutTop = false;
        }
        this.__removeClassTimeOutTop = setTimeout(function () {
            self.removeClass('mapping-chart-hover-top');
            self.__removeClassTimeOutTop = false;
        }, 100);
    }
    else if (target == self.$botHitbox) {
        if (this.__removeClassTimeOutBot) {
            clearTimeout(this.__removeClassTimeOutBot);
            self.__removeClassTimeOutBot = false;
        }
        self.__removeClassTimeOutBot = setTimeout(function () {
            self.removeClass('mapping-chart-hover-bot');
            self.__removeClassTimeOutBot = false;
        }, 100)
    }


};

MappingChart.prototype.eventClickHitboxHandler = function (event) {
    var target = event.target;
    if (target == this.$topHitbox) {
        if (this.state == STATE_READY) {
            this.addMarkerTop(this.tempValue);
        }

        this.emit('clicktop', {}, this);
    }
    else if (target == this.$botHitbox) {
        if (this.state == STATE_READY) {
            this.addMarkerBottom(this.tempValue);
        }
        this.emit('clickbot', {}, this);

    }
};


MappingChart.prototype.eventMoveHandler = function (event) {
    var hitboxBound = this.$botHitbox.getBoundingClientRect();
    var eventX = event.clientX;
    var tempValue = map(eventX, hitboxBound.left, hitboxBound.right, this.min, this.max);
    this.tempValue = Math.min(this.max, Math.max(this.min, tempValue));
    var newX = map(this.tempValue, this.min, this.max, this.axisLeft, this.axisRight);
    this.$tempTopMarker.moveTo(newX, this.axisTop);
    this.$tempBotMarker.moveTo(newX, this.axisBottom);
    var markerText = this.numberToString(this.tempValue);
    this.$tempTopMarker.text = markerText;
    this.$tempBotMarker.text = markerText;
    // client XY to local pointer XY

    var bound = this.getBoundingClientRect();
    this.mouseX = map(event.clientX, bound.left, bound.right, 0, this.canvasWidth);
    this.mouseY = map(event.clientY, bound.top, bound.bottom, 0, this.canvasHeight);
    this.$pointer.attr({
        cx: this.mouseX,
        cy: this.mouseY,

    })
};


MappingChart.prototype.cancelCMD = function () {
    if (this._tempLine) {
        this._tempLine.$line.remove();
        this._tempLine.$topMarker.remove();
        this._tempLine.$topPlot.remove();
        this._tempLine = undefined;
    }
    else {

    }
};
MappingChart.prototype.deleteCMD = function () {
    if (this._tempLine) {
        this._tempLine.$line.remove();
        this._tempLine.$topMarker.remove();
        this._tempLine.$topPlot.remove();
        this._tempLine = undefined;
    }
    else {
        if (this._selectedLine){
            var tempLine = this._selectedLine;
            tempLine.$line.remove();
            tempLine.$botMarker.remove();
            tempLine.$botPlot.remove();
            tempLine.$topMarker.remove();
            tempLine.$topPlot.remove();
            this._lineList = this._lineList.filter(function(elt){
                return ((elt.value != tempLine.value) && (elt.mapValue != tempLine.mapValue));
            });
            this._selectedLine = undefined;
            console.log(this._lineList);
        }
    }
};


MappingChart.prototype.eventKeyDownHandler = function (event) {
    if (event.key == "Escape") {
        this.cancelCMD();
        event.preventDefault();
    } else if (event.key == "Delete") {
        this.deleteCMD();
        event.preventDefault();
    }
};

MappingChart.prototype.setLineElt = function(value, mapValue){
    value = Math.round(value / 100000) * 100000;
    mapValue = Math.round(mapValue / 100000) * 100000;
    var x0 = map(value, this.min, this.max, this.axisLeft, this.axisRight);
    var y0 = this.axisTop;
    var x1 = map(mapValue, this.min, this.max, this.axisLeft, this.axisRight);
    var y1 = this.axisBottom;
    console.log(value, mapValue);
    console.log(x0, y0, x1, y1);
    console.log(this.min, this.max, this.axisTop, this.axisBottom, this.axisLeft, this.axisRight);
    var tempLine;
    var cLine;
    tempLine = {
        value: value,
        mapValue: mapValue,
        $line: _('shape.mapping-chart-map-line').addTo(this.$background),
        $topMarker: _({
            tag: 'mappingchartmarker',
        }).addTo(this.$forceground),
        $topPlot: circle(20, 20, 5, 'mapping-chart-line-plot').addTo(this.$forceground),
        $botMarker: _({
            tag: 'mappingchartmarker',
        }).addTo(this.$forceground),
        $botPlot: circle(20, 20, 5, 'mapping-chart-line-plot').addTo(this.$forceground),
        x0: x0,
        x1: x1,
        y0: y0,
        y1: y1
    }
    tempLine.x0 = x0;
    tempLine.y0 = y0;
    tempLine.x1 = x1;
    tempLine.y1 = y1;
    tempLine.$topMarker.moveTo(x0, y0);
    tempLine.$topPlot.attr({
        cx: x0,
        cy: y0
    });
    tempLine.$botMarker.moveTo(x1, y1);
    tempLine.$botPlot.attr({
        cx: x1,
        cy: y1
    });
    tempLine.$topMarker.text = this.numberToString(value);
    tempLine.$botMarker.text = this.numberToString(mapValue);
    tempLine.$line.begin().moveTo(x0, y0).lineTo(x1, y1).end();
    var self = this;
    function clickLineHandler(event) {
        self._selectedLine = tempLine;
        tempLine.$line.addClass('selected-line');
    }

    var lineElt = tempLine.$line;
    function clickTopPlotHandler(event) {
        self.state = STATE_MODIFY;
        tempLine.$topMarker.addStyle('visibility', 'hidden');
        tempLine.$topPlot.addStyle('visibility', 'hidden');
        function mouseMoveHandler(event) {
            lineElt.begin().moveTo(self.mouseX, self.mouseY).lineTo(tempLine.x1, tempLine.y1).end();
        }

        function clickTopBarHandler(event, sender) {
            var newValue = self.tempValue;
            if (self._checkLineIsCross(newValue, tempLine.mapValue)) {
            }
            else {
                var newX0 = map(newValue, this.min, this.max, this.axisLeft, this.axisRight);
                lineElt.begin().moveTo(newX0, tempLine.y0).lineTo(tempLine.x1, tempLine.y1).end();
                tempLine.$topMarker.moveTo(newX0, tempLine.y0);
                tempLine.$topMarker.text = self.numberToString(newValue);
                tempLine.$topPlot.attr({
                    cx: newX0,
                    cy: tempLine.y0
                });
                tempLine.x0 = newX0;

                tempLine.$topMarker.removeStyle('visibility', 'hidden');
                tempLine.$topPlot.removeStyle('visibility', 'hidden');

                self.off('clicktop', clickTopBarHandler);
                self.off('mousemove', mouseMoveHandler);
                self.off('keydown', KeyDownHandler);
                self.state = STATE_READY;
            }
            
        }
        function cancel(){
            lineElt.begin().moveTo(tempLine.x0, tempLine.y0).lineTo(tempLine.x1, tempLine.y1).end();
        };
        
        function deleteElt(){
            tempLine.$topMarker.remove();
            tempLine.$topPlot.remove();
            tempLine.$botMarker.remove();
            tempLine.$botPlot.remove();
            tempLine.$line.remove();
            self._lineList = self._lineList.filter(function(elt){
                return ((elt.value != tempLine.value) && (elt.mapValue != tempLine.mapValue));
            });
            console.log(self._lineList);
        };
        
        function KeyDownHandler(event) {
            tempLine.$topMarker.removeStyle('visibility', 'hidden');
            tempLine.$topPlot.removeStyle('visibility', 'hidden');
            if (event.key == "Escape") {
                cancel();
                event.preventDefault();
            } else if (event.key == "Delete") {
                deleteElt();
                event.preventDefault();
            }
            self.off('clicktop', clickTopBarHandler);
            self.off('mousemove', mouseMoveHandler);
            self.off('keydown', KeyDownHandler);
            self.state = STATE_READY;
        };
        
        self.on('clicktop', clickTopBarHandler);
        
        self.on('mousemove', mouseMoveHandler);

        self.on('keydown', KeyDownHandler);

    }

    function clickBotPlotHandler(event) {
        self.state = STATE_MODIFY;
        tempLine.$botMarker.addStyle('visibility', 'hidden');
        tempLine.$botPlot.addStyle('visibility', 'hidden');
        function mouseMoveHandler(event) {
            lineElt.begin().moveTo(tempLine.x0, tempLine.y0).lineTo(self.mouseX, self.mouseY).end();
        }

        function clickBotBarHandler(event, sender) {
            var newValue = self.tempValue;
            if (self._checkLineIsCross(tempLine.value, newValue)) {
            }
            else {
                var newX1 = map(newValue, this.min, this.max, this.axisLeft, this.axisRight);
                lineElt.begin().moveTo(tempLine.x0, tempLine.y0).lineTo(newX1, tempLine.y1).end();
                tempLine.$botMarker.moveTo(newX1, tempLine.y1);
                tempLine.$botMarker.text = self.numberToString(newValue);
                tempLine.$botPlot.attr({
                    cx: newX1,
                    cy: tempLine.y1
                });
                tempLine.x1 = newX1;

                tempLine.$botMarker.removeStyle('visibility', 'hidden');
                tempLine.$botPlot.removeStyle('visibility', 'hidden');

                self.off('clickbot', clickBotBarHandler);
                self.off('mousemove', mouseMoveHandler);
                self.off('keydown', KeyDownHandler);
                self.state = STATE_READY;
            }

        }
        function cancel(){
            lineElt.begin().moveTo(tempLine.x0, tempLine.y0).lineTo(tempLine.x1, tempLine.y1).end();
        };
        
        function deleteElt(){
            tempLine.$topMarker.remove();
            tempLine.$topPlot.remove();
            tempLine.$botMarker.remove();
            tempLine.$botPlot.remove();
            tempLine.$line.remove();
            console.log(tempLine);
            self._lineList = self._lineList.filter(function(elt){
                return ((elt.value != tempLine.value) && (elt.mapValue != tempLine.mapValue));
            });
            console.log(self._lineList);
        };
        
        function KeyDownHandler(event) {
            tempLine.$botMarker.removeStyle('visibility', 'hidden');
            tempLine.$botPlot.removeStyle('visibility', 'hidden');
            if (event.key == "Escape") {
                cancel();
                event.preventDefault();
            } else if (event.key == "Delete") {
                deleteElt();
                event.preventDefault();
            }
            self.off('clickbot', clickBotBarHandler);
            self.off('mousemove', mouseMoveHandler);
            self.off('keydown', KeyDownHandler);
            self.state = STATE_READY;
        };

        self.on('clickbot', clickBotBarHandler);

        self.on('mousemove', mouseMoveHandler);

        self.on('keydown', KeyDownHandler);

    }

    tempLine.$line.on("click", clickLineHandler);
    tempLine.$topPlot.on("click", clickTopPlotHandler);
    tempLine.$botPlot.on("click", clickBotPlotHandler);
    this._lineList.push(tempLine);
}



MappingChart.property = {};

MappingChart.property.content = {
    set: function(content){
        this._lineList.forEach(function(lineData){
            Object.keys(lineData).forEach(function(key){
                if (typeof lineData[key].remove == 'function') lineData[key].remove(); 
            })
        });

        this._lineList = [];//todo
        this.sync.then(function(){
            for(var i = 0; i < content.length; i++){
                this.setLineElt(content[i].value, content[i].mapValue);
            }

        }.bind(this));
        //
    },
    get: function(){
        var ret =  this._lineList.map(function(lineData){
            return {
                value:lineData.value,
                mapValue: lineData.mapValue
            }
        });

        ret.sort(function(a, b){
            return a.value - b.value;
        })

        return ret;
    }
};


/**
 * @typedef MapLine
 * @property {Number} value
 * @property {Number} mapValue
 * @property {Path} $line
 * @property {MappingChartMarker} $topMarker
 * @property {MappingChartMarker} $botMarker
 */




MappingChart.prototype.init = function (props) {
    this.on('mousemove', this.eventMoveHandler.bind(this));
    this.on('keydown', this.eventKeyDownHandler.bind(this));
    this.preInit();
    this._lineList = [];
    this.sync = this.sync.then(this.update.bind(this));
    this.super(props);
    this.state = STATE_READY;
    /**
    * @type {Array<MapLine>}
    */
    this.$pointer = circle(0, 0, 5).addTo(this.$background);

    this.initComp();

    
};


function MappingChartMarker() {
    var res = _({
        // tag:'g',
        class: 'mapping-chart-marker',
        attr: {
            transform: translate(200, 200)
        }
    });

    res.$box = _('shape.mapping-chart-marker-box')
        .addTo(res);

    res.$text = text('', 0, -10, 'mapping-chart-marker-text').attr('text-anchor', 'middle').addTo(res);
    res.$hitbox = rect(-3, -30, 6, 60, 'vchart-hitbox').addTo(res);
    res.sync = res.afterAttached();
    return res;
}


MappingChartMarker.prototype.updateBox = function () {
    var textBBox = this.$text.getBBox();
    if (this.rotate180) {
        this.$box.begin()
            .moveTo(0, 0)
            .lineTo(-2, 5)
            .lineTo(-textBBox.width / 2 - 5, 5)
            .lineTo(-textBBox.width / 2 - 5, textBBox.height + 2 + 5)
            .lineTo(textBBox.width / 2 + 5, +textBBox.height + 2 + 5)
            .lineTo(textBBox.width / 2 + 5, 5)
            .lineTo(2, 5)
            .end();
        this.$text.attr('y', 3 + textBBox.height);
    }
    else {
        this.$box.begin()
            .moveTo(0, 0)
            .lineTo(-2, -5)
            .lineTo(-textBBox.width / 2 - 5, -5)
            .lineTo(-textBBox.width / 2 - 5, -textBBox.height - 2 - 5)
            .lineTo(textBBox.width / 2 + 5, -textBBox.height - 2 - 5)
            .lineTo(textBBox.width / 2 + 5, - 5)
            .lineTo(2, - 5)
            .end();
        this.$text.attr('y', -10);
    }
};

MappingChartMarker.prototype.moveTo = function (x, y) {
    this.attr('transform', translate(x, y));
    return this;
};

MappingChartMarker.property = {};
MappingChartMarker.property.text = {
    set: function (value) {
        this._text = value + '';
        this.$text.innerHTML = this._text;
        this.updateBox();
    },
    get: function () {
        return this._text || '';
    }
};


MappingChartMarker.property.rotate180 = {
    set: function (value) {
        this._rotate180 = !!value;
        this.updateBox();
    },
    get: function () {
        return !!this._rotate180;
    }
}

MappingChartMarker.property.hitboxWidth = {
    set: function (value) {
        this.$hitbox.attr({
            width: value,
            x: -value / 2
        })
    },
    get: function () {
        return parseFloat(this.$hitbox.attr('width'));
    }
};

MappingChartMarker.attribute = {};

MappingChartMarker.attribute.rotate180 = {
    set: function (value) {
        this.rotate180 = value == 'true' || value === true;
    },
    get: function () {
        return this.rotate180 ? 'true' : 'false'
    },
    remove: function () {
        this.rotate180 = false;
    }
};

MappingChartMarker.attribute.rotate180 = {
    set: function (value) {
        value = parseFloat(value + '');
        if (isNumber(value)) {
            this.hitboxWidth = value;
        }
    },
    get: function () {
        return this.hitboxWidth + '';
    },
    remove: function () {
        this.hitboxWidth = 6;
    }
};


MappingChartMarker.prototype.init = function (props) {
    this.super(props);
    this.sync.then(this.updateBox.bind(this))
};



Vcore.creator.mappingchartmarker = MappingChartMarker;


Vcore.creator.mappingchart = MappingChart;
export default MappingChart;