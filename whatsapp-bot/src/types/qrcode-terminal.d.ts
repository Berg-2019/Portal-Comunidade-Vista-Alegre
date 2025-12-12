declare module 'qrcode-terminal' {
  interface QRCodeTerminalOptions {
    small?: boolean;
  }
  
  function generate(text: string, callback?: (qrcode: string) => void): void;
  function generate(text: string, options?: QRCodeTerminalOptions, callback?: (qrcode: string) => void): void;
  function setErrorLevel(level: 'L' | 'M' | 'Q' | 'H'): void;
  
  export { generate, setErrorLevel };
  export default { generate, setErrorLevel };
}
