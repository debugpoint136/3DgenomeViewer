/**
 *  A generic class to hold single valued bed data.  Data consists of 
 *  chromosome, start, stop, and value.
 */

function BedData(){
    this.chromosome = null;
    this.start = null;
    this.end = null;
    this.value = null;
}

// Lines are in tab deliminated format and have four values
// Example line: chr11\t10000\t20000\t34
// Official ucsc format says bed goes chr start end name value [options...], so 
// I guess we'll allow 5 or more values too.
BedData.prototype.setBedData = function(line){
    var entries = line.split("\t");
    if(entries.length === 4){
        this.chromosome = entries[0];
        this.start = Number(entries[1]);
        this.end = Number(entries[2]);
        this.value = Number(entries[3]);
    } else if(entries.length > 4){
        this.chromosome = entries[0];
        this.start = Number(entries[1]);
        this.end = Number(entries[2]);
        this.value = Number(entries[4]);
    } else {
        alert("BED format requires at least for entries\nin tab delimited format.\nFound line:"  + line);
    }
};

BedData.prototype.readBroadPeakLine = function(line){
    var entries = line.split("\t");
    if(entries.length === 9 || entries.length === 10){
        this.chromosome = entries[0];
        this.start = Number(entries[1]);
        this.end = Number(entries[2]);
        this.value = Number(entries[6]);
    } else {
        alert("broadPeak format requires nine tab delimited entries.\nFound line: " + line);
    }
}
    
BedData.prototype.printBedData = function(){
    return this.chromosome + " " + this.start + " " + this.end + " " 
                            + this.value;
};

BedData.prototype.overlapsCluster = function(cluster){
    var cStart = cluster.genomicStart;
    var cEnd = cluster.genomicEnd;
    if((cStart > this.start && cStart < this.end) || (cEnd > this.start && cEnd < this.end)){
        return true;
    } else {
        return false;
    }
};



