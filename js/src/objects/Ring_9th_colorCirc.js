//https://threejs.org/examples/#webgl_rtt
//Three.jsの公式のshaderMaterialに色々サンプルあるよ

// import * as THREE from '../../libs/three.module.js';

export default class Ring extends THREE.Object3D {
  
  constructor() {
    super();
    this.datUpdate = this.datUpdate.bind(this);

    var material = new THREE.ShaderMaterial({
      wireframe: true,//gl_Linesになる！
      // wireframeLinewidth: 10.0,
      transparent:true,//これ、gl_FragColorのアルファ設定に必要！！！！！！！！！！！
      // vertexColors: THREE.VertexColors,//これは送れない。。。
      defaultAttributeValues:{
        'alpha': this.alphas
      },
      // uniforms: {
      //   color: { value: new THREE.Color( 0x000000 ) },
      // },
      vertexShader: vertex,
      fragmentShader: fragment
    });

    let MAX_POINTS = 360;
    this.newValue = MAX_POINTS;//DrawRangeに使う

    let Params = function(){
      // size
      this.radius = 170;
      this.span = 15;
      this.noise_step = 0.005;
      this.noise_min = 0.7;
      this.noise_max = 0.8;
      this.fin_alpha = 0.09;
      this.back_alpha1 = 0.083;
      this.back_alpha2 = 0.1;
      this.back_radius = 119;
      this.noise_speed = 0.004;
    }

    this.geometry = new THREE.BufferGeometry();
    this.positions = new Float32Array( MAX_POINTS * 3 );
    this.colors = new Float32Array( MAX_POINTS * 3 );
    
    this.alphas = new Float32Array( MAX_POINTS * 1); //ここ4つにしても遅れるのは3つだけ。。。
    this.indices = new Uint16Array( MAX_POINTS * MAX_POINTS);
    this.geometry.setIndex(new THREE.BufferAttribute(this.indices,1));
    this.geometry.setAttribute( 'position', new THREE.BufferAttribute( this.positions, 3 ) );
    this.geometry.setAttribute( 'color', new THREE.BufferAttribute( this.colors, 3 ) );
    this.geometry.setAttribute( 'alpha', new THREE.BufferAttribute( this.alphas, 1) );
    this.geometry.setDrawRange( 0, this.newValue );//このthis.newValueを更新させていく

    this.mesh = new THREE.Mesh( this.geometry, material );
    this.add( this.mesh );


    this.noise_seed_list = [];
    this.noise_param_list = [];
    for (let i = 0; i < 2; i++) {//リングを2周にしてる
      // this.noise_seed_list.push(Math.random(1000));//ノイズでランダムに
      this.noise_seed_list.push(300*i);
      this.noise_param_list.push(0);
    }
    this.simplexNoise = new SimplexNoise;


    this.params = new Params();
    //普通の線リング
    this.frame = 0;
    this.thetaSeg = 360/2;
    this.phiSeg = 2;
    this.ringWid = 2.5;
    this.ringGeometry = new THREE.RingGeometry( 1, 2, this.thetaSeg, this.phiSeg-1);
    this.ringMaterial1 = new THREE.MeshBasicMaterial({
        // color: 0x9FE3ED,//シアン
        color: 0x7E8DF7,//青
        side: THREE.DoubleSide,
        // wireframe: true,
        transparent: true,
        opacity: this.params.back_alpha1
    });
    this.ringMaterial2 = new THREE.MeshBasicMaterial({
        color: 0xB361DF,//紫
        side: THREE.DoubleSide,
        wireframe: true,
        transparent: true,
        opacity: this.params.back_alpha2
    });
    
    this.planeMesh1 = new THREE.Mesh(this.ringGeometry, this.ringMaterial1);
    this.planeMesh2 = new THREE.Mesh(this.ringGeometry, this.ringMaterial2);
    
    this.meshList = new THREE.Group();
    this.meshList.add(this.planeMesh1);
    this.planeMesh2.rotateZ(150);
    this.meshList.add(this.planeMesh2);
    this.add(this.meshList);

    var gui = new dat.GUI();
    this.datUpdate();

    var folder1 = gui.addFolder('colorCircle_size');
        folder1.add( this.params, 'radius', 100, 200 ).onChange( this.datUpdate );
        folder1.add( this.params, 'span', 5, 40 ).onChange( this.datUpdate );
        folder1.add( this.params, 'noise_step', 0.001, 0.01).onChange( this.datUpdate );
        folder1.add( this.params, 'noise_min', 0, 1 ).onChange( this.datUpdate );
        folder1.add( this.params, 'fin_alpha', 0, 0.5 ).onChange( this.datUpdate );
        folder1.add( this.params, 'back_alpha1', 0, 0.5 ).onChange( this.datUpdate );
        folder1.add( this.params, 'back_alpha2', 0, 0.5 ).onChange( this.datUpdate );
        folder1.add( this.params, 'back_radius', 100, 200 ).onChange( this.datUpdate );
    folder1.open();

    var folder2 = gui.addFolder('colorCircle_speed');
        folder2.add( this.params, 'noise_speed', 0, 0.03 ).onChange( this.datUpdate );
    folder2.open();
  }

  datUpdate() {
    // size
    this.radius = this.params.radius;
    this.span = this.params.span;
    this.noise_step = this.params.noise_step;
    this.noise_min = this.params.noise_min;
    this.noise_max = this.params.noise_max;
    this.fin_alpha = this.params.fin_alpha;
    this.back_alpha1 = this.params.back_alpha1;
    this.back_alpha2 = this.params.back_alpha2;
    this.back_radius = this.params.back_radius;
    // speed
    this.noise_speed = this.params.noise_speed;
  }

  update() {
    let posNum = 0;//this.positionsの数、毎回0から更新していく →数は普遍
    let idxNum = 0;//this.indicesの数、毎回0から更新していく   →距離によって毎回数はかわる。

    for (let i = 0; i < this.alphas.length; i++) {
        this.alphas[i] = 1.0 *this.fin_alpha;
    }

    if(this.frame %10 ==0){
      for (let i = 0; i < this.colors.length; i+=3) {
          if( i/3 %1 ==0){
            let red = [1.0, 0.0, 0.0];
            let yellow = [1.0, 1.0, 0.0];
            let green = [0.0, 1.0, 0.0];
            // let cyan = [0.0, 1.0, 1.0];
            // let blue = [0.0, 0.0, 1.0];
            // let purple = [1.0, 0.0, 1.0];
            let cyan = [159, 227, 237];//シアン0x9FE3ED
            let blue = [126, 141, 247];//青0x7E8DF7
            let purple = [179, 97, 223];//紫0xB361DF
            let RGB = [
              // red,
              // yellow, 
              // green, 
              // cyan,
              blue,
              purple
            ];
            this.selectCol = ~~Maf.randomInRange( 0, RGB.length);
            this.colors[i] = RGB[this.selectCol][0]/225;
            this.colors[i+1] = RGB[this.selectCol][1]/225;
            this.colors[i+2] = RGB[this.selectCol][2]/225;
          }else{
            this.colors[i] = this.colors[i-3];
            this.colors[i+1] = this.colors[i-2];
            this.colors[i+2] = this.colors[i-1];
          }
      }
    }

    function THREEmap(value, start1, end1, start2, end2) {
      return start2 + (end2 - start2) * ((value - start1) / (end1 - start1));
    }
   
    for (let i = 0; i < this.noise_seed_list.length; i++) {
      for (let deg = 0; deg < 360; deg += 2) {

        let noise_location = new THREE.Vector2(
          this.radius * Math.cos(deg * Math.PI/180), 
          this.radius * Math.sin(deg * Math.PI/180)
        )
        let noise_param = THREEmap(this.simplexNoise.noise4d(
          this.noise_seed_list[i], 
          noise_location.x * this.noise_step, 
          noise_location.y * this.noise_step, 
          this.noise_param_list[i]), 0, 1, this.noise_min, this.noise_max);

        this.positions[posNum] = this.radius * noise_param * Math.cos(deg * Math.PI/180);
        posNum +=1;
        this.positions[posNum] = this.radius * noise_param * Math.sin(deg * Math.PI/180);
        posNum +=1;
        this.positions[posNum] = 0;
        posNum +=1;

      }
      this.noise_param_list[i] += this.noise_speed;
    }

    for (let i = 0; i < this.positions.length-3; i+=3) {
      for (let k = i + 3; k < this.positions.length; k+=3) {
        // for (let i = 0; i < 360*3 -3; i+=3) {
        //   for (let k = i + 3; k < 360*3; k+=3) {

        let startPoint = new THREE.Vector3(
          this.positions[i+ 0],
          this.positions[i+ 1],
          this.positions[i+ 2]
        );
        let endPoint = new THREE.Vector3(
          this.positions[k+ 0],
          this.positions[k+ 1],
          this.positions[k+ 2]
        );
        let distance = startPoint.distanceTo (endPoint); 
        if (distance < this.span && distance >0) {
          let alpha = distance < this.span * 0.25 ? 1: THREEmap(distance, this.span * 0.25, this.span, 1, 0)/1;

          this.alphas[i] = alpha *this.fin_alpha;

          this.geometry.index.array[idxNum] = i/3;
          idxNum +=1;
          this.geometry.index.array[idxNum] = k/3; 
          idxNum +=1;
        }
      }
    }

    this.geometry.index.needsUpdate = true; //indexはTHREE.Bufferattributeの必要あり
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;
    this.geometry.attributes.alpha.needsUpdate = true;

    //draw
    this.newValue = idxNum-1;
    this.geometry.setDrawRange( 0, this.newValue );//毎回設定し直す必要あり



    // //普通の線リング
    this.frame += 1;
    // if(this.frame > 130){this.frame = 0;} 
    let tau = 360/ this.thetaSeg;
    
    for ( let i = 0; i < this.phiSeg; i++ ) {
      for ( let j = 0; j < this.thetaSeg; j++ ) {
    // for ( let i = 0; i < this.ringGeometry.vertices.length; i++ ) {
        var planeVertex = this.ringGeometry.vertices[ i*this.thetaSeg +j ];
        let hure = 10*Math.sin((j*tau +(this.frame*0.2))*2 *Math.PI/180+ (1.5 *this.simplexNoise.noise( planeVertex.x *0.003, planeVertex.y *0.003 )));
        this.ringWid = 2* Math.cos((j*tau)*Math.PI/180*3.0)+0.5

          planeVertex.x = 
            // (19 +(1*i)) *Math.sin(j*tau *Math.PI/180);
            ((this.back_radius +(this.ringWid*i) +hure) *Math.sin((j*tau)*Math.PI/180));
          planeVertex.y = 
            // (19 +(1*i)) *Math.cos(j*tau *Math.PI/180);
            ((this.back_radius +(this.ringWid*i) +hure) *Math.cos((j*tau)*Math.PI/180));
      }
    }
    this.ringGeometry.verticesNeedUpdate = true;
    this.ringMaterial1.opacity = this.back_alpha1;
    this.ringMaterial1.needsUpdate = true;
    this.ringMaterial2.opacity = this.back_alpha2;
    this.ringMaterial2.needsUpdate = true;
    // this.planeMesh.geometry.attributes.position.needsUpdate = true;
  }
}

const vertex= `
  attribute vec3 color;
  attribute float alpha;
  varying float vAlpha;
  varying vec3 vColor;
  void main(){
      vAlpha = alpha;
      vColor = color;
      // vColor = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
      // gl_Position = vec4( position, 1.0 );
  }
`;

const fragment = `
  varying float vAlpha;
  varying vec3 vColor;
  void main(){
      // gl_FragColor = vec4( vec3(0.0), vAlpha*0.4);
      gl_FragColor = vec4( vColor, vAlpha);
  }
`;
