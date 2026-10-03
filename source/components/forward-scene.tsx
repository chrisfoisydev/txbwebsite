"use client";
import { useEffect, useRef } from 'react';
import type { WebGLRenderer } from 'three';

/** Camera travels through architectural frames; no perpetual render loop. */
export default function ForwardScene() {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = host.current;
    if (!element || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let cancelled = false;
    let dispose = () => {};
    import('three').then(T => {
      if (cancelled) return;
      let renderer: WebGLRenderer;
      try { renderer = new T.WebGLRenderer({ alpha: true, antialias: true }); } catch { return; }
      renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
      element.appendChild(renderer.domElement);
      const scene = new T.Scene();
      scene.fog = new T.FogExp2('#f7f7f4', .025);
      const camera = new T.PerspectiveCamera(49, 1, .1, 130);
      const assembly = new T.Group();
      scene.add(assembly);
      const red = new T.MeshStandardMaterial({ color: '#c7192b', roughness: .46, metalness: .3 });
      const graphite = new T.MeshStandardMaterial({ color: '#b7cbd0', roughness: .55, metalness: .3 });
      const geometry = new T.BoxGeometry(1, 1, 1);
      for (let i = 0; i < 10; i++) {
        const frame = new T.Group();
        const z = -i * 9;
        // Open rectangular structures produce genuine parallax as the camera advances.
        [[-5.8,0,.12,8],[5.8,0,.12,8],[0,4,11.7,.12],[0,-4,11.7,.12]].forEach(([x,y,w,h]) => {
          const bar = new T.Mesh(geometry, i % 3 === 0 ? red : graphite);
          bar.position.set(x,y,z); bar.scale.set(w,h,.3); frame.add(bar);
        });
        frame.rotation.z = i % 2 ? -.055 : .055;
        assembly.add(frame);
        for (let n=0;n<3;n++) {
          const slab = new T.Mesh(geometry, graphite);
          slab.position.set((n%2 ? -1 : 1)*(4.3+n*.25), -1.8+n*1.6, z-3);
          slab.scale.set(1.5,.65,.07); slab.rotation.y = n%2 ? .35 : -.35;
          assembly.add(slab);
        }
      }
      scene.add(new T.AmbientLight('#ffffff', 1.5));
      const light = new T.PointLight('#ffffff', 110, 30);
      light.position.set(0,3,7); scene.add(light);
      let progress = 0, frame = 0, visible = true;
      const render = () => {
        frame = 0;
        if (!visible || document.hidden) return;
        camera.position.set(Math.sin(progress*Math.PI*2)*.6, Math.sin(progress*Math.PI)*.35, 9-progress*63);
        camera.lookAt(0,0,camera.position.z-15);
        light.position.z = camera.position.z+2;
        renderer.render(scene,camera);
      };
      const schedule = () => { if (!frame) frame = requestAnimationFrame(render); };
      const update = (event: Event) => { progress = (event as CustomEvent<number>).detail; schedule(); };
      const resize = () => { renderer.setSize(element.clientWidth,element.clientHeight); camera.aspect=element.clientWidth/element.clientHeight; camera.updateProjectionMatrix(); schedule(); };
      const observer = new ResizeObserver(resize); observer.observe(element);
      const visibility = new IntersectionObserver(([entry]) => { visible=entry.isIntersecting; schedule(); }); visibility.observe(element);
      window.addEventListener('becu:progress',update);
      document.addEventListener('visibilitychange',schedule);
      resize();
      dispose = () => { cancelAnimationFrame(frame); observer.disconnect(); visibility.disconnect(); window.removeEventListener('becu:progress',update); document.removeEventListener('visibilitychange',schedule); geometry.dispose(); red.dispose(); graphite.dispose(); renderer.dispose(); renderer.domElement.remove(); };
    }).catch(() => {});
    return () => { cancelled=true; dispose(); };
  }, []);
  return <div className="forward-scene" ref={host} aria-hidden="true" />;
}

