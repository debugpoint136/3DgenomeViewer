/**
 * @typedef {Object} ChromatinCluster
 * @property {number} genomicStart   the start of the interval in base-pairs
 * @property {number} genomicEnd    the stop of the interval in base-pairs
 * @property {THREE.Vector3} position the position of the interval in 3D coordinates
 * @property {number} genomicPosition   the average of genomicStart and genomicEnd
 * @property {boolean} primary  a value of false indicates that this cluster
 *                              was generated for interpolation purposes
 * @property {boolean} inCentromere Indicates if cluster is in the centromere region.                             
 * 
 * @param {number} genomicStart
 * @param {number} genomicEnd
 * @param {number} x The x coordinate
 * @param {number} y The y coordinate
 * @param {number} z The z coordinate
 * @param {boolean} primary Whether this is a primary cluster or an 
 *                          interpolation cluster
 */

function ChromatinCluster(genomicStart, genomicEnd, x, y, z, primary){
    this.genomicStart = genomicStart;
    this.genomicEnd = genomicEnd;
    this.position = new THREE.Vector3(x, y, z);
    this.genomicPosition = Math.floor((genomicStart + genomicEnd)/2);
    this.primary = primary;
    this.inCentromere = false;
}

ChromatinCluster.prototype.getGenomicStart = function(){
    return this.genomicStart;
};

ChromatinCluster.prototype.getGenomicEnd = function(){
    return this.genomicEnd;
};

ChromatinCluster.prototype.getGenomicPosition = function(){
    return this.genomicPosition;
};

ChromatinCluster.prototype.getPosition = function(){
    return this.position;
};

ChromatinCluster.prototype.isPrimary = function(){
    return this.primary;
};

ChromatinCluster.prototype.isInCentromere = function(){
    return this.inCentromere;
};

ChromatinCluster.prototype.setInCentromere = function(inCentromere){
    this.inCentromere = inCentromere;
};

ChromatinCluster.prototype.toString = function() {
    return  this.genomicStart + ", " + this.genomicEnd + ", " + this.position.x
                + ", " + this.position.y + ", " + this.position.z;
};

/**
 * @typedef {Object} Interaction
 * @property {number} genomicStart1   the 1st position that is interacting
 * @property {number} genomicStart2   the 2nd position that is interacting
 * @property {number} count              the interaction count
 * @property {string} proteinFactor      the protein factor mediating this interaction
 * @param genomicStart1
 * @param genomicStart2
 * @param count
 * @param proteinFactor
 */

function Interaction(genomicStart1, genomicStart2, count, proteinFactor){
    this.genomicStart1 = genomicStart1;
    this.genomicStart2 = genomicStart2;
    this.count = count;
    this.proteinFactor = proteinFactor;
}

Interaction.prototype.getGenomicStart1 = function(){
    return this.genomicStart1;
};

Interaction.prototype.getGenomicStart2 = function(){
    return this.genomicStart2;
};

Interaction.prototype.getInteractionCount = function(){
    return this.count;
};

Interaction.prototype.getProteinFactor = function(){
    return this.proteinFactor;
};

Interaction.prototype.toString = function(){
    return this.genomicStart1 + ", " + this.genomicStart2 + ", "  + this.count
                                + ", " + this.proteinFactor;
};

/* **************************************************************************\
 *                      CENTROMERE OBJECT                                   *
 * Holds references to the first and last clusters of the centromere. If    *
 * there are no clusters within the centromere, then we store the last      *
 * cluster before the centromere location and the first cluster after the   *
 * centromere location.                                                     *
 * We construct and store a new cluster between the two end clusters. This  *
 * ensures we always have at least one cluster site to color white.         *
 * We include a flag to indicate those chromosomes which have unmappable    *
 * short arms, in which case we'll construct a cluster 1 and use the first  *
 * actual cluster as cluster 2.                                             *
 *                                                                          *     
 * It turns out that we'll need the vector pointing from cluster1 to        *
 * cluster2, and its normal, so let's store them here and be done with it.  *
\****************************************************************************/

function Centromere(){
    this.cluster1 = null; // Last cluster before centromere
    this.cluster2 = null; // First cluster after centromere
    this.middleCluster = null; // Midpoint between clusters
    this.shortArm = false;
    
    this.vector = null;
    this.normal = null;
    this.distance = null;  // length of vector
}

Centromere.prototype.getCluster1 = function(){
    return this.cluster1;
};

Centromere.prototype.setCluster1 = function(cluster){
    this.cluster1 = cluster;
};

Centromere.prototype.getCluster2 = function(){
    return this.cluster2;
};

Centromere.prototype.setCluster2 = function(cluster){
    this.cluster2 = cluster;
};

Centromere.prototype.getMiddleCluster = function(){
    return this.middleCluster;
};

Centromere.prototype.setMiddleCluster = function(cluster){
    this.middleCluster = cluster;
};

Centromere.prototype.isShortArm = function(){
    return this.shortArm;
};

Centromere.prototype.setShortArm = function(shortArm){
    this.shortArm = shortArm;
};

Centromere.prototype.getDistance = function(){
    return this.distance;
};

Centromere.prototype.getVector = function(){
    return this.vector;
};

Centromere.prototype.getNormal = function(){
    return this.normal;
};

Centromere.prototype.calculateVector = function(){
    var pos0 = this.cluster1.getPosition();
    var pos1 = this.cluster2.getPosition();
    this.vector = new THREE.Vector3(pos1.x-pos0.x, pos1.y - pos0.y, pos1.z - pos0.z);
    this.distance = Math.sqrt(this.vector.x*this.vector.x + this.vector.y*this.vector.y + this.vector.z*this.vector.z);
    this.normal = new THREE.Vector3(this.vector.x/this.distance, this.vector.y/this.distance, this.vector.z/this.distance);
};


/**
 * Renders a chromatin model to the given canvas using WebGL/three.js
 * 
 * @constructor
 */
function ChromatinModel() {
    
    this.clusters = [];
    this.interpolationClusters = [];
    // Give quick access for loops over all clusters
    this.allClusters = [];
    
    this.interactions = [];
    this.proteinFactors = [];
    this.level = 0;
    
    this.chromosomeName = null;
    this.centromereStart = null;
    this.centromereEnd = null;
    this.chromosomeEnd = null;
    
    this.centromere = new Centromere();
}

ChromatinModel.prototype.setClusters = function(genomicIntervals, positions){
  for(var i=0;i<genomicIntervals.length;i++){
      var geneLoc = genomicIntervals[i];
      var pos = positions[i];
      var cluster = new ChromatinCluster(geneLoc[0], geneLoc[1], pos[0], pos[1], pos[2], true);
      this.clusters.push(cluster);
      if(cluster.getGenomicPosition() > this.centromereStart 
                    && cluster.getGenomicPosition() < this.centromereEnd){
          cluster.setInCentromere(true);
      }
  }
};

ChromatinModel.prototype.getClusters = function(){
    return this.clusters;
};

ChromatinModel.prototype.getCluster = function(index){
    return this.clusters[index];
};

ChromatinModel.prototype.setInteractions = function(factorArray, interactionArray){
    this.proteinFactors = factorArray;
    for(var i=0;i<interactionArray.length;i++){
        var interactionData = interactionArray[i];
        this.interactions.push(new Interaction(interactionData[0], interactionData[1],
                        interactionData[2], factorArray[interactionData[3]]));
    }
};

ChromatinModel.prototype.getInteractions = function(){
    return this.interactions;
};

ChromatinModel.prototype.getInteraction = function(index){
    return this.interactions[index];
};

ChromatinModel.prototype.getProteinFactorArray = function(){
    return this.proteinFactors;
};

ChromatinModel.prototype.clearModel = function(){
    // <editor-fold defaultstate="collapsed" desc="Clear all model fields.">
    this.interactions = [];
    this.clusters = [];
    this.interpolationClusters = [];
    this.allClusters = [];
    this.proteinFactors = [];
    this.level = null;
    
    this.chromosomeName = null;
    this.centromereStart = null;
    this.centromereEnd = null;
    this.chromosomeEnd = null;
    
    this.centromere = new Centromere();
    // </editor-fold>
};

ChromatinModel.prototype.getLevel = function(){
    return this.level;
};

ChromatinModel.prototype.setLevel = function(level){
    this.level = Number(level);
};

ChromatinModel.prototype.getPositions = function(){
    var positions = [];
    for(var i=0;i<this.clusters.length;i++){
        positions.push(this.clusters[i].getPosition());
    }
    return positions;
};

ChromatinModel.prototype.getGenomicPositions = function(){
    var genomicPositions = [];
    for(var i=0;i<this.clusters.length;i++){
        genomicPositions.push(this.clusters[i].getGenomicPosition());
    }
    return genomicPositions;
};

ChromatinModel.prototype.setChromosome = function(chromosomeName){
    this.chromosomeName = chromosomeName;
    this.centromereStart = CDATA[chromosomeName].centromereStart;
    this.centromereEnd = CDATA[chromosomeName].centromereEnd;
    this.chromosomeEnd = CDATA[chromosomeName].chromosomeEnd;
};

ChromatinModel.prototype.getChromosomeName = function(){
    return this.chromosomeName;
};

ChromatinModel.prototype.getCentromereStart = function(){
    return this.centromereStart;
};

ChromatinModel.prototype.getCentromereEnd = function(){
    return this.centromereEnd;
};

ChromatinModel.prototype.getChromosomeEnd = function(){
    return this.chromosomeEnd;
};

ChromatinModel.prototype.getCentromere = function(){
    return this.centromere;
};

ChromatinModel.prototype.getInterpolationClusters = function(){
    return this.interpolationClusters;
};

ChromatinModel.prototype.getAllClusters = function(){
    return this.allClusters;
};

// We used to determine interpolation points for levels 0 and 1 in the viewer
// showModel method, but since interpolation points are given to the model
// for level 2, it makes sense to make them a part of the model for levels 0
// and 1 as well.
ChromatinModel.prototype.setInterpolationClusters = function(genomicIntervals, positions){
    // <editor-fold defaultstate="collapsed" desc="Build/assign interpolation clusters.">
    if(genomicIntervals === null || positions === null) {
        // NUMBER OF ADDITIONAL POINTS TO PUT BETWEEN ORIGINAL CLUSTER LOCATIONS
        // Right now I will use 6 points, so each original cluster will be 
        // extended to include a total of 7 points.  One at genomicStart, 
        // two between genomicStart and genomicPosition, one at genomicPosition,
        // two between genomicPosition and genomicEnd, and one at genomicEnd.
        // (Since the cluster sizes and gaps between clustesr are variable, 
        // there isn't a 1-to-1 correspondence between linear genomic position
        // and spatial distance between interpolation points.  Nevertheless, 
        // this should be a decent approximation for now.)
        var numberFillerPoints = 6; // USE AN EVEN NUMBER FOR CONSISTENCY
        
        this.interpolationClusters = [];
        var clusterPositions = [];
        for(var i=0;i<this.clusters.length;i++){
            clusterPositions.push(this.clusters[i].getPosition());
        }
        // Build the spline which we will use to interpolate between the 
        // cluster locations.
        var spline = new THREE.SplineCurve3(clusterPositions);
        // The positions can be found on the curve using getPoint(t), where t goes
        // from 0 to 1 and t increases by 1/(numberOfSites-1) to get to the next
        // position.
        var t_inc = 1/(clusterPositions.length -1);
        // It's easiest to do this in two steps.  First, determine the spatial
        // positions of the additional points.  Then do another loop to
        // determine the genomic positions.
        
        // It's easiest to set up an intermediate array which includes all of
        // the positions (interpolation + original), then extract the
        // interpolation points at the end.
        var extraPositions = [];
        // Total number of points, including the original 
        var numberPoints = 1 + (numberFillerPoints + 1)*(clusterPositions.length-1);
        for(var i=0;i<numberPoints;i++){
            extraPositions.push(spline.getPoint(i*t_inc/(numberFillerPoints+1)));
        }
        // Loop over the original clusters to assign genomic locations to the
        // interpolation positions.
        var interpolatedGenomicPositions = [];
        for(var i=0;i<this.clusters.length;i++){
            var cluster = this.clusters[i];
            var genomicStart = cluster.getGenomicStart();
            var genomicEnd = cluster.getGenomicEnd();
            var genomicPosition = cluster.getGenomicPosition();
            
            // Interpolate as a linear function, interpolatedPos = m*c + b,
            // where c goes from 0 to numberFillerPoints.
            if(i === 0){
                var m = (genomicEnd-genomicPosition)/(numberFillerPoints/2);
                var b = genomicPosition;
                var c = 0;
                while(c <= (numberFillerPoints/2)){
                    var ipos = Math.floor(m*c + b);
                    interpolatedGenomicPositions.push(ipos);
                    c++;
                }
            } else if(i === this.clusters.length -1){
                var m = (genomicPosition - genomicStart)/(numberFillerPoints/2);
                var b = genomicStart;
                var c = 0;
                while(c <= (numberFillerPoints/2)){
                    var ipos = Math.floor(m*c + b);
                    interpolatedGenomicPositions.push(ipos);
                    c++;
                }
            } else {
                var m = (genomicEnd - genomicStart)/numberFillerPoints;
                var b = genomicStart;
                var c = 0;
                while(c <= numberFillerPoints){
                    var ipos = Math.floor(m*c + b);
                    interpolatedGenomicPositions.push(ipos);
                    c++;
                }
            }
        }
        // Now create the interpolatedClusters array
        for(var i=0;i<numberPoints;i++){
            // Skip the original clusters
            if(!(0 === i%(numberFillerPoints+1))){
                var geneLoc = interpolatedGenomicPositions[i];
                var pos = extraPositions[i];
                var newCluster = new ChromatinCluster(geneLoc, geneLoc, pos.x, pos.y, pos.z, false);
                this.interpolationClusters.push(newCluster);
                if(newCluster.getGenomicPosition() > this.centromereStart 
                        && newCluster.getGenomicPosition() < this.centromereEnd){
                    newCluster.setInCentromere(true);
                }
            }
        }
        
        // Now create the allClusters array.
        var c = 0; // interpolation array counter

        for(var i=0;i<this.clusters.length;i++){
            this.allClusters.push(this.clusters[i]);
            if(i !== this.clusters.length -1){
                c = numberFillerPoints*i;
                for(var j=0;j<numberFillerPoints;j++){
                    this.allClusters.push(this.interpolationClusters[c]);
                    c++;
                }
            }
        }
        console.log("Clusters = " + this.clusters.length);
        console.log("Interpolation Clusters = " + this.interpolationClusters.length);
        console.log("All Clusters = " + this.allClusters.length);
        console.log("interpolated positions = " + interpolatedGenomicPositions.length);
        console.log("numberPoints = " + numberPoints);
        
    } else {
        this.interpolationClusters = [];
        for(var i = 0; i < genomicIntervals.length; i++) {
            var geneLoc = genomicIntervals[i];
            var pos = positions[i];
            var newCluster = new ChromatinCluster(geneLoc[0], geneLoc[1], pos[0], pos[1], pos[2], false);
            this.interpolationClusters.push(newCluster);
            if(newCluster.getGenomicPosition() > this.centromereStart 
                        && newCluster.getGenomicPosition() < this.centromereEnd){
                newCluster.setInCentromere(true);
            }
        }
        
        var c0 = 0;
        var c1 = 0;
        do{
            var clusterGPos = this.clusters[c0].getGenomicPosition();
            if(c1 < this.interpolationClusters.length){
                var intGPos = this.interpolationClusters[c1].getGenomicPosition();
                while(intGPos < clusterGPos){
                    this.allClusters.push(this.interpolationClusters[c1]);
                    c1++;
                    if(c1 < this.interpolationClusters.length){
                        intGPos = this.interpolationClusters[c1].getGenomicPosition();
                    } else {
                        break;
                    }
                }
            }
            this.allClusters.push(this.clusters[c0]);
            c0++;
        } while(c0 < this.clusters.length);
        

        console.log("Clusters = " + this.clusters.length);
        console.log("Interpolation Clusters = " + this.interpolationClusters.length);
        console.log("All Clusters = " + this.allClusters.length);
        
        this.reInterpolate();
    }
    // Just putting this here for now.  Maybe a better spot for it?
    this.determineCentromerePosition();
    // </editor-fold>
};

/** When we use the interpolation points provided by the simulation software
 *  (level 2) the curves still look jagged because the points on the loops
 *  can be far apart. To make the smooth looking loops like Yijun's group
 *  wants to see, we'll have to do a second interpolation.  It will be analogous
 *  to the interpolation we do with levels 0 and 1, but now we use the
 *  allClusters array to create the spline for interpolation. Re-ordering
 *  the interpolation array might be a pain.
 */

ChromatinModel.prototype.reInterpolate = function(){
    // <editor-fold defaultstate="collapsed" desc="Second interpolation step.">
    if(this.level !== 2){
        return;
    }
    var numberFillerPoints = 6; // USE AN EVEN NUMBER FOR CONSISTENCY
    // We can clear the interpolatoin cluster array because we have all of the 
    // clusters stored in allClusters.
    this.interpolationClusters = [];
    var allClusterPositions = [];
    for(var i=0;i<this.allClusters.length;i++){
        allClusterPositions.push(this.allClusters[i].getPosition());
    }
    
    // Build the spline which we will use to interpolate between the 
    // cluster locations.
    var spline = new THREE.SplineCurve3(allClusterPositions);
    // The positions can be found on the curve using getPoint(t), where t goes
    // from 0 to 1 and t increases by 1/(numberOfSites-1) to get to the next
    // position.
    var t_inc = 1/(allClusterPositions.length -1);
    // It's easiest to do this in two steps.  First, determine the spatial
    // positions of the additional points.  Then do another loop to
    // determine the genomic positions.

    // It's easiest to set up an intermediate array which includes all of
    // the positions (interpolation + original), then extract the
    // interpolation points at the end.
    var extraPositions = [];
    // Total number of points, including the original 
    var numberPoints = 1 + (numberFillerPoints + 1)*(allClusterPositions.length-1);
    for(var i=0;i<numberPoints;i++){
        extraPositions.push(spline.getPoint(i*t_inc/(numberFillerPoints+1)));
    }
    
    // Loop over the original clusters to assign genomic locations to the
    // interpolation positions.
    var interpolatedGenomicPositions = [];
    for(var i=0;i<this.allClusters.length;i++){
        var cluster = this.allClusters[i];
        var genomicStart = cluster.getGenomicStart();
        var genomicEnd = cluster.getGenomicEnd();
        var genomicPosition = cluster.getGenomicPosition();

        // Interpolate as a linear function, interpolatedPos = m*c + b,
        // where c goes from 0 to numberFillerPoints.
        if(i === 0){
            var m = (genomicEnd-genomicPosition)/(numberFillerPoints/2);
            var b = genomicPosition;
            var c = 0;
            while(c <= (numberFillerPoints/2)){
                var ipos = Math.floor(m*c + b);
                interpolatedGenomicPositions.push(ipos);
                c++;
            }
        } else if(i === this.allClusters.length -1){
            var m = (genomicPosition - genomicStart)/(numberFillerPoints/2);
            var b = genomicStart;
            var c = 0;
            while(c <= (numberFillerPoints/2)){
                var ipos = Math.floor(m*c + b);
                interpolatedGenomicPositions.push(ipos);
                c++;
            }
        } else {
            var m = (genomicEnd - genomicStart)/numberFillerPoints;
            var b = genomicStart;
            var c = 0;
            while(c <= numberFillerPoints){
                var ipos = Math.floor(m*c + b);
                interpolatedGenomicPositions.push(ipos);
                c++;
            }
        }
    }
    
    // Now create the new interpolation clusters
    var newInterpolationClusters = [];
    for(var i=0;i<numberPoints;i++){
        // Skip the original clusters
        if(!(0 === i%(numberFillerPoints+1))){
            var geneLoc = interpolatedGenomicPositions[i];
            var pos = extraPositions[i];
            var newCluster = new ChromatinCluster(geneLoc, geneLoc, pos.x, pos.y, pos.z, false);
            newInterpolationClusters.push(newCluster);
            if(newCluster.getGenomicPosition() > this.centromereStart 
                    && newCluster.getGenomicPosition() < this.centromereEnd){
                newCluster.setInCentromere(true);
            }
        }
    }
    
    // Now create a new allClusters array
    var newAllClusters = [];
    var c = 0; // interpolation array counter

    for(var i=0;i<this.allClusters.length;i++){
        newAllClusters.push(this.allClusters[i]);
        if(!this.allClusters[i].isPrimary()){
            this.interpolationClusters.push(this.allClusters[i]);
        }
        if(i !== this.allClusters.length -1){
            c = numberFillerPoints*i;
            for(var j=0;j<numberFillerPoints;j++){
                var newIntCluster = newInterpolationClusters[c];
                newAllClusters.push(newIntCluster);
                this.interpolationClusters.push(newIntCluster);
                c++;
            }
        }
    }
    
    this.allClusters = [];
    for(var i=0;i<newAllClusters.length;i++){
        this.allClusters.push(newAllClusters[i]);
    }
    
    console.log("newInterpolationCluster length = " + newInterpolationClusters.length);
    console.log("interpolationClusters length = " + this.interpolationClusters.length);
    console.log("AllClusters length = " + this.allClusters.length);
    // </editor-fold>
};

/**
 * We want the option of drawing a ball at the centromere location. Loop 
 * through the clusters, pull out those in the centromere region, and just
 * put the ball at the middle site (for now).
 */

ChromatinModel.prototype.determineCentromerePosition = function(){
    // <editor-fold defaultstate="collapsed" desc="Centromere spatial position.">
    
    // Sometimes the short arm is unmappable, in which case the centromere is
    // before the first cluster in the array.
    if(this.centromereStart === 1){
        // Get vector between the first two actual clusters, and 
        var pos0 = this.clusters[0].getPosition();
        var pos1 = this.clusters[1].getPosition();
        var diff = new THREE.Vector3(pos1.x-pos0.x, pos1.y-pos0.y, pos1.z-pos0.z);
        var newPos = new THREE.Vector3(pos0.x-diff.x, pos0.y-diff.y, pos0.z-diff.z);
        // Don't want the new position to be too close to the original position.
        var newDistance = Math.sqrt(newPos.x*newPos.x + newPos.y*newPos.y + newPos.z*newPos.z);
        if(newDistance < 20){
            newPos = new THREE.Vector3(20*newPos.x/newDistance, 20*newPos.y/newDistance, 20*newPos.z/newDistance);
        }
        // Create a cluster at the new position, mark it as part of the centromere
        // and add it to the front of the all clusters and interpolation clusters
        // arrays. Make its genomic location the start of the centromere. 
        var newCluster = new ChromatinCluster(this.centromereStart, this.centromereStart, newPos.x, newPos.y, newPos.z, false);
        newCluster.setInCentromere(true);
        
        var middleCluster = new ChromatinCluster(this.centromereEnd, this.centromereEnd,
                            (newPos.x + pos0.x)/2, (newPos.y + pos0.y)/2, (newPos.z + pos0.z)/2, false);
        middleCluster.setInCentromere(true);
        this.interpolationClusters.unshift(middleCluster);
        this.allClusters.unshift(middleCluster);
        this.interpolationClusters.unshift(newCluster);
        this.allClusters.unshift(newCluster);
        
        this.centromere.isShortArm(true);
        this.centromere.setCluster1(newCluster);
        this.centromere.setMiddleCluster(middleCluster);
        this.centromere.setCluster2(this.clusters[0]);
        this.centromere.calculateVector();
    } else {
        var centromereClusters = [];
        var centromereIndices = [];
        var lastBeforeCentromere = null;
        var firstAfterCentromere = null;
        var lastBeforeSet = false;
        var firstAfterSet = false;
        var lastBeforeIndex;
        var firstAfterIndex;
        for(var i=0;i<this.allClusters.length;i++){
            var c = this.allClusters[i];
            if(c.isInCentromere()){
                centromereClusters.push(c);
                centromereIndices.push(i);
            }
            if(c.getGenomicPosition() > this.centromereStart){
                // First time we get here we can set the last cluster
                // before the centromere.
                if(!lastBeforeSet){
                    lastBeforeCentromere = this.allClusters[i-1];
                    lastBeforeIndex = i-1;
                    lastBeforeSet = true;
                }
            }
            if(c.getGenomicPosition() > this.centromereEnd){
                // First time we get here we can 
                if(!firstAfterSet){
                    firstAfterCentromere = this.allClusters[i];
                    firstAfterIndex = i;
                    firstAfterSet = true;
                }
            }
        }
        
        if(centromereClusters.length === 0){
            console.log("Could not find any clusters in centromere!");
            // In this case we use the last before and first after as the 
            // end points. 
            this.centromere.setCluster1(lastBeforeCentromere);
            this.centromere.setCluster2(firstAfterCentromere);
            var p0 = lastBeforeCentromere.getPosition();
            var p1 = firstAfterCentromere.getPosition();
            var g0 = lastBeforeCentromere.getGenomicPosition();
            var g1 = firstAfterCentromere.getGenomicPosition();
            var newGPos = Math.floor((g0+g1)/2);
            var newCluster = new ChromatinCluster(newGPos, newGPos,
                        (p0.x+p1.x)/2, (p0.y+p1.y)/2, (p0.z+p1.z)/2, false);
            newCluster.setInCentromere(true);
            this.centromere.setMiddleCluster(newCluster);
            this.centromere.calculateVector();
            // Use splice to insert at the right location
            this.allClusters.splice(firstAfterIndex, 0, newCluster);
            // NOT SETTING ADDING THIS TO THE INTERPOLATION CLUSTER ARRAY. 
            // I'M PROBABLY PHASING OUT THAT ARRAY.  I NEVER USE IT IN 
            // THE VIEWER.
            
            
        } else if(centromereClusters.length === 1){
            // In this case we just remove the point and then follow the 
            // procedure for when we had no clusters
            this.allClusters.splice(centromereIndices[0],1);
            
            this.centromere.setCluster1(lastBeforeCentromere);
            this.centromere.setCluster2(firstAfterCentromere);
            var p0 = lastBeforeCentromere.getPosition();
            var p1 = firstAfterCentromere.getPosition();
            var g0 = lastBeforeCentromere.getGenomicPosition();
            var g1 = firstAfterCentromere.getGenomicPosition();
            var newGPos = Math.floor((g0+g1)/2);
            var newCluster = new ChromatinCluster(newGPos, newGPos,
                        (p0.x+p1.x)/2, (p0.y+p1.y)/2, (p0.z+p1.z)/2, false);
            newCluster.setInCentromere(true);
            this.centromere.setMiddleCluster(newCluster);
            this.centromere.calculateVector();
            // Use splice to insert at the right location
            this.allClusters.splice(firstAfterIndex, 0, newCluster);
            // NOT SETTING ADDING THIS TO THE INTERPOLATION CLUSTER ARRAY. 
            // I'M PROBABLY PHASING OUT THAT ARRAY.  I NEVER USE IT IN 
            // THE VIEWER.
            
            // If this was a primary cluster, then we need to remove it from the
            // primary cluster array too.
            // (Way too many loops... there must be a more clever way to 
            // do all these manipulations.)
            if(centromereClusters[0].isPrimary()){
                var index;
                for(var i=0;i<this.clusters.length;i++){
                    if(this.clusters[i].isInCentromere()){
                        index = i;
                        break;
                    }
                }
                this.clusters.splice(i,1);
            }
            
        } else {
            var length = centromereClusters.length;
            var cluster0 = centromereClusters[0];
            var cluster1 = centromereClusters[length-1];
            
            this.centromere.setCluster1(cluster0);
            this.centromere.setCluster2(cluster1);
            var p0 = cluster0.getPosition();
            var p1 = cluster1.getPosition();
            var g0 = cluster0.getGenomicPosition();
            var g1 = cluster1.getGenomicPosition();
            var newGPos = Math.floor((g0+g1)/2);
            var newCluster = new ChromatinCluster(newGPos, newGPos,
                        (p0.x+p1.x)/2, (p0.y+p1.y)/2, (p0.z+p1.z)/2, false);
            newCluster.setInCentromere(true);
            this.centromere.setMiddleCluster(newCluster);
            this.centromere.calculateVector();
            // Delete all middle centromere locations, add the new cluster
            this.allClusters.splice(centromereIndices[1],length-2,newCluster);
            // NOT SETTING ADDING THIS TO THE INTERPOLATION CLUSTER ARRAY. 
            // I'M PROBABLY PHASING OUT THAT ARRAY.  I NEVER USE IT IN 
            // THE VIEWER.
            
            // TODO: REMOVE THESE FROM THE PRIMARY CLUSTER ARRAY.  AGAIN, AM 
            // I EVEN USING THAT ARRAY ANYWHERE ELSE?
        }
    }
    // </editor-fold>
};

