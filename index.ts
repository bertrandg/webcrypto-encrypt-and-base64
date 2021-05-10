// Import stylesheets
import './style.css';

const nbTests = 20;

(document.getElementById('source') as any).value = 'Whatever text >>> zazezkdjfhz$:;,;êgrre !!!!';

generateAesKey().then(key => {
  (document.getElementById('key') as any).value = key.keyString;
});

document.getElementById('btnEncrypt').addEventListener('click', () => encrypt());
document.getElementById('btnDecrypt').addEventListener('click', () => decrypt());

function encrypt() {
  const sourceStr = (document.getElementById('source') as any).value;
  const keyStr = (document.getElementById('key') as any).value;
  const ivs = Array(nbTests).fill('').map(() => getRandomBytes(8));

  importRawKey(keyStr, ['encrypt']).then(key => Promise.allSettled(
    Array(nbTests).fill('').map((x, i) => encryptWithAesKey(key, sourceStr, ivs[i].string))
  )).then(results => {
    console.log('encryptWithAesKey 10 times > ', results);
    (document.getElementById('encrypted') as any).innerHTML = results.map((r, i) => `
      <div id="encrypted-${i}" class="block ${ (r.status === 'fulfilled') ? 'success' : 'error' }">
        ${r.status} : 
        <pre class="enc">${ r['value'] ? r['value'].string : 'nope' }</pre>
        <pre class="iv">${ ivs[i].string }</pre>
      </div>`).join('');
  });

  (document.getElementById('decrypted') as any).innerHTML = '';
}

function decrypt() {
  const keyStr = (document.getElementById('key') as any).value;

  importRawKey(keyStr, ['decrypt']).then(key => Promise.allSettled(
    Array(nbTests).fill('').map((x, i) => {
      const encryptedStr = (document.querySelector(`#encrypted-${i} .enc`) as HTMLElement).textContent;
      const ivStr = (document.querySelector(`#encrypted-${i} .iv`) as HTMLElement).textContent;
      console.log('decrypt > ', encryptedStr, ' > ', ivStr);
      return decryptWithAesKey(key, encryptedStr, ivStr);
    })
  )).then(results => {
    console.log('decryptWithAesKey 10 times > ', results);
    (document.getElementById('decrypted') as any).innerHTML = results.map((r, i) => `
      <div id="decrypted-${i}" class="block ${ (r.status === 'fulfilled') ? 'success' : 'error' }">
        ${r.status} : 
        <pre class="enc">${ r['value'] ? r['value'].string : 'nope' }</pre>
      </div>`).join('');
  });

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

export function encryptWithAesKey(key: CryptoKey, sourceString: string, ivString: string): Promise<{bytes: Uint8Array, string: string}> {
  console.log('encryptWithAesKey > ', sourceString);
  const plaintextBytes: Uint8Array = (new TextEncoder()).encode(sourceString);
  const ivBytes: Uint8Array = base64ToBytes(ivString);

  return (window.crypto.subtle.encrypt({name: 'AES-GCM', iv: ivBytes}, key, plaintextBytes) as Promise<Uint8Array>)
    .then(cypherBytes => new Uint8Array(cypherBytes))
    .then(cypherBytes => ({bytes: cypherBytes, string: bytesToBase64(cypherBytes)}));
}

export function decryptWithAesKey(key: CryptoKey, cypherString: string, ivString: string): Promise<{bytes: Uint8Array, string: string}> {
  const cypherBytes: Uint8Array = base64ToBytes(cypherString);
  const ivBytes: Uint8Array = base64ToBytes(ivString);

  return (window.crypto.subtle.decrypt({name: 'AES-GCM', iv: ivBytes}, key, cypherBytes) as Promise<ArrayBuffer>)
    .then(plaintextBytes => new Uint8Array(plaintextBytes))
    .then(plaintextBytes => ({bytes: plaintextBytes, string: (new TextDecoder('utf-8')).decode(plaintextBytes)}));
}