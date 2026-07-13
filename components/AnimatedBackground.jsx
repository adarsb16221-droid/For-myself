'use client';
import { useEffect, useRef } from 'react';
import { useTheme } from '@/components/ThemeProvider';

export default function AnimatedBackground() {
  const canvasRef = useRef(null);
  const { theme } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let animationFrameId;

    function syncSize() {
      const w = canvas.clientWidth || window.innerWidth;
      const h = canvas.clientHeight || window.innerHeight;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    }

    const resizeObserver = new ResizeObserver(syncSize);
    resizeObserver.observe(canvas);
    syncSize();

    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return;

    const vs = `attribute vec2 a_position;
varying vec2 v_texCoord;
void main() {
  v_texCoord = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

    const fs = `precision highp float;
varying vec2 v_texCoord;
uniform float u_time;
uniform vec2 u_resolution;
uniform float u_is_light;

float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

void main() {
    vec2 uv = v_texCoord;
    
    // Base background color (Slate #0f172a for dark, White/LightBlue for light)
    vec3 baseColorDark = vec3(0.0588, 0.0902, 0.1647);
    vec3 baseColorLight = vec3(0.972, 0.976, 1.0); // #f8f9ff
    vec3 baseColor = mix(baseColorDark, baseColorLight, u_is_light);
    
    // Blob 1: Top-left, Indigo (#6366f1)
    vec2 pos1 = vec2(0.2 + 0.1 * sin(u_time * 0.5), 0.8 + 0.1 * cos(u_time * 0.4));
    float d1 = length(uv - pos1);
    vec3 color1 = mix(vec3(0.388, 0.4, 0.945), vec3(0.88, 0.88, 1.0), u_is_light);
    float blob1 = smoothstep(0.5, 0.0, d1);
    
    // Blob 2: Bottom-right, Purple (#a855f7)
    vec2 pos2 = vec2(0.8 + 0.15 * cos(u_time * 0.3), 0.2 + 0.1 * sin(u_time * 0.6));
    float d2 = length(uv - pos2);
    vec3 color2 = mix(vec3(0.659, 0.333, 0.969), vec3(0.9, 0.8, 1.0), u_is_light);
    float blob2 = smoothstep(0.6, 0.0, d2);
    
    // Blob 3: Center, Pink (#ec4899)
    vec2 pos3 = vec2(0.5 + 0.2 * sin(u_time * 0.4), 0.5 + 0.15 * cos(u_time * 0.5));
    float d3 = length(uv - pos3);
    vec3 color3 = mix(vec3(0.925, 0.282, 0.6), vec3(1.0, 0.85, 0.9), u_is_light);
    float blob3 = smoothstep(0.4, 0.0, d3);
    
    vec3 finalColor = baseColor;
    finalColor = mix(finalColor, color1, blob1 * mix(0.35, 0.5, u_is_light));
    finalColor = mix(finalColor, color2, blob2 * mix(0.3, 0.5, u_is_light));
    finalColor = mix(finalColor, color3, blob3 * mix(0.25, 0.5, u_is_light));
    
    float grain = (hash(uv + u_time) - 0.5) * 0.02;
    finalColor += grain;
    
    gl_FragColor = vec4(finalColor, 1.0);
}`;

    function createShader(type, src) {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    }

    const prog = gl.createProgram();
    gl.attachShader(prog, createShader(gl.VERTEX_SHADER, vs));
    gl.attachShader(prog, createShader(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);

    const pos = gl.getAttribLocation(prog, 'a_position');
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(prog, 'u_time');
    const uRes = gl.getUniformLocation(prog, 'u_resolution');
    const uIsLight = gl.getUniformLocation(prog, 'u_is_light');

    function render(t) {
      syncSize();
      gl.viewport(0, 0, canvas.width, canvas.height);
      if (uTime) gl.uniform1f(uTime, t * 0.001);
      if (uRes) gl.uniform2f(uRes, canvas.width, canvas.height);
      if (uIsLight) gl.uniform1f(uIsLight, theme === 'light' ? 1.0 : 0.0);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      animationFrameId = requestAnimationFrame(render);
    }
    
    render(0);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
    };
  }, [theme]);

  return (
    <div className={`fixed inset-0 w-full h-full -z-10 overflow-hidden ${theme === 'light' ? 'opacity-100' : 'opacity-50'}`}>
      <div className="absolute inset-0 w-full h-full" style={{ display: 'block' }}>
        <canvas 
          ref={canvasRef} 
          style={{ display: 'block', width: '100%', height: '100%' }}
        />
      </div>
    </div>
  );
}
