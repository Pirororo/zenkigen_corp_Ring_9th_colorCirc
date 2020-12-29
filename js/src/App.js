// import * as THREE from '../libs/three.module.js';

export class App{
    constructor(sceneInstance){
      this._update = this._update.bind(this);
      this._onResize = this._onResize.bind(this);
      this.frame = 0;

      // シーン
      this._scene = sceneInstance;
  
      //レンダラー
      this._renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true});
      this._renderer.setClearColor(new THREE.Color(0xFAFAFA), 1.0);
      this._renderer.setSize(window.innerWidth, window.innerHeight);
      this._renderer.setPixelRatio(1);
      this._renderer.shadowMap.enabled = true;//影に必要
  
      // DOMを追加
      this._wrapper = document.getElementById('WebGL-output').appendChild(this._renderer.domElement);

      // リサイズ
      this._onResize();
      window.addEventListener('resize', this.onResize);

      // フレーム毎の更新
      this._update();

    }

    _update() {
      this._renderer.autoClear = true;
      this._scene.update();
      requestAnimationFrame(this._update);
      this._renderer.render(this._scene, this._scene.camera);
    }

    _onResize() {
      this.width = window.innerWidth;
      this.height = window.innerHeight;
      this._renderer.domElement.setAttribute('width', String(this.width));
      this._renderer.domElement.setAttribute('height', String(this.height));
      this._renderer.setPixelRatio(window.devicePixelRatio || 1.0);
      this._renderer.setSize(this.width, this.height);
      this._scene.camera.aspect = this.width / this.height;
      this._scene.camera.updateProjectionMatrix();
    }

}


