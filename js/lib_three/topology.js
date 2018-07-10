/**
 * @author Lee Stemkoski
 */
 
// declare namespace
var TOPOLOGY = TOPOLOGY || {};

///////////////////////////////////////////////////////////////////////////////
TOPOLOGY.Vertex = function(params)
{
    this.ID = -1;
	this.type = "vertex";
    this.vector3 = new THREE.Vector3(); // coordinates
    this.edgeIDs = []; // length n
    this.faceIDs = []; // length n
   
    this.collapseCost = null;
    this.collapseToVertexID = null;
    
    setParameters(this, params);   
};

TOPOLOGY.Edge = function(params)
{
    this.ID = -1;
    this.type = "edge";
    this.center    = new THREE.Vector3(); // midpoint
    this.vertexIDs = []; // length 2
    this.faceIDs   = []; // length 2
   
    setParameters(this, params);   
};

TOPOLOGY.Face = function (params)
{
   this.ID = -1;
   this.type = "face";
   this.center    = new THREE.Vector3(); // centroid
   this.normal = new THREE.Vector3();
   this.vertexIDs = []; // length n
   this.edgeIDs   = []; // length n
   this.colorID = -1;
   
   setParameters(this, params);   
};

setParameters = function(obj, params)
{
   if (params === undefined) return;

    for (var arg in obj)
        if (params[arg] !== undefined )
			obj[arg] = params[arg];
};

TOPOLOGY.Topology = function()
{
	this.vertex = [];
	this.edge   = [];
	this.face   = [];
};

///////////////////////////////////////////////////////////////////////////////
// convenience Array methods

Array.prototype.pushUnique = function(obj) 
{
	if (this.indexOf(obj) === -1) this.push(obj);
};

Array.prototype.spliceData = function(data) 
{	
	var dataArray = (data instanceof Array) ? data : [data];
	for (var a = 0; a < dataArray.length; a++)
	{
		var i = this.indexOf(dataArray[a]); 
		if ( i !== -1 ) this.splice( i, 1 );
	}
};

Array.prototype.changeData = function(oldData, newData)
{
	for (var i = 0; i < this.length; i++)
		if (this[i] === oldData) this[i] = newData;
};

Array.prototype.clone = function() 
{
	return this.concat();
};

///////////////////////////////////////////////////////////////////////////////

// create a vertex/edge/face with next available ID, add it to topology structure.
TOPOLOGY.Topology.prototype.create = function(type)
{
	var simplex = {};
	if ( type === "vertex" ) simplex = new TOPOLOGY.Vertex();
	if ( type === "edge"   ) simplex = new TOPOLOGY.Edge();
	if ( type === "face"   ) simplex = new TOPOLOGY.Face();
	simplex.ID = this[type].length;
	this.add( simplex );
	return simplex; 
};

TOPOLOGY.Topology.prototype.add = function(obj)
{
	if ( obj.hasOwnProperty("type") )
		this[obj.type][obj.ID] = obj;
	else
		console.log("Topology.add: unknown object type");
};

TOPOLOGY.Topology.prototype.addIncidenceData = function(type1, data1, type2, data2)
{
	// convert non-arrays into arrays for convenience
	var IDs1 = (data1 instanceof Array) ? data1 : [data1];
	var IDs2 = (data2 instanceof Array) ? data2 : [data2];
	
	for (var i = 0; i < IDs1.length; i++)
	for (var j = 0; j < IDs2.length; j++)
	{
		this[type1][ IDs1[i] ][ type2 + "IDs" ].pushUnique( IDs2[j] );
		this[type2][ IDs2[j] ][ type1 + "IDs" ].pushUnique( IDs1[i] );
	}
};

TOPOLOGY.Topology.prototype.addTriangleData = function(Va, Vb, Vc, Eab, Ebc, Eca, F)
{
	this.addIncidenceData("edge", Eab, "vertex", [Va, Vb]);
	this.addIncidenceData("edge", Ebc, "vertex", [Vb, Vc]);
	this.addIncidenceData("edge", Eca, "vertex", [Vc, Va]);

	this.addIncidenceData("face", F, "vertex", [Va, Vb, Vc]);

	this.addIncidenceData("face", F, "edge", [Eab, Ebc, Eca]);
};

TOPOLOGY.Topology.prototype.remove = function(obj)
{
	// remove references to obj stored in ID lists of other types
	var otherTypes = ["vertex", "edge", "face"];
	otherTypes.spliceData(obj.type);
	
	for (var t = 0; t < 2; t++)
	{
		var otherType = otherTypes[t];		
		for (var i = 0; i < obj[otherType + "IDs"].length; i++)
		{
			// get ID of otherType that contains a reference to obj
			var ID = obj[otherType + "IDs"][i];
			this[otherType][ID][obj.type + "IDs"].spliceData( obj.ID );
		}
	}

	// pop off the last simplex of given type, and reindex it to given ID	
	this.reindex( this[obj.type].pop(), obj.ID );
};

TOPOLOGY.Topology.prototype.reindex = function(obj, newIndex)
{
	var oldIndex = obj.ID;
	obj.ID = newIndex;
	this[obj.type][newIndex] = obj;

	// change references to obj stored in ID lists of other types
	var otherTypes = ["vertex", "edge", "face"];
	otherTypes.spliceData(obj.type);
	
	for (var t = 0; t < 2; t++)
	{
		var otherType = otherTypes[t];		
		for (var i = 0; i < obj[otherType + "IDs"].length; i++)
		{
			// get ID of otherType that contains a reference to obj
			var ID = obj[otherType + "IDs"][i];
			this[otherType][ID][obj.type + "IDs"].changeData( oldIndex, newIndex );
		}
	}
};

///////////////////////////////////////////////////////////////////////////////

TOPOLOGY.Topology.prototype.edgeIDWithVertices = function(va, vb)
{
	var edgeCandidateIDs = this.vertex[va].edgeIDs;
	for (var i = 0; i < edgeCandidateIDs.length; i++)
	{
		var edgeIndex = edgeCandidateIDs[i];
		if (this.edge[edgeIndex].vertexIDs.indexOf(vb) !== -1)
			return edgeIndex;
	}
	
	return -1;
};

TOPOLOGY.Topology.prototype.edgeIDWithFaces = function(fa, fb)
{
	var edgeCandidateIDs = this.face[fa].edgeIDs;
	for (var i = 0; i < edgeCandidateIDs.length; i++)
	{
		var edgeIndex = edgeCandidateIDs[i];
		if (this.edge[edgeIndex].faceIDs.indexOf(fb) !== -1)
			return edgeIndex;
	}
	
	return -1;
};

///////////////////////////////////////////////////////////////////////////////

TOPOLOGY.Topology.prototype.computeCenters = function()
{
	for (var i = 0; i < this.edge.length; i++)
	{
		var edge = this.edge[i];
		if (edge === null) continue;
		edge.center = new THREE.Vector3(0,0,0);
		edge.center.add( this.vertex[ edge.vertexIDs[0] ].vector3 );
		edge.center.add( this.vertex[ edge.vertexIDs[1] ].vector3 );
		edge.center.divideScalar(2);	
	}
	for (var i = 0; i < this.face.length; i++)
	{
		var face = this.face[i];
		if (face === null) continue;
		face.center = new THREE.Vector3(0,0,0);
		for (var v = 0; v < face.vertexIDs.length; v++)
			face.center.add( this.vertex[ face.vertexIDs[v] ].vector3 );
		face.center.divideScalar( face.vertexIDs.length );	
	}
};

///////////////////////////////////////////////////////////////////////////////

TOPOLOGY.Topology.prototype.textQuery = function(type, ID)
{
	var array = this[type][ID];
	
	var info = type + " " + "ID " + ID + ". ";
	if ( !(type == "vertex") )
		info += "Adj vertices: [" + array.vertexIDs.toString() + "]. ";
	if ( !(type == "edge") )
		info += "Adj edges: [" + array.edgeIDs.toString() + "]. ";
	if ( !(type == "face") )
		info += "Adj faces: [" + array.faceIDs.toString() + "]. ";
	return info;
}

///////////////////////////////////////////////////////////////////////////////

// assumption: geometries previously triangulated.

TOPOLOGY.Topology.prototype.retriangulate = function(type, ID, vec3)
{
    if ( type == "face" )
	    this.retriangulateFace(ID, vec3);
	else if ( type == "edge" )
	    this.retriangulateEdge(ID, vec3);
	else
		console.log("Topology.retriangulate: unknown type");
};

TOPOLOGY.Topology.prototype.retriangulateFace = function(faceID, vec3)
{
	
	var v0 = this.face[faceID].vertexIDs[0];
	var v1 = this.face[faceID].vertexIDs[1];
	var v2 = this.face[faceID].vertexIDs[2];
	
	var e01 = this.edgeIDWithVertices(v0,v1);
	var e12 = this.edgeIDWithVertices(v1,v2);
	var e20 = this.edgeIDWithVertices(v2,v0);
	
	// create new items and store IDs
	var Vn = this.create("vertex");
	Vn.vector3 = vec3.clone();

	var E0n = this.create("edge").ID;
	var E1n = this.create("edge").ID;
	var E2n = this.create("edge").ID;

	var F01n = this.create("face").ID;
	var F12n = this.create("face").ID;
	var F20n = this.create("face").ID;
	
	this.addTriangleData( v0,v1,Vn.ID, e01,E1n,E0n, F01n );
	this.addTriangleData( v1,v2,Vn.ID, e12,E2n,E1n, F12n );
	this.addTriangleData( v2,v0,Vn.ID, e20,E0n,E2n, F20n );
		
	this.remove( this.face[faceID] );
};

TOPOLOGY.Topology.prototype.retriangulateEdge = function(edgeID, vec3)
{
	var v0 = this.edge[edgeID].vertexIDs[0];
	var v1 = this.edge[edgeID].vertexIDs[1];
	var e01 = this.edgeIDWithVertices(v0,v1);
	
	var f0 = this.edge[edgeID].faceIDs[0];
	var tempArray = this.face[f0].vertexIDs.clone();
	tempArray.spliceData( [v0,v1] );
	var va = tempArray[0];
	
	var e0a = this.edgeIDWithVertices(v0,va);
	var e1a = this.edgeIDWithVertices(v1,va);
	
	var f1 = this.edge[edgeID].faceIDs[1];
	var tempArray = this.face[f1].vertexIDs.clone();
	tempArray.spliceData( [v0,v1] );
	var vb = tempArray[0]; 
	
	var e0b = this.edgeIDWithVertices(v0,vb);
	var e1b = this.edgeIDWithVertices(v1,vb);

	// create new items and store IDs
	var Vn = this.create("vertex");
	Vn.vector3 = vec3.clone();

	var E0n = this.create("edge").ID;
	var E1n = this.create("edge").ID;
	var Ean = this.create("edge").ID;
	var Ebn = this.create("edge").ID;

	var F0na = this.create("face").ID;
	var F1na = this.create("face").ID;
	var F0nb = this.create("face").ID;
	var F1nb = this.create("face").ID;
	
	this.addTriangleData( v0,Vn.ID,va, E0n,Ean,e0a, F0na );
	this.addTriangleData( v1,Vn.ID,va, E1n,Ean,e1a, F1na );
	this.addTriangleData( v0,Vn.ID,vb, E0n,Ebn,e0b, F0nb );
	this.addTriangleData( v1,Vn.ID,vb, E1n,Ebn,e1b, F1nb );

	// remove edge and two faces
	this.remove( this.edge[edgeID] );
	this.remove( this.face[f0] );
	this.remove( this.face[f1] );	
};

///////////////////////////////////////////////////////////////////////////////

TOPOLOGY.createFromGeometry = function( geometry )
{
	// initialize topology
	var topo = new TOPOLOGY.Topology();

	// add vertices
	for (var vertexIndex = 0; vertexIndex < geometry.vertices.length; vertexIndex++)
	{
		var v = new TOPOLOGY.Vertex( {ID: vertexIndex, vector3: geometry.vertices[vertexIndex].clone() } );
		topo.add(v);
	}
	
	// add faces, link vertex-face IDs 
	for (var faceIndex = 0; faceIndex < geometry.faces.length; faceIndex++)
	{
		var face = geometry.faces[faceIndex];
		var vertexData = [ face['a'], face['b'], face['c'] ];
		if (face instanceof THREE.Face4) 
			vertexData.push( face['d'] );
		
		var f = new TOPOLOGY.Face( {ID: faceIndex, normal: face.normal} );
		topo.add(f);
		topo.addIncidenceData( "face", faceIndex, "vertex", vertexData );
	}

    // add edges, incidence data for vertex-edge and edge-face IDs
	for (var faceIndex = 0; faceIndex < geometry.faces.length; faceIndex++)
	{
		var edgeArray = [];
		
		var face = geometry.faces[faceIndex];
		// indices of vertices on the face
		var iva = face['a'];
		var ivb = face['b'];
		var ivc = face['c'];
		
		edgeArray.push( [iva,ivb] );
		edgeArray.push( [ivb,ivc] );
		
		if (face instanceof THREE.Face3)
		{
			edgeArray.push( [ivc,iva] );
		}
		else // THREE.Face4
		{
			var ivd = face['d'];
			edgeArray.push( [ivc,ivd] );
			edgeArray.push( [ivd,iva] );
		}
		
		// add edges to topology, if not already present
		for (var j = 0; j < edgeArray.length; j++)
		{
			var edgeVertices = edgeArray[j];
			var edgeIndex = topo.edgeIDWithVertices(edgeVertices[0], edgeVertices[1]);
			
			if ( edgeIndex === -1 ) // not already present
			{			
				edge = topo.create("edge");
				edgeIndex = edge.ID;
				topo.addIncidenceData( "edge", edgeIndex, "vertex", edgeVertices );	
			}

			topo.addIncidenceData( "edge", edgeIndex, "face", faceIndex );					
		}

	} // finished adding edges to topology
	
	topo.computeCenters();
        topo.initializeCollapseCosts();
	return topo;
};
///////////////////////////////////////////////////////////////////////////////

TOPOLOGY.Topology.prototype.convertToGeometry = function()
{
    var geometry = new THREE.Geometry();
	
	for (var i = 0; i < this.vertex.length; i++)
	{
		if (this.vertex[i] === null) continue;
		
		geometry.vertices[i] = this.vertex[i].vector3.clone();
	}

	this.computeFaceColoring();

	var palette = [new THREE.Color(0x333333), new THREE.Color(0x999999), new THREE.Color(0x666666), 
				   new THREE.Color(0xCCCCCC), new THREE.Color(0x111111)];

	var totalFaces = 0;
	for (var i = 0; i < this.face.length; i++)
	{
		if (this.face[i] === null) continue;
		var a = this.face[i].vertexIDs;
		var geoFace = new THREE.Face3( a[0], a[1], a[2] );
		geometry.faces[totalFaces] = geoFace;
		geometry.faces[totalFaces].color = palette[this.face[i].colorID];
		
		totalFaces++;
	}
	
	geometry.computeFaceNormals();
	geometry.computeVertexNormals();

	return geometry;
};

///////////////////////////////////////////////////////////////////////////////

TOPOLOGY.Topology.prototype.computeFaceColoring = function()
{
	for (var i = 0; i < this.face.length; i++)
	{
		if (this.face[i] === null) continue;

		var adjacentFaces = [];
		for (var j = 0; j < this.face[i].edgeIDs.length; j++)
		{
			var eID = this.face[i].edgeIDs[j];
			adjacentFaces = adjacentFaces.concat( this.edge[eID].faceIDs );
		}
		
		var colorIDs = [0,1,2,3,4,5,6];
		for (var k = 0; k < adjacentFaces.length; k++)
		{
			var fID = adjacentFaces[k];
			colorIDs.spliceData( this.face[fID].colorID );
		}

		this.face[i].colorID = colorIDs[0];
	}
};

///////////////////////////////////////////////////////////////////////////////

// v0 and v1 are the vertex ids.  Collapsing v0 into v1.  That is, the resulting
// topology loses v0 but retains v1.
TOPOLOGY.Topology.prototype.collapseEdge = function(v0, v1){
   
    var vertex0 = this.vertex[v0];
    var vertex1 = this.vertex[v1];
    
    // TESTING
    // Initial outer vertices
    var initOuterVertexIDs = [];
    for(var i=0;i<vertex0.edgeIDs.length;i++){
        var vs = this.edge[vertex0.edgeIDs[i]].vertexIDs;
        if(vs[0] === v0){
            initOuterVertexIDs.push(vs[1]); 
        } else {
            initOuterVertexIDs.push(vs[0]);
        }
    }
    // What I actually want is a reference to those objects, because their 
    // IDs will change after removing the vertex corresponding to v0
    var initOuterVertices = [];
    for(var i=0;i<initOuterVertexIDs.length;i++){
        initOuterVertices.push(this.vertex[initOuterVertexIDs[i]]);
    }
    console.log("init outer vertex IDs: " + initOuterVertexIDs.join());
    // Get all of the faces and edges connected to v0
    var initEdgeIDs = vertex0.edgeIDs.clone();
    var initEdges = [];
    for(var i=0;i<initEdgeIDs.length;i++){
        initEdges.push(this.edge[initEdgeIDs[i]]);
    }
    
    var initFaceIDs = vertex0.faceIDs.clone();
    var initFaces = [];
    for(var i=0;i<initFaceIDs.length;i++){
        initFaces.push(this.face[initFaceIDs[i]]);
    }
    
    // Make a list of the outer edge ids
    var outerEdgeIDs = [];
    var outerEdgeVertexIDs = [];
    for(var i=0;i<initFaceIDs.length;i++){
        var faceID = initFaceIDs[i];
        var face = this.face[faceID];
        var faceEdgeIDs = face.edgeIDs;
        for(var j=0;j<faceEdgeIDs.length;j++){
            if(initEdgeIDs.indexOf(faceEdgeIDs[j]) === -1){
                outerEdgeIDs.push(faceEdgeIDs[j]);
                var edge = this.edge[faceEdgeIDs[j]];
                var vs = edge.vertexIDs;
                outerEdgeVertexIDs.push(vs[0]);
                outerEdgeVertexIDs.push(vs[1]);
            }
        };
    };
    
    console.log("Vertices of outer edges: " + outerEdgeVertexIDs.join());
    
    // Now order the outer edges, so that the first and last contain v1
    var sortedEdgeIDs = [];
    // Find the first edge. At this point it will point clockwise 50% of the time.
    for(var i=0;i<outerEdgeIDs.length;i++){
        var edge = this.edge[outerEdgeIDs[i]];
        var verts = edge.vertexIDs;
        if(verts[0] === v1 || verts[1] === v1){
            sortedEdgeIDs.push(edge.ID);
            break;
        } 
    };
    console.log("outer edges " + outerEdgeIDs.join());
    console.log("Faces: " + initFaces.length);
    var counter = 0;
    while(counter < outerEdgeIDs.length-1){
        console.log("sortedEdges length " + sortedEdgeIDs.length + ", " + sortedEdgeIDs.join());
        var currentEdgeID = sortedEdgeIDs[counter];
        console.log("Edge ID: " + currentEdgeID);
        var currentEdge = this.edge[currentEdgeID];
        var vIDs = currentEdge.vertexIDs;
        console.log("Current Edge vertex IDs: " + vIDs.join());
        for(var i=0;i<outerEdgeIDs.length;i++){
            if(sortedEdgeIDs.indexOf(outerEdgeIDs[i]) === -1){
                var outerEdge = this.edge[outerEdgeIDs[i]];
                var outerVIDs = outerEdge.vertexIDs;
                console.log("Testing edge with vertices: " + outerVIDs.join());
                if(vIDs.indexOf(outerVIDs[0]) !== -1 && vIDs.indexOf(outerVIDs[1]) === -1){
                    sortedEdgeIDs.push(outerEdgeIDs[i]);
                    console.log("Joined 0.")
                    break;
                } else if(vIDs.indexOf(outerVIDs[1]) !== -1 && vIDs.indexOf(outerVIDs[0]) === -1){
                    sortedEdgeIDs.push(outerEdgeIDs[i]);
                    console.log("Joined 1.");
                    break;
                } 
            }
        }
        counter++;
    }
    
    
    // New inner edges
    var innerEdgeIDs = [];
    for(var i=0;i<sortedEdgeIDs.length-1;i++){
        // Get the next two edges
        var e1, e2;
        if(i===0){
            e1 = this.edge[sortedEdgeIDs[i]];
            e2 = this.edge[sortedEdgeIDs[i+1]];
        } else if(i=== sortedEdgeIDs.length-2){
            e1 = this.edge[sortedEdgeIDs[i]];
            e2 = this.edge[sortedEdgeIDs[i+1]];
        } else {
            e1 = this.edge[innerEdgeIDs[innerEdgeIDs.length-1]];
            e2 = this.edge[sortedEdgeIDs[i+1]];
        }
        
        var v1IDs = e1.vertexIDs;
        var v2IDs = e2.vertexIDs;
        var sortedVertices = [];
        if(v2IDs.indexOf(v1IDs[0]) === -1){
            sortedVertices.push(v1IDs[0]);
            sortedVertices.push(v1IDs[1]);
            if(v1IDs[1] === v2IDs[0]){
                sortedVertices.push(v2IDs[1]);
            } else {
                sortedVertices.push(v2IDs[0]);
            }
        } else {
            sortedVertices.push(v1IDs[1]);
            sortedVertices.push(v1IDs[0]);
            if(v1IDs[0] === v2IDs[0]){
                sortedVertices.push(v2IDs[1]);
            } else {
                sortedVertices.push(v2IDs[0]);
            }
        }
        
        // Now make a new edge and a new face
        var newEdge = this.create("edge").ID;
        var newFace = this.create("face").ID;
        innerEdgeIDs.push(newEdge);
        
        this.addTriangleData( sortedVertices[0], sortedVertices[1], sortedVertices[2], e1.ID, e2.ID, newEdge, newFace );
    }
    
    // Now remove the old edges and faces and v0
    this.remove(vertex0);
    for(var i=0;i<initEdges.length;i++){
        this.remove(initEdges[i]);
    }
    for(var i=0;i<initFaces.length;i++){
        this.remove(initFaces[i]);
    }
    
    // THIS STEP IS TRICKY BECAUSE THE IDS OF THE REMAINING VERTICES ARE
    // DIFFERENT THAN THEY WERE INTIALLY!  For example, imagine we had a total
    // of 12 vertices and v1 = 11.  Then after removing v0, we know the 
    // vertex corresponding to v1 must have an index <= 10, whereas we'll have
    // v1 = 11 in out outerVertexID list. 
    
    for(var i=0;i<initOuterVertices.length;i++){
        this.computeCollapseCostAtVertex(initOuterVertices[i].ID);
    }
    // this.initializeCollapseCosts();
    this.computeCenters();
};

TOPOLOGY.Topology.prototype.collapseCost = function(v0, v1){
    var vertex0 = this.vertex[v0];
    var vertex1 = this.vertex[v1];
    
    var vec0 = vertex0.vector3;
    var vec1 = vertex1.vector3;
    var diff = new THREE.Vector3(vec1.x -vec0.x, vec1.y-vec0.y, vec1.z-vec0.z);
    var length = diff.length();
    var curvature = 1;
    
    var edgeID = this.edgeIDWithVertices(v0, v1);
    var edge = this.edge[edgeID];
    
    for(var i=0;i<vertex0.faceIDs.length;i++){
        var minCurvature = 1;
        var normal1 = this.face[vertex0.faceIDs[i]].normal;
        for(var j=0;j<edge.faceIDs.length;j++){
            var normal2 = this.face[edge.faceIDs[j]].normal;
            var dot = normal1.dot(normal2);
            minCurvature = Math.min(minCurvature, (1-dot)/2);
        }
        curvature = Math.max(curvature, minCurvature);
    }
    // curvature = 1;
    return length*curvature;
};

TOPOLOGY.Topology.prototype.computeCollapseCostAtVertex = function(v0){
    var vert = this.vertex[v0];
    if(vert.edgeIDs.length === 0){
        vert.collapseCost = -0.01;
        vert.collapseToVertexID = null;
        return;
    }
    
    vert.collapseCost = 100000;
    vert.collapseToVertexID = null;
    
    for(var i=0;i<vert.edgeIDs.length;i++){
        var edge = this.edge[vert.edgeIDs[i]];
        var v1 = edge.vertexIDs[0];
        if(v1 === v0){
            v1 = edge.vertexIDs[1];
        }
        var cost = this.collapseCost(v0, v1);
        if(cost < vert.collapseCost){
            vert.collapseCost = cost;
            vert.collapseToVertexID = v1;
        }
    }
};

TOPOLOGY.Topology.prototype.initializeCollapseCosts = function(){
    for(var i=0;i<this.vertex.length;i++){
        this.computeCollapseCostAtVertex(this.vertex[i].ID);
    }
};

TOPOLOGY.Topology.prototype.getVertexToCollapse = function(){
    var minCost = 1000000;
    var vertexID = -1;
    for(var i=0;i<this.vertex.length;i++){
        if(this.vertex[i].collapseCost < minCost){
            minCost = this.vertex[i].collapseCost;
            vertexID = this.vertex[i].ID;
        }
    }
    return vertexID;
};