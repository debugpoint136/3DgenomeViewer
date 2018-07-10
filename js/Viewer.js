var initialClusterSphereRadius = 0.4;
var initialInteractionSphereRadius = 0.4;
var initialCentromereRadius = 5;

var initialAxisRadius = 0.75;
var initialAxisLength = 50;

var xaxis = new THREE.Vector3(1,0,0);
var yaxis = new THREE.Vector3(0,1,0);
var zaxis = new THREE.Vector3(0,0,1);
var origin = new THREE.Vector3(0,0,0);

// Direction should be a normalized Vector3
function Axis(direction, color){  
    this.direction = direction;
    this.length = initialAxisLength;
    this.radius = initialAxisRadius;
    this.color = color;
    
    this.cylinder = null;
    this.arrowHead = null;
}

Axis.prototype.buildCylinder = function(point1, point2){
    // <editor-fold defaultstate="collapsed" desc="Method Code">
    var direction = new THREE.Vector3().subVectors(point2, point1);
    var orientation = new THREE.Matrix4();
    orientation.lookAt(point1, point2, new THREE.Object3D().up);
    orientation.multiply(new THREE.Matrix4(1, 0, 0, 0,
                                           0, 0, 1, 0,
                                           0, -1, 0, 0,
                                           0, 0, 0, 1));
    var cylinderGeometry = new THREE.CylinderGeometry(this.radius, this.radius, direction.length(), 10, 2, false);
    var cylinderMaterial = new THREE.MeshLambertMaterial({color: 0xffffff, transparent: true, opcacity: 1.0});
    cylinderMaterial.color.setHex("0x" + this.color.getHexString());
    cylinderMaterial.ambient.setHex("0x"+ this.color.getHexString()); 
    this.cylinder = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
    this.cylinder.applyMatrix(orientation);
    // position based on midpoints - there may be a better solution than this
    this.cylinder.position.set((point1.x+point2.x)/2, (point1.y+point2.y)/2, (point1.z+point2.z)/2);
    // </editor-fold>
};

Axis.prototype.buildArrowHead = function(point1, point2){
    // <editor-fold defaultstate="collapsed" desc="Method Code">
    var direction = new THREE.Vector3().subVectors(point2, point1);
    var orientation = new THREE.Matrix4();
    orientation.lookAt(point1, point2, new THREE.Object3D().up);
    orientation.multiply(new THREE.Matrix4(1, 0, 0, 0,
                                           0, 0, 1, 0,
                                           0, -1, 0, 0,
                                           0, 0, 0, 1));
    var cylinderGeometry = new THREE.CylinderGeometry(0, 1.5*this.radius, direction.length(), 10, 2, false);
    var cylinderMaterial = new THREE.MeshLambertMaterial({color: 0xffffff, transparent: true, opcacity: 1.0});
    cylinderMaterial.color.setHex("0x" + this.color.getHexString());
    cylinderMaterial.ambient.setHex("0x" + this.color.getHexString());
    this.arrowHead = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
    this.arrowHead.applyMatrix(orientation);
    // position based on midpoints - there may be a better solution than this
    this.arrowHead.position.set((point1.x+point2.x)/2, (point1.y+point2.y)/2, (point1.z+point2.z)/2);
    // </editor-fold>
};

Axis.prototype.buildAxis = function(){
    // <editor-fold defaultstate="collapsed" desc="Method Code">
    var d = this.direction;
    var l = this.length;
    var point1 = new THREE.Vector3(-l*d.x/2, -l*d.y/2, -l*d.z/2);
    var point2 = new THREE.Vector3(l*d.x/2, l*d.y/2, l*d.z/2);
    var arrowTip = new THREE.Vector3(1.2*l*d.x/2, 1.2*l*d.y/2, 1.2*l*d.z/2);
    
    this.buildCylinder(point1, point2);
    this.buildArrowHead(point2, arrowTip);
    // </editor-fold>
};

Axis.prototype.getColor = function(){
    return this.color;
};

Axis.prototype.setColor = function(colorHexString){
    this.color.setHex(colorHexString);
    this.arrowHead.material.color.setHex(colorHexString);
    this.arrowHead.material.ambient.setHex(colorHexString);
    this.cylinder.material.color.setHex(colorHexString);
    this.cylinder.material.ambient.setHex(colorHexString);
};

Axis.prototype.getRadius = function(){
    return this.radius;
};

Axis.prototype.setRadius = function(radius){
    this.radius = radius;
    var radiusScale = radius/initialAxisRadius;
    this.arrowHead.scale.x = radiusScale;
    this.arrowHead.scale.z = radiusScale;
    this.cylinder.scale.x = radiusScale;
    this.cylinder.scale.z = radiusScale;
};

Axis.prototype.getLength = function(){
    return this.length;
};

Axis.prototype.setLength = function(length){
    this.length = length;
    var lengthScale = length/initialAxisLength;
    this.cylinder.scale.y = lengthScale;
    // We have to move and scale the arrowHead
    this.arrowHead.scale.y = lengthScale;
    var d = this.direction;
    this.arrowHead.position.set(1.1*length*d.x/2, 1.1*length*d.y/2, 1.1*length*d.z/2);
};

/**
 * In the current version of the code, both original clusters and interpolation
 * points are used to generate ClusterShape objects.  Original clusters
 * generate ClusterShapes with a sphere, while interpolation clusters 
 * just store their position.  The main property these objects hold is their
 * color, which is used to construct the bright and dim lines in the 
 * viewer.   
 * 
 * @param {type} cluster
 * @returns {ClusterShape}
 */
function ClusterShape(cluster){
    // <editor-fold defaultstate="collapsed" desc="ClusterSphere Constructor">
    this.cluster = cluster;
    this.color = new THREE.Color( 0x0000ff );
    this.annotationColor = new THREE.Color( 0x0000ff );
    this.opacity = 1.00;
    
    // The sphere
    this.radius = 0;
    this.sphere = null;
    if(this.cluster.isPrimary()){
        this.radius = initialClusterSphereRadius;
        var sphereGeometry = new THREE.SphereGeometry(this.radius, 4, 3);
        var meshMaterial = new THREE.MeshLambertMaterial({transparent: true, opacity: 1.0});
        meshMaterial.color.setHex("0x" + this.color.getHexString());
        meshMaterial.ambient.setHex("0x" + this.color.getHexString());
        this.sphere = new THREE.Mesh(sphereGeometry, meshMaterial);
        var pos = this.cluster.getPosition();
        this.sphere.position.set(pos.x, pos.y, pos.z);
        this.sphere.id = cluster.getGenomicStart();  // Eventually will be used for mouse picking
    }
    // </editor-fold>
}

ClusterShape.prototype.getCluster = function(){
    return this.cluster;
};

ClusterShape.prototype.getOpacity = function(){
    return this.opacity;
};

ClusterShape.prototype.setOpacity = function(opacity){
    this.opacity = opacity;
    if(this.sphere !== null){
        this.sphere.material.opacity = opacity;
    }
};

ClusterShape.prototype.getColor = function(){
    return this.color;
};

ClusterShape.prototype.setColor = function(colorHexString){
    this.color.setHex(colorHexString);
    if(this.sphere !== null){
        this.sphere.material.color.setHex(colorHexString);
        this.sphere.material.ambient.setHex(colorHexString);
    }
};

ClusterShape.prototype.getRadius = function(){
    return this.radius;
};

ClusterShape.prototype.setRadius = function(radius){
    this.radius = radius;
    if(this.sphere !== null){
        var radiusScale = radius/initialClusterSphereRadius;
        this.sphere.scale.x = radiusScale;
        this.sphere.scale.y = radiusScale;
        this.sphere.scale.z = radiusScale;
    }
};

ClusterShape.prototype.getSphere = function(){
    return this.sphere;
};

/***************** INTERACTION SHAPE OBJECT ********************************\
 *                                                                         *
 * @param {type} interaction                                               *
 * @returns {InteractionShape}                                             *
 \**************************************************************************/

function InteractionShape(interaction){
    // <editor-fold defaultstate="collapsed" desc="InterctionShape Constructor">
    this.interaction = interaction;
    
    this.sphereRadius = initialInteractionSphereRadius;
    this.sphereVisible = true;
    this.cylinderRadius = 0.5;
    this.cylinderVisible = true;
    this.color; 
    if(interaction.getProteinFactor() === "CTCF"){
        this.color = "0x00ff00";
    } else {
        this.color = "0xff0000";
    }
    this.opacity = 1.0;
    
    this.sphereGeometry = new THREE.SphereGeometry(this.sphereRadius, 4, 3);
    this.sphereMaterial = new THREE.MeshLambertMaterial({transparent: true, opacity: 1.0});
    this.sphereMaterial.color.setHex(this.color);
    this.sphereMaterial.ambient.setHex(this.color);
    this.sphere = new THREE.Mesh(this.sphereGeometry, this.sphereMaterial);
    this.sphere.position.set(0,0,0);
    
//    this.cylinderGeometry = new THREE.CylinderGeometry();
//    this.cylinderMaterial = new THREE.MeshLambertMaterial({transparent: true, opacity: 1.0});
//    this.cylinderMaterial.color.setHex(this.color);
//    this.cylinderMaterial.ambient.setHex(this.color);
//    this.cylinder = new THREE.Mesh(this.cylinderGeometry, this.cylinderMaterial);
    
    /** Major change in code. Instead of storing actual line objects, the 
     *  interaction shape will just store the two end points of the line.  
     *  Construction of the line will be passed off to the viewer, which
     *  holds the dim and bright protein lines.  (A thought: eventually, those
     *  lines should probably be their own objects.)
     */
    
    this.linePoints = [];
    
    // </editor-fold>
}

InteractionShape.prototype.getInteraction = function(){
    return this.interaction;
};

InteractionShape.prototype.getColor = function(){
    return this.color; 
};

InteractionShape.prototype.setColor = function(color){
    // <editor-fold defaultstate="collapsed" desc="Method Code">
    this.color = color;
    this.sphereMaterial.color.setHex(color);
    this.sphereMaterial.ambient.setHex(color);
//    this.cylinderMaterial.color.setHex(color);
//    this.cylinderMaterial.ambient.setHex(color);
    // </editor-fold>
};

InteractionShape.prototype.setOpacity = function(opacity){
    // <editor-fold defaultstate="collapsed" desc="Method Code">
    this.opacity = opacity;
    this.sphereMaterial.opacity = opacity;
    // this.cylinderMaterial.opacity = opacity;
    // </editor-fold>
};

InteractionShape.prototype.getOpacity = function(){
    return this.opacity;
};

InteractionShape.prototype.setSphereVisible = function(visible){
    this.sphereVisible = visible;
};

// Radius starts at 10, so adjust scale to get the radius we want.
InteractionShape.prototype.setSphereRadius = function(radius){
    // <editor-fold defaultstate="collapsed" desc="Method Code">
    this.sphereRadius = radius;
    var radiusScale = radius/initialInteractionSphereRadius;
    this.sphere.scale.x = radiusScale;
    this.sphere.scale.y = radiusScale;
    this.sphere.scale.z = radiusScale;
    // </editor-fold>
};

InteractionShape.prototype.getSphere = function(){
    return this.sphere;
};

InteractionShape.prototype.setLinePosition = function(point1, point2){
    this.linePoints.push(point1, point2);
};

InteractionShape.prototype.getLinePoints = function(){
    return this.linePoints;
};

/* ********************  THE CENTROMERE OBJECT ********************************\
 * Eventually we might provide different ways of displaying the centromere or *
 * want other functionality.  We'll define a separate object to make it easy  *
 * to add additional functionality.                                           *
\******************************************************************************/

function CentromereShape(centromere){
    this.centromere = centromere;
    this.position = centromere.getMiddleCluster().getPosition();
    this.normal = centromere.getNormal();
    initialCentromereRadius = this.centromere.getDistance()/4;
    if(initialCentromereRadius < 3){  // Don't want it to be too small
        initialCentromereRadius = 3;
    }
    this.radius = initialCentromereRadius;
    this.color = new THREE.Color( 0xffffff );
    this.visible = true;
    this.opacity = 1.0;
    
    var geometry = new THREE.SphereGeometry(this.radius, 16, 16);
    var material = new THREE.MeshLambertMaterial({transparent: true, opacity: 1.0});
    material.color.setHex("0x" + this.color.getHexString());
    material.ambient.setHex("0x" + this.color.getHexString());
    this.sphere = new THREE.Mesh(geometry, material);
    this.sphere.position.set(this.position.x, this.position.y, this.position.z);
}

CentromereShape.prototype.getPosition = function(){
    return this.position;
};

CentromereShape.prototype.getColor = function(){
    return this.color;
};

CentromereShape.prototype.setColor = function(colorHexString){
    this.color.setHex(colorHexString);
    this.sphere.material.color.setHex(colorHexString);
    this.sphere.material.ambient.setHex(colorHexString);
};

CentromereShape.prototype.setVisible = function(visible){
    this.visible = visible;
};

CentromereShape.prototype.isVisible = function(){
    return this.visible;
};

CentromereShape.prototype.getOpacity = function(){
    return this.opacity;
};

CentromereShape.prototype.setOpacity = function(opacity){
    this.opacity = opacity;
    this.sphere.material.opacity = opacity;
};

CentromereShape.prototype.getRadius = function(){
    return this.radius;
};

CentromereShape.prototype.setRadius = function(radius){
    this.radius = radius;
    var radiusScale = radius/initialCentromereRadius;
    this.sphere.scale.x = radiusScale;
    this.sphere.scale.y = radiusScale;
    this.sphere.scale.z = radiusScale;
};

/* **************** ADDING FUNCTIONALITY TO DAT.GUI ************************/
dat.GUI.prototype.removeFolder = function(name) {
    var folder = this.__folders[name];
    if (!folder) {
      return;
    }
    folder.close();
    this.__ul.removeChild(folder.domElement.parentNode);
    delete this.__folders[name];
    this.onResize();
  };

/* ****************   GUI Control Panel ***********************************/

function ControlPanel(gui, viewer){
    // <editor-fold defaultstate="collapsed" desc="Entire control panel constructor.">
    var self = this;
    this.mygui = gui;
    this.viewer = viewer;
    this.proteinFactors = viewer.getModel().getProteinFactorArray();
    
    this.chromosomeStart = 0;
    this.chromosomeEnd = 0;
    this.selectedStarts = [];
    this.selectedStarts.push(0);
    this.selectedEnds = [];
    this.selectedEnds.push(0);
    if(this.viewer.getModel().getClusters().length > 0){
        this.chromosomeEnd = this.viewer.getModel().getCluster(this.viewer.getModel().getClusters().length-1).getGenomicEnd();
    }
   
    //meixiao: add save button here
    this.save = function saveImage(){
      var numberOfClusters = this.viewer.getModel().getClusters().length;  
      this.viewer.canvas.toBlob(function(blob) {
           saveAs(
                    blob, "3DChromatinModel.png"
                );
        }, "image/png");
    };
    var saveImageMenu = gui.addFolder('SAVE IMAGE');
    var saveimageCtrl = saveImageMenu.add(this, 'save');
    //meixiao
    
    // BUTTON TO LOAD FILE
    this.loadFileParameters = {
        // <editor-fold defaultstate="collapsed" desc="Parameter Object with three functions">
        loadElement: document.createElement('input'),
        showColorScale:  viewer.headsUpDisplay.showColorScaleBar,
        colorScaleScale: viewer.colorScale.scale,
        minColor: viewer.colorScale.minColor,
        maxColor: viewer.colorScale.maxColor,
        lowerCutoff: 0,
        upperCutoff: 100,
        loadFile: function(){
            console.log("Clicked loadFile.");
            $(document.getElementById("fileinput")).click();
        },
        getData: function(event){
            // <editor-fold defaultstate="collapsed" desc="Method Code">
            console.log("Entered getData.");
            var files = event.target.files;
            if(files.length===0){
                alert("No file selected!");
                return;
            }
            if(self.viewer.hasAnnotationData){
                self.viewer.bedData = [];
            }
            self.viewer.hasAnnotationData = true;
            var file = files[0];
            var fileName = file.name;
            var nameSplit = fileName.split(".");
            var extension = nameSplit[nameSplit.length-1];
            if(extension === "bed"){
                var chr = self.viewer.model.chromosomeName;
                var reader = new FileReader();
                reader.onload = function(e){
                    var contents = String(e.target.result);
                    var lines = contents.split("\n");
                    // Skip the header line, so start at 1
                    for(var i=1;i<lines.length;i++){
                        var line = lines[i];
                        if(line.lastIndexOf(chr,0)===0){
                            line = line.replace(new RegExp('\r?\n','g'),"");
                            var bedData = new BedData();
                            bedData.setBedData(line);
                            self.viewer.bedData.push(bedData);
                        }
                    }
                    self.viewer.sortBedData();
                    self.viewer.headsUpDisplay.createColorScaleSprite();
                    self.viewer.buildChromatinLines(self.selectedStarts, self.selectedEnds, self.chromatinParameters.dimOpacity, self.chromatinParameters.lineWidth);
                    self.viewer.viewChangedSinceLastRender = true;
                };
                reader.readAsText(file);
            } else if(extension === "broadPeak" || extension === "narrowPeak"){
                var chr = self.viewer.model.chromosomeName;
                var reader = new FileReader();
                reader.onload = function(e){
                    var contents = String(e.target.result);
                    var lines = contents.split("\n");
                    // Skip the header line, so start at 1
                    for(var i=1;i<lines.length;i++){
                        var line = lines[i];
                        if(line.lastIndexOf(chr,0)===0){
                            line = line.replace(new RegExp('\r?\n','g'),"");
                            var bedData = new BedData();
                            bedData.readBroadPeakLine(line);
                            self.viewer.bedData.push(bedData);
                        }
                    }
                    self.viewer.sortBedData();
                    self.viewer.headsUpDisplay.createColorScaleSprite();
                    self.viewer.buildChromatinLines(self.selectedStarts, self.selectedEnds, self.chromatinParameters.dimOpacity, self.chromatinParameters.lineWidth);
                    self.viewer.viewChangedSinceLastRender = true;
                };
                reader.readAsText(file);
            } else {
                alert("Could not load file.\nAnnotation files must be in either bed, broadPeak, or narrowPeak format.");
            }
            // </editor-fold>
        },
        unloadData: function(){
            // <editor-fold defaultstate="collapsed" desc="Method Code">
            document.getElementById("fileinput").value = null;
            self.viewer.hasAnnotationData = false;
            self.viewer.buildChromatinLines(self.selectedStarts, self.selectedEnds, self.chromatinParameters.dimOpacity, self.chromatinParameters.lineWidth);
            self.viewer.bedData = [];
            if(self.viewer.headsUpDisplay.showColorScaleBar){
                self.viewer.headsUpDisplay.removeColorScaleSprite();
                self.viewer.headsUpDisplay.showColorScaleBar = false;
            }
            
            self.viewer.viewChangedSinceLastRender = true;
            // </editor-fold>
        }
        // </editor-fold>
    };
    
    this.loadFileFolder = this.mygui.addFolder("LOAD ANNOTATION FILE");
    createLoadFileFolder();
    
    function createLoadFileFolder(){
        // <editor-fold defaultstate="collapsed" desc="Method Code">
        // First initialize the loadElement input element
        self.loadFileParameters.loadElement.setAttribute('type','file');
        self.loadFileParameters.loadElement.setAttribute("style","visibility:hidden");
        self.loadFileParameters.loadElement.setAttribute('id','fileinput');
        self.viewer.canvas.appendChild(self.loadFileParameters.loadElement);
        self.loadFileParameters.loadElement.addEventListener('change', self.loadFileParameters.getData, false);
        
        var loadFileChooser = self.loadFileFolder.add(self.loadFileParameters, "loadFile").name("Load File");
        var unloadDataChooser = self.loadFileFolder.add(self.loadFileParameters, "unloadData").name("Unload Data");
        var colorScaleDisplayChooser = self.loadFileFolder.add(self.loadFileParameters, "showColorScale").name("Show Color Scale");
        var colorScaleScaleChooser = self.loadFileFolder.add(self.loadFileParameters, "colorScaleScale",
                            [ColorScaleConstants.LINEAR, ColorScaleConstants.LOG]).name("Scale");
        var minColorChooser = self.loadFileFolder.addColor(self.loadFileParameters, "minColor").name("Minimum Color");
        var maxColorChooser = self.loadFileFolder.addColor(self.loadFileParameters, "maxColor").name("Maximum Color");
        var lowerCutoffChooser = self.loadFileFolder.add(self.loadFileParameters, "lowerCutoff").min(0).max(25).step(1).name("Lower Cutoff");
        var upperCutoffChooser = self.loadFileFolder.add(self.loadFileParameters, "upperCutoff").min(25).max(300).step(1).name("Upper Cutoff");
        
        colorScaleDisplayChooser.onChange(function(value){
            // <editor-fold defaultstate="collapsed" desc="Method Code">
            self.viewer.headsUpDisplay.showColorScaleBar = value;
            if(value){
                self.viewer.headsUpDisplay.addColorScaleSprite();
            } else {
                self.viewer.headsUpDisplay.removeColorScaleSprite();
            }
            self.viewer.viewChangedSinceLastRender = true;
            // </editor-fold>
        });
        
        colorScaleScaleChooser.onChange(function(value){
            // <editor-fold defaultstate="collapsed" desc="Method Code">
            self.viewer.colorScale.setScale(value);
            self.viewer.buildChromatinLines(self.selectedStarts, self.selectedEnds, self.chromatinParameters.dimOpacity, self.chromatinParameters.lineWidth);
            if(self.viewer.headsUpDisplay.showColorScaleBar){
                self.viewer.headsUpDisplay.removeColorScaleSprite();
                self.viewer.headsUpDisplay.createColorScaleSprite();
                self.viewer.headsUpDisplay.addColorScaleSprite();
            } else {
                self.viewer.headsUpDisplay.createColorScaleSprite();
            }
            self.viewer.viewChangedSinceLastRender = true;
            // </editor-fold>
        });
        
        minColorChooser.onChange(function(value){
            // <editor-fold defaultstate="collapsed" desc="Method Code">
            self.viewer.colorScale.minColor = value;
            self.viewer.buildChromatinLines(self.selectedStarts, self.selectedEnds, self.chromatinParameters.dimOpacity, self.chromatinParameters.lineWidth);
            if(self.viewer.headsUpDisplay.showColorScaleBar){
                self.viewer.headsUpDisplay.removeColorScaleSprite();
                self.viewer.headsUpDisplay.createColorScaleSprite();
                self.viewer.headsUpDisplay.addColorScaleSprite();
            } else {
                self.viewer.headsUpDisplay.createColorScaleSprite();
            }
            self.viewer.viewChangedSinceLastRender = true;
            // </editor-fold>
        });
        
        maxColorChooser.onChange(function(value){
            // <editor-fold defaultstate="collapsed" desc="Method Code">
            self.viewer.colorScale.maxColor = value;
            self.viewer.buildChromatinLines(self.selectedStarts, self.selectedEnds, self.chromatinParameters.dimOpacity, self.chromatinParameters.lineWidth);
            if(self.viewer.headsUpDisplay.showColorScaleBar){
                self.viewer.headsUpDisplay.removeColorScaleSprite();
                self.viewer.headsUpDisplay.createColorScaleSprite();
                self.viewer.headsUpDisplay.addColorScaleSprite();
            } else {
                self.viewer.headsUpDisplay.createColorScaleSprite();
            }
            self.viewer.viewChangedSinceLastRender = true;
            // </editor-fold>
        });
        
        lowerCutoffChooser.onChange(function(value){
            // <editor-fold defaultstate="collapsed" desc="Method Code">
            self.viewer.colorScale.setLowerCutoff(value);
            self.viewer.buildChromatinLines(self.selectedStarts, self.selectedEnds, self.chromatinParameters.dimOpacity, self.chromatinParameters.lineWidth);
            if(self.viewer.headsUpDisplay.showColorScaleBar){
                self.viewer.headsUpDisplay.removeColorScaleSprite();
                self.viewer.headsUpDisplay.createColorScaleSprite();
                self.viewer.headsUpDisplay.addColorScaleSprite();
            } else {
                self.viewer.headsUpDisplay.createColorScaleSprite();
            }
            self.viewer.viewChangedSinceLastRender = true;
            // </editor-fold>
        });
        
        upperCutoffChooser.onChange(function(value){
            // <editor-fold defaultstate="collapsed" desc="Method Code">
            self.viewer.colorScale.setUpperCutoff(value);
            self.viewer.buildChromatinLines(self.selectedStarts, self.selectedEnds, self.chromatinParameters.dimOpacity, self.chromatinParameters.lineWidth);
            if(self.viewer.headsUpDisplay.showColorScaleBar){
                self.viewer.headsUpDisplay.removeColorScaleSprite();
                self.viewer.headsUpDisplay.createColorScaleSprite();
                self.viewer.headsUpDisplay.addColorScaleSprite();
            } else {
                self.viewer.headsUpDisplay.createColorScaleSprite();
            }
            self.viewer.viewChangedSinceLastRender = true;
            // </editor-fold>
        });
        // </editor-fold>
    }
    
    // PARAMETERS AND FUNCTIONS TO GENERATE STL FILE
    var initialLinearSegments = 200;
    var initialTubeRadius = 4;
    var initialRadialSegments = 8;
    this.stlParameters = {
        // <editor-fold defaultstate="collapsed" desc="Parameter object">
        showTubeGeometry: false,
        linearSegments: initialLinearSegments,
        tubeRadius: initialTubeRadius,
        radialSegments: initialRadialSegments,
        showEndCaps: false,
        tubeColor: "#ff0000",
        innerSaveFunction: function(){
            if(!self.viewer.tubeVisible){
                alert("No tube to save.");
            } else {
                AsciiStlWriter.saveSTL(viewer.tube.geometry, "TubeGeometry");
            }
        },
        binarySaveFunction: function(){
            if(!self.viewer.tubeVisible){
                alert("No tube to save.");
            } else {
                BinaryStlWriter.save(viewer.tube.geometry, "TubeGeometryBinary");
            }
        },
        reset: function(){
            this.showTubeGeometry = false;
            this.linearSegments = initialLinearSegments;
            this.tubeRadius = initialTubeRadius;
            this.radialSegments = initialRadialSegments;
            this.showEndCaps = false;
            this.tubeColor = "#ff0000";
        }
        // </editor-fold>
    };
    
    this.stlFileFolder = this.mygui.addFolder("GENERATE STL FILE");
    createSTLFileFolder();
    
    function createSTLFileFolder(){
        // <editor-fold defaultstate="collapsed" desc="Method Code">
        var showTubeChooser = self.stlFileFolder.add(self.stlParameters, 'showTubeGeometry').name("Show Tube");
        var lineSegmentsChooser = self.stlFileFolder.add(self.stlParameters, 'linearSegments').min(50).max(10000).step(50).name("Line Segments");
        var tubeRadiusChooser = self.stlFileFolder.add(self.stlParameters, 'tubeRadius').min(0.02).max(10).step(0.01).name("Tube Radius");
        var radialSegmentsChooser = self.stlFileFolder.add(self.stlParameters, 'radialSegments').min(3).max(20).step(1).name("Radial Segments");
        // var endCapChooser = self.stlFileFolder.add(self.stlParameters, 'showEndCaps').name("End Caps");
        var tubeColorChooser = self.stlFileFolder.addColor(self.stlParameters, 'tubeColor').name("Tube Color");
        self.stlFileFolder.add(self.stlParameters, 'innerSaveFunction').name("Save ASCII STL File");
        self.stlFileFolder.add(self.stlParameters, 'binarySaveFunction').name("Save Binary STL File");
        
        showTubeChooser.onChange(function(value){
            self.viewer.tubeVisible = value;
            if(value){
                makeTube();
            } else {
                self.viewer.scene.remove(self.viewer.tube);
                self.viewer.tube = null;
            }
            self.viewer.viewChangedSinceLastRender = true;
        });
        
        lineSegmentsChooser.onChange(function(value){
            makeTube();
        });
        
        tubeRadiusChooser.onChange(function(value){
            makeTube();
        });
        
        radialSegmentsChooser.onChange(function(value){
            makeTube();  
        });
        
//        endCapChooser.onChange(function(value){
//            makeTube();
//        });
        
        tubeColorChooser.onChange(function(value){
            makeTube();
        });
        
        
        // </editor-fold>
    }
    
    // Trying to define an inner class to hold the interaction display parameters
    // One instance of this class will be instantiated for each protein factor.
    function ProteinParameters(color){
        this.visible = false;
        this.color = color;
        this.opacity = 1.00;
        this.sphereSize = initialInteractionSphereRadius;
        this.lineWidth = 1.0;
    }
    
    this.chromatinParameters = {
        // <editor-fold defaultstate="collapsed" desc="Parameters for chromatin display.">
        units: "bp",
        unitScale: 1,
        selectedRegion: self.chromosomeStart + "-" + self.chromosomeEnd,
        highlightRegion: false,
        lineWidth: 1.0,
        showSpheres: false, // Spheres are initially hidden
        sphereRadius: initialClusterSphereRadius,  
        dimOpacity: 0.5,
        showWholeChromosome: function(){
            // <editor-fold defaultstate="collapsed" desc="Method Code">
            self.selectedStarts = [];
            self.selectedStarts.push(self.chromosomeStart);
            self.selectedEnds = [];
            self.selectedEnds.push(self.chromosomeEnd);
            self.chromatinParameters.highlightRegion = false;
            self.chromatinParameters.selectedRegion = self.printSelectedRegion();
            var controllers = self.chromatinFolder.__controllers;
            for(var i in controllers){
                if(controllers[i].property === "selectedRegion"){
                    self.chromatinFolder.__controllers[i].updateDisplay();
                }
                if(controllers[i].property === "highlightRegion"){
                    self.chromatinFolder.__controllers[i].updateDisplay();
                }
            }
            if(self.viewer.dimLines){
                for(var j = 0;j<self.viewer.dimLines.length;j++){
                    self.viewer.dimLines[j].material.opacity = 1;
                }
            }
            if(self.viewer.model.getLevel() === 2){
                    self.viewer.buildProteinLines(self.selectedStarts, self.selectedEnds, 1.0);
            }
            // Body of the makeTube method. For some reason it wasn't seeing
            // the method itself.
            if(self.viewer.tubeVisible){
                self.viewer.createTubeGeometry(self.stlParameters.linearSegments,
                    self.stlParameters.tubeRadius, self.stlParameters.radialSegments,
                    self.stlParameters.showEndCaps, self.stlParameters.tubeColor.replace("#","0x"));
            }
            self.viewer.viewChangedSinceLastRender = true;
            // </editor-fold>
        },
        reset: function(){
            // <editor-fold defaultstate="collapsed" desc="Method Code">
            var model = self.viewer.getModel();
            var clusters = model.getClusters();
            self.selectedStarts = [];
            self.chromosomeStart = 0;
            self.selectedStarts.push(0);
            self.selectedEnds = [];
            if(clusters.length >0){
                self.chromosomeEnd = model.getCluster(model.getClusters().length-1).getGenomicEnd();
            } else {
                self.chromosomeEnd = 0;
            }
            self.selectedEnds.push(self.chromosomeEnd);
            
            this.selectedRegion = self.printSelectedRegion();
            this.highlightRegion = false;
            this.lineWidth = 1.0;
            this.showSpheres = false;
            this.sphereRadius = initialClusterSphereRadius;
            this.dimOpacity = 0.5;
            // </editor-fold>
        },
        changeUnits: function(){
            // <editor-fold defaultstate="collapsed" desc="Method Code">
            if(this.units === "bp"){
                this.unitScale = 1;
            } else if(this.units === "kbp"){
                this.unitScale = 1000;
            } else if(this.units === "Mbp"){
                this.unitScale = 1000000;
            } else {
                console.log("Received unexpected unit: " + value)
            }
            this.selectedRegion = self.printSelectedRegion();
            var controllers = self.chromatinFolder.__controllers;
            for(var i in controllers){
                if(controllers[i].property === "selectedRegion"){
                    self.chromatinFolder.__controllers[i].updateDisplay();
                }
            }
            // </editor-fold>
        }
        // </editor-fold>
    };
    
    this.printSelectedRegion = function(){
        // <editor-fold defaultstate="collapsed" desc="Prints selected region for display">
        var string = "";
        for(var i=0;i<self.selectedStarts.length;i++){
            string += (self.selectedStarts[i]/self.chromatinParameters.unitScale)
                    + "-" + (self.selectedEnds[i]/self.chromatinParameters.unitScale);
            if(i !== self.selectedStarts.length-1){
                string += ",";
            }
        }
        return string;
        // </editor-fold>
    };
    
    // region string is of form xxx-xxx,xxx-xxx,xxx-xxx
    // TODO:  ADD INPUT CHECKING!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    this.parseSelectedRegion = function(regionString){
        // <editor-fold defaultstate="collapsed" desc="Mehod Code">
        self.selectedStarts = [];
        self.selectedEnds = [];
        var regions = regionString.split(",");
        for(var i=0;i<regions.length;i++){
            var pos = regions[i].split("-");
            self.selectedStarts.push(pos[0]*self.chromatinParameters.unitScale);
            self.selectedEnds.push(pos[1]*self.chromatinParameters.unitScale);
        }
        // </editor-fold>
    };
    
    this.centromereParameters = {
        // <editor-fold defaultstate="collapsed" desc="Parameters for centromere display.">
        visible: true,
        color: "#ffffff",
        parallelRadius: initialCentromereRadius,
        perpRadius: initialCentromereRadius,
        reset: function(){
            this.visible = true;
            this.color = "#ffffff";
            this.parallelRadius = initialCentromereRadius;
            this.perpRadius = initialCentromereRadius;
        }
        // </editor-fold>
    };
    
    this.interactionParameters = {};
    
    this.displayFolder = this.mygui.addFolder("DISPLAY OPTIONS");
    createDisplayOptionsFolder();
    
    this.chromatinFolder = this.mygui.addFolder("CHROMATIN OPTIONS");
    createChromatinFolder();
    
    //this.centromereFolder = this.mygui.addFolder("CENTROMERE OPTIONS");
    //createCentromereFolder();
    
    this.proteinFolder = this.mygui.addFolder("PROTEIN FACTOR OPTIONS");
    this.proteinFolderFolderNames = [];
    
    this.update = function(){
        // <editor-fold defaultstate="collapsed" desc="Method Code">
        // Copy the reference for all sub-folders of the protein folders
        
        self.mygui.removeFolder("PROTEIN FACTOR OPTIONS");
        //self.mygui.removeFolder("CENTROMERE OPTIONS");
        self.mygui.removeFolder("CHROMATIN OPTIONS");
        self.mygui.removeFolder("DISPLAY OPTIONS");
        self.mygui.removeFolder("GENERATE STL FILE");
        
        self.stlFileFolder = self.mygui.addFolder("GENERATE STL FILE");
        self.stlParameters.reset();
        createSTLFileFolder();
        
        self.displayFolder = self.mygui.addFolder("DISPLAY OPTIONS");
        createDisplayOptionsFolder();
        
        self.chromatinFolder = self.mygui.addFolder("CHROMATIN OPTIONS");
        self.chromatinParameters.reset();
        createChromatinFolder();
        
        //self.centromereFolder = self.mygui.addFolder("CENTROMERE OPTIONS");
        //self.centromereParameters.reset();
        //createCentromereFolder();
        
        var model = self.viewer.getModel();
        self.proteinFolderFolderNames = [];
        self.interactionParameters = {};
        self.proteinFactors = model.getProteinFactorArray();
        if(model.getLevel() === 2){
            self.proteinFolder = self.mygui.addFolder("PROTEIN FACTOR OPTIONS");
            for(var i=0;i<self.proteinFactors.length;i++){
                createProteinFactorFolder(self.proteinFactors[i]);
            }
        }
        
//        for(var i in self.chromatinFolder.__controllers){
//            self.chromatinFolder.__controllers[i].updateDisplay();
//        }
        // </editor-fold>
    };
    
    // Return a reference to the folder
    function createProteinFactorFolder(proteinName){
        // <editor-fold defaultstate="collapsed" desc="Method Code">
        var folder = self.proteinFolder.addFolder(proteinName+" Options");
        self.proteinFolderFolderNames.push(proteinName+" Options");
        // Get the count, just to decide on an initial color.
        var count = Object.keys(self.interactionParameters).length;
        var initColor = initialColor(count);
        // Add this protein to the interactionParameters array
        self.interactionParameters[proteinName] = new ProteinParameters(initColor);
        // Get the interaction shapes for this protein factor, and change
        // their color to the initial color.
        var interactionShapes = self.viewer.getInteractionShapes(proteinName);
        for(var i=0;i<interactionShapes.length;i++){
            if(interactionShapes[i].getInteraction().getProteinFactor() === proteinName){
                interactionShapes[i].setColor(initColor.replace("#","0x"));
            }
        }
        self.viewer.brightProteinLines[proteinName].material.color.setHex(initColor.replace("#","0x"));
        
        // Get a local copy of the interaction parameters object
        var local = self.interactionParameters[proteinName];
        
        var displayChooser = folder.add(local, "visible").name("Show Protein Factor");
        displayChooser.onChange(function(value){
            if(value){
                self.viewer.world.add(self.viewer.interactionSpheres[proteinName]);
                self.viewer.world.add(self.viewer.brightProteinLines[proteinName]);
                if(self.viewer.dimProteinLines[proteinName] !== null){
                    self.viewer.world.add(self.viewer.dimProteinLines[proteinName]);
                }
                self.viewer.interactionSpheresVisible[proteinName] = true;
            } else {
                self.viewer.world.remove(self.viewer.interactionSpheres[proteinName]);
                self.viewer.world.remove(self.viewer.brightProteinLines[proteinName]);
                if(self.viewer.dimProteinLines[proteinName] !== null){
                    self.viewer.world.remove(self.viewer.dimProteinLines[proteinName]);
                }
                self.viewer.interactionSpheresVisible[proteinName] = false;
            }
            self.viewer.viewChangedSinceLastRender = true;
        });
        
        var colorChooser = folder.addColor(local, "color").name("Color");
        colorChooser.onChange(function(value){
            changeInteractionColor(proteinName, value.replace("#", "0x"));
        });
        
        var opacityChooser = folder.add(local, "opacity").min(0.00).max(1.00).step(0.01).name("Opacity");
        opacityChooser.onChange(function(value){
            changeInteractionOpacity(proteinName, value);
        });
        
        var sphereSizer = folder.add(local, "sphereSize").min(0.1).max(5).step(0.1).name("Sphere Size");
        sphereSizer.onFinishChange(function(value){
            changeInteractionSphereSize(proteinName, value);
        });
        
        var lineWidthChooser = folder.add(local, "lineWidth").min(1).max(5).step(0.1).name("Line Thickness");
        lineWidthChooser.onChange(function(value){
            changeInteractionLineWidth(proteinName, value);
        });
        folder.open();
        return folder;
        // </editor-fold>
    }
    
    function changeInteractionColor(proteinFactor, color){
        // <editor-fold defaultstate="collapsed" desc="Method Code">
        var shapes = self.viewer.getInteractionShapes(proteinFactor);
        for(var i=0;i<shapes.length;i++){  
            shapes[i].setColor(color);
        }
        self.viewer.brightProteinLines[proteinFactor].material.color.setHex(color);
        if(self.viewer.dimProteinLines[proteinFactor] !== null){
            self.viewer.dimProteinLines[proteinFactor].material.color.setHex(color);
        }
        self.viewer.viewChangedSinceLastRender = true;
        // </editor-fold>
    }
    
    function changeInteractionOpacity(proteinFactor, opacity){
        // <editor-fold defaultstate="collapsed" desc="Method Code">
        var shapes = self.viewer.getInteractionShapes(proteinFactor);
        for(var i=0;i<shapes.length;i++){  
            shapes[i].setOpacity(opacity);
        }
        self.viewer.brightProteinLines[proteinFactor].material.opacity = opacity;
        self.viewer.viewChangedSinceLastRender = true;
        // </editor-fold>
    }
    
    function changeInteractionSphereSize(proteinFactor, radius){
        // <editor-fold defaultstate="collapsed" desc="Method Code">
        self.viewer.updateInteractionSphereRadius(proteinFactor, radius);
        self.viewer.viewChangedSinceLastRender = true;
        // </editor-fold>
    }
    
    function changeInteractionLineWidth(proteinFactor, lineWidth){
        // <editor-fold defaultstate="collapsed" desc="Method Code">
        self.viewer.brightProteinLines[proteinFactor].material.linewidth = lineWidth;
        if(self.viewer.dimProteinLines[proteinFactor] !== null){
            self.viewer.dimProteinLines[proteinFactor].material.linewidth = lineWidth;
        }
        self.viewer.viewChangedSinceLastRender = true;
        // </editor-fold>
    }
    
    function initialColor(count){
        // <editor-fold defaultstate="collapsed" desc="Method Code">
        switch(count%6){
            case 0:
                return "#ff0000";
            case 1:
                return "#00ff00";
            case 2:
                return "#0000ff";
            case 3:
                return "#ffff00";
            case 4:
                return "#ff00ff";
            case 5:
                return "#00ffff";
        }
        // </editor-fold>
    }
    
    function createDisplayOptionsFolder(){
        // <editor-fold defaultstate="collapsed" desc="Method Code">
        var backgroundColorParameters = {
            bgColor: "#000000"
        };
        
        var bgFolder = self.displayFolder.addFolder("Background Color");
        
        var bgColorChooser = bgFolder.addColor(backgroundColorParameters, "bgColor").name("Background Color");
        
        bgColorChooser.onChange(function(value){
            self.viewer.setBackgroundColor(value.replace("#","0x"));
            self.viewer.viewChangedSinceLastRender = true;
        });
        
        var axisParameters = {
            visible: false,
            length: initialAxisLength,
            radius: initialAxisRadius,
            xColor: "#ff0000",
            yColor: "#00ff00",
            zColor: "#0000ff"
        };
        
        var axisFolder = self.displayFolder.addFolder("Axis Controls");
        
        var showAxisChooser = axisFolder.add(axisParameters, "visible").name("Show Axes");
        var xColorChooser = axisFolder.addColor(axisParameters, "xColor").name("X Axis Color");
        var yColorChooser = axisFolder.addColor(axisParameters, "yColor").name("Y Axis Color");
        var zColorChooser = axisFolder.addColor(axisParameters, "zColor").name("Z Axis Color");
        var axesLengthChooser = axisFolder.add(axisParameters, "length").min(1).max(400).step(1).name("Length");
        var axesRadiusChooser = axisFolder.add(axisParameters, "radius").min(0.25).max(5).step(0.25).name("Radius");
        
        showAxisChooser.onChange(function(value){
            // <editor-fold defaultstate="collapsed" desc="Method Code">
            self.viewer.axesVisible = value;
            if(value){
                self.viewer.scene.add(self.viewer.axes);
            } else {
                self.viewer.scene.remove(self.viewer.axes);
            }
            self.viewer.viewChangedSinceLastRender = true;
            // </editor-fold>
        });
        
        xColorChooser.onChange(function(value){
            self.viewer.xaxis.setColor(value.replace("#", "0x"));
            self.viewer.viewChangedSinceLastRender = true;
        });
        yColorChooser.onChange(function(value){
            self.viewer.yaxis.setColor(value.replace("#", "0x"));
            self.viewer.viewChangedSinceLastRender = true;
        });
        zColorChooser.onChange(function(value){
            self.viewer.zaxis.setColor(value.replace("#", "0x"));
            self.viewer.viewChangedSinceLastRender = true;
        });
        axesRadiusChooser.onChange(function(value){
            self.viewer.updateAxesSize(value, axisParameters.length);
            self.viewer.viewChangedSinceLastRender = true;
        });
        axesLengthChooser.onChange(function(value){
            self.viewer.updateAxesSize(axisParameters.radius, value);
            self.viewer.viewChangedSinceLastRender = true;
         });
         
        var axesTranslationParameters = {
            // <editor-fold defaultstate="collapsed" desc="Parameters needed for axes translation.">
            axis: "x",
            distance: 0,
            translate: function(){
                if(this.axis === "x"){
                    self.viewer.axes.translateX(this.distance);
                } else if(this.axis === "y"){
                    self.viewer.axes.translateY(this.distance);
                } else {
                    self.viewer.axes.translateZ(this.distance);
                }
                self.viewer.viewChangedSinceLastRender = true;
            }
            // </editor-fold>
        };
        
        var axesTranslationFolder = axisFolder.addFolder("Translate Axes");
        axesTranslationFolder.add(axesTranslationParameters, "axis", ["x","y","z"]).name("Translation Axis");
        var distanceChooser = axesTranslationFolder.add(axesTranslationParameters, "distance").name("Distance");
        axesTranslationFolder.add(axesTranslationParameters, "translate").name("Translate");
        
        // Input checking for distance
       distanceChooser.onChange(function(value){
           if(!isNumber(value)){
               axesTranslationParameters.distance = 0;
               for(var i in axesTranslationFolder.__controllers){
                   axesTranslationFolder.__controllers[i].updateDisplay();
               }
           }
       });
        
        var rotationParameters = {
            // <editor-fold defaultstate="collapsed" desc="Parameters for rotations about an axis.">
            axis: "x",
            degrees: "0",
            rotate: function(){
                var angle = this.degrees*Math.PI/180.0;
                if(this.axis === "x"){
                    rotateAroundWorldAxis(self.viewer.world, xaxis, angle);
                } else if(this.axis === "y"){
                    rotateAroundWorldAxis(self.viewer.world, yaxis, angle);
                } else {
                    rotateAroundWorldAxis(self.viewer.world, zaxis, angle);
                }
                self.viewer.viewChangedSinceLastRender = true;
            }
            // </editor-fold>
        };
        
        var rotationFolder = self.displayFolder.addFolder("Rotation Controls");
        var axisChooser = rotationFolder.add(rotationParameters, "axis", ["x","y","z"]).name("Rotation Axis");
        var degreeChooser = rotationFolder.add(rotationParameters, "degrees").name("Angle (degrees)");
        var rotater = rotationFolder.add(rotationParameters, "rotate").name("Rotate");
        
        // Add some input checking for the angle
        degreeChooser.onChange(function(value){
            // <editor-fold defaultstate="collapsed" desc="Method Code">
            if(!isNumber(value)){
                rotationParameters.degrees = 0;
                for(var i in rotationFolder.__controllers){
                    rotationFolder.__controllers[i].updateDisplay();
                }
            }
            // </editor-fold>
        });
        
        function rotateAroundWorldAxis(object, axis, radians) {
            // <editor-fold defaultstate="collpsed" desc="Method Code">
            var rotWorldMatrix = new THREE.Matrix4();
            rotWorldMatrix.makeRotationAxis(axis.normalize(), radians);

            rotWorldMatrix.multiply(object.matrix);                // pre-multiply

            object.matrix = rotWorldMatrix;

            object.rotation.setFromRotationMatrix(object.matrix);
            // </editor-fold>
        }
        
        var coordinateBarParameters = {
            showCoordinateBar: self.viewer.headsUpDisplay.showCoordinateBar
        };
        
        var headsUpFolder = self.displayFolder.addFolder("Overlay Display");
        var showHeadsUpDisplayChooser = headsUpFolder.add(coordinateBarParameters, "showCoordinateBar").name("Coord. Color Map");
        
        showHeadsUpDisplayChooser.onChange(function(value){
            self.viewer.headsUpDisplay.showCoordinateBar = value;
            if(value){
                self.viewer.headsUpDisplay.addCoordinateSprite();
            } else {
                self.viewer.headsUpDisplay.removeCoordinateSprite();
            }
            self.viewer.viewChangedSinceLastRender = true;
        });
        
        // </editor-fold>
    }
    
    function createChromatinFolder(){
        // <editor-fold defaultstate="collapsed" desc="Method Code">
        self.chromatinFolder.add(self.chromatinParameters, "showWholeChromosome").name("Show Whole Genome");
        var unitChooser = self.chromatinFolder.add(self.chromatinParameters, "units", ["bp", "kbp", "Mbp"]).name("Unit");
        var selectedRegionChooser = self.chromatinFolder.add(self.chromatinParameters, "selectedRegion").name("Select Genomic Region");
        var highlightChooser = self.chromatinFolder.add(self.chromatinParameters, "highlightRegion").name("Highlight");
        var lineWidthChooser = self.chromatinFolder.add(self.chromatinParameters, "lineWidth").min(1.0).max(5.0).step(0.1).name("Line Thickness");
        var showSpheresChooser = self.chromatinFolder.add(self.chromatinParameters, "showSpheres").name("Show spheres");
        var sphereRadiusChooser = self.chromatinFolder.add(self.chromatinParameters, "sphereRadius").min(0.1).max(5).step(0.1).name("Sphere Radius");
        var dimOpacityChooser = self.chromatinFolder.add(self.chromatinParameters, "dimOpacity").min(0.0).max(1.0).step(0.01).name("Dim Opacity");
        
        unitChooser.onChange(function(value){
            // <editor-fold defaultstate="collapsed" desc="Method Code">
            self.chromatinParameters.units = value;
            self.chromatinParameters.changeUnits();
            // </editor-fold>
        });
        
        // NEED TO ADD INPUT CHECKING HERE!!!
        selectedRegionChooser.onFinishChange(function(value){
            // <editor-fold defaultstate="collapsed" desc="Method Code">
            // Get the gui controllers so we can update them if need be
//            var controllers = self.chromatinFolder.__controllers;
            self.parseSelectedRegion(value);
            self.chromatinParameters.selectedRegion = self.printSelectedRegion();
                
            // INPUT CHECKING
//            var changedInput = false;
//            if(!isNumber(start) || !isNumber(end)){
//                start = 0;
//                end = self.chromosomeEnd;
//                changedInput = true;
//            } else {
//                // Now adjust the units!
//                start = Number(start);
//                end = Number(end);
//                if(start < 0){
//                    start = 0;
//                    changedInput = true;
//                }
//                if(end*self.chromatinParameters.unitScale > self.chromosomeEnd){
//                    end = self.chromosomeEnd/self.chromatinParameters.unitScale;
//                    changedInput = true;
//                 }
//            }
//            
//            if(changedInput){
//                self.chromatinParameters.selectedRegion = start + "-" + end;
//                for(var i in controllers){
//                    if(controllers[i].property === "selectedRegion"){
//                        controllers[i].updateDisplay();
//                    }
//                }
//            }
            self.viewer.viewChangedSinceLastRender = true;
            // </editor-fold>
        });
        
        highlightChooser.onChange(function(value){
            // <editor-fold defaultstate="collapsed" desc="Method Code">
            var dimOpacity = self.chromatinParameters.dimOpacity;
            var lineWidth = self.chromatinParameters.lineWidth;
            if(value){
                self.viewer.buildChromatinLines(self.selectedStarts, self.selectedEnds, dimOpacity, lineWidth);
                if(self.viewer.model.getLevel() === 2){
                    self.viewer.buildProteinLines(self.selectedStarts, self.selectedEnds, dimOpacity);
                }
            } else {
                self.viewer.buildChromatinLines(self.selectedStarts, self.selectedEnds, 1.0, lineWidth);
                if(self.viewer.model.getLevel() === 2){
                    self.viewer.buildProteinLines(self.selectedStarts, self.selectedEnds, 1.0);
                }
            }
            makeTube();
            self.viewer.viewChangedSinceLastRender = true;
            // </editor-fold>
        });
        
        lineWidthChooser.onChange(function(value){
            // <editor-fold defaultstate="collapsed" desc="Method Code">
            self.viewer.brightLine.material.linewidth = value;
            if(self.chromatinParameters.highlightRegion){
                self.viewer.dimLine1.material.linewidth = value;
                self.viewer.dimLine2.material.linewidth = value;
            }
            self.viewer.viewChangedSinceLastRender = true;
            // </editor-fold>
        });
        
        sphereRadiusChooser.onFinishChange(function(value){
            // <editor-fold defaultstate="collapsed" desc="Method Code">
            self.viewer.updateClusterSphereRadius(value);
            self.viewer.viewChangedSinceLastRender = true;
            // </editor-fold>
        });
        
        showSpheresChooser.onChange(function(value){
            // <editor-fold defaultstate="collapsed" desc="Method Code">
            self.viewer.clusterSpheresVisible = value;
            if(value){
                self.viewer.world.add(self.viewer.mergedClusterMesh);
            } else {
                self.viewer.world.remove(self.viewer.mergedClusterMesh);
            }
            self.viewer.viewChangedSinceLastRender = true;
            // </editor-fold>
        });
        
        dimOpacityChooser.onFinishChange(function(value){
            // <editor-fold defaultstate="collapsed" desc="Method Code">
            if(self.chromatinParameters.highlightRegion){
                self.viewer.buildChromatinLines(self.selectedStarts, self.selectedEnds, value, self.chromatinParameters.lineWidth);
                self.viewer.buildProteinLines(self.selectedStarts, self.selectedEnds, value);
            }
           self.viewer.viewChangedSinceLastRender = true;
           // </editor-fold>
        });
        // </editor-fold>
    }
    
    function createCentromereFolder(){
        // <editor-fold defaultstate="collapsed" desc="Method Code">
        var visibleChooser = self.centromereFolder.add(self.centromereParameters, "visible").name("Show Centromere");
        var colorChooser = self.centromereFolder.addColor(self.centromereParameters, "color").name("Color");
        var parallelRadiusChooser = self.centromereFolder.add(self.centromereParameters, "parallelRadius")
                .min(0.1*initialCentromereRadius)
                .max(2*initialCentromereRadius)
                .step(0.01).name("Parallel Radius");
        var perpRadiusChooser = self.centromereFolder.add(self.centromereParameters, "perpRadius")
                .min(0.1*initialCentromereRadius)
                .max(2*initialCentromereRadius)
                .step(0.01).name("Perp Radius");

        visibleChooser.onChange(function(value){
            // <editor-fold defaultstate="collapsed" desc="Method Code">
            var centromereShape = self.viewer.centromereShape;
            if(centromereShape !== null){
                centromereShape.setVisible(value);
                if(value){
                    self.viewer.world.add(centromereShape.sphere);
                } else {
                    self.viewer.world.remove(centromereShape.sphere);
                }
            }
            self.viewer.viewChangedSinceLastRender = true;
            // </editor-fold>
        });

        colorChooser.onChange(function(value){
            var centromere = self.viewer.centromereShape;
            if(centromere !== null){
                centromere.setColor(value.replace("#", "0x"));
            }
            self.viewer.viewChangedSinceLastRender = true;
        });

        parallelRadiusChooser.onChange(function(value){
            stretchCentromere(value, self.centromereParameters.perpRadius);
            self.viewer.viewChangedSinceLastRender = true;
        });
        
        perpRadiusChooser.onChange(function(value){
            stretchCentromere(self.centromereParameters.parallelRadius, value);
            self.viewer.viewChangedSinceLastRender = true;
        });
        
        function stretchCentromere(parallelRadius, perpRadius){
            // <editor-fold defaultstate="collapsed" desc="Centromere stretching">
            // Store the current position
            var centromere = self.viewer.centromereShape;
            if(centromere !== null){
                var sphere = centromere.sphere;
                var pos = centromere.position;
                // Shift the sphere to the origin and undo the rotations
                sphere.position.set(0,0,0);
                sphere.rotation.x = 0;
                sphere.rotation.y = 0;
                sphere.rotation.z = 0;
                // The parallel radius is used to stretch along the x axis
                sphere.scale.x = parallelRadius/initialCentromereRadius;
                sphere.scale.y = perpRadius/initialCentromereRadius;
                sphere.scale.z = perpRadius/initialCentromereRadius;
                // Now rotate to align the x-axis with the centromere normal
                var n = centromere.normal;
                // Defining theta relative to the y-axis.  Doing this because
                // rotation.x and rotation.y rotate with respect to the world axes,
                // but rotation.z rotates relative to an internal z-axis?!  That's
                // what it seems.  That's messed up.
                var theta = Math.asin(n.y);
                var phi = 0;
                // It's unlikely, but if n is exactly parallel to the z-axis, then
                // cos(theta) = 0 and we'd try to divide by infinity below.  In this
                // case we do not need a second rotation.
                if(n.y !== 1.0){
                    phi = Math.asin(n.z/Math.cos(theta));
                }
                if(n.x < 0){
                    theta = -theta;
                    phi = -phi;
                }
                sphere.rotation.y = -phi;
                sphere.rotation.z = theta;

                // Now put the sphere back
                sphere.position.set(pos.x, pos.y, pos.z);
            }
            // </editor-fold>
        }   
        // </editor-fold>
    }
    
    function isNumber(n){
        return !isNaN(parseFloat(n)) && isFinite(n);
    };
    
    // Helper function to call the viewer's createTube method
    function makeTube(){
        // <editor-fold defaultstate="collapsed" desc="Method Code">
        if(self.viewer.tubeVisible){
            self.viewer.createTubeGeometry(self.stlParameters.linearSegments,
                self.stlParameters.tubeRadius, self.stlParameters.radialSegments,
                self.stlParameters.showEndCaps, self.stlParameters.tubeColor.replace("#","0x"));
            self.viewer.viewChangedSinceLastRender = true;
        }
        // </editor-fold>
    }
    // </editor-fold>
}

/* ************************ HEADS UP DISPLAY ****************************\
 *                                                                      *
 * Use this for any 2D elements which should always be displayed. Right *
 * now we only have one such element, namely, a bar which shows how     *
 * the color scale relates to genomic position.                         *
\************************************************************************/
                        
function HeadsUpDisplay(viewer){
    this.viewer = viewer;
    this.canvas = viewer.canvas;
    this.orthoScene = new THREE.Scene();
    this.orthoCamera = null;
    
    this.showCoordinateBar = false;
    this.coordinateSpriteTexture = null;
    this.coordinateSprite = null;
    
    this.showColorScaleBar = false;
    this.colorScaleSpriteTexture = null;
    this.colorScaleSprite = null;
    
}

HeadsUpDisplay.prototype.init = function(){
    var width = this.canvas.width;
    var height = this.canvas.height;
    this.orthoCamera = new THREE.OrthographicCamera( - width / 2, width / 2, height / 2, - height / 2, 1, 10 );
    this.orthoCamera.position.z = 10;
};

HeadsUpDisplay.prototype.drawLine = function(context, color, x1, y1, x2, y2){
    // <editor-fold defaultstate="collapsed" desc="Method Code">
    context.strokeStyle = color;
    context.beginPath();
    context.moveTo(x1,y1);
    context.lineTo(x2,y2);
    context.stroke();
    // </editor-fold>
};

HeadsUpDisplay.prototype.createCoordinateSprite = function () {
    // <editor-fold defaultstate="collapsed" desc="Method Code">
    if(this.coordinateSprite !== null){
        this.orthoScene.remove(this.coordinateSprite);
    }
    this.coordinateSprite = null;
    
    var width = this.canvas.width;
    var height = this.canvas.height;
    
    var drawCanvas = document.createElement('canvas');
    drawCanvas.width = Math.floor(0.95*width);
    drawCanvas.height = Math.floor(0.1*height);
    var sideMargin = 30;
    var topMargin = 5;
    // Number of lines we need to draw
    var lines = drawCanvas.width - 2*sideMargin;
    var oneFourthLines = Math.ceil(lines/4); // Want ceiling so the last and next-to-last clusters don't both add labels
    var context = drawCanvas.getContext('2d');
    context.fillStyle = "rgba(255,255,255,1)";
    context.fillRect(0,0,width, height);
    
    var labels = [];
    var labelPositions = [];
    // Get the cluster shapes to draw the lines.
    var clusterShapes = this.viewer.clusterShapes;
    var spacing = clusterShapes.length/lines;
    for(var i=0;i<lines;i++){
        var cs = clusterShapes[Math.floor(spacing*i)];
        if(i===0){
            var genStart = cs.getCluster().getGenomicStart();
            labels.push(genStart);
            labelPositions.push(i);
        } else if(i=== lines-1){
            cs = clusterShapes[clusterShapes.length-1]; // Avoid any rounding issues
            var genEnd = cs.getCluster().getGenomicEnd();
            labels.push(genEnd);
            labelPositions.push(i);
        } else if(0 === i%oneFourthLines){
            var genPos = cs.getCluster().getGenomicPosition();
            labels.push(genPos);
            labelPositions.push(i);
        }
        this.drawLine(context,"#"+cs.color.getHexString(), sideMargin+i, topMargin, sideMargin+i, drawCanvas.height/2);
    }
    
    formatLabels();
    
    context.font = Math.round(drawCanvas.height/4) + "px Arial";
    context.textAlign = "center";
    context.fillStyle = "black";
    for(var i=0;i<labels.length;i++){
        context.fillText(labels[i], sideMargin+labelPositions[i], Math.ceil(5*drawCanvas.height/6));
    }

    this.coordinateSpriteTexture = new THREE.Texture(drawCanvas);
    this.coordinateSpriteTexture.needsUpdate = true;
    
    var spriteMaterial = new THREE.SpriteMaterial({map: this.coordinateSpriteTexture});
    this.coordinateSprite = new THREE.Sprite( spriteMaterial);
    this.coordinateSprite.scale.set(drawCanvas.width, drawCanvas.height, 1.0);
    this.coordinateSprite.position.set(0,(-height+ drawCanvas.height)/2,1);
    // this.orthoScene.add(this.coordinateSprite);
    
    function formatLabels(){
        if(labels[labels.length-1] > 1000000){
            for(var i=0;i<labels.length;i++){
                labels[i] = Math.floor(labels[i]/100000);
                labels[i] = labels[i]/10;
            }
        }
    };
    // </editor-fold>
};

HeadsUpDisplay.prototype.createColorScaleSprite = function(){
    // <editor-fold defaultstate="collapsed" desc="Method Code">
    if(this.colorScaleSprite !== null){
        this.orthoScene.remove(this.colorScaleSprite);
    }
    this.colorScaleSprite = null;
    
    var fontHeight = 14;
    var wordWidth = (String(this.viewer.colorScale.maxValue).length + 2) * 7;
    var barWidth = 30;
    var width = this.canvas.width;
    var height = this.canvas.height;
    var sideMargin = 5;
    var topMargin = 10;
    var drawCanvas = document.createElement('canvas');
    drawCanvas.width = Math.floor(wordWidth + barWidth + 2*sideMargin);
    drawCanvas.height = Math.floor(0.8*height);

    // Number of lines we need to draw
    var lines = drawCanvas.height - 2*topMargin;
    var oneFourthLines = Math.ceil(lines/4); // Want ceiling so the last and next-to-last clusters don't both add labels
    var context = drawCanvas.getContext('2d');
    context.fillStyle = "rgba(255,255,255,1)";
    context.fillRect(0,0,width, height);
    
    var labels = [];
    var labelPositions = [];
    
    var colorScale = this.viewer.colorScale;
    var maxValue = colorScale.maxValue;
    if(colorScale.scale === ColorScaleConstants.LOG){
        maxValue = Math.log(maxValue)/Math.log(10);
    }
    for(var i=0;i<lines;i++){
        if(i===0){
            labels.push(0);
            labelPositions.push(i);
        } else if(i=== lines-1){
            labels.push(colorScale.maxValue);
            labelPositions.push(i);
        } else if(0 === i%oneFourthLines){
            if(colorScale.scale === ColorScaleConstants.LOG){
                labels.push(Math.pow(10,i*maxValue/lines));
            } else {
                labels.push(i*maxValue/lines);
            }
            labelPositions.push(i);
        }
 
        this.drawLine(context, colorScale.interpolateColor(i/(lines-1)), drawCanvas.width-sideMargin-barWidth, 
                            topMargin+i, drawCanvas.width-sideMargin, topMargin+i);
    }
    
    formatLabels();
    
    context.font = fontHeight + "px Arial";
    context.textAlign = "right";
    context.fillStyle = "black";
    for(var i=0;i<labels.length;i++){
        context.fillText(labels[i], drawCanvas.width-sideMargin-barWidth-3, topMargin + labelPositions[i] + fontHeight/2);
    }

    this.colorScaleSpriteTexture = new THREE.Texture(drawCanvas);
    this.colorScaleSpriteTexture.needsUpdate = true;
    
    var spriteMaterial = new THREE.SpriteMaterial({map: this.colorScaleSpriteTexture});
    this.colorScaleSprite = new THREE.Sprite( spriteMaterial);
    this.colorScaleSprite.scale.set(drawCanvas.width, drawCanvas.height, 1.0);
    this.colorScaleSprite.position.set((-width + drawCanvas.width)/2,(height-drawCanvas.height)/2,1);
    // this.orthoScene.add(this.coordinateSprite);
    
    function formatLabels(){
        // <editor-fold defaultstate="collapsed" desc="Keep no more than 2 decimal places.">
        for(var i=0;i<labels.length;i++){
            labels[i] = Math.floor(100*labels[i])/100.0;
        }
        // </editor-fold>
    };
    // </editor-fold>
};

HeadsUpDisplay.prototype.addCoordinateSprite = function(){
    if(this.coordinateSprite !== null){
        this.orthoScene.add(this.coordinateSprite);
    }
};

HeadsUpDisplay.prototype.removeCoordinateSprite = function(){
    if(this.coordinateSprite !== null){
        this.orthoScene.remove(this.coordinateSprite);
    }
};

HeadsUpDisplay.prototype.addColorScaleSprite = function(){
    if(this.colorScaleSprite !== null){
        this.orthoScene.add(this.colorScaleSprite);
    }
};

HeadsUpDisplay.prototype.removeColorScaleSprite = function(){
    if(this.colorScaleSprite !== null){
        this.orthoScene.remove(this.colorScaleSprite);
    }
};

//HeadsUpDisplay.prototype.updateHUDSprites = function() {
//
//    var width = this.canvas.width / 2;
//    var height = this.canvas.height / 2;
//
//    var material = this.spriteTL.material;
//
//    var imageWidth = material.map.width / 2;
//    var imageHeight = material.map.height / 2;
//
//    this.spriteTL.position.set( - width + imageWidth,   height - imageHeight, 1 ); // top left
//    this.spriteTR.position.set(   width - imageWidth,   height - imageHeight, 1 ); // top right
//    this.spriteBL.position.set( - width + imageWidth, - height + imageHeight, 1 ); // bottom left
//    this.spriteBR.position.set(   width - imageWidth, - height + imageHeight, 1 ); // bottom right
//    this.spriteC.position.set( 0, 0, 1 ); // center
//
//};

//HeadsUpDisplay.prototype.onWindowResize = function() {
//
//    var width = window.innerWidth;
//    var height = window.innerHeight;
//
////    camera.aspect = width / height;
////    camera.updateProjectionMatrix();
//
//    this.orthoCamera.left = - width / 2;
//    this.orthoCamera.right = width / 2;
//    this.orthoCamera.top = height / 2;
//    this.orthoCamera.bottom = - height / 2;
//    this.orthoCamera.updateProjectionMatrix();
//
//    this.updateHUDSprites();
//
////    renderer.setSize( window.innerWidth, window.innerHeight );
//
//};

/*************************  THE VIEWER ************************************\
 *  @type {Object} Viewer                                                 *
 *                                                                        *
 *  @param _canvas                                                        *
 *  @param _model                                                         *
\**************************************************************************/

function Viewer(_canvas, _model) {
    // <editor-fold defaultstate="collapsed" desc="Viewer Constructor">
    this.model = _model;
    this.clusterShapes = [];
    this.mergedClusterMesh = null;
    this.clusterSpheresVisible = false;
    
    // Unlimited number of highlighted sections.
    this.dimLines = [];
    this.brightLines = [];
    
    // The tube that we need for the STL file
    this.tube = null;
    this.tubeVisible = false;
    
    this.interactionShapes = {};
    this.interactionSpheres = {};
    this.interactionSpheresVisible = {};
    
    this.dimProteinLines = {};
    this.brightProteinLines = {};
    
    this.centromereShape = null;
    
    // Array to store the loaded BED file data
    this.bedData = [];
    this.hasAnnotationData = false;
    this.colorScale = new ColorScale();
    
    // To implement user-defined rotations, we will add all objects to an
    // object3d named "world," and then we will rotate this world object.
    this.world = new THREE.Object3D();
    
    this.xaxis = null;
    this.yaxis = null;
    this.zaxis = null;
    this.axes = null;
    this.axesVisible = false;
    
    // Three.js globals
    this.canvas = _canvas;
    this.clock = new THREE.Clock();
    this.keyboard = new THREEx.KeyboardState();
    this.scene = new THREE.Scene();
    this.scale = 0.75;
    this.SCREEN_WIDTH = this.scale * window.innerWidth;
    this.SCREEN_HEIGHT = this.scale * window.innerHeight;
    this.VIEW_ANGLE = 45;
    this.controls;

    this.camera = new THREE.PerspectiveCamera(this.VIEW_ANGLE, this.canvas.width / this.canvas.height, 0.1, 20000);
    this.renderer = new THREE.WebGLRenderer({preserveDrawingBuffer:true, canvas: this.canvas, antialias: true});
    this.stats = new Stats();
    this.skyBox = null; // Make this a parameter so we can adjust the background color
    
    this.headsUpDisplay = new HeadsUpDisplay(this);
    // variables used to prevent rendering when there is no change in view.
    // maxRenderIntervalMilliSecs is hardcoded to the interval at which we
    // want to force a render even if nothing has changed (the idea being
    // that a render might be needed to remove visual artifacts)
    this.maxRenderIntervalMilliSecs = 5000;
    this.lastRenderTimeMilliSecs = Date.now();
    this.viewChangedSinceLastRender = true;

    // </editor-fold>
}

Viewer.prototype.init = function () {
    // <editor-fold defaultstate="collapsed" desc="Viewer initialization">
    var self = this;
    this.scene.add(this.camera);

    this.camera.position.set(0, 0, 400);
    this.camera.lookAt(this.scene.position);

    if (!Detector.webgl) {
        // TODO this should probably trigger error message. I don't think we can render without WebGL
        this.renderer = new THREE.CanvasRenderer({canvas: this.canvas});
    }
    this.renderer.autoClear = false;
    // this.renderer.sortObjects = false;

    // EVENTS
    THREEx.FullScreen.bindKey({charCode: 'm'.charCodeAt(0)});
    // CONTROLS
    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    this.controls.addEventListener('change', function() {
        // set a dirty bit to force a render
        self.viewChangedSinceLastRender = true;
    });
    // STATS

    // LIGHT
    var directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(0, 250, 0);
    this.scene.add(directionalLight);

    var ambientLight = new THREE.AmbientLight(0xd0d0d0); // soft white light
    this.scene.add(ambientLight);

    // SKYBOX/FOG
    var skyBoxGeometry = new THREE.CubeGeometry(10000, 10000, 10000);
    var skyBoxMaterial = new THREE.MeshBasicMaterial({color: 0x000000, side: THREE.BackSide});
    this.skyBox = new THREE.Mesh(skyBoxGeometry, skyBoxMaterial);
    this.skyBox.flipSided = true; // render faces from inside of the cube, instead of from outside (default).
    this.scene.add(this.skyBox);
    // scene.fog = new THREE.FogExp2( 0x9999ff, 0.00025 );
    
    this.headsUpDisplay.init();
    // </editor-fold>
};

Viewer.prototype.update = function () {
    if (this.keyboard.pressed("z")) {
        // do something
    }
    this.controls.update();
    this.stats.update();
};

Viewer.prototype.render = function () {
    // <editor-fold defaultstate="collapsed" desc="Rendering code">
    var timeIsUp = Date.now() - this.lastRenderTimeMilliSecs >= this.maxRenderIntervalMilliSecs;
    if(this.viewChangedSinceLastRender || timeIsUp) {
        this.lastRenderTimeMilliSecs = Date.now();
        this.viewChangedSinceLastRender = false;
        
        this.renderer.clear();
        this.renderer.render(this.scene, this.camera);

        this.renderer.clearDepth();
        this.renderer.render(this.headsUpDisplay.orthoScene, this.headsUpDisplay.orthoCamera);
        
    }
    // </editor-fold>
};

Viewer.prototype.buildChromatinShapes = function(){
    // <editor-fold defaultstate="collapsed" desc="Build the spheres and lines.">
    var sphereMaterials = [];
    var mergedClusterGeometry = new THREE.Geometry();
    // When we're first showing a chromosome we have the whole thing 
    // highlighted. No need for dim geometries.
    var brightLineGeometry = new THREE.Geometry();
    var brightLineMaterial = new THREE.LineBasicMaterial({color: 0xffffff, transparent: true, opacity: 1.0, vertexColors: THREE.VertexColors});
    var colors3 = [];
    
    var allClusters = this.model.getAllClusters();
    
    var cluster, clusterShape;
    var genomicPosition;
    var primaryClusterCounter = 0;
    for(var i=0;i<allClusters.length;i++){
        cluster = allClusters[i];
        genomicPosition = cluster.getGenomicPosition();
        brightLineGeometry.vertices.push(cluster.getPosition());
        
        clusterShape = new ClusterShape(cluster);
        this.clusterShapes.push(clusterShape);
        
        if(cluster.isPrimary()){
            var currentSphere = clusterShape.getSphere();
            currentSphere.updateMatrix();
            var currentGeometry = currentSphere.geometry;
            mergedClusterGeometry.merge(currentGeometry, currentSphere.matrix, primaryClusterCounter);
            primaryClusterCounter += 1;
            sphereMaterials.push(currentSphere.material);
        } 
        
        colors3[i] = new THREE.Color( 0xffffff );
        if(!cluster.isInCentromere()){
            colors3[i].setHSL(i / allClusters.length, 1.0, 0.5); 
        } 
        clusterShape.setColor("0x" + colors3[i].getHexString());
        brightLineGeometry.colors.push(colors3[i]);
    }
    
    brightLineGeometry.colorsNeedUpdate = true;
    mergedClusterGeometry.colorsNeedUpdate = true;
    mergedClusterGeometry.verticesNeedUpdate = true;
    console.log("sphereMaterials length = " + sphereMaterials.length);
    this.mergedClusterMesh = new THREE.Mesh(mergedClusterGeometry, new THREE.MeshFaceMaterial(sphereMaterials));
    this.brightLines.push(new THREE.Line(brightLineGeometry, brightLineMaterial));
    // </editor-fold>
};

Viewer.prototype.buildInteractionShapes = function(){
    // <editor-fold defaultstate="collapsed" desc="Build the spheres and lines.">
    var proteinFactors = this.model.getProteinFactorArray();
    var clusters = this.model.getClusters();
    
    for(var i=0;i<proteinFactors.length;i++){
        var name = proteinFactors[i];
        this.interactionSpheres[name] = null;
        this.interactionSpheresVisible[name] = false;
        this.interactionShapes[name] = [];
        
        this.dimProteinLines[name] = null;
        this.brightProteinLines[name] = null;
    }
    
    if(this.model.getLevel() === 2){
        var interactionSphereMaterials = {};
        var interactionSphereGeometry = {};
        var interactionLineGeometry = {};
        var interactionCounter = {};
        
        for(var i=0;i<proteinFactors.length;i++){
            var name = proteinFactors[i];
            interactionSphereGeometry[name] = new THREE.Geometry();
            interactionSphereMaterials[name] = [];
            interactionLineGeometry[name] = new THREE.Geometry();
            interactionCounter[name] = 0;
        }
        
        var interactionShape;
        var interaction;
        for(var i=0;i< this.model.getInteractions().length;i++){
            interaction = this.model.getInteraction(i);
            var intStart1 = interaction.getGenomicStart1();
            var intStart2 = interaction.getGenomicStart2();
            // We have to find the positions of the clusters for this interaction.
            var position1 = -1, position2 = -1;
            for(var j=0;j<clusters.length;j++){
                var cluster = clusters[j];
                var gStart = cluster.getGenomicStart();
                var gEnd = cluster.getGenomicEnd();
                if(intStart1 >= gStart && intStart1 <= gEnd){
                    position1 = cluster.getPosition();
                }
                if(intStart2 >= gStart && intStart2 <= gEnd){
                    position2 = cluster.getPosition();
                }
                if(position1 !== -1 && position2 !== -1){
                    if(0 === i%200){
                        console.log("Loaded interaction " + i);
                    }
                    break;
                }
            }
            var averagePosition = new THREE.Vector3((position1.x + position2.x)/2,
                    (position1.y + position2.y)/2, (position1.z + position2.z)/2);

            interactionShape = new InteractionShape(interaction);
            var currentSphere = interactionShape.sphere;
            currentSphere.position.set(averagePosition.x, averagePosition.y, averagePosition.z);
            currentSphere.updateMatrix();
            
            var proteinName = interaction.getProteinFactor();
            interactionSphereMaterials[proteinName].push(currentSphere.material); 
            interactionSphereGeometry[proteinName].merge(currentSphere.geometry, currentSphere.matrix, interactionCounter[proteinName]);
            
            // interactionShape.setCylinderPosition(position1, position2);
            interactionShape.setLinePosition(position1, position2);
            interactionLineGeometry[proteinName].vertices.push(position1,position2);
            
            this.interactionShapes[proteinName].push(interactionShape);
            
            interactionCounter[proteinName] += 1;
        }
        
        for(var i=0;i<proteinFactors.length;i++){
            var name = proteinFactors[i];
            this.interactionSpheres[name] = new THREE.Mesh(interactionSphereGeometry[name],
                            new THREE.MeshFaceMaterial(interactionSphereMaterials[name]));
            var interactionLineMaterial = new THREE.LineBasicMaterial({color: 0xffffff, transparent: true, opacity: 1.0});
            this.brightProteinLines[name] = new THREE.Line(interactionLineGeometry[name], interactionLineMaterial, THREE.LinePieces);
        }
    }
    // </editor-fold>
};

// Probably don't need a separate function for this, but it seems cleaner.
Viewer.prototype.buildCentromere = function(){
    // <editor-fold defaultstate="collapsed" desc="Build the centromere sphere.">
    this.centromereShape = new CentromereShape(this.model.getCentromere());
    // </editor-fold>
};

Viewer.prototype.buildAxes = function(){
    // <editor-fold defaultstate="collapsed" desc="Build axes object.">
    var axesGeom = new THREE.Geometry();
    
    var axesArray = [];
    this.xaxis = new Axis(xaxis, new THREE.Color(0xff0000));
    this.yaxis = new Axis(yaxis, new THREE.Color(0x00ff00));
    this.zaxis = new Axis(zaxis, new THREE.Color(0x0000ff));
    
    axesArray.push(this.xaxis);
    axesArray.push(this.yaxis);
    axesArray.push(this.zaxis);
    
    var materials = [];
    for(var i=0;i<axesArray.length;i++){
        var a = axesArray[i];
        a.buildAxis();
        a.cylinder.updateMatrix();
        a.arrowHead.updateMatrix();
        axesGeom.merge(a.cylinder.geometry, a.cylinder.matrix, 2*i);
        axesGeom.merge(a.arrowHead.geometry, a.arrowHead.matrix, 2*i+1);
        
        materials.push(a.cylinder.material);
        materials.push(a.arrowHead.material);
    }
    
    this.axes = new THREE.Mesh(axesGeom, new THREE.MeshFaceMaterial(materials));
    // </editor-fold>
};

Viewer.prototype.showModel = function(){
    // <editor-fold defaultstate="collapsed" desc="Display model on canvas">
    this.buildChromatinShapes();
    
    this.buildInteractionShapes();
    
    this.buildCentromere();

    this.buildAxes();
    
    this.world.add(this.brightLines[0]);
    this.world.add(this.centromereShape.sphere);
//    if(this.model.getLevel() === 2){
//        var proteinFactors = this.model.getProteinFactorArray();
//        for(var i=0;i<proteinFactors.length;i++){
//            this.world.add(this.interactionSpheres[proteinFactors[i]]);
//            this.world.add(this.brightProteinLines[proteinFactors[i]]);
//        }
//    }
    
    // this.drawSpheres();
    
    this.scene.add(this.world);
    // Update the heads up display
    this.headsUpDisplay.createCoordinateSprite();
    
    this.viewChangedSinceLastRender = true;
    // </editor-fold>
};

Viewer.prototype.clearScene = function(){
    // <editor-fold defaultstate="collapsed" desc="Stop displaying model">

    this.world.remove(this.mergedClusterMesh);
    for(var i=0;i<this.brightLines.length;i++){
        this.world.remove(this.brightLines[i]);
    }
    for(var i=0;i<this.dimLines.length;i++){
        this.world.remove(this.dimLines[i]);
    }

    if(this.centromereShape !== null){
        this.world.remove(this.centromereShape.sphere);
    }
    
    this.mergedClusterMesh = null;
    this.clusterShapes = [];
    this.dimLines = [];
    this.brightLines = [];
    this.clusterSphereVisible = false;
    this.centromereShape = null;
    
    this.bedData = [];
    this.hasAnnotationData = false;
    this.colorScale = new ColorScale();
    this.maxAnnotationValue = null;
    this.minAnnotationValue = null;
    
    if(this.axesVisible){
        this.scene.remove(this.axes);
    }
    this.axes = null;
    this.axesVisible = false;
    
    if(this.tube){
        this.scene.remove(this.tube);
    }
    this.tube = null;
    this.tubeVisible = null;

    var proteinFactors = this.model.getProteinFactorArray();
    for(var i=0;i<proteinFactors.length;i++){
        var name = proteinFactors[i];
        this.world.remove(this.interactionSpheres[name]);
        this.world.remove(this.dimProteinLines[name]);
        this.world.remove(this.brightProteinLines[name]);
        
        this.interactionShapes[name] = [];
        this.interactionSpheresVisible[name] = false;
        this.interactionSpheres[name] = null;
        this.dimProteinLines[name] = null;
        this.brightProteinLines[name] = null;
    }

    this.scene.remove(this.world);
    this.world = new THREE.Object3D();
    
    this.viewChangedSinceLastRender = true;
    // </editor-fold>
};

Viewer.prototype.getModel = function(){
    return this.model;
};

Viewer.prototype.getInteractionShapes = function(name){
    return this.interactionShapes[name];
};

Viewer.prototype.getClusterShapes = function(){
    return this.clusterShapes;
};

Viewer.prototype.updateClusterSphereRadius = function(radius){
    // <editor-fold defaultstate="collapsed" desc="Update cluster sphere radii.">
    if(!this.clusterSpheresVisible){
        return;
    }
    this.world.remove(this.mergedClusterMesh);
    var mergedClusterGeometry = new THREE.Geometry();
    var clusterShape;
    var clusterMaterials = [];
    var primaryCounter = 0;
    for(var i=0;i<this.clusterShapes.length; i++){
        clusterShape = this.clusterShapes[i];
        clusterShape.setRadius(radius);
        if(clusterShape.getCluster().isPrimary()){
            var currentSphere = clusterShape.getSphere();
            currentSphere.updateMatrix();
            var currentSphereGeometry = currentSphere.geometry;
            mergedClusterGeometry.merge(currentSphereGeometry, currentSphere.matrix, primaryCounter);
            primaryCounter += 1;
            clusterMaterials.push(currentSphere.material);
        }
    }
    this.mergedClusterMesh = new THREE.Mesh(mergedClusterGeometry, new THREE.MeshFaceMaterial(clusterMaterials));
    this.world.add(this.mergedClusterMesh);
    // </editor-fold>
};

Viewer.prototype.buildChromatinLines = function(startPositions, endPositions, dimOpacity, lineWidth){
    // <editor-fold defaultstate="collapsed" desc="Draw two dim lines and one bright line.">
    console.log("Entered build chromatin lines.");
    console.log(startPositions);
    console.log(endPositions);
    for(var i=0;i<this.brightLines.length;i++){
        this.world.remove(this.brightLines[i]);
    }
    for(var i=0;i<this.dimLines.length;i++){
        this.world.remove(this.dimLines[i]);
    }
    this.dimLines = [];
    this.brightLines = [];

    var dimLinesGeometries = [];
    var brightLinesGeometries = [];
    dimLinesGeometries.push(new THREE.Geometry());
    for(var i=0;i<startPositions.length;i++){
        brightLinesGeometries.push(new THREE.Geometry());
        dimLinesGeometries.push(new THREE.Geometry());
    }
    
    var dimLinesColors = [];
    var brightLinesColors = [];
    dimLinesColors.push([]);
    for(var i=0;i<startPositions.length;i++){
        brightLinesColors.push([]);
        dimLinesColors.push([]);
    }

    var n = 0; // INDEX OF THE BRIGHT LINE WE'RE WORKING ON!
    for(var i=0;i<this.clusterShapes.length;i++){
        // <editor-fold defaultstate="collapsed" desc="Loop over cluster shapes">
        var clusterShape = this.clusterShapes[i];
        var color = new THREE.Color( 0x000000 );  
        color.setHex("0x" + clusterShape.getColor().getHexString());
        var cluster = clusterShape.getCluster();
        var gPosition = cluster.getGenomicPosition();
        var position = cluster.getPosition();
        
        // If we have annotation data, then adjust the color
        if(this.hasAnnotationData){
            // console.log("See annotation data.");
            // Use the min color a lot, so define it once to prevent lots of object creation
            var lowColor = new THREE.Color( 0x000000 );
            lowColor.setHex(this.colorScale.minColor.replace("#","0x"));
            var assignedColor = false;
            for(var j=0;j<this.bedData.length;j++){
                var data = this.bedData[j];
                // Since the bed data is sorted, if the start of the bed data
                // is past the end of the cluster, then we know we don't
                // have to check any more bed data
//                if(data.start > cluster.getGenomicEnd()){
//                    color.setHex("0x" + lowColor.getHexString());
//                    assignedColor = true;
//                    break;
                if (data.overlapsCluster(cluster)){
                    if(this.colorScale.scale === ColorScaleConstants.LINEAR){
                        color.setHex(this.colorScale.interpolateColor(data.value/this.colorScale.maxValue).replace("#","0x"));
                    } else {
                        var logDataValue = Math.log(data.value)/Math.log(10);
                        var logMaxValue = Math.log(this.colorScale.maxValue)/Math.log(10);
                        color.setHex(this.colorScale.interpolateColor(logDataValue/logMaxValue).replace("#","0x"));
                    }
                    assignedColor = true;
                    break;
                }
            }
            if(!assignedColor){
                color.setHex("0x" + lowColor.getHexString());
            }
        }
        clusterShape.annotationColor = color;
        
        if(gPosition < startPositions[n]){
            // To make the line continuous, for the first point we get the last
            // point of the previous bright line.
            if(dimLinesColors[n].length === 0 && i!==0){
                var oldClusterShape = this.clusterShapes[i-1];
                if(this.hasAnnotationData){
                    dimLinesColors[n].push(oldClusterShape.annotationColor);
                } else {
                    dimLinesColors[n].push(oldClusterShape.getColor());
                }
                dimLinesGeometries[n].vertices.push(oldClusterShape.getCluster().getPosition());
            }
            dimLinesColors[n].push(color);
            dimLinesGeometries[n].vertices.push(position);
            clusterShape.setOpacity(dimOpacity);
        } else if(gPosition < endPositions[n]){
            // To make the line continuous, for the first point we get the last
            // point of the previous dimline.
            if(brightLinesColors[n].length === 0 && i !== 0){
                var oldClusterShape = this.clusterShapes[i-1];
                if(this.hasAnnotationData){
                    brightLinesColors[n].push(oldClusterShape.annotationColor);
                } else {
                    brightLinesColors[n].push(oldClusterShape.getColor());
                }
                brightLinesGeometries[n].vertices.push(oldClusterShape.getCluster().getPosition());
            }
            brightLinesColors[n].push(color);
            brightLinesGeometries[n].vertices.push(position);
            clusterShape.setOpacity(1.0);
        } else { 
            // We always have one more dim line than bright lines.  Save this
            // last step for the last dim line, so skip if we have more 
            // bright lines to fill.
            if(n < startPositions.length){
                n++;
                i--; // It's terrible to adjust this here, but I need to make sure
                     // that when we continue, we actually start with the cluster
                     // that we just skipped.
                continue;
            } else {
                // To make the line continuous, for the first point we also append
                // it to brightline.
                if(dimLinesColors[n].length === 0){
                    brightLinesColors[n-1].push(color);
                    brightLinesGeometries[n-1].vertices.push(position);
                }
                dimLinesColors[n].push(color);
                dimLinesGeometries[n].vertices.push(position);
                clusterShape.setOpacity(dimOpacity);
            }
        }
        // </editor-fold>
    }
    
    for(var i=0;i<dimLinesGeometries.length;i++){
        dimLinesGeometries[i].colors = dimLinesColors[i];
        dimLinesGeometries[i].colorsNeedUpdate = true;
        var dimLineMaterial = new THREE.LineBasicMaterial({color: 0xffffff, 
                            transparent: true, opacity: dimOpacity,
                            vertexColors: THREE.VertexColors,
                            linewidth: lineWidth});
        this.dimLines.push(new THREE.Line(dimLinesGeometries[i], dimLineMaterial));
    }
    for(var i=0;i<brightLinesGeometries.length;i++){
        brightLinesGeometries[i].colors = brightLinesColors[i];
        brightLinesGeometries[i].colorsNeedUpdate = true;
        var brightLineMaterial = new THREE.LineBasicMaterial({color: 0xffffff, 
                            transparent: true, opacity: 1.0,
                            vertexColors: THREE.VertexColors,
                            linewidth: lineWidth});
        this.brightLines.push(new THREE.Line(brightLinesGeometries[i], brightLineMaterial));
    }
    
    this.world.add(this.dimLines[0]);
    for(var i=0;i<this.brightLines.length;i++){
        this.world.add(this.dimLines[i+1]);
        this.world.add(this.brightLines[i]);  
    }
    // </editor-fold>
};

Viewer.prototype.updateInteractionSphereRadius = function(name, radius){
    // <editor-fold defaultstate="collapsed" desc="Update interaction sphere radii.">
    if(!this.interactionSpheresVisible[name]){
        return;
    }
    this.world.remove(this.interactionSpheres[name]);
    var interactionShape;
    var interactionMaterials = [];
    var interactionGeometry = new THREE.Geometry();
    var shapes = this.interactionShapes[name];
    for(var i=0;i<shapes.length;i++){
        interactionShape = shapes[i];
        interactionShape.setSphereRadius(radius);
        var currentSphere = interactionShape.getSphere();
        currentSphere.updateMatrix();
        interactionGeometry.merge(currentSphere.geometry, currentSphere.matrix,i);
        interactionMaterials.push(currentSphere.material);
    }
    this.interactionSpheres[name] = new THREE.Mesh(interactionGeometry, new THREE.MeshFaceMaterial(interactionMaterials));
    this.world.add(this.interactionSpheres[name]);
    // </editor-fold>
};

Viewer.prototype.buildProteinLines = function(startPositions, endPositions, dimOpacity){
    // <editor-fold defaultstate="collapsed" desc="Draw one dim line and one bright line.">
    var proteinFactors = this.model.getProteinFactorArray();
    for(var i=0;i<proteinFactors.length;i++){
        var name = proteinFactors[i];
        this.world.remove(this.brightProteinLines[name]);
        this.world.remove(this.dimProteinLines[name]);
        // Get current thickness
        var lineWidth = this.brightProteinLines[name].material.linewidth;
        this.brightProteinLines[name] = null;
        this.dimProteinLines[name] = null;
        
        var brightLineGeometry = new THREE.Geometry();
        var dimLineGeometry = new THREE.Geometry();
        
        var shapes = this.interactionShapes[name];
        var color = Number(shapes[0].getColor());

        for(var j=0;j<shapes.length;j++){
            var interactionShape = shapes[j];
            var points = interactionShape.getLinePoints();
            var interaction = interactionShape.getInteraction();
            var makeBright1 = false; // Genomic position 1
            var makeBright2 = false; // Genomic position 2
            for(var k=0;k<startPositions.length;k++){
                if(interaction.getGenomicStart1() > startPositions[k] 
                        && interaction.getGenomicStart1() < endPositions[k]){
                    makeBright1 = true;
                }
                if(interaction.getGenomicStart2() > startPositions[k]
                        && interaction.getGenomicStart2() < endPositions[k]){
                    makeBright2 = true;
                    break;
                }
            }
            if(makeBright1 && makeBright2){
                brightLineGeometry.vertices.push(points[0]);
                brightLineGeometry.vertices.push(points[1]);
                interactionShape.setOpacity(1.0);
            } else {
                dimLineGeometry.vertices.push(points[0]);
                dimLineGeometry.vertices.push(points[1]);
                interactionShape.setOpacity(dimOpacity);
            }
        }
        
        var brightMaterial = new THREE.LineBasicMaterial({color: color, transparent: true, opacity: 1.0, linewidth: lineWidth});
        var dimMaterial = new THREE.LineBasicMaterial({color: color, transparent: true, opacity: dimOpacity, linewidth: lineWidth});
        
        this.brightProteinLines[name] = new THREE.Line(brightLineGeometry, brightMaterial, THREE.LinePieces );
        this.dimProteinLines[name] = new THREE.Line(dimLineGeometry, dimMaterial, THREE.LinePieces);
        if(this.interactionSpheresVisible[name] === true){
            this.world.add(this.brightProteinLines[name]);
            this.world.add(this.dimProteinLines[name]);
        }
    }
    // </editor-fold>
};

Viewer.prototype.updateAxesSize = function(radius,length){
    // <editor-fold defaultstate="collapsed" desc="Update axes radii.">
    if(!this.axesVisible){
        return;
    }
    this.scene.remove(this.axes);
    var axesGeom = new THREE.Geometry();
    
    var axesArray = [];
    
    axesArray.push(this.xaxis);
    axesArray.push(this.yaxis);
    axesArray.push(this.zaxis);
    
    var materials = [];
    
    for(var i=0;i<axesArray.length;i++){
        var a = axesArray[i];
        a.setRadius(radius);
        a.setLength(length);
        a.cylinder.updateMatrix();
        a.arrowHead.updateMatrix();
        axesGeom.merge(a.cylinder.geometry, a.cylinder.matrix, 2*i);
        axesGeom.merge(a.arrowHead.geometry, a.arrowHead.matrix, 2*i+1);
        
        materials.push(a.cylinder.material);
        materials.push(a.arrowHead.material);
    }
    
    this.axes = new THREE.Mesh(axesGeom, new THREE.MeshFaceMaterial(materials));
    this.scene.add(this.axes);
    // </editor-fold>
};

// THIS FUNCTION ALSO SETS THE MAX VALUE OF THE COLORSCALE OBJECT.
Viewer.prototype.sortBedData = function(){
    // <editor-fold defaultstate="collapsed" desc="Sorts bed list by chromosome and start position.">
    var maxValue = 0;
    var minValue = 100000;
    var sortedData = [];
    for(var i=0;i<this.bedData.length;i++){
        var data = this.bedData[i];
        if(data.value > maxValue){
            maxValue = data.value;
        }
        if(data.value < minValue){
            minValue = data.value;
        }
        var k=0;
        for(var j=0;j<sortedData.length;j++){
            var sData = sortedData[j];
            if(Number(sData.chromosome) < Number(data.chromosome)){
                k++;
            } else if(Number(sData.chromosome) === Number(data.chromosome)){
                if(sData.start <= data.start){
                    k++;
                }
            } else {
                break;
            }
        }
        sortedData.splice(k,0,data);
    }
    this.colorScale.setMaxValue(maxValue);
    this.colorScale.setMinValue(minValue);
    this.colorScale.setUpperCutoff(maxValue);
    this.colorScale.setLowerCutoff(minValue);
    this.bedData = sortedData;
    // </editor-fold>
};

// This function draws translucent spheres around the chromatin line.  At this 
// point this function generates spheres of randomly varying radii.  Eventually
// we expect to have uncertainty data to illustrate.  Currently this is only 
// used for development, there is no access to such a feature through the ui.
Viewer.prototype.drawSpheres = function(){
    // <editor-fold defaultstate="collapsed" desc="Draw translucent spheres">
    var mergedClusterMesh = null;
    
    var mat = new THREE.MeshLambertMaterial({color: 0xffffff, transparent: true, opacity: 0.5, vertexColors: THREE.FaceColors});
    mat.depthWrite = false; // Needed to see the lines through the transparent sphere

    var newRadii = [];
    for(var i=0;i<this.clusterShapes.length; i++){
        var clusterShape = this.clusterShapes[i];
        var cluster = clusterShape.getCluster();
        var pos = cluster.getPosition();
        
        var randomRadii = 8*(0.2*Math.random()+0.8);
        newRadii.push(randomRadii);
        var sphereGeom = new THREE.SphereGeometry(randomRadii, 8, 6);
        // Shift the sphere geometry
        for(var j=0;j<sphereGeom.vertices.length;j++){
            sphereGeom.vertices[j].add(pos);
        }
        
        if(i===0){
            mergedClusterMesh = new THREE.Mesh(sphereGeom.clone(), mat);
        } else {
            var mergeBSP = new ThreeBSP(mergedClusterMesh);
            var sphereBSP = new ThreeBSP(sphereGeom);
            var union = mergeBSP.union(sphereBSP);
            mergedClusterMesh = union.toMesh(mat);
            
            
            
            var topo = new TOPOLOGY.createFromGeometry(mergedClusterMesh.geometry);
            topo.computeCenters();
            var c = 1;
            while(topo.vertex.length > 60*(i+1)){
                var vertIndex = topo.getVertexToCollapse();
                var otherIndex = topo.vertex[vertIndex].collapseToVertexID;
                topo.collapseEdge(vertIndex,otherIndex);
                console.log("Collapsed " + c + " vertices.");
                c++;
            } 
            // need to recreate geometry to mirror changes in topology!
            mergedClusterMesh.geometry = topo.convertToGeometry();
            
        }
        console.log(i + ", vertices = " + mergedClusterMesh.geometry.vertices.length);
        
        if(i > 15){
            break;
        }
    }

    var geom = mergedClusterMesh.geometry;

    for(var i=0;i<geom.faces.length;i++){
        var face = geom.faces[i];
        var p = getFacePosition(geom, face);
        for(var j=0;j<this.clusterShapes.length;j++){
            var clusterShape = this.clusterShapes[j];
            var cluster = clusterShape.getCluster();
            var pos = cluster.getPosition();
            var col = "0x" + clusterShape.getColor().getHexString();
            var diff = new THREE.Vector3(p.x -pos.x, p.y - pos.y, p.z - pos.z);
            if(diff.length() < newRadii[j]){
                face.color.setHex(col);
                break;
            }
            if(j > 15){
                break;
            }
        }
    }
    mergedClusterMesh.geometry.colorsNeedUpdate = true;
    this.world.add(mergedClusterMesh);
 
    function getFacePosition(geometry, face){
        var faceIndices = ['a','b','c'];
        var av = new THREE.Vector3(0,0,0);
        for(var i=0;i<faceIndices.length;i++){
            var vertexIndex = face[faceIndices[i]];
            var v = geometry.vertices[vertexIndex];
            av.x += v.x;
            av.y += v.y;
            av.z += v.z;
        }
        av.x /= 3;
        av.y /= 3;
        av.z /= 3;
        return av;
    }
    
    // </editor-fold>
};

// This function creates the tube geometry, given segments, radius, and color
// linearSegments, radius, and radialSegments are numeric
// endCap is boolean
// color is a hex string
Viewer.prototype.createTubeGeometry = function(linearSegments, radius, radialSegments, endCap, color){
    // <editor-fold defaultstate="collapsed" desc="Create a new tube geometry">
    if(!this.tubeVisible){
        return;
    }
    if(this.tube !== null){
        this.scene.remove(this.tube);
    }
    
    var positions = [];
    for(var i=0;i<this.clusterShapes.length;i++){
        if(this.clusterShapes[i].getOpacity() > 0.99){
            var cluster = this.clusterShapes[i].getCluster();
            positions.push(cluster.getPosition());
        }
    }
    
    var spline = new THREE.SplineCurve3(positions);
    var tubeGeometry = new THREE.TubeGeometry(spline, linearSegments, radius, radialSegments, endCap);
    var tubeMaterial = new THREE.MeshLambertMaterial({transparent: true, opacity: 1.0, color: 0xffffff, side: THREE.DoubleSide});
    tubeMaterial.color.setHex(color);
    tubeMaterial.ambient.setHex(color);
    this.tube = new THREE.Mesh(tubeGeometry, tubeMaterial);
    this.scene.add(this.tube);
    // </editor-fold>
};

// Set the background color
Viewer.prototype.setBackgroundColor = function(color){
    // <editor-fold defaultstate="collapsed" desc="Method Code">
    var material = this.skyBox.material;
    material.color.setHex(color);
    // </editor-fold>
};
