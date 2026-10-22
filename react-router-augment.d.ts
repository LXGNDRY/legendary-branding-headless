import '@shopify/hydrogen/react-router-types';

// Module augmentation — must be a module (has export {}) so declare module is an augmentation
// not a replacement. Enables v8_middleware types for React Router 7.16+.
export {};

declare module 'react-router' {
  interface Future {
    v8_middleware: true;
  }
}
