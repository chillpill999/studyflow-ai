import { ThreeEvent } from '@react-three/fiber';

export const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
  e.stopPropagation();
  if (typeof document !== 'undefined') {
    document.body.style.cursor = 'pointer';
  }
};

export const handlePointerOut = (e: ThreeEvent<PointerEvent>) => {
  e.stopPropagation();
  if (typeof document !== 'undefined') {
    document.body.style.cursor = 'default';
  }
};


