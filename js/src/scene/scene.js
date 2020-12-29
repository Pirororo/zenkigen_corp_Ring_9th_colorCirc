// import * as THREE from '../../libs/three.module.js';
import Ring_colorLine from '../objects/Ring_9th_colorCirc.js';

export class Scene extends THREE.Scene {

    constructor(){

        super();

        //カメラ
        this._persCamera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 10, 500);
        this.camera = this._persCamera; //初期値
        this.camera.camPos = new THREE.Vector3(0, 0, -355);//9th
        this.camera.position.set(this.camera.camPos.x,this.camera.camPos.y,this.camera.camPos.z);


        //リング、色付き線
        this._ring_colorLine = new Ring_colorLine();
        this.add(this._ring_colorLine);

    }

    update(){

        this.camera.lookAt(new THREE.Vector3(0, 0, 0));//必須！！
        this._ring_colorLine.update();

    }
}
