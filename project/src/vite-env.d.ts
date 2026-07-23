// FIX: Replaced problematic `vite/client` reference with manual type declarations
// to resolve "Cannot find type definition file" error. This is a workaround
// for a likely environment configuration issue. The declarations below provide
// types for common assets.

declare module '*.css';

// FIX: Combined asset module declarations into a single block to resolve "Duplicate identifier" errors.
declare module '*.(svg|png|jpg|jpeg)' {
  const content: any;
  export default content;
}

declare module 'marked';
