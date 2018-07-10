/** 
 *  This object stores the current max or min values, the type of scale (linear
 *  or log), knows whether to display horizontally or vertically, allows 
 *  for choosing the color.
 *  
 *  I meant for the HeadsUpDisplay class in Viewer.js to be a general
 *  purpose class for all overlay data, but it now looks like its really
 *  built for 
 */
var ColorScaleConstants = {
    HORIZONTAL: 100,
    VERTICAL: 200,
    LINEAR: "LINEAR",
    LOG: "LOG"
};

function ColorScale(){
    this.maxValue = null;
    this.minValue = null;
    this.lowerCutoff = 0;
    this.upperCutoff = 100;
    this.minFraction = null; // lowerCutoff/maxValue
    this.maxFraction = null; // upperCutoff/maxValue
    this.orientation = ColorScaleConstants.VERTICAL;
    this.scale = ColorScaleConstants.LINEAR;
    this.minColor = "#715fff";
    this.maxColor = "#ff0000";
}

ColorScale.prototype.setScale = function(type){
    if(type === ColorScaleConstants.LINEAR || type === ColorScaleConstants.LOG){
        this.scale = type;
    } else {
        console.log("Incorrect type given to colorscale.setScale: " + type);
    }
};

ColorScale.prototype.setMaxValue = function(maxValue){
    this.maxValue = maxValue;
    if(this.upperCutoff > this.maxValue){
        this.upperCutoff = this.maxValue;
    }
    this.maxFraction = this.upperCutoff/this.maxValue;
    this.minFraction = this.lowerCutoff/this.maxValue;
};

ColorScale.prototype.setMinValue = function(minValue){
    this.minValue = minValue;
};

ColorScale.prototype.setUpperCutoff = function(value){
    this.upperCutoff = value;
    this.maxFraction = value/this.maxValue;
};

ColorScale.prototype.setLowerCutoff = function(value){
    this.lowerCutoff = value;
    this.minFraction = value/this.maxValue;
}

ColorScale.prototype.setOrientation = function(orientation){
    if(orientation === ColorScaleConstants.VERTICAL || orientation === ColorScaleConstants.HORIZONTAL){
        this.orientation = orientation;
    } else {
        console.log("Incorrect type given to colorscale.setOrientation: " + type);
    }
};

ColorScale.prototype.interpolateColor = function(fraction){
    // <editor-fold defaultstate="collapsed" desc="Interpolate between hex colors.">
    function d2h(d){return d.toString(16);}
    function h2d(h){return parseInt(h,16);}
    if(fraction <= this.minFraction){
        return this.minColor;
    }
    if(fraction >= this.maxFraction){
        return this.maxColor;
    }
    fraction = (fraction - this.minFraction)/(this.maxFraction-this.minFraction);
    var color = "#";
    for(var i=1;i<=6;i+=2){
        var minVal = new Number(h2d(this.minColor.substring(i,i+2)));
        var maxVal = new Number(h2d(this.maxColor.substring(i,i+2)));
        var nVal = minVal + (maxVal-minVal)*fraction;
        var val = d2h(Math.floor(nVal));
        while(val.length < 2){
            val = "0" + val;
        }
        color += val;
    }
    return color;
    // </editor-fold>
};






