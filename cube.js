function generate(){

	//TODO: figure out dodecahedron
	//TODO: font resizing

	return {

		lastTime:0,
		cBlack:'#18181b',
		calc:function(){
			this.SCREEN_WIDTH = window.innerWidth;
			this.SCREEN_HEIGHT = window.innerHeight;
		},
		setup:function(callback){
			var c = document.getElementById('e');
			this.renderer = new THREE.WebGLRenderer({ canvas: c });
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
			//rotate and align labels
			/*$('.label').css({
				"left": marginL/4 +'px'
			});*/
		},
		draw:function(){
			var self = this;
			this.shapeSize = (this.SCREEN_WIDTH*0.6)/this.data.length;

			//top and bottom positions for boat directions
			//just work off the width for resizing purposes
			this.posL = this.SCREEN_WIDTH*-0.12;
			this.posR = this.SCREEN_WIDTH*0.12 -8;

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
			
			shape = new THREE.Mesh(self.mapShape(d), shapeMesh);
			shape.overdraw = true;

			shape.data = d;
			shape.speed = self.mapSpeed(d);

			return shape;
		},
		mapShape:function(data){
			var s,
				cubesz = this.shapeSize,
				polysz = this.shapeSize*0.8;
			if(data.size === "XS"){
				s = new THREE.TetrahedronGeometry(polysz);
			} else if(data.size === "S"){
				s = new THREE.CubeGeometry(cubesz,cubesz,cubesz);
			} else if(data.size === "M"){
				s = new THREE.OctahedronGeometry(polysz);
			} else if(data.size === "L"){
				s = new THREE.CubeGeometry(cubesz,cubesz,cubesz);
				//s = new THREE.DodecahedronGeometry(sz);
			} else if(data.size === "XL"){
				s = new THREE.IcosahedronGeometry(polysz);
			} else{
				s = new THREE.CubeGeometry(cubesz,cubesz,cubesz);
			}
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






