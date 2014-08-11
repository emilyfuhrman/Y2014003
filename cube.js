function generate(){

	return {
		//revolutions per second
		angularSpeed:0.2,
		lastTime:0,
		calc:function(){
			this.SCREEN_WIDTH = window.innerWidth;
			this.SCREEN_HEIGHT = window.innerHeight;
			this.xLeft = this.SCREEN_WIDTH*-0.15;
			this.xRight = this.SCREEN_HEIGHT*0.15;
		},
		setup:function(callback){

			this.renderer = new THREE.WebGLRenderer();
			this.renderer.setSize(this.SCREEN_WIDTH,this.SCREEN_HEIGHT);
			document.getElementById('container').appendChild(this.renderer.domElement);

			//camera specs
			/*var view_angle = 30,
				aspect = this.SCREEN_WIDTH/this.SCREEN_HEIGHT,
				near = 0.1,
				far = 10000;*/

			//camera
			//this.camera = new THREE.PerspectiveCamera(view_angle, aspect, near, far);
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
				self.draw(d);
			});
		},
		draw:function(data){
			var self = this;
			this.cubes = [];

			data.forEach(function(d,i){
				var sz = self.mapSize(d),
					newcube = new THREE.Mesh(new THREE.CubeGeometry(sz,sz,sz), new THREE.MeshBasicMaterial({color:'#1c1d22',wireframe:true,wireframeLinewidth:9}));
				newcube.overdraw = true;
				newcube.data = d;
				self.scene.add(newcube);
				self.cubes.push(newcube);
			});
			this.animate();
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
				angleChange = this.angularSpeed *timeDiff *2 *Math.PI / 1000;

			this.cubes.forEach(function(d,i){
				var xpos = self.mapPosX(d),
					ypos = self.mapPosY(d,i);

				d.position.x = xpos;
				d.position.y = ypos;

				d.rotation.x = 50;
				d.rotation.y += angleChange;
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
		mapSize:function(data){
			var sz;
			if(data.size === "XS"){
				sz = 25;
			} else if(data.size === "S"){
				sz = 50;
			} else if(data.size === "M"){
				sz = 75;
			} else if(data.size === "L"){
				sz = 100;
			} else if(data.size === "XL"){
				sz = 125;
			} else{
				sz = 150;
			}
			return sz;
		},
		mapPosX:function(d){
			var pos;
			if(d.data.direction === "L"){
				pos = this.xLeft;
			} else if(d.data.direction === "R"){
				pos = this.xRight;
			}
			return pos;
		},
		mapPosY:function(d,i){
			var pos;
			pos = i*70 -300;
			return pos;
		}
	}
}

var vis = generate();
vis.calc();
vis.setup(vis.getData);

window.onresize = function(event){
	vis.calc();
	vis.camera.aspect = vis.SCREEN_WIDTH/vis.SCREEN_HEIGHT;
	vis.camera.updateProjectionMatrix();
	vis.renderer.setSize(vis.SCREEN_WIDTH,vis.SCREEN_HEIGHT);
	vis.render();
};







