function generate(){

	//TODO: legend

	return {

		lastTime:0,
		cBlack:'#18181b',
		calc:function(){
			this.SCREEN_WIDTH = window.innerWidth;
			this.SCREEN_HEIGHT = window.innerHeight;
		},
		setup:function(callback){
			var c = document.getElementById('e');
			this.renderer = new THREE.CanvasRenderer({ canvas: c });
			this.renderer.setSize(this.SCREEN_WIDTH,this.SCREEN_HEIGHT);
			document.getElementById('container').appendChild(this.renderer.domElement);

			//camera
			this.camera = new THREE.OrthographicCamera(this.SCREEN_WIDTH / - 2, this.SCREEN_WIDTH / 2, this.SCREEN_HEIGHT / 2, this.SCREEN_HEIGHT / - 2, 150, 1000)
			this.camera.position.z = 300;

			//scene
			this.scene = new THREE.Scene();

			//pass in context
			callback(this);
		},
		getData:function(context){
			var self = context;
			d3.csv('data/dumboats.csv',function(d){
				self.data = d;
				self.chassis();
				self.draw();
			});
		},
		chassis:function(){
			var self = this,
				marginL   = (window.innerWidth*0.325)/2,
				shapeSize = (window.innerWidth*0.6)/this.data.length;

			//set position of middle divider
			$('#divider').css({
				"top": window.innerHeight/2 -(divider.offsetHeight/2) +'px',
				"left": marginL -shapeSize/2 +'px'
			});

			//as with shapes, resize based on width
			var fontSize = shapeSize*0.95,
				labelBuffer = window.innerWidth*0.14;

			//align labels
			$('.label').css({
				"font-size":fontSize +'px',
				"top":function(){
					return this.id === "right" ? window.innerHeight -window.innerHeight/2 -labelBuffer +'px' : null;
				},
				"bottom":function(){
					return this.id === "left" ? window.innerHeight/2 -labelBuffer +'px' : null;
				},
				"left":function(){
					return (100 -fontSize)*-1 +'px';
				},
				"color":'#1c1d22'
			});
		},
		draw:function(){
			var self = this;
			this.shapeSize = (this.SCREEN_WIDTH*0.6)/this.data.length;

			//top and bottom positions for boat directions
			//just work off the width for resizing purposes
			this.posL = this.SCREEN_WIDTH*-0.12;
			this.posR = this.SCREEN_WIDTH*0.12;

			this.shapes  = [];
			this.shapesL = [];
			this.shapesR = [];
			this.data.forEach(function(d,i){
				var newshape = self.dataToMesh(d);
				self.scene.add(newshape);

				self.shapes.push(newshape);
				d.direction === "L" ? self.shapesL.push(newshape) : self.shapesR.push(newshape);
			});

			this.animate();
		},
		clear:function(){
			var self = this;
			this.shapes.forEach(function(d){
				self.scene.remove(d);
			});
		},
		render:function(){
			this.renderer.render(this.scene,this.camera);
		},
		animate:function(){

			//executed on each animation frame
			//update these values
			var self = this,
				time = new Date().getTime(),
				timeDiff = time -this.lastTime,
				angleChange = timeDiff *2 *Math.PI;

			this.shapesL.forEach(function(d,i){
				var ypos   = self.mapPosY(d),
					xpos   = self.mapPosX(d,i),
					change = angleChange *d.speed/1000;

				d.position.x = xpos;
				d.position.y = ypos;

				d.rotation.x = 50;
				d.rotation.y += change;
			});
			this.shapesR.forEach(function(d,i){
				var ypos   = self.mapPosY(d),
					xpos   = self.mapPosX(d,i),
					change = angleChange *d.speed/1000;

				if(d.geometry.width && d.geometry.width !== self.shapeSize){
					d.geometry.width = self.shapeSize;
					d.geometry.height = self.shapeSize;
					d.geometry.depth = self.shapeSize;
				}

				d.position.x = xpos;
				d.position.y = ypos;

				d.rotation.x = 50;
				d.rotation.y += change;
			});

			//this.cube.rotation.y += angleChange;
			this.lastTime = time;

			//render
			this.render();

			//request new frame
			requestAnimationFrame(function(){
				self.animate();
			});
		},
		dataToMesh:function(d){
			var self = this;
			var	shape,
				shapeMesh = new THREE.MeshBasicMaterial({color:self.cBlack, wireframe:true, wireframeLinewidth:3});

			//define line material
			var material = new THREE.LineBasicMaterial({
				color:self.cBlack,
				linewidth:3
			});
			
			//shape = new THREE.Mesh(self.mapShape(d), shapeMesh);
			//shape.overdraw = true;

			shape = new THREE.Line(self.mapShape(d), material, THREE.LinePieces);

			shape.data = d;
			shape.speed = self.mapSpeed(d);

			return shape;
		},
		mapShape:function(data){
			var self = this,
				s,
				poly,
				scale
				cubesz = self.shapeSize*0.65,
				polysz = self.shapeSize*0.5;

			s = new THREE.Geometry();
			if(data.size === "XS"){
				poly = POLYHEDRA.Tetrahedron;
				scale = polysz;
			} else if(data.size === "S"){
				poly = POLYHEDRA.Cube;
				scale = cubesz;
			} else if(data.size === "M"){
				poly = POLYHEDRA.Octahedron;
				scale = polysz;
			} else if(data.size === "L"){
				poly = POLYHEDRA.Dodecahedron;
				scale = cubesz;
			} else if(data.size === "XL"){
				poly = POLYHEDRA.Icosahedron;
				scale = polysz;
			} else{
				poly = POLYHEDRA.Cube;
				scale = cubesz;
			}
			s.vertices = []; 
			poly.edge.forEach(function(d,i){
				d.forEach(function(_d){	
					var v = new THREE.Vector3();
					v.x = poly.vertex[_d][0]*scale;
					v.y = poly.vertex[_d][1]*scale;
					v.z = poly.vertex[_d][2]*scale;
					s.vertices.push(v);
				});
			});
			return s;
		},
		mapSpeed:function(d){
			var s;
			if(d.speed === "slow"){
				s = 5;
			} else if(d.speed === "med"){
				s = 35;
			} else if(d.speed === "fast"){
				s = 125;
			} else {
				s = 0;
			}
			return s/100;
		},
		mapPosX:function(d,i){
			var pos,
				marginL = this.SCREEN_WIDTH*0.325;
			pos = (i*(this.shapeSize +(this.shapeSize*.925))) -marginL;
			return pos;
		},
		mapPosY:function(d){
			var pos;
			if(d.data.direction === "L"){
				pos = this.posL;
			} else if(d.data.direction === "R"){
				pos = this.posR;
			}
			return pos;
		}
	}
}

var vis = generate();
vis.calc();
vis.setup(vis.getData);

window.onresize = function(event){

	//since original factor was 2, take new screen width into account
	var camFactor = 2*(window.innerWidth/vis.SCREEN_WIDTH);

	vis.renderer.setSize(window.innerWidth,window.innerHeight);

	vis.camera.left = window.innerWidth / -camFactor;
	vis.camera.right = window.innerWidth / camFactor;
	vis.camera.top = window.innerHeight / camFactor;
	vis.camera.bottom = window.innerHeight / -camFactor;

	vis.camera.updateProjectionMatrix();

	vis.chassis();
};






