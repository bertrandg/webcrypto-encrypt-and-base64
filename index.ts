// Import stylesheets
import './style.css';

(document.getElementById('source') as any).value = 'Whatever text >>> zazezkdjfhz$:;,;êgrre !!!!';

const iv = getRandomBytes(8);
(document.getElementById('iv') as any).value = iv.string;

generateAesKey().then(key => {
  (document.getElementById('key') as any).value = key.keyString;
});

document.getElementById('btnEncrypt').addEventListener('click', () => encrypt());
document.getElementById('btnDecrypt').addEventListener('click', () => decrypt());

function encrypt() {
  const sourceStr = (document.getElementById('source') as any).value;
  const keyStr = (document.getElementById('key') as any).value;
  const ivStr = (document.getElementById('iv') as any).value;

  importRawKey(keyStr, ['encrypt']).then(key => {
    
  });
}

function decrypt() {

}

//////////////////////////////////////

function getRandomBytes(l: number) {
    const bytes = window.crypto.getRandomValues(new Uint8Array(l));
    const string = bytesToBase64(bytes);

    return {bytes, string};
}

export function generateAesKey(): Promise<{key: CryptoKey, keyBytes: Uint8Array, keyString: string}> {
    let kiki;
    
    return (window.crypto.subtle.generateKey({name: 'AES-GCM', length: 256}, true, ['encrypt']) as Promise<CryptoKey>)
        .then(key => {
            kiki = key;
            return window.crypto.subtle.exportKey('raw', key);
        })
        .then(keyBytes => new Uint8Array(keyBytes))
        .then(keyBytes => ({
            key: kiki, 
            keyBytes,
            keyString: bytesToBase64(keyBytes),
        }));
}

export function importRawKey(keyString: string, keyUsages: Array<KeyUsage>): Promise<CryptoKey> {
  const key: ArrayBuffer = base64ToBytes(keyString);
  return (window.crypto.subtle.importKey('raw', key, {name: 'AES-GCM'}, false, keyUsages) as Promise<CryptoKey>);
}

///////////////////////////////////////

function bytesToBase64(byteArray: Uint8Array): string {
  const len = byteArray.byteLength;
  let binary = '';
  for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(byteArray[i]);
  }
  return window.btoa(binary);
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = window.atob(base64);
  const len = binary.length;
  const byteArray = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
      byteArray[i] = binary.charCodeAt(i);
  }
  return byteArray;
}

///////////////////////////////////////

export function encryptWithAesKey(key: CryptoKey, plaintextBytes: Uint8Array, ivBytes: Uint8Array): Promise<Uint8Array> {
  return (window.crypto.subtle.encrypt({name: 'AES-GCM', iv: ivBytes}, key, plaintextBytes) as Promise<Uint8Array>)
    .then(cypherBytes => new Uint8Array(cypherBytes));
}

export function decryptWithAesKey(key: CryptoKey, cypherBytes: Uint8Array, ivBytes: Uint8Array): Promise<Uint8Array> {
  return (window.crypto.subtle.decrypt({name: 'AES-GCM', iv: ivBytes}, key, cypherBytes) as Promise<ArrayBuffer>)
    .then(plaintextBytes => new Uint8Array(plaintextBytes));
}