// Permite importar archivos CSS desde TypeScript
declare module '*.css' {
  const content: Record<string, string>;
  export default content;
}
