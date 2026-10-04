// Portfolio บ้านต้นไม้ (three.js r128)
const $stage = document.getElementById('stage');

// สร้าง renderer, scene, camera
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
$stage.appendChild(renderer.domElement);

const BG = 0xefe7d8;
const scene = new THREE.Scene();
scene.background = new THREE.Color(BG);
scene.fog = new THREE.Fog(BG, 32, 70);

const camera = new THREE.PerspectiveCamera(48, innerWidth / innerHeight, 0.1, 150);
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.07;
controls.minDistance = 3;
controls.maxDistance = 34;
controls.maxPolarAngle = Math.PI * 0.49;

// แสง
scene.add(new THREE.HemisphereLight(0xffffff, 0xb8a384, 0.66));
const sun = new THREE.DirectionalLight(0xfff3e0, 0.74);
sun.position.set(9, 18, 12);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -16, right: 16, top: 16, bottom: -16, near: 1, far: 60 });
sun.shadow.bias = -0.0006;
scene.add(sun);

// ฟังก์ชันช่วย
const flat = (color, extra = {}) =>
  new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 0.9, metalness: 0, ...extra });

// สุ่มขยับ vertex ให้เป็นหน้าเหลี่ยม
function jitter(geo, amt, seed = 1) {
  const p = geo.attributes.position;
  const h = (x, y, z, k) => {
    const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7 + k * 19.19 + seed * 13.37) * 43758.5453;
    return (s - Math.floor(s)) - 0.5;
  };
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const rx = Math.round(x * 100) / 100, ry = Math.round(y * 100) / 100, rz = Math.round(z * 100) / 100;
    p.setXYZ(i, x + h(rx, ry, rz, 1) * amt, y + h(rx, ry, rz, 2) * amt, z + h(rx, ry, rz, 3) * amt);
  }
  geo.computeVertexNormals();
  return geo;
}

function box(parent, w, h, d, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  parent.add(m);
  return m;
}

// ท่อนไม้จากจุด a ไปจุด b
function beam(parent, a, b, r, mat, seg = 6) {
  const dir = new THREE.Vector3().subVectors(b, a);
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, dir.length(), seg), mat);
  m.position.copy(a).add(b).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  parent.add(m);
  return m;
}

function canvasTex(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return t;
}

const loader = new THREE.TextureLoader();
function imgTex(src) {
  const t = loader.load(src);
  t.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return t;
}

// ฉากหลัก: เกาะ ต้นไม้ บ้าน
function buildIsland() {
  const g = new THREE.CylinderGeometry(10.5, 5.5, 3, 28, 1);
  g.translate(0, -1.5, 0);
  // ทำพื้นหญ้าให้ไม่เรียบ
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    if (p.getY(i) > -0.01) {
      const x = p.getX(i), z = p.getZ(i);
      p.setY(i, Math.sin(x * 12.9 + z * 78.2) * 0.07);
    }
  }
  jitter(g, 0.12, 7);
  const m = new THREE.Mesh(g, [flat(0xa97a52), flat(0x86b45a), flat(0x8a6240)]);
  m.receiveShadow = true;
  scene.add(m);
}

function buildTreehouse() {
  const tree = new THREE.Group();
  tree.position.set(0, 0, -3);
  scene.add(tree);

  const bark = flat(0xb9703f);
  const barkDark = flat(0x8f532c);
  const leaves = [flat(0x7fb83f), flat(0x92c94d), flat(0x6aa535), flat(0x86c044)];
  const wood = flat(0xd6a868);
  const woodDark = flat(0xa8764a);

  // ลำต้น
  const trunk = new THREE.Mesh(jitter(new THREE.CylinderGeometry(0.75, 1.15, 6.6, 7, 3), 0.1, 3), bark);
  trunk.position.y = 3.3;
  tree.add(trunk);
  // กิ่ง
  beam(tree, new THREE.Vector3(0, 5.6, 0), new THREE.Vector3(-1.9, 6.6, 0.4), 0.2, barkDark);
  beam(tree, new THREE.Vector3(0, 6.0, 0), new THREE.Vector3(1.1, 7.4, -1.4), 0.17, barkDark);

  // ใบไม้
  [
    [-0.6, 7.6, -0.2, 2.4, 0], [-2.1, 6.5, 0.5, 1.6, 1], [0.1, 9.1, -0.3, 1.6, 2], [1.0, 8.1, -1.6, 1.4, 3],
  ].forEach(([x, y, z, r, c], i) => {
    const m = new THREE.Mesh(jitter(new THREE.IcosahedronGeometry(r, 1), r * 0.22, i + 4), leaves[c]);
    m.position.set(x, y, z);
    tree.add(m);
  });

  // ระเบียง
  const C = new THREE.Vector3(2.1, 4.0, 0);
  const deck = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.1, 0.18, 8), wood);
  deck.position.copy(C);
  tree.add(deck);
  beam(tree, new THREE.Vector3(0, 2.9, 0.3), new THREE.Vector3(2.6, 3.9, 1.0), 0.09, woodDark);
  beam(tree, new THREE.Vector3(0, 2.9, -0.3), new THREE.Vector3(2.6, 3.9, -1.0), 0.09, woodDark);

  // ราว
  const R = 1.95, N = 16, deckTop = C.y + 0.09;
  const pts = [];
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2;
    const x = C.x + Math.cos(a) * R, z = C.z + Math.sin(a) * R;
    const nearTrunk = x < 1.2;
    const ladderGap = z > 1.4 && Math.abs(x - C.x) < 0.75;
    pts.push(nearTrunk || ladderGap ? null : [x, z]);
  }
  pts.forEach((q, i) => {
    if (!q) return;
    box(tree, 0.1, 0.8, 0.1, woodDark, q[0], deckTop + 0.4, q[1]);
    const n = pts[(i + 1) % N];
    if (n) {
      const dx = n[0] - q[0], dz = n[1] - q[1], len = Math.hypot(dx, dz);
      const rail = box(tree, len, 0.07, 0.07, wood, (q[0] + n[0]) / 2, deckTop + 0.78, (q[1] + n[1]) / 2);
      rail.rotation.y = -Math.atan2(dz, dx);
    }
  });

  // กระท่อม
  const cx = 2.45, cz = -0.45, cy = deckTop + 0.75;
  box(tree, 1.7, 1.5, 1.4, flat(0xf1dfb5), cx, cy, cz);
  box(tree, 0.5, 0.95, 0.06, flat(0x8a5a3b), cx - 0.3, deckTop + 0.48, cz + 0.72);  // ประตู
  box(tree, 0.52, 0.52, 0.06, flat(0xf4c542), cx + 0.5, cy + 0.1, cz + 0.72);  // หน้าต่าง
  box(tree, 0.38, 0.38, 0.08, flat(0x6d5a50), cx + 0.5, cy + 0.1, cz + 0.72);
  box(tree, 0.06, 0.52, 0.52, flat(0xf4c542), cx + 0.87, cy + 0.1, cz);  // หน้าต่างข้าง
  box(tree, 0.08, 0.38, 0.38, flat(0x6d5a50), cx + 0.87, cy + 0.1, cz);

  const shape = new THREE.Shape();
  shape.moveTo(-1.15, 0); shape.lineTo(1.15, 0); shape.lineTo(0, 1.05); shape.closePath();
  const roofGeo = new THREE.ExtrudeGeometry(shape, { depth: 1.8, bevelEnabled: false });
  roofGeo.translate(0, 0, -0.9);
  const roof = new THREE.Mesh(roofGeo, flat(0xe0785c));
  roof.position.set(cx, cy + 0.75, cz);
  tree.add(roof);
  // บันได
  const ladder = new THREE.Group();
  ladder.position.set(C.x, 2.05 + 0.05, 2.92);
  ladder.rotation.x = -0.444;
  const L = 4.5;
  box(ladder, 0.08, L, 0.08, wood, -0.33, 0, 0);
  box(ladder, 0.08, L, 0.08, wood, 0.33, 0, 0);
  for (let y = -L / 2 + 0.35; y < L / 2 - 0.1; y += 0.4) box(ladder, 0.66, 0.06, 0.06, woodDark, 0, y, 0);
  tree.add(ladder);
}

function buildProps() {
  // หินใช้ geometry เดียวกัน หมุนต่างกันนิดหน่อย
  const rockGeo = jitter(new THREE.DodecahedronGeometry(0.55, 0), 0.12, 2);
  const rockMat = flat(0x9a9a94);
  [[-8.2, -1, 0.3], [5.6, -5.4, 1.7], [-3.2, -6.4, 2.9], [9, -3.4, 4.1]].forEach(([x, z, ry]) => {
    const m = new THREE.Mesh(rockGeo, rockMat);
    m.position.set(x, 0.25, z); m.scale.y = 0.7; m.rotation.y = ry;
    m.castShadow = true; m.receiveShadow = true; scene.add(m);
  });
  const bush = [flat(0x7fb83f), flat(0x6aa535)];
  [[-2.8, -1.2], [3.9, -0.6], [-6.6, -4.6], [5.4, -2.8]].forEach(([x, z], i) => {
    const m = new THREE.Mesh(jitter(new THREE.IcosahedronGeometry(0.6, 0), 0.12, i + 9), bush[i % 2]);
    m.position.set(x, 0.4, z); scene.add(m);
  });
}

const clouds = [];
function buildClouds() {
  const mat = flat(0xffffff, { roughness: 1 });
  const tpl = new THREE.Group();  // เมฆก้อนเดียว เอาไป clone
  [[0, 0, 0, 1.4], [1.4, -0.2, 0.2, 1.0], [-1.3, -0.25, 0, 0.95]].forEach(([a, b, c, r], i) => {
    const m = new THREE.Mesh(jitter(new THREE.IcosahedronGeometry(r, 1), 0.15, i), mat);
    m.position.set(a, b, c); m.scale.y = 0.65; tpl.add(m);
  });
  [[-14, 11, -10], [13, 13, -14], [4, 15, -22]].forEach(([x, y, z]) => {
    const g = tpl.clone();
    g.position.set(x, y, z);
    scene.add(g); clouds.push(g);
  });
}

// ป้ายชื่อ (Text + Material) กับรูป
const BOARD = new THREE.Vector3(-4.4, 0, 3.2);

function drawCard(ctx, w, h, c) {
  ctx.fillStyle = c.bg; ctx.fillRect(0, 0, w, h);
  ctx.textBaseline = 'alphabetic';
  // หัวข้อ
  ctx.fillStyle = c.accent; ctx.font = '600 34px Prompt, sans-serif';
  ctx.fillText('PORTFOLIO  ·  COMPUTER SCIENCE', 60, 100);
  // ชื่อ
  ctx.fillStyle = c.ink; ctx.font = '600 118px Prompt, sans-serif';
  ctx.fillText('นายปรินวัฒน์', 60, 260);
  ctx.fillText('ปั้นนาค', 60, 392);
  // เส้น
  ctx.fillStyle = c.accent; ctx.fillRect(60, 440, 150, 8);
  // รหัส
  ctx.fillStyle = c.mute; ctx.font = '400 38px Prompt, sans-serif';
  ctx.fillText('รหัสนิสิต', 60, 530);
  ctx.fillStyle = c.ink; ctx.font = '600 78px Prompt, sans-serif';
  ctx.fillText('6721651513', 60, 612);
  // สาขา
  ctx.fillStyle = c.mute; ctx.font = '400 38px Prompt, sans-serif';
  ctx.fillText('สาขา', 60, 705);
  ctx.fillStyle = c.ink; ctx.font = '500 62px Prompt, sans-serif';
  ctx.fillText('วิทยาการคอมพิวเตอร์', 60, 782);
  // มหาลัย
  ctx.fillStyle = c.accent; ctx.fillRect(60, 835, 150, 8);
  ctx.fillStyle = c.ink; ctx.font = '500 46px Prompt, sans-serif';
  ctx.fillText('มหาวิทยาลัยเกษตรศาสตร์ กำแพงแสน', 60, 910);
}

function buildAboutBoard() {
  const g = new THREE.Group();
  g.position.copy(BOARD);
  g.rotation.y = 0.1;
  g.userData.view = 'about';
  scene.add(g);

  const woodDark = flat(0xa8764a), wood = flat(0xc89862);
  [-2.0, 2.0].forEach(x => {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 2.6, 6), woodDark);
    post.position.set(x, 1.3, -0.1); g.add(post);
  });
  box(g, 4.9, 3.0, 0.18, wood, 0, 2.55, 0);  // กรอบ
  box(g, 4.55, 2.65, 0.08, flat(0xfbf7ef, { roughness: 0.8, emissive: 0xfbf7ef, emissiveIntensity: 0.4 }), 0, 2.55, 0.07);  // กระดาษ

  // รูปตัวเอง
  box(g, 1.84, 2.3, 0.05, flat(0xffffff), -1.4, 2.55, 0.13);
  const photo = new THREE.Mesh(
    new THREE.PlaneGeometry(1.7, 2.146),
    (m => new THREE.MeshStandardMaterial({ map: m, roughness: 0.5, emissive: 0xffffff, emissiveMap: m, emissiveIntensity: 0.3 }))(imgTex(ASSETS.me))
  );
  photo.position.set(-1.4, 2.55, 0.16);
  g.add(photo);

  // ตัวอักษร ใช้ map กับ bumpMap
  const W = 1100, H = 980;
  const map = canvasTex(W, H, (ctx, w, h) => drawCard(ctx, w, h, { bg: '#fbf7ef', ink: '#3a2e28', accent: '#7c3aed', mute: '#6b5b4e' }));
  const bump = canvasTex(W, H, (ctx, w, h) => drawCard(ctx, w, h, { bg: '#000', ink: '#fff', accent: '#fff', mute: '#555' }));
  const text = new THREE.Mesh(
    new THREE.PlaneGeometry(2.45, 2.45 * 980 / 1100),
    new THREE.MeshStandardMaterial({ map, bumpMap: bump, bumpScale: 0.15, roughness: 0.6, metalness: 0.05, emissive: 0xffffff, emissiveMap: map, emissiveIntensity: 0.4 })
  );
  text.position.set(0.9, 2.55, 0.12);
  g.add(text);

  g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
}

// ผลงาน Mini Paint กับ ICG
const WORKS = new THREE.Vector3(2.1, 0, 4.6);

function labelTex(title, sub) {
  return canvasTex(1000, 150, (ctx, w, h) => {
    ctx.fillStyle = '#fbf7ef'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#3a2e28'; ctx.font = '600 52px Prompt, sans-serif'; ctx.fillText(title, 36, 70);
    ctx.fillStyle = '#7c3aed'; ctx.font = '400 30px Prompt, sans-serif'; ctx.fillText(sub, 36, 115);
  });
}

function buildWorks() {
  const g = new THREE.Group();
  g.position.copy(WORKS);
  g.userData.view = 'works';
  scene.add(g);

  const woodDark = flat(0xa8764a), wood = flat(0xc89862);
  const items = [
    { x: -1.3, rot: 0.08, src: ASSETS.paint, t: 'Mini Paint', s: 'pencil · line · rectangle · ellipse · eraser' },
    { x: 1.3, rot: -0.08, src: ASSETS.icg, t: 'Interactive Computer Graphics', s: 'custom raster renderer · translate / rotate / scale' },
  ];
  items.forEach(it => {
    const f = new THREE.Group();
    f.position.x = it.x; f.rotation.y = it.rot; f.userData.view = 'works';
    g.add(f);
    [-0.95, 0.95].forEach(px => {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 2.8, 6), woodDark);
      post.position.set(px, 1.4, -0.1); f.add(post);
    });
    box(f, 2.3, 1.8, 0.12, wood, 0, 2.15, 0);
    const pic = new THREE.Mesh(
      new THREE.PlaneGeometry(2.1, 1.575),
      (m => new THREE.MeshStandardMaterial({ map: m, roughness: 0.4, emissive: 0xffffff, emissiveMap: m, emissiveIntensity: 0.3 }))(imgTex(it.src))
    );
    pic.position.set(0, 2.15, 0.07); f.add(pic);
    const lab = new THREE.Mesh(new THREE.PlaneGeometry(2.3, 0.345), new THREE.MeshStandardMaterial({ map: labelTex(it.t, it.s), roughness: 0.8 }));
    lab.position.set(0, 1.0, 0.0); f.add(lab);
    box(f, 2.34, 0.385, 0.05, wood, 0, 1.0, -0.04);
    f.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  });
}

// ลูกบอล Cell Shade
const ORB = new THREE.Vector3(8.2, 0, 2.0);
const orbUniforms = {
  uTime: { value: 0 },
  uLightDir: { value: new THREE.Vector3(0.5, 1.0, 0.8).normalize() },
};
let orb, orbShadow;

const orbWobble = `
  uniform float uTime;
  vec3 wobble(vec3 p, vec3 n) {
    float w = sin(p.y * 4.0 + uTime * 2.0) * 0.022 + sin(p.x * 5.0 - uTime * 1.5) * 0.015;
    return p + n * w;
  }
`;

function buildOrb() {
  const vertexShader = orbWobble + `
    varying vec3 vN;
    varying vec3 vPosW;
    varying vec3 vObj;
    void main() {
      vec3 p = wobble(position, normal);
      vObj = position;
      vN = normalize(mat3(modelMatrix) * normal);  // normal ใน world space
      vPosW = (modelMatrix * vec4(p, 1.0)).xyz;
      gl_Position = projectionMatrix * viewMatrix * vec4(vPosW, 1.0);
    }
  `;
  const fragmentShader = `
    precision mediump float;
    uniform vec3 uLightDir;
    varying vec3 vN;
    varying vec3 vPosW;
    varying vec3 vObj;
    void main() {
      vec3 N = normalize(vN);
      vec3 L = normalize(uLightDir);
      vec3 V = normalize(cameraPosition - vPosW);

      float levels = 3.0;
      float diffuse = floor(max(dot(N, L), 0.0) * levels) / levels;  // แบ่งแสงเป็นขั้น

      vec3 R = reflect(-L, N);
      float spec = pow(max(dot(R, V), 0.0), 18.0);
      spec = smoothstep(0.45, 0.5, spec);  // ไฮไลต์

      float rim = smoothstep(0.62, 0.66, 1.0 - max(dot(N, V), 0.0)) * 0.18;

      float band = step(0.86, fract(vObj.y * 1.6 + vObj.x * 0.7));  // แถบสี

      vec3 base = vec3(0.55, 0.36, 0.96) + vec3(0.10) * band;
      vec3 color = base * (0.5 + diffuse * 0.65) + vec3(spec * 0.7) + vec3(rim);
      gl_FragColor = vec4(color, 1.0);
    }
  `;
  const geo = new THREE.SphereGeometry(0.8, 48, 48);
  orb = new THREE.Mesh(geo, new THREE.ShaderMaterial({ vertexShader, fragmentShader, uniforms: orbUniforms }));

  // เส้นขอบ
  const outline = new THREE.Mesh(geo, new THREE.ShaderMaterial({
    uniforms: orbUniforms, side: THREE.BackSide,
    vertexShader: orbWobble + `
      void main() {
        vec3 p = wobble(position, normal) + normal * 0.04;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }`,
    fragmentShader: `void main() { gl_FragColor = vec4(0.16, 0.09, 0.36, 1.0); }`,
  }));
  orb.add(outline);
  orb.userData.view = 'orb';

  // ฐาน
  const base = new THREE.Group();
  base.position.copy(ORB);
  base.userData.view = 'orb';
  const t1 = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.2, 0.5, 40), new THREE.MeshStandardMaterial({ color: 0xe2d8c4, roughness: 0.8 }));
  t1.position.y = 0.25;
  const t2 = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.9, 0.35, 40), new THREE.MeshStandardMaterial({ color: 0xcfc2a8, roughness: 0.8 }));
  t2.position.y = 0.675;
  base.add(t1, t2);
  const plaque = new THREE.Mesh(
    new THREE.PlaneGeometry(1.0, 0.24),
    new THREE.MeshStandardMaterial({
      roughness: 0.7,
      map: canvasTex(500, 120, (ctx, w, h) => {
        ctx.fillStyle = '#fbf7ef'; ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#7c3aed'; ctx.font = '600 56px Prompt, sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('Cell Shade', w / 2, 80);
      }),
    })
  );
  plaque.position.set(0, 0.26, 1.2);
  base.add(plaque);
  base.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  scene.add(base);

  orb.position.set(ORB.x, 2.0, ORB.z);
  scene.add(orb);

  // เงาบนฐาน
  orbShadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.6, 32),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.18, depthWrite: false })
  );
  orbShadow.rotation.x = -Math.PI / 2;
  orbShadow.position.set(ORB.x, 0.86, ORB.z);
  scene.add(orbShadow);
}

// กล้อง
const VIEWS = {
  overview: { pos: [1.0, 6.8, 19.5], target: [1.0, 3.8, 0] },
  about:    { pos: [-4.1, 2.7, 9.2],  target: [-4.4, 2.3, 3.2] },
  works:    { pos: [2.1, 2.8, 10.6],  target: [2.1, 2.1, 4.6] },
  orb:      { pos: [10.0, 3.0, 10.2], target: [8.2, 1.5, 2.0] },
};
let goal = null, current = 'overview';

function goTo(name) {
  const v = VIEWS[name]; if (!v) return;
  const t = new THREE.Vector3(...v.target);
  const off = new THREE.Vector3(...v.pos).sub(t);
  const aspect = camera.aspect;
  if (aspect < 1.2) off.multiplyScalar(Math.min(2.2, 1.2 / aspect));  // จอแนวตั้งให้ถอยกล้อง
  goal = { pos: t.clone().add(off), target: t };
  current = name;
  document.querySelectorAll('#nav button').forEach(b => b.classList.toggle('active', b.dataset.view === name));
}
document.getElementById('nav').addEventListener('click', e => {
  const b = e.target.closest('button'); if (b) goTo(b.dataset.view);
});
controls.addEventListener('start', () => { goal = null; });

// คลิกวัตถุแล้วกล้องไปหา
const ray = new THREE.Raycaster(), mouse = new THREE.Vector2();
let downXY = null;
function pick(e) {
  mouse.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  ray.setFromCamera(mouse, camera);
  const hits = ray.intersectObjects(scene.children, true);
  for (const h of hits) {
    let o = h.object;
    while (o) { if (o.userData && o.userData.view) return o.userData.view; o = o.parent; }
  }
  return null;
}
renderer.domElement.addEventListener('pointerdown', e => { downXY = [e.clientX, e.clientY]; });
renderer.domElement.addEventListener('pointerup', e => {
  if (!downXY || Math.hypot(e.clientX - downXY[0], e.clientY - downXY[1]) > 5) return;
  const v = pick(e); if (v) goTo(v);
});
renderer.domElement.addEventListener('pointermove', e => {
  renderer.domElement.style.cursor = pick(e) ? 'pointer' : 'grab';
});

// loop
let lastMs = 0;
function animate(ms) {
  const t = ms * 0.001, dt = Math.min((ms - lastMs) * 0.001, 0.1);
  lastMs = ms;
  orbUniforms.uTime.value = t;

  // ลูกบอลลอยและหมุน
  const bob = Math.sin(t * 1.6);
  orb.position.y = 2.0 + bob * 0.22;
  orb.rotation.y = t * 0.9;
  orb.rotation.z = Math.sin(t * 0.8) * 0.35;
  orb.rotation.x = Math.cos(t * 0.6) * 0.25;
  const s = 1 - bob * 0.12;
  orbShadow.scale.set(s, s, s);
  orbShadow.material.opacity = 0.18 - bob * 0.04;

  clouds.forEach((c, i) => { c.position.x += 0.004 * (i + 1); if (c.position.x > 24) c.position.x = -24; });

  if (goal) {
    const k = 1 - Math.exp(-dt * 4.5);  // เลื่อนกล้องตามเวลา
    camera.position.lerp(goal.pos, k);
    controls.target.lerp(goal.target, k);
    if (camera.position.distanceTo(goal.pos) < 0.02) goal = null;
  }
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  goTo(current);
});

// เริ่มทำงาน (รอฟอนต์โหลดก่อน)
function init() {
  buildIsland(); buildTreehouse(); buildProps(); buildClouds();
  buildAboutBoard(); buildWorks(); buildOrb();
  goTo('overview');
  // เริ่มที่ตำแหน่งเลย
  camera.position.copy(goal.pos); controls.target.copy(goal.target); goal = null;
  requestAnimationFrame(animate);
}
Promise.race([
  Promise.all([
    document.fonts.load('600 80px Prompt', 'นายปรินวัฒน์ 6721651513'),
    document.fonts.load('500 40px Prompt', 'วิทยาการคอมพิวเตอร์'),
    document.fonts.load('400 30px Prompt', 'รหัสนิสิต'),
    document.fonts.load('500 46px Prompt', 'มหาวิทยาลัยเกษตรศาสตร์ กำแพงแสน'),
  ]),
  new Promise(r => setTimeout(r, 2500)),
]).then(init, init);
