# Speak Precisely SDK
This is a sample showing how to use the [SpeakPrecisely SDK](https://github.com/imponenm/SpeakPrecisely-JS) with Javascript.

Fist, set your public key in app.js.

To run this, start a webserver and navigate to `http://localhost:<port>`. For example, `python -m http.server 8000`

## Installing the SDK

### NPM
```bash
npm install speak-precisely-sdk
```

### CDN
```html
<script src="https://unpkg.com/speak-precisely-sdk"></script>
```

## Usage

### ES Modules
```javascript
import { SpeakPrecisely, TranscriptionEvents } from 'speak-precisely-sdk';

const client = new SpeakPrecisely('your-public-key');

client.on(TranscriptionEvents.Connected, () => {
  console.log('Connected to service');
});

client.on(TranscriptionEvents.Transcript, (result) => {
  console.log('Received transcript:', result);
});

await client.start({
  spokenLanguage: 'en-US',
  targetLanguages: ['es', 'fr']
});
```

### Browser Script
```html
<script src="https://unpkg.com/speak-precisely-sdk"></script>
<script>
  const client = new SpeakPrecisely('your-public-key');
  
  client.on(SpeakPrecisely.TranscriptionEvents.Connected, () => {
    console.log('Connected to service');
  });

  // Start transcription
  client.start({
    spokenLanguage: 'en-US',
    targetLanguages: ['es', 'fr']
  });
</script>
```

## API Reference

### `new SpeakPrecisely(publicKey: string)`
Creates a new instance of the SpeakPrecisely client.

### Methods
- `start(options: TranscriptionOptions): Promise<void>`
- `stop(): void`
- `on(event: TranscriptionEvents, callback: Function): void`
- `off(event: TranscriptionEvents, callback: Function): void`
- `isConnected(): boolean`

### Events
- `TranscriptionEvents.Connected`
- `TranscriptionEvents.Disconnected`
- `TranscriptionEvents.Error`
- `TranscriptionEvents.Transcript`
- `TranscriptionEvents.MaxConnectionsReached`

## License

MIT

