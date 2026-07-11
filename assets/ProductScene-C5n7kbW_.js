import{o as e,r as t,t as n}from"./index-CRRcKoI8.js";import{a as r,c as i,d as a,f as o,i as s,l as c,n as l,o as u,p as d,r as f,s as p,t as m,u as h}from"./Float-BBPveQrC.js";var g=parseInt(`185`.replace(/\D+/g,``)),_=e(t()),v=class extends h{constructor(){super({uniforms:{time:{value:0},pixelRatio:{value:1}},vertexShader:`
        uniform float pixelRatio;
        uniform float time;
        attribute float size;  
        attribute float speed;  
        attribute float opacity;
        attribute vec3 noise;
        attribute vec3 color;
        varying vec3 vColor;
        varying float vOpacity;

        void main() {
          vec4 modelPosition = modelMatrix * vec4(position, 1.0);
          modelPosition.y += sin(time * speed + modelPosition.x * noise.x * 100.0) * 0.2;
          modelPosition.z += cos(time * speed + modelPosition.x * noise.y * 100.0) * 0.2;
          modelPosition.x += cos(time * speed + modelPosition.x * noise.z * 100.0) * 0.2;
          vec4 viewPosition = viewMatrix * modelPosition;
          vec4 projectionPostion = projectionMatrix * viewPosition;
          gl_Position = projectionPostion;
          gl_PointSize = size * 25. * pixelRatio;
          gl_PointSize *= (1.0 / - viewPosition.z);
          vColor = color;
          vOpacity = opacity;
        }
      `,fragmentShader:`
        varying vec3 vColor;
        varying float vOpacity;
        void main() {
          float distanceToCenter = distance(gl_PointCoord, vec2(0.5));
          float strength = 0.05 / distanceToCenter - 0.1;
          gl_FragColor = vec4(vColor, strength * vOpacity);
          #include <tonemapping_fragment>
          #include <${g>=154?`colorspace_fragment`:`encodings_fragment`}>
        }
      `})}get time(){return this.uniforms.time.value}set time(e){this.uniforms.time.value=e}get pixelRatio(){return this.uniforms.pixelRatio.value}set pixelRatio(e){this.uniforms.pixelRatio.value=e}},y=e=>e&&e.constructor===Float32Array,b=e=>[e.r,e.g,e.b],x=e=>e instanceof a||e instanceof o||e instanceof d,S=e=>Array.isArray(e)?e:x(e)?e.toArray():[e,e,e];function C(e,t,n){return _.useMemo(()=>{if(t!==void 0){if(y(t))return t;if(t instanceof i){let n=Array.from({length:e*3},()=>b(t)).flat();return Float32Array.from(n)}else if(x(t)||Array.isArray(t)){let n=Array.from({length:e*3},()=>S(t)).flat();return Float32Array.from(n)}return Float32Array.from({length:e},()=>t)}return Float32Array.from({length:e},n)},[t])}var w=_.forwardRef(({noise:e=1,count:t=100,speed:n=1,opacity:a=1,scale:o=1,size:s,color:l,children:d,...m},h)=>{_.useMemo(()=>r({SparklesImplMaterial:v}),[]);let g=_.useRef(null),b=p(e=>e.viewport.dpr),x=S(o),w=_.useMemo(()=>Float32Array.from(Array.from({length:t},()=>x.map(c.randFloatSpread)).flat()),[t,...x]),T=C(t,s,Math.random),E=C(t,a),D=C(t,n),O=C(t*3,e),k=C(l===void 0?t*3:t,y(l)?l:new i(l),()=>1);return u(e=>{g.current&&g.current.material&&(g.current.material.time=e.clock.elapsedTime)}),_.useImperativeHandle(h,()=>g.current,[]),_.createElement(`points`,f({key:`particle-${t}-${JSON.stringify(o)}`},m,{ref:g}),_.createElement(`bufferGeometry`,null,_.createElement(`bufferAttribute`,{attach:`attributes-position`,args:[w,3]}),_.createElement(`bufferAttribute`,{attach:`attributes-size`,args:[T,1]}),_.createElement(`bufferAttribute`,{attach:`attributes-opacity`,args:[E,1]}),_.createElement(`bufferAttribute`,{attach:`attributes-speed`,args:[D,1]}),_.createElement(`bufferAttribute`,{attach:`attributes-color`,args:[k,3]}),_.createElement(`bufferAttribute`,{attach:`attributes-noise`,args:[O,3]})),d||_.createElement(`sparklesImplMaterial`,{transparent:!0,pixelRatio:b,depthWrite:!1}))}),T=n();function E({color:e}){return(0,T.jsxs)(`group`,{children:[(0,T.jsxs)(`mesh`,{position:[0,-.1,0],children:[(0,T.jsx)(`cylinderGeometry`,{args:[.62,.7,1.6,32]}),(0,T.jsx)(`meshPhysicalMaterial`,{color:e,roughness:.2,metalness:.05,clearcoat:.6})]}),(0,T.jsxs)(`mesh`,{position:[0,.95,0],children:[(0,T.jsx)(`cylinderGeometry`,{args:[.28,.4,.5,32]}),(0,T.jsx)(`meshPhysicalMaterial`,{color:e,roughness:.2,clearcoat:.6})]}),(0,T.jsxs)(`mesh`,{position:[0,1.28,0],children:[(0,T.jsx)(`cylinderGeometry`,{args:[.3,.3,.22,32]}),(0,T.jsx)(`meshStandardMaterial`,{color:`#3d4a3a`,roughness:.5})]})]})}function D({color:e}){return(0,T.jsxs)(`group`,{children:[(0,T.jsxs)(`mesh`,{children:[(0,T.jsx)(`cylinderGeometry`,{args:[.85,.8,1.1,40]}),(0,T.jsx)(`meshPhysicalMaterial`,{color:e,roughness:.25,clearcoat:.5})]}),(0,T.jsxs)(`mesh`,{position:[0,.66,0],children:[(0,T.jsx)(`cylinderGeometry`,{args:[.88,.88,.28,40]}),(0,T.jsx)(`meshStandardMaterial`,{color:`#f6f1e4`,roughness:.4})]})]})}function O({color:e}){return(0,T.jsxs)(`mesh`,{children:[(0,T.jsx)(`sphereGeometry`,{args:[.95,48,48]}),(0,T.jsx)(l,{color:e,distort:.15,speed:1.2,roughness:.35})]})}function k({color:e}){return(0,T.jsxs)(`group`,{rotation:[Math.PI,0,0],children:[(0,T.jsxs)(`mesh`,{position:[0,-.3,0],scale:[1,1.3,1],children:[(0,T.jsx)(`sphereGeometry`,{args:[.8,40,40]}),(0,T.jsx)(`meshPhysicalMaterial`,{color:e,roughness:.15,clearcoat:.7,transmission:.15})]}),(0,T.jsxs)(`mesh`,{position:[0,.75,0],children:[(0,T.jsx)(`coneGeometry`,{args:[.28,.9,32]}),(0,T.jsx)(`meshPhysicalMaterial`,{color:e,roughness:.15,clearcoat:.7})]})]})}function A({color:e}){return(0,T.jsxs)(`group`,{children:[(0,T.jsxs)(`mesh`,{position:[0,-.4,0],children:[(0,T.jsx)(`cylinderGeometry`,{args:[.7,.75,.9,32]}),(0,T.jsx)(`meshPhysicalMaterial`,{color:e,roughness:.2,clearcoat:.5})]}),(0,T.jsxs)(`mesh`,{position:[0,.4,0],children:[(0,T.jsx)(`cylinderGeometry`,{args:[.18,.5,.9,32]}),(0,T.jsx)(`meshPhysicalMaterial`,{color:`#f6f1e4`,roughness:.3,transparent:!0,opacity:.85})]}),(0,T.jsxs)(`mesh`,{position:[0,.9,0],children:[(0,T.jsx)(`cylinderGeometry`,{args:[.05,.05,.5,12]}),(0,T.jsx)(`meshStandardMaterial`,{color:`#c6d7b9`,roughness:.5})]})]})}var j={bottle:E,jar:D,ball:O,drop:k,diffuser:A};function M({shape:e,color:t}){let n=(0,_.useRef)(null),r=j[e];return u((e,t)=>{n.current&&(n.current.rotation.y+=t*.35,n.current.rotation.y+=e.pointer.x*.002)}),(0,T.jsx)(`group`,{ref:n,children:(0,T.jsx)(m,{speed:1.5,rotationIntensity:.25,floatIntensity:.8,children:(0,T.jsx)(r,{color:t})})})}function N({shape:e,color:t}){return(0,T.jsxs)(s,{camera:{position:[0,.3,4.2],fov:38},dpr:[1,1.8],gl:{alpha:!0},children:[(0,T.jsx)(`ambientLight`,{intensity:.75,color:`#f6f1e4`}),(0,T.jsx)(`directionalLight`,{position:[3,4,3],intensity:1.5,color:`#fff7ea`}),(0,T.jsx)(`pointLight`,{position:[-3,-2,-2],intensity:.7,color:`#d97a52`}),(0,T.jsx)(`pointLight`,{position:[2,-3,2],intensity:.4,color:`#c6d7b9`}),(0,T.jsxs)(_.Suspense,{fallback:null,children:[(0,T.jsx)(M,{shape:e,color:t}),(0,T.jsx)(w,{count:30,scale:4,size:2,speed:.25,color:`#f4dca0`,opacity:.5})]})]})}export{N as default};