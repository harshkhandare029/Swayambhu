/**
 * FormSentry - 3D Privacy Investigation Lab Visualizer
 * Built with native Three.js geometry, materials, and particle systems.
 * 
 * Features:
 * 1. HeroScannerScene: Perspective 3D scanning grid with electric lime beam and floating data particles.
 * 2. FieldParticleSpace: Interactive 3D data-particle coordinate space mapping real analyzed fields.
 * 
 * 100% Client-Side, Zero External Assets/Models, WebGL Fallback Protected.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.FormSentry3D = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Check WebGL Support
  function isWebGLAvailable() {
    try {
      const canvas = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    } catch (e) {
      return false;
    }
  }

  // Color Palette Constants
  const COLORS = {
    BG_GRAPHITE: 0x080c10,
    LIME_GREEN: 0x10e871,
    LIME_GLOW: 0x00ff7f,
    AMBER: 0xf59e0b,
    CORAL: 0xf43f5e,
    NEUTRAL_GREY: 0x94a3b8,
    GRID_LINE: 0x142820,
    BEAM_LIME: 0x10e871
  };

  // =========================================================================
  // 1. HERO 3D SCANNING GRID SCENE
  // Perspective floor grid, traveling scan beam, and floating data particles
  // =========================================================================
  class HeroScannerScene {
    constructor(canvasContainerId) {
      this.container = document.getElementById(canvasContainerId);
      this.isAvailable = typeof THREE !== 'undefined' && isWebGLAvailable() && !!this.container;
      this.isScanning = false;
      this.scanProgress = 0;
      this.mouseX = 0;
      this.mouseY = 0;
      this.targetMouseX = 0;
      this.targetMouseY = 0;

      if (!this.isAvailable) {
        if (this.container) {
          this.container.classList.add('webgl-fallback');
        }
        return;
      }

      this.init();
    }

    init() {
      const width = this.container.clientWidth || window.innerWidth;
      const height = this.container.clientHeight || 280;

      // 1. Scene & Fog
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(COLORS.BG_GRAPHITE);
      this.scene.fog = new THREE.FogExp2(COLORS.BG_GRAPHITE, 0.022);

      // 2. Camera
      this.camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 100);
      this.camera.position.set(0, 3.5, 7.5);
      this.camera.lookAt(0, 0, -2);

      // 3. Renderer
      this.renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance'
      });
      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.container.appendChild(this.renderer.domElement);

      // 4. Ground Perspective Grid
      this._buildGrid();

      // 5. Sweeping Scanning Beam
      this._buildScanningBeam();

      // 6. Floating Data Particles
      this._buildFloatingParticles();

      // 7. Event Listeners
      this._bindEvents();

      // 8. Start Animation Loop
      this.animate = this.animate.bind(this);
      this.animationFrameId = requestAnimationFrame(this.animate);
    }

    _buildGrid() {
      const size = 32;
      const divisions = 32;
      this.gridHelper = new THREE.GridHelper(size, divisions, COLORS.LIME_GREEN, COLORS.GRID_LINE);
      this.gridHelper.position.y = -0.5;
      this.scene.add(this.gridHelper);
    }

    _buildScanningBeam() {
      // Beam line
      const lineGeo = new THREE.BufferGeometry();
      const points = [
        new THREE.Vector3(-16, -0.48, 0),
        new THREE.Vector3(16, -0.48, 0)
      ];
      lineGeo.setFromPoints(points);

      const lineMat = new THREE.LineBasicMaterial({
        color: COLORS.BEAM_LIME,
        linewidth: 2,
        transparent: true,
        opacity: 0.8
      });
      this.beamLine = new THREE.Line(lineGeo, lineMat);
      this.scene.add(this.beamLine);

      // Subtle plane beam glow
      const planeGeo = new THREE.PlaneGeometry(32, 1.8);
      const planeMat = new THREE.MeshBasicMaterial({
        color: COLORS.LIME_GREEN,
        transparent: true,
        opacity: 0.12,
        side: THREE.DoubleSide
      });
      this.beamPlane = new THREE.Mesh(planeGeo, planeMat);
      this.beamPlane.rotation.x = -Math.PI / 2;
      this.beamPlane.position.y = -0.49;
      this.scene.add(this.beamPlane);
    }

    _buildFloatingParticles() {
      const count = 48;
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(count * 3);
      this.particleSpeeds = [];

      for (let i = 0; i < count; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 24;
        positions[i * 3 + 1] = Math.random() * 5 + 0.2;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 20 - 2;
        this.particleSpeeds.push({
          y: Math.random() * 0.008 + 0.004,
          z: Math.random() * 0.006 + 0.002
        });
      }

      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

      const material = new THREE.PointsMaterial({
        color: COLORS.LIME_GREEN,
        size: 0.08,
        transparent: true,
        opacity: 0.6
      });

      this.particles = new THREE.Points(geometry, material);
      this.scene.add(this.particles);
    }

    _bindEvents() {
      window.addEventListener('resize', () => {
        if (!this.container || !this.renderer) return;
        const w = this.container.clientWidth;
        const h = this.container.clientHeight;
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(w, h);
      });

      this.container.addEventListener('mousemove', (e) => {
        const rect = this.container.getBoundingClientRect();
        this.targetMouseX = ((e.clientX - rect.left) / rect.width - 0.5) * 1.5;
        this.targetMouseY = ((e.clientY - rect.top) / rect.height - 0.5) * 0.5;
      });

      this.container.addEventListener('mouseleave', () => {
        this.targetMouseX = 0;
        this.targetMouseY = 0;
      });

      // Pause when tab is hidden to save energy
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          cancelAnimationFrame(this.animationFrameId);
        } else {
          this.animationFrameId = requestAnimationFrame(this.animate);
        }
      });
    }

    startScan(durationMs = 900) {
      this.isScanning = true;
      this.scanProgress = 0;
      this.scanDuration = durationMs;
      this.scanStartTime = performance.now();

      if (this.beamLine && this.beamPlane) {
        this.beamLine.material.opacity = 1.0;
        this.beamPlane.material.opacity = 0.28;
      }
    }

    stopScan() {
      this.isScanning = false;
      if (this.beamLine && this.beamPlane) {
        this.beamLine.material.opacity = 0.7;
        this.beamPlane.material.opacity = 0.1;
      }
    }

    animate() {
      this.animationFrameId = requestAnimationFrame(this.animate);

      // Smooth mouse parallax easing
      this.mouseX += (this.targetMouseX - this.mouseX) * 0.05;
      this.mouseY += (this.targetMouseY - this.mouseY) * 0.05;

      this.camera.position.x = this.mouseX;
      this.camera.position.y = 3.5 - this.mouseY;
      this.camera.lookAt(0, 0, -2);

      // Scanning Beam Travel
      let beamZ = 0;
      if (this.isScanning) {
        const elapsed = performance.now() - this.scanStartTime;
        const progress = Math.min(1, elapsed / this.scanDuration);
        beamZ = 6 - progress * 16;
        if (progress >= 1) {
          this.stopScan();
        }
      } else {
        // Subtle ambient oscillation in idle
        beamZ = Math.sin(performance.now() * 0.0012) * 5 - 2;
      }

      if (this.beamLine && this.beamPlane) {
        this.beamLine.position.z = beamZ;
        this.beamPlane.position.z = beamZ;
      }

      // Drift Floating Data Particles
      if (this.particles) {
        const pos = this.particles.geometry.attributes.position.array;
        for (let i = 0; i < this.particleSpeeds.length; i++) {
          pos[i * 3 + 1] += this.particleSpeeds[i].y;
          if (pos[i * 3 + 1] > 6) pos[i * 3 + 1] = 0.2;

          pos[i * 3 + 2] += this.particleSpeeds[i].z;
          if (pos[i * 3 + 2] > 6) pos[i * 3 + 2] = -12;
        }
        this.particles.geometry.attributes.position.needsUpdate = true;
      }

      this.renderer.render(this.scene, this.camera);
    }

    destroy() {
      if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
      if (this.renderer && this.renderer.domElement) {
        this.renderer.domElement.remove();
        this.renderer.dispose();
      }
    }
  }

  // =========================================================================
  // 2. INTERACTIVE DATA-PARTICLE VISUALIZATION SPACE (Part 6)
  // Maps real analyzed fields to 3D nodes with raycaster selection
  // =========================================================================
  class FieldParticleSpace {
    constructor(canvasContainerId, onFieldSelectedCallback) {
      this.container = document.getElementById(canvasContainerId);
      this.onFieldSelected = onFieldSelectedCallback || (() => {});
      this.isAvailable = typeof THREE !== 'undefined' && isWebGLAvailable() && !!this.container;
      this.nodes = [];
      this.raycaster = new THREE.Raycaster();
      this.mouse = new THREE.Vector2(-999, -999);
      this.hoveredNode = null;

      if (!this.isAvailable) {
        if (this.container) {
          this.container.classList.add('webgl-fallback');
        }
        return;
      }

      this.init();
    }

    init() {
      const width = this.container.clientWidth || 400;
      const height = this.container.clientHeight || 260;

      // Scene
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0x0a0f16);

      // Camera
      this.camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 50);
      this.camera.position.set(0, 0, 7.5);

      // Renderer
      this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.container.appendChild(this.renderer.domElement);

      // Ambient & Point Lighting
      const ambLight = new THREE.AmbientLight(0xffffff, 0.7);
      this.scene.add(ambLight);

      const ptLight = new THREE.PointLight(COLORS.LIME_GREEN, 1.2, 20);
      ptLight.position.set(3, 4, 5);
      this.scene.add(ptLight);

      // Bounding Coordinate Ring
      this._buildOrbitalRing();

      // Tooltip HTML element
      this._buildTooltipElement();

      // Events
      this._bindEvents();

      // Animate
      this.animate = this.animate.bind(this);
      this.animationFrameId = requestAnimationFrame(this.animate);
    }

    _buildOrbitalRing() {
      const ringGeo = new THREE.RingGeometry(3.6, 3.65, 64);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x1a2e24,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.4
      });
      this.orbitalRing = new THREE.Mesh(ringGeo, ringMat);
      this.orbitalRing.rotation.x = Math.PI / 3;
      this.scene.add(this.orbitalRing);
    }

    _buildTooltipElement() {
      this.tooltip = document.createElement('div');
      this.tooltip.className = 'particle-3d-tooltip';
      this.tooltip.style.display = 'none';
      this.container.style.position = 'relative';
      this.container.appendChild(this.tooltip);
    }

    _bindEvents() {
      window.addEventListener('resize', () => {
        if (!this.container || !this.renderer) return;
        const w = this.container.clientWidth;
        const h = this.container.clientHeight;
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(w, h);
      });

      this.renderer.domElement.addEventListener('mousemove', (e) => {
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        // Position tooltip
        if (this.hoveredNode && this.tooltip) {
          this.tooltip.style.left = `${e.clientX - rect.left + 12}px`;
          this.tooltip.style.top = `${e.clientY - rect.top - 28}px`;
        }
      });

      this.renderer.domElement.addEventListener('mouseleave', () => {
        this.mouse.x = -999;
        this.mouse.y = -999;
        if (this.tooltip) this.tooltip.style.display = 'none';
        this.hoveredNode = null;
      });

      this.renderer.domElement.addEventListener('click', () => {
        if (this.hoveredNode && this.hoveredNode.userData && this.hoveredNode.userData.field) {
          this.onFieldSelected(this.hoveredNode.userData.field);
        }
      });
    }

    /**
     * Update 3D Nodes based on Real Audit Results
     */
    updateFields(fields = [], removedFieldNames = new Set()) {
      if (!this.isAvailable) return;

      // Clean existing nodes
      this.nodes.forEach(n => this.scene.remove(n));
      this.nodes = [];

      if (this.latticeLines) {
        this.scene.remove(this.latticeLines);
        this.latticeLines = null;
      }

      if (!fields || fields.length === 0) return;

      const total = fields.length;
      const sphereGeo = new THREE.SphereGeometry(0.24, 16, 16);
      const pointsArray = [];

      fields.forEach((field, index) => {
        // Determine Color based on real status
        let hexColor = COLORS.NEUTRAL_GREY;
        let isRemoved = removedFieldNames.has(field.rawIdentifier);

        if (field.necessityStatus === 'Likely necessary') {
          hexColor = COLORS.LIME_GREEN;
        } else if (field.necessityStatus === 'Potentially necessary — justification needed' || field.necessityStatus === 'Unknown — review required') {
          hexColor = COLORS.AMBER;
        } else if (field.necessityStatus === 'Likely excessive') {
          hexColor = COLORS.CORAL;
        }

        const mat = new THREE.MeshStandardMaterial({
          color: hexColor,
          emissive: hexColor,
          emissiveIntensity: isRemoved ? 0.05 : 0.45,
          roughness: 0.2,
          metalness: 0.8,
          wireframe: isRemoved,
          transparent: true,
          opacity: isRemoved ? 0.25 : 0.95
        });

        const mesh = new THREE.Mesh(sphereGeo, mat);

        // Position nodes in an aesthetic spiral/ring distribution
        const angle = (index / total) * Math.PI * 2;
        const radius = 2.4 + (index % 3) * 0.45;
        const y = Math.sin(index * 1.5) * 1.2;

        mesh.position.set(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
        mesh.userData = {
          field: field,
          baseColor: hexColor,
          isRemoved: isRemoved,
          baseY: y,
          speed: 0.001 + (index % 5) * 0.0004
        };

        this.scene.add(mesh);
        this.nodes.push(mesh);
        pointsArray.push(mesh.position);
      });

      // Subtle connecting lattice lines between adjacent nodes
      if (pointsArray.length > 1) {
        const lineGeo = new THREE.BufferGeometry().setFromPoints(pointsArray);
        const lineMat = new THREE.LineBasicMaterial({
          color: 0x1f3d2b,
          transparent: true,
          opacity: 0.35
        });
        this.latticeLines = new THREE.Line(lineGeo, lineMat);
        this.scene.add(this.latticeLines);
      }
    }

    animate() {
      this.animationFrameId = requestAnimationFrame(this.animate);

      const time = performance.now();

      // Gentle rotation of the orbital constellation
      if (this.orbitalRing) {
        this.orbitalRing.rotation.z += 0.001;
      }

      // Animate individual nodes
      this.nodes.forEach((node, idx) => {
        if (!node.userData.isRemoved) {
          node.position.y = node.userData.baseY + Math.sin(time * 0.002 + idx) * 0.12;
        }
      });

      // Raycasting for interactive hover & selection
      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersects = this.raycaster.intersectObjects(this.nodes);

      if (intersects.length > 0) {
        const hit = intersects[0].object;
        if (this.hoveredNode !== hit) {
          this.hoveredNode = hit;
          const f = hit.userData.field;
          if (this.tooltip && f) {
            this.tooltip.innerHTML = `
              <strong>${f.rawIdentifier}</strong>
              <div style="font-size:0.75rem; color:#94a3b8;">${f.category}</div>
              <div style="font-size:0.75rem; font-weight:700; color:${hit.material.color.getHexString() === 'f43f5e' ? '#f43f5e' : '#10e871'};">
                ${f.necessityStatus}
              </div>
              <div style="font-size:0.68rem; color:#64748b; margin-top:2px;">(Click to open dossier)</div>
            `;
            this.tooltip.style.display = 'block';
          }
        }
        document.body.style.cursor = 'pointer';
      } else {
        if (this.hoveredNode) {
          this.hoveredNode = null;
          if (this.tooltip) this.tooltip.style.display = 'none';
        }
        document.body.style.cursor = 'default';
      }

      this.renderer.render(this.scene, this.camera);
    }

    destroy() {
      if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
      if (this.renderer && this.renderer.domElement) {
        this.renderer.domElement.remove();
        this.renderer.dispose();
      }
    }
  }

  return {
    isWebGLAvailable,
    HeroScannerScene,
    FieldParticleSpace,
    COLORS
  };
}));
